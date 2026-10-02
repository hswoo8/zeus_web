/* Review-only, code-authored VFX. No assets, gameplay state or random frame jitter.
 * Coordinates: contact at (0,0), +X incoming projectile direction, Y down.
 * sample() is pure: replay and seeking produce identical geometry.
 */
(() => {
  'use strict';
  const DURATION_MS = 320;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
  const envelope = (t, start, peak, end) => t < start || t >= end ? 0
    : t < peak ? smooth((t - start) / (peak - start)) : Math.pow(1 - (t - peak) / (end - peak), 1.5);

  // Authored asymmetrical forks. Most of the energy exits in +X; none forms a ring.
  const forks = [
    { at: 0, end: 176, width: 2.8, points: [[-11, 1], [-3, -2], [5, 1], [13, -4], [20, -1], [27, -12], [36, -8], [46, -18], [56, -15]] },
    { at: 5, end: 155, width: 2.35, points: [[0, -1], [5, -11], [0, -18], [11, -24], [9, -34], [21, -40], [25, -53]] },
    { at: 9, end: 193, width: 2.25, points: [[1, 3], [10, 11], [8, 18], [21, 24], [18, 33], [31, 37], [37, 49]] },
    { at: 2, end: 145, width: 1.95, points: [[-1, 0], [-12, -6], [-18, -3], [-24, -14], [-33, -15], [-40, -27]] },
    { at: 14, end: 174, width: 1.75, points: [[-2, 5], [-11, 14], [-9, 22], [-23, 28], [-26, 39], [-38, 43]] },
    { at: 8, end: 143, width: 1.65, points: [[6, 2], [18, 8], [25, 4], [36, 14], [45, 10], [56, 17]] },
    { at: 20, end: 169, width: 1.05, points: [[27, -12], [29, -23], [39, -27], [37, -36], [45, -42]] },
    { at: 23, end: 163, width: 0.95, points: [[11, -24], [0, -30], [-1, -40], [-11, -48]] },
    { at: 27, end: 195, width: 1.05, points: [[21, 24], [34, 22], [41, 31], [51, 30]] },
    { at: 18, end: 152, width: 0.9, points: [[-24, -14], [-34, -9], [-43, -16], [-53, -13]] },
    { at: 31, end: 201, width: 0.8, points: [[-23, 28], [-34, 25], [-39, 32], [-48, 31]] }
  ];
  const splinters = [
    [7, -4, 118, -64, 14, 196, 5.7, false], [12, 6, 154, 33, 20, 233, 6.2, false],
    [3, -9, 50, -153, 25, 238, 4.6, true], [-7, -2, -114, -53, 12, 184, 4.6, false],
    [-3, 8, -55, 135, 27, 256, 5.3, false], [5, 8, 85, 143, 29, 274, 5.8, true],
    [-5, 5, -130, 61, 38, 253, 3.7, false], [10, -6, 142, -104, 34, 283, 4.4, false],
    [-3, -7, -51, -132, 42, 225, 3.0, true], [8, 7, 185, 80, 45, 305, 3.2, false],
    [5, 4, 60, 171, 50, 316, 2.8, false], [-8, 0, -158, -2, 52, 276, 2.5, false]
  ];
  const residual = [
    { start: 91, peak: 115, end: 212, width: 1.0, points: [[21, -10], [27, -15], [36, -11], [45, -21]] },
    { start: 121, peak: 142, end: 238, width: 0.85, points: [[8, 22], [18, 27], [16, 34], [26, 38]] },
    { start: 137, peak: 155, end: 257, width: 0.65, points: [[-19, 21], [-29, 23], [-33, 31]] }
  ];

  function slicePath(points, from, to) {
    if (to <= from) return [];
    const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    const low = clamp(from) * total, high = clamp(to) * total, out = [];
    let walked = 0;
    for (let i = 0; i < lengths.length; i++) {
      const len = lengths[i], next = walked + len;
      if (next > low && walked < high && len > 0) {
        const a = clamp((low - walked) / len), b = clamp((high - walked) / len);
        const p = points[i], q = points[i + 1];
        if (!out.length) out.push([p[0] + (q[0] - p[0]) * a, p[1] + (q[1] - p[1]) * a]);
        out.push([p[0] + (q[0] - p[0]) * b, p[1] + (q[1] - p[1]) * b]);
      }
      walked = next;
    }
    return out;
  }

  function sample(ageMs, { quiet = false, branches = true, sparks = true, flash = true } = {}) {
    const frame = { strokes: [], sparks: [], core: 0, glow: 0, coreRadius: 0 };
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs >= DURATION_MS) return frame;
    const t = ageMs;
    const intensity = quiet ? 0.56 : 1;
    frame.core = flash ? envelope(t, 0, 18, quiet ? 62 : 85) * intensity : 0;
    frame.glow = flash ? envelope(t, 0, 28, 156) * (quiet ? 0.30 : 0.64) : 0;
    frame.coreRadius = 2.8 + 6.2 * smooth(t / 45);

    if (branches) {
      forks.forEach((fork, i) => {
        const age = t - fork.at;
        if (age <= 0 || t >= fork.end) return;
        const head = smooth(age / (i < 6 ? 43 : 32));
        const tail = smooth((age - 71) / (fork.end - fork.at - 71));
        const points = slicePath(fork.points, tail, head);
        if (points.length < 2) return;
        const alpha = envelope(t, fork.at, fork.at + 25, fork.end) * (quiet ? 0.72 : 1);
        frame.strokes.push({ points, width: fork.width * (1 - tail * 0.7), alpha, residual: false });
      });
      residual.forEach(fork => {
        const alpha = envelope(t, fork.start, fork.peak, fork.end) * (quiet ? 0.32 : 0.57);
        if (alpha > 0) frame.strokes.push({ points: fork.points, width: fork.width, alpha, residual: true });
      });
    }
    if (sparks) splinters.forEach(([x, y, vx, vy, start, end, length, gold], i) => {
      if (t <= start || t >= end || (quiet && i % 2)) return;
      const p = (t - start) / (end - start), seconds = (t - start) / 1000;
      const travel = seconds * (1 - p * 0.35);
      frame.sparks.push({ x: x + vx * travel, y: y + vy * travel + 12 * seconds * seconds,
        angle: Math.atan2(vy, vx), length: length * (1 - p * 0.75),
        alpha: smooth(p / 0.12) * Math.pow(1 - p, 1.65) * (quiet ? 0.6 : 0.95), gold });
    });
    return frame;
  }

  function path(ctx, points) {
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  }
  function draw(ctx, ageMs, { x = 0, y = 0, scale = 1, angle = 0, ...options } = {}) {
    const frame = sample(ageMs, options);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
    ctx.lineCap = 'round'; ctx.lineJoin = 'miter'; ctx.miterLimit = 2.5;

    if (frame.glow > 0) {
      ctx.globalCompositeOperation = 'source-over';
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
      glow.addColorStop(0, `rgba(96,220,255,${frame.glow * 0.60})`);
      glow.addColorStop(0.22, `rgba(44,166,255,${frame.glow * 0.25})`);
      glow.addColorStop(1, 'rgba(25,110,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(-40, -40, 80, 80);
    }
    for (const stroke of frame.strokes) {
      // A slim dark edge keeps the silhouette readable on light backgrounds.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = stroke.alpha * 0.50;
      ctx.strokeStyle = '#12364b'; ctx.lineWidth = stroke.width + 1.7;
      path(ctx, stroke.points); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = stroke.alpha * 0.13;
      ctx.strokeStyle = '#329bff'; ctx.lineWidth = stroke.width * 3.9;
      path(ctx, stroke.points); ctx.stroke();
      ctx.globalAlpha = stroke.alpha * 0.67;
      ctx.strokeStyle = '#69d8ff'; ctx.lineWidth = stroke.width * 1.65;
      path(ctx, stroke.points); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = stroke.alpha;
      ctx.strokeStyle = stroke.residual ? '#a8ecff' : '#f2ffff';
      ctx.lineWidth = stroke.width * 0.68;
      path(ctx, stroke.points); ctx.stroke();
    }
    for (const spark of frame.sparks) {
      ctx.save(); ctx.translate(spark.x, spark.y); ctx.rotate(spark.angle);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = spark.alpha;
      ctx.fillStyle = spark.gold ? '#ffe4a0' : '#d9f8ff';
      ctx.beginPath(); ctx.moveTo(spark.length, 0); ctx.lineTo(0, 0.73);
      ctx.lineTo(-spark.length * 0.48, 0); ctx.lineTo(0, -0.73); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (frame.core > 0) {
      ctx.globalAlpha = frame.core;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffe1a3';
      const r = frame.coreRadius;
      ctx.beginPath(); ctx.moveTo(-r * 1.5, 0); ctx.lineTo(-2, -2.2);
      ctx.lineTo(1, -r); ctx.lineTo(3, -2); ctx.lineTo(r * 1.7, 0);
      ctx.lineTo(2, 2.7); ctx.lineTo(-1, r * 0.85); ctx.lineTo(-3, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fffef2';
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, -r * 0.55);
      ctx.lineTo(r * 1.1, 0); ctx.lineTo(0, r * 0.48); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  window.LightningHitV1 = Object.freeze({ durationMs: DURATION_MS, sample, draw });
})();
