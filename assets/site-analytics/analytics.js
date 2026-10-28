(function () {
  'use strict';
  var id = 'G-0S7V29D647';
  var key = 'minizeus-analytics-consent-v1';
  var language = (document.documentElement.lang || 'ko').toLowerCase();
  var messages = language.indexOf('ja') === 0 ? {
    text: 'サイトの利用状況を把握するため、Google Analytics の利用を許可しますか？', accept: '許可', reject: '拒否', settings: '分析設定', privacy: 'プライバシー'
  } : language.indexOf('zh') === 0 ? {
    text: '是否允許使用 Google Analytics，協助我們了解網站使用情況？', accept: '允許', reject: '拒絕', settings: '分析設定', privacy: '隱私權'
  } : language.indexOf('en') === 0 ? {
    text: 'Allow Google Analytics to help us understand website visits?', accept: 'Allow', reject: 'Decline', settings: 'Analytics settings', privacy: 'Privacy'
  } : {
    text: '사이트 방문 현황을 파악하기 위해 Google Analytics 사용을 허용하시겠어요?', accept: '허용', reject: '거부', settings: '통계 설정', privacy: '개인정보처리방침'
  };
  var started = false;
  var choice = null;
  try { choice = localStorage.getItem(key); } catch (_) {}
  var panel = document.createElement('section');
  panel.className = 'mz-analytics-panel';
  panel.setAttribute('aria-label', messages.settings);
  var description = document.createElement('span');
  description.textContent = messages.text;
  var allow = document.createElement('button');
  allow.type = 'button'; allow.textContent = messages.accept;
  var deny = document.createElement('button');
  deny.type = 'button'; deny.textContent = messages.reject;
  var privacy = document.createElement('a');
  privacy.href = '/privacy.html#website-analytics'; privacy.textContent = messages.privacy;
  panel.append(description, allow, deny, privacy);
  var settings = document.createElement('button');
  settings.type = 'button'; settings.className = 'mz-analytics-settings'; settings.textContent = messages.settings;
  function store(value) { choice = value; try { localStorage.setItem(key, value); } catch (_) {} }
  function start() {
    if (started) return;
    started = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    gtag('js', new Date());
    gtag('config', id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    var referrer = '';
    try { if (document.referrer) referrer = new URL(document.referrer).origin; } catch (_) {}
    gtag('event', 'page_view', { page_location: location.origin + location.pathname, page_referrer: referrer, page_title: document.title });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }
  function hide() { panel.hidden = true; settings.hidden = false; }
  allow.addEventListener('click', function () { store('yes'); hide(); start(); });
  deny.addEventListener('click', function () {
    var wasStarted = started;
    store('no');
    window['ga-disable-' + id] = true;
    document.cookie.split(';').forEach(function (item) {
      var name = item.trim().split('=')[0];
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        ['', ';domain=' + location.hostname, ';domain=.minizeusgame.com'].forEach(function (domain) {
          document.cookie = name + '=; Max-Age=0; path=/' + domain + '; SameSite=Lax';
        });
      }
    });
    hide();
    if (wasStarted) location.reload();
  });
  settings.addEventListener('click', function () { panel.hidden = false; settings.hidden = true; allow.focus(); });
  document.body.append(panel, settings);
  if (choice === 'yes') { hide(); start(); }
  else if (choice === 'no') { hide(); }
  else { settings.hidden = true; }
}());
