/* Review source only: explicit app-open click, no autojoin, timers or store redirects. */
(() => {
  'use strict';
  const root = document.querySelector('[data-route-channel]');
  const channel = root.dataset.routeChannel;
  const prefix = channel === 'beta' ? '/beta' : '';
  const scheme = channel === 'beta' ? 'minizeus-beta' : 'minizeus';
  const allowed = new Set(['code', 'region', 'channel', 'pool', 'v', 'protocol', 'ruleset', 'balance']);
  const regions = new Set(['kr_jp', 'sea', 'na', 'eu', 'global']);
  const fields = new URLSearchParams(location.search);
  const seen = new Set();
  let valid = location.pathname.replace(/\/$/, '') === prefix + '/invite/room' &&
    location.search.length < 1800 && !location.hash &&
    !/%(?![0-9a-fA-F]{2})/.test(location.search);
  for (const part of location.search.slice(1).split('&')) {
    const pair = part.split('=');
    if (pair.length !== 2 || !allowed.has(pair[0]) || !pair[1]) valid = false;
  }
  for (const [key, value] of fields) {
    if (!allowed.has(key) || seen.has(key) || !value) valid = false;
    seen.add(key);
  }
  valid = valid && /^[1-9][0-9]{3}$/.test(fields.get('code') || '') &&
    regions.has(fields.get('region')) && fields.get('channel') === channel;
  if (fields.has('pool') && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(fields.get('pool'))) valid = false;
  for (const key of ['v', 'protocol', 'ruleset', 'balance']) {
    if (fields.has(key)) {
      const value = fields.get(key);
      if (!/^[1-9][0-9]{0,9}$/.test(value) || Number(value) > 2147483647) valid = false;
    }
  }
  const open = document.getElementById('open-app');
  if (!valid) {
    document.getElementById('invite-context').textContent = '올바르지 않거나 다른 채널의 초대입니다. / Invalid invite or wrong app channel.';
    open.removeAttribute('href');
    open.setAttribute('aria-disabled', 'true');
    return;
  }
  const regionNames = {
    kr_jp: '한국·일본 / Korea · Japan', sea: '동남아시아 / Southeast Asia',
    na: '북미 / North America', eu: '유럽 / Europe', global: '기타 지역 / Other regions'
  };
  document.getElementById('invite-context').textContent =
    '방 / Room ' + fields.get('code') + ' · ' + regionNames[fields.get('region')] + ' · ' + channel;
  // Authority, path and scheme are fixed app-owned values; no supplied server/redirect URL.
  open.removeAttribute('aria-disabled');
  open.href = scheme + '://minizeusgame.com' + prefix + '/invite/room?' + fields.toString();
})();
