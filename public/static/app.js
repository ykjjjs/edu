/* ═══════════════════════════════════════════════════════
   WebDo v9.0 — Real Google Auth + Supabase DB
   진짜 Google OAuth 로그인 + 서버 진행도 저장
   수강생 관리: Supabase 대시보드에서 실시간 조회
   Copyright 2026. WebDo (Yeon Je-jin) All rights reserved.
   ═══════════════════════════════════════════════════════ */
(function() {
'use strict';

/* ─── SUPABASE CLIENT ─────────────────────────── */
var SUPABASE_URL = 'https://qsqeotkoifwhdpzfdpmf.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcWVvdGtvaWZ3aGRwemZkcG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk4NTUsImV4cCI6MjA5MDA4NTg1NX0.lcuolb0NvVpc312t2oewwjyvu1WfHaoug6ihfGRaVjo';
var sb = null;
var sbReady = false;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    sbReady = true;
  }
}

/* ─── ADVANCED STARFIELD + SHOOTING STARS ────── */
var canvas = document.getElementById('starfield');
var ctx = canvas.getContext('2d');
var stars = [];
var shootingStars = [];
var STAR_COUNT = 280;
var STAR_COLORS = [
  [200,210,255], [180,200,255], [255,220,200], [200,255,240],
  [220,200,255], [255,200,220], [200,240,255]
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = [];
  for (var i = 0; i < STAR_COUNT; i++) {
    var c = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.2,
      dx: (Math.random() - 0.5) * 0.12,
      dy: (Math.random() - 0.5) * 0.12,
      a: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      color: c
    });
  }
}

function spawnShootingStar() {
  if (shootingStars.length < 2 && Math.random() < 0.006) {
    var angle = Math.random() * 0.4 + 0.3;
    var speed = Math.random() * 6 + 4;
    shootingStars.push({
      x: Math.random() * canvas.width * 0.8,
      y: Math.random() * canvas.height * 0.4,
      len: Math.random() * 60 + 40,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      life: 1,
      decay: Math.random() * 0.015 + 0.012
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var time = Date.now() * 0.001;
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i];
    s.x += s.dx; s.y += s.dy;
    if (s.x < 0) s.x = canvas.width;
    if (s.x > canvas.width) s.x = 0;
    if (s.y < 0) s.y = canvas.height;
    if (s.y > canvas.height) s.y = 0;
    var alpha = s.a * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed * 60));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + s.color[0] + ',' + s.color[1] + ',' + s.color[2] + ',' + alpha + ')';
    ctx.fill();
    if (s.r > 1.2) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.color[0] + ',' + s.color[1] + ',' + s.color[2] + ',' + (alpha * 0.06) + ')';
      ctx.fill();
    }
  }
  spawnShootingStar();
  for (var j = shootingStars.length - 1; j >= 0; j--) {
    var ss = shootingStars[j];
    ss.x += ss.dx; ss.y += ss.dy;
    ss.life -= ss.decay;
    if (ss.life <= 0 || ss.x > canvas.width || ss.y > canvas.height) {
      shootingStars.splice(j, 1); continue;
    }
    ctx.save();
    var spd = Math.sqrt(ss.dx*ss.dx+ss.dy*ss.dy);
    var grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.dx * (ss.len/spd), ss.y - ss.dy * (ss.len/spd));
    grad.addColorStop(0, 'rgba(200,230,255,' + (ss.life * 0.9) + ')');
    grad.addColorStop(0.3, 'rgba(100,200,255,' + (ss.life * 0.4) + ')');
    grad.addColorStop(1, 'rgba(100,180,255,0)');
    ctx.strokeStyle = grad; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ss.x, ss.y);
    var tl = ss.len * ss.life;
    ctx.lineTo(ss.x - ss.dx*(tl/spd), ss.y - ss.dy*(tl/spd));
    ctx.stroke();
    ctx.beginPath(); ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,240,255,' + (ss.life * 0.8) + ')';
    ctx.fill(); ctx.restore();
  }
  requestAnimationFrame(drawStars);
}

resizeCanvas(); initStars(); drawStars();
window.addEventListener('resize', function() { resizeCanvas(); initStars(); });

/* ─── DATA LOADING ───────────────────────────── */
var PH = [];
var NAV_DATA = {};
var dataLoaded = false;

function loadData(callback) {
  var loaded = 0;
  var total = 2;
  function check() { loaded++; if (loaded >= total) { dataLoaded = true; callback(); } }

  var xhr1 = new XMLHttpRequest();
  xhr1.open('GET', '/static/phases.json', true);
  xhr1.onload = function() {
    if (xhr1.status === 200) { try { PH = JSON.parse(xhr1.responseText); } catch(e) {} }
    check();
  };
  xhr1.onerror = check;
  xhr1.send();

  var xhr2 = new XMLHttpRequest();
  xhr2.open('GET', '/static/nav-data.json', true);
  xhr2.onload = function() {
    if (xhr2.status === 200) { try { NAV_DATA = JSON.parse(xhr2.responseText); } catch(e) {} }
    check();
  };
  xhr2.onerror = check;
  xhr2.send();
}

/* ─── STATE ──────────────────────────────────── */
var SK = 'webdo_v9';
var st = {};
var pts = [];
var curUser = null;
var curUserMeta = null;
var curPhId = null;
var curStep = null;
var tSt = {};
var sbClosed = {};
var syncTimer = null;

function loadSt() {
  try { st = JSON.parse(localStorage.getItem(SK + '_s') || '{}'); } catch(e) { st = {}; }
  try { pts = JSON.parse(localStorage.getItem(SK + '_p') || '[]'); } catch(e) { pts = []; }
}
function saveSt() {
  localStorage.setItem(SK + '_s', JSON.stringify(st));
  localStorage.setItem(SK + '_p', JSON.stringify(pts));
  debounceSyncToServer();
}
function isDone(id) { return !!st[id]; }
function setDone(id, v) { st[id] = v; saveSt(); }
function allSteps() {
  var r = [];
  for (var i = 0; i < PH.length; i++) {
    for (var j = 0; j < PH[i].steps.length; j++) r.push(PH[i].steps[j]);
  }
  return r;
}
function totalDone() {
  var steps = allSteps(), c = 0;
  for (var i = 0; i < steps.length; i++) { if (isDone(steps[i].id)) c++; }
  return c;
}
function pDone(p) {
  var c = 0;
  for (var i = 0; i < p.steps.length; i++) { if (isDone(p.steps[i].id)) c++; }
  return c;
}
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── SUPABASE SYNC (서버 저장) ─────────────── */
function debounceSyncToServer() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(function() { syncProgressToServer(); }, 2000);
}

function syncProgressToServer() {
  if (!sbReady || !sb || !curUser) return;
  sb.auth.getUser().then(function(res) {
    if (!res.data || !res.data.user) return;
    var userId = res.data.user.id;
    var payload = {
      user_id: userId,
      progress_data: JSON.stringify(st),
      nav_checks: JSON.stringify(getAllNavChecks()),
      patients_data: JSON.stringify(pts),
      updated_at: new Date().toISOString()
    };
    sb.from('user_progress').upsert(payload, { onConflict: 'user_id' })
      .then(function() { /* silent */ })
      .catch(function() { /* fallback: localStorage already saved */ });
  });
}

function loadProgressFromServer() {
  if (!sbReady || !sb || !curUser) return Promise.resolve();
  return sb.auth.getUser().then(function(res) {
    if (!res.data || !res.data.user) return;
    var userId = res.data.user.id;
    return sb.from('user_progress').select('*').eq('user_id', userId).single()
      .then(function(resp) {
        if (resp.data) {
          try { st = JSON.parse(resp.data.progress_data || '{}'); } catch(e) {}
          try { pts = JSON.parse(resp.data.patients_data || '[]'); } catch(e) {}
          try {
            var navChecks = JSON.parse(resp.data.nav_checks || '{}');
            restoreAllNavChecks(navChecks);
          } catch(e) {}
          localStorage.setItem(SK + '_s', JSON.stringify(st));
          localStorage.setItem(SK + '_p', JSON.stringify(pts));
        }
      }).catch(function() { /* No server data yet, use localStorage */ });
  });
}

function getAllNavChecks() {
  var all = {};
  for (var key in NAV_DATA) {
    try { var c = JSON.parse(localStorage.getItem(SK + '_tc_' + key) || '{}'); if (Object.keys(c).length) all[key] = c; } catch(e) {}
  }
  return all;
}

function restoreAllNavChecks(obj) {
  if (!obj) return;
  for (var key in obj) {
    localStorage.setItem(SK + '_tc_' + key, JSON.stringify(obj[key]));
  }
}

/* ─── AUTH (Real Supabase Google OAuth) ─────── */
document.getElementById('gBtn').addEventListener('click', function() {
  if (!sbReady) {
    showLoginError('Supabase SDK 로딩 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  document.getElementById('gBtn').disabled = true;
  document.getElementById('gBtn').textContent = '로그인 중...';
  sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  }).then(function(res) {
    if (res.error) {
      showLoginError('로그인 실패: ' + res.error.message);
      document.getElementById('gBtn').disabled = false;
      document.getElementById('gBtn').innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Google 계정으로 시작하기';
    }
    /* OAuth redirect happens automatically */
  });
});

document.getElementById('logoutBtn').addEventListener('click', function() {
  if (sbReady && sb) {
    sb.auth.signOut().then(function() {
      doLogout();
    });
  } else {
    doLogout();
  }
});

function doLogout() {
  localStorage.removeItem(SK + '_user');
  curUser = null;
  curUserMeta = null;
  document.getElementById('appShell').classList.remove('on');
  document.getElementById('loginScreen').style.display = 'flex';
  exitNavMode();
}

function showLoginError(msg) {
  var el = document.getElementById('loginError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function launch(user) {
  curUser = user.email || user.user_metadata && user.user_metadata.email || 'unknown';
  curUserMeta = user.user_metadata || {};
  var displayName = curUserMeta.full_name || curUserMeta.name || curUser;
  var avatar = curUserMeta.avatar_url || curUserMeta.picture || '';

  localStorage.setItem(SK + '_user', curUser);
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').classList.add('on');

  /* Avatar */
  var avImg = document.getElementById('userAvImg');
  var avText = document.getElementById('userAv');
  if (avatar) {
    avImg.src = avatar;
    avImg.style.display = 'block';
    avText.style.display = 'none';
  } else {
    avText.textContent = curUser[0].toUpperCase();
    avImg.style.display = 'none';
    avText.style.display = 'flex';
  }
  document.getElementById('userName').textContent = displayName;

  /* Load progress from server, then render */
  loadProgressFromServer().then(function() {
    renderSidebar();
    updateTopPct();
    showWelcome();
  }).catch(function() {
    renderSidebar();
    updateTopPct();
    showWelcome();
  });
}

/* ─── SIDEBAR ────────────────────────────────── */
document.getElementById('hambBtn').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('open');
});

function renderSidebar() {
  if (!dataLoaded) return;
  var menu = document.getElementById('sbMenu');
  var html = '';
  for (var pi = 0; pi < PH.length; pi++) {
    var p = PH[pi];
    if (sbClosed[p.id] === undefined) sbClosed[p.id] = pi > 0;
    var done = pDone(p);
    var total = p.steps.length;
    html += '<div class="sb-phase-hdr" data-phid="' + p.id + '">'
      + '<div class="sb-phase-icon" style="background:' + p.color + '22;color:' + p.color + '">' + p.icon + '</div>'
      + '<div class="sb-phase-name">' + esc(p.title) + '</div>'
      + '<div class="sb-phase-cnt' + (done === total ? ' done' : '') + '">' + done + '/' + total + '</div>'
      + '</div>'
      + '<div class="sb-steps' + (sbClosed[p.id] ? ' closed' : '') + '" id="sbS_' + p.id + '">';
    for (var si = 0; si < p.steps.length; si++) {
      var s = p.steps[si];
      var d = isDone(s.id);
      html += '<div class="sb-step' + (d ? ' dn' : '') + '" data-sid="' + s.id + '" data-phid="' + p.id + '">'
        + '<div class="sc">' + (d ? '&#10003;' : '') + '</div>'
        + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.72rem">'
        + esc(s.title.length > 22 ? s.title.substring(0, 22) + '\u2026' : s.title) + '</span>'
        + '</div>';
    }
    html += '</div><div class="sb-divider"></div>';
  }
  menu.innerHTML = html;

  menu.onclick = function(e) {
    var phHdr = e.target.closest('.sb-phase-hdr');
    if (phHdr) {
      var id = phHdr.getAttribute('data-phid');
      sbClosed[id] = !sbClosed[id];
      renderSidebar();
      return;
    }
    var step = e.target.closest('.sb-step');
    if (step) {
      var sid = step.getAttribute('data-sid');
      var phid = step.getAttribute('data-phid');
      exitNavMode();
      showPhaseView(phid);
      setTimeout(function() { openModal(sid); }, 100);
      document.getElementById('sidebar').classList.remove('open');
    }
  };

  var done2 = totalDone();
  var total2 = allSteps().length;
  var pct = total2 ? Math.round(done2 / total2 * 100) : 0;
  document.getElementById('sbFpTxt').textContent = done2 + ' / ' + total2 + ' \ub2e8\uacc4 \uc644\ub8cc';
  document.getElementById('sbFpFill').style.width = pct + '%';
}

function updateTopPct() {
  if (!dataLoaded) return;
  var done = totalDone(), total = allSteps().length;
  var pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('topPct').textContent = pct + '%';
}

/* ─── WELCOME ────────────────────────────────── */
function showWelcome() {
  if (!dataLoaded) return;
  curPhId = null;
  var done = totalDone(), total = allSteps().length;
  var pct = total ? Math.round(done / total * 100) : 0;
  var displayName = (curUserMeta && (curUserMeta.full_name || curUserMeta.name)) || curUser || '';

  var html = '<div class="welcome-hero"><div class="wh-inner">'
    + '<div class="wh-hi">\uc548\ub155\ud558\uc138\uc694, ' + esc(displayName) + ' \ud83d\udc4b</div>'
    + '<div class="wh-title">Web<span>Do</span></div>'
    + '<div class="wh-sub">HTML \ud504\ub85c\ud1a0\ud0c0\uc785 \ud55c \uc7a5\uc5d0\uc11c \uc2dc\uc791\ud574\uc11c Google \ub85c\uadf8\uc778 \xb7 Supabase DB \xb7 Telegram \uc54c\ub9bc\uae4c\uc9c0<br>\uc11c\ubc84\ube44 0\uc6d0\uc73c\ub85c \uc644\uc131\ud558\ub294 \uc804\uccb4 \uacf5\uc815\uc744 \ub2e8\uacc4\ubcc4\ub85c \uc2e4\uc2b5\ud569\ub2c8\ub2e4.</div>'
    + '<div class="wh-stats">'
    + '<div class="wstat"><div class="wstat-num">' + pct + '%</div><div class="wstat-lbl">\uc804\uccb4 \ub2ec\uc131\ub960</div></div>'
    + '<div class="wstat"><div class="wstat-num">' + done + '</div><div class="wstat-lbl">\uc644\ub8cc \ub2e8\uacc4</div></div>'
    + '<div class="wstat"><div class="wstat-num">' + (total - done) + '</div><div class="wstat-lbl">\ub0a8\uc740 \ub2e8\uacc4</div></div>'
    + '<div class="wstat"><div class="wstat-num">' + PH.length + '</div><div class="wstat-lbl">\ucd1d Phase</div></div>'
    + '</div></div></div>'
    + '<div class="phase-grid">';

  for (var i = 0; i < PH.length; i++) {
    var p = PH[i];
    var d = pDone(p), t = p.steps.length;
    var pct2 = Math.round(d / t * 100);
    html += '<div class="ph-card" data-phid="' + p.id + '">'
      + '<div class="ph-card-top">'
      + '<div class="ph-card-icon" style="background:' + p.color + '20;color:' + p.color + '">' + p.icon + '</div>'
      + '<div class="ph-card-title">' + esc(p.title) + '</div></div>'
      + '<div class="ph-card-sub">' + esc(p.sub) + '</div>'
      + '<div class="ph-mini-bar"><div class="ph-mini-fill" style="width:' + pct2 + '%;background:' + p.color + '"></div></div>'
      + '<div class="ph-mini-lbl">' + d + '/' + t + ' \uc644\ub8cc</div>'
      + '</div>';
  }
  html += '</div>';

  var ci = document.getElementById('contentInner');
  ci.innerHTML = html;
  ci.onclick = function(e) {
    var card = e.target.closest('.ph-card');
    if (card) showPhaseView(card.getAttribute('data-phid'));
  };
}

/* ─── PHASE VIEW ─────────────────────────────── */
function showPhaseView(phId) {
  if (!dataLoaded) return;
  curPhId = phId;
  var phase = null, pi = -1;
  for (var i = 0; i < PH.length; i++) {
    if (PH[i].id === phId) { phase = PH[i]; pi = i; break; }
  }
  if (!phase) return;

  var done = pDone(phase), total = phase.steps.length, allDone2 = done === total;
  var ci = document.getElementById('contentInner');
  var html = '<button class="back-btn" id="backBtn">&larr; \ub300\uc2dc\ubcf4\ub4dc\ub85c \ub3cc\uc544\uac00\uae30</button>';

  if (allDone2) {
    html += '<div class="done-banner on"><h2>\ud83c\udf89 ' + esc(phase.title) + ' COMPLETE!</h2><p>\uc774 Phase\uc758 \ubaa8\ub4e0 \ub2e8\uacc4\ub97c \ub9c8\ucce4\uc2b5\ub2c8\ub2e4!</p></div>';
  }

  html += '<div class="phase-hdr">'
    + '<div class="ph-icon-big" style="background:' + phase.color + '20;color:' + phase.color + '">' + phase.icon + '</div>'
    + '<div><div class="ph-title-big">' + esc(phase.title) + '</div><div class="ph-sub-big">' + esc(phase.sub) + '</div></div>'
    + '<div class="ph-badge' + (allDone2 ? ' done' : '') + '">' + done + '/' + total + ' \uc644\ub8cc</div>'
    + '</div>';

  if (phId === 'p4') html += buildPatientSection() + buildCryptoDemo();

  html += '<div class="steps-list">';
  for (var si = 0; si < phase.steps.length; si++) {
    html += renderStepCard(phase.steps[si], pi, si);
  }
  html += '</div>';

  ci.innerHTML = html;
  ci.onclick = function(e) {
    if (e.target.closest('#backBtn')) { showWelcome(); return; }
    var stepEl = e.target.closest('[data-step-id]');
    if (stepEl && !e.target.closest('.sc-nav-btn')) { e.stopPropagation(); openModal(stepEl.getAttribute('data-step-id')); return; }
    var navBtn = e.target.closest('[data-nav-step]');
    if (navBtn) { e.stopPropagation(); enterNavMode(navBtn.getAttribute('data-nav-step')); return; }
    if (e.target.closest('#ptAddBtn')) { openPatientForm(); return; }
    if (e.target.closest('#ptSampleBtn')) { loadSamples(); return; }
    if (e.target.closest('#ptSqlBtn')) { genSQL(); return; }
    if (e.target.closest('#ptClearBtn')) {
      if (confirm('\ubaa8\ub4e0 \ud658\uc790 \ub370\uc774\ud130\ub97c \uc0ad\uc81c\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?')) {
        pts = []; saveSt(); showPhaseView('p4');
      }
      return;
    }
    var delBtn = e.target.closest('.pt-del');
    if (delBtn) {
      var idx = parseInt(delBtn.getAttribute('data-idx'));
      if (!isNaN(idx)) { pts.splice(idx, 1); saveSt(); showPhaseView('p4'); }
      return;
    }
    if (e.target.closest('#encBtn')) { doCryptoEnc(); return; }
    if (e.target.closest('#decBtn')) { doCryptoDec(); return; }
    if (e.target.closest('#matchBtn')) { doCryptoMatch(); return; }
  };

  renderSidebar();
  updateTopPct();
}

function renderStepCard(s, pi, si) {
  var done = isDone(s.id);
  var hasNav = !!NAV_DATA[s.id];
  var navCount = hasNav ? NAV_DATA[s.id].nav.length : 0;
  return '<div class="step-card' + (done ? ' dn' : '') + '" id="card_' + s.id + '">'
    + '<div class="step-card-hdr" data-step-id="' + s.id + '" style="cursor:pointer">'
    + '<div class="sc-num">' + (done ? '&#10003;' : (pi + 1) + '-' + (si + 1)) + '</div>'
    + '<div class="sc-info">'
    + '<div class="sc-title">' + esc(s.title) + '</div>'
    + '<div class="sc-tags">'
    + (s.tags || []).map(function(t) { return '<span class="sc-tag">' + esc(t) + '</span>'; }).join('')
    + '<span class="sc-tag">' + esc(s.diff || '\u2605\u2606\u2606') + '</span>'
    + '</div></div>'
    + '<div class="sc-right">'
    + '<div class="sc-time">\u23f1 ' + esc(s.time) + '</div>'
    + (hasNav ? '<button class="sc-nav-btn" data-nav-step="' + s.id + '">\ud83d\ude80 \uc2e4\uc2b5 \uc2dc\uc791 <span class="sc-nav-cnt">' + navCount + '\uac1c</span></button>' : '')
    + '<button class="sc-btn" data-step-id="' + s.id + '">' + (done ? '\ud83d\udccb \ubcf5\uc2b5' : '\u25b6 \uc0c1\uc138') + '</button>'
    + '</div></div></div>';
}

/* ═════════════════════════════════════════════════
   NAVIGATOR MODE v3 — Open Tab Edition
   ═════════════════════════════════════════════════ */
var navActive = false;
var navStepId = null;
var navTaskIdx = 0;
var navSavedChecks = {};
var navNavInfo = null;
var navOpenedTabs = {};

var SITE_META = {
  'accounts.google.com': { icon: '\ud83d\udd11', color: '#4285F4', name: 'Google' },
  'supabase.com':        { icon: '\ud83d\udfe2', color: '#3ECF8E', name: 'Supabase' },
  'github.com':          { icon: '\ud83d\udc19', color: '#f0f6fc', name: 'GitHub' },
  'dash.cloudflare.com': { icon: '\u2601\ufe0f', color: '#F6821F', name: 'Cloudflare' },
  'cloudflare.com':      { icon: '\u2601\ufe0f', color: '#F6821F', name: 'Cloudflare' },
  'claude.ai':           { icon: '\ud83e\udde0', color: '#CC7832', name: 'Claude AI' },
  'www.genspark.ai':     { icon: '\u2728',       color: '#6366F1', name: 'GenSpark' },
  'web.telegram.org':    { icon: '\ud83d\udcac', color: '#229ED9', name: 'Telegram' },
  't.me':                { icon: '\ud83e\udd16', color: '#229ED9', name: 'Telegram Bot' },
  'console.cloud.google.com': { icon: '\u2601\ufe0f', color: '#4285F4', name: 'GCP Console' },
  'securityheaders.com': { icon: '\ud83d\udee1\ufe0f', color: '#4CAF50', name: 'Security Headers' },
  'www.ssllabs.com':     { icon: '\ud83d\udd12', color: '#1565C0', name: 'SSL Labs' },
  'developer.mozilla.org': { icon: '\ud83e\udd8a', color: '#E66000', name: 'MDN Observatory' },
  'www.gabia.com':       { icon: '\ud83c\udf10', color: '#0078D4', name: 'Gabia' }
};

function getSiteMeta(url) {
  if (!url) return { icon: '\ud83d\udcbb', color: '#888', name: '\ub85c\uceec \uc791\uc5c5' };
  try { var d = new URL(url).hostname; return SITE_META[d] || { icon: '\ud83c\udf10', color: '#888', name: d }; }
  catch(e) { return { icon: '\ud83c\udf10', color: '#888', name: url.substring(0,30) }; }
}

function enterNavMode(stepId) {
  var navInfo = NAV_DATA[stepId];
  if (!navInfo || !navInfo.nav || navInfo.nav.length === 0) { openModal(stepId); return; }

  var step = null, pi = -1, si = -1;
  for (var i = 0; i < PH.length; i++) {
    for (var j = 0; j < PH[i].steps.length; j++) {
      if (PH[i].steps[j].id === stepId) { step = PH[i].steps[j]; pi = i; si = j; break; }
    }
    if (step) break;
  }
  if (!step) return;

  navActive = true;
  navStepId = stepId;
  navTaskIdx = 0;
  navNavInfo = navInfo;
  navOpenedTabs = {};

  try { navSavedChecks = JSON.parse(localStorage.getItem(SK + '_tc_' + stepId) || '{}'); } catch(e) { navSavedChecks = {}; }

  var firstUnchecked = 0;
  for (var f = 0; f < navInfo.nav.length; f++) {
    if (!navSavedChecks[f]) { firstUnchecked = f; break; }
    if (f === navInfo.nav.length - 1) firstUnchecked = f;
  }
  navTaskIdx = firstUnchecked;

  var navContainer = document.getElementById('navContainer');
  var phase = PH[pi];

  var leftHtml = '<div class="nav-header">'
    + '<button class="nav-close-btn" id="navCloseBtn">&times;</button>'
    + '<div class="nav-step-info">'
    + '<span class="nav-phase-tag" style="background:' + phase.color + '22;color:' + phase.color + '">' + phase.icon + ' ' + esc(phase.title) + '</span>'
    + '<div class="nav-step-title">' + esc(step.title) + '</div>'
    + '<div class="nav-step-time">\u23f1 ' + esc(step.time) + ' &middot; ' + navInfo.nav.length + '\uac1c \ud56d\ubaa9</div>'
    + '</div></div>'
    + '<div class="nav-tasks" id="navTasks">';

  for (var t = 0; t < navInfo.nav.length; t++) {
    var ni = navInfo.nav[t];
    var checked = navSavedChecks[t];
    var sm = getSiteMeta(ni.url);
    leftHtml += '<div class="nav-task' + (checked ? ' done' : '') + (t === firstUnchecked ? ' active' : '') + '" data-nav-ti="' + t + '">'
      + '<div class="nav-task-check" data-check-ti="' + t + '">'
      + '<div class="nav-tk">' + (checked ? '&#10003;' : (t + 1)) + '</div>'
      + '</div>'
      + '<div class="nav-task-body" data-goto-ti="' + t + '">'
      + '<div class="nav-task-label">' + sm.icon + ' ' + esc(ni.label) + '</div>'
      + '<div class="nav-task-hint">' + esc(ni.hint) + '</div>'
      + '</div>'
      + (ni.url ? '<button class="nav-open-btn" data-open-ti="' + t + '" title="\uc0c8 \ud0ed\uc73c\ub85c \uc5f4\uae30">\ud83d\ude80</button>' : '')
      + '</div>';
  }

  leftHtml += '</div>'
    + '<div class="nav-footer">'
    + '<div class="nav-progress-txt" id="navProgressTxt">0 / ' + navInfo.nav.length + ' \uc644\ub8cc</div>'
    + '<div class="nav-progress-bar"><div class="nav-progress-fill" id="navProgressFill" style="width:0%"></div></div>'
    + '<div class="nav-footer-btns">'
    + '<button class="nav-prev-btn" id="navPrevBtn">\u25c0 \uc774\uc804</button>'
    + '<button class="nav-next-btn" id="navNextBtn">\ub2e4\uc74c \u25b6</button>'
    + '</div>'
    + '<button class="nav-complete-btn" id="navCompleteBtn">\u2705 \ub2e8\uacc4 \uc804\uccb4 \uc644\ub8cc</button>'
    + '</div>';

  document.getElementById('navLeft').innerHTML = leftHtml;
  renderNavRight(firstUnchecked, navInfo, step, phase);

  navContainer.classList.add('on');
  document.getElementById('appShell').style.display = 'none';
  updateNavProgress(navInfo, navSavedChecks);

  document.getElementById('navCloseBtn').addEventListener('click', exitNavMode);
  document.getElementById('navCompleteBtn').addEventListener('click', function() {
    completeStep(navStepId);
    exitNavMode();
  });
  document.getElementById('navPrevBtn').addEventListener('click', function() {
    if (navTaskIdx > 0) { navTaskIdx--; setActiveNavTask(navTaskIdx, navNavInfo, true); }
  });
  document.getElementById('navNextBtn').addEventListener('click', function() {
    if (navTaskIdx < navNavInfo.nav.length - 1) { navTaskIdx++; setActiveNavTask(navTaskIdx, navNavInfo, true); }
  });

  var navTasks = document.getElementById('navTasks');
  navTasks.addEventListener('click', function(e) {
    var openBtn = e.target.closest('[data-open-ti]');
    if (openBtn) { var oi = parseInt(openBtn.getAttribute('data-open-ti')); if (!isNaN(oi)) openSiteTab(oi, navNavInfo); return; }
    var checkArea = e.target.closest('[data-check-ti]');
    if (checkArea) { var ci2 = parseInt(checkArea.getAttribute('data-check-ti')); if (!isNaN(ci2)) toggleNavCheck(ci2); return; }
    var gotoArea = e.target.closest('[data-goto-ti]');
    if (gotoArea) { var gi = parseInt(gotoArea.getAttribute('data-goto-ti')); if (!isNaN(gi)) { navTaskIdx = gi; setActiveNavTask(gi, navNavInfo, true); } return; }
  });

  document.getElementById('navRight').addEventListener('click', function(e) {
    var openMain = e.target.closest('#navOpenSiteBtn');
    if (openMain) { openSiteTab(navTaskIdx, navNavInfo); return; }
    var checkMain = e.target.closest('#navCheckCurBtn');
    if (checkMain) { toggleNavCheck(navTaskIdx); return; }
  });

  navKeyHandler = function(e) {
    if (!navActive) return;
    if (e.key === 'Escape') { exitNavMode(); return; }
    if (e.key === ' ' && !e.target.closest('input,textarea,select')) { e.preventDefault(); toggleNavCheck(navTaskIdx); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); if (navTaskIdx < navNavInfo.nav.length - 1) { navTaskIdx++; setActiveNavTask(navTaskIdx, navNavInfo, true); } return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); if (navTaskIdx > 0) { navTaskIdx--; setActiveNavTask(navTaskIdx, navNavInfo, true); } return; }
    if (e.key === 'Enter' && !e.target.closest('input,textarea,select')) {
      e.preventDefault();
      var ni2 = navNavInfo.nav[navTaskIdx];
      if (ni2 && ni2.url) { openSiteTab(navTaskIdx, navNavInfo); }
      var allChecked = true;
      for (var k = 0; k < navNavInfo.nav.length; k++) { if (!navSavedChecks[k]) { allChecked = false; break; } }
      if (allChecked) { completeStep(navStepId); exitNavMode(); }
      return;
    }
    var num = parseInt(e.key);
    if (num >= 1 && num <= navNavInfo.nav.length) { navTaskIdx = num - 1; setActiveNavTask(navTaskIdx, navNavInfo, true); return; }
  };
  document.addEventListener('keydown', navKeyHandler);
}

var navKeyHandler = null;

function openSiteTab(idx, navInfo) {
  var ni = navInfo.nav[idx];
  if (!ni || !ni.url) return;
  window.open(ni.url, '_blank');
  navOpenedTabs[idx] = true;
  var btn = document.querySelector('.nav-open-btn[data-open-ti="' + idx + '"]');
  if (btn) { btn.classList.add('opened'); btn.textContent = '\u2705'; }
  renderNavRight(idx, navInfo);
  showNavToast('\ud83d\ude80 ' + getSiteMeta(ni.url).name + ' \uc5f4\ub9bc');
}

function renderNavRight(idx, navInfo) {
  var ni = navInfo.nav[idx];
  var sm = getSiteMeta(ni ? ni.url : null);
  var isLocal = !ni || !ni.url;
  var isChecked = !!navSavedChecks[idx];
  var wasOpened = !!navOpenedTabs[idx];

  var html = '<div class="nr-inner">';
  html += '<div class="nr-step-num">\ud56d\ubaa9 ' + (idx + 1) + ' / ' + navInfo.nav.length + '</div>';
  html += '<div class="nr-site-card">'
    + '<div class="nr-site-icon" style="background:' + sm.color + '22;color:' + sm.color + ';font-size:2.4rem;">' + sm.icon + '</div>'
    + '<div class="nr-site-name">' + esc(sm.name) + '</div>'
    + '<div class="nr-task-title">' + esc(ni ? ni.label : '') + '</div>'
    + '</div>';
  html += '<div class="nr-hint-box">'
    + '<div class="nr-hint-label">\ud83d\udca1 \uc774\ubc88 \ud56d\ubaa9\uc5d0\uc11c \ud560 \uc77c</div>'
    + '<div class="nr-hint-text">' + esc(ni ? ni.hint : '') + '</div>'
    + '</div>';

  if (!isLocal) {
    html += '<button class="nr-open-btn" id="navOpenSiteBtn">'
      + (wasOpened ? '\ud83d\udd01 ' + esc(sm.name) + ' \ub2e4\uc2dc \uc5f4\uae30' : '\ud83d\ude80 ' + esc(sm.name) + ' \uc0c8 \ud0ed\uc73c\ub85c \uc5f4\uae30')
      + '</button>'
      + '<div class="nr-url-display">' + esc(ni.url) + '</div>';
  } else {
    html += '<div class="nr-local-box">'
      + '<div class="nr-local-icon">\ud83d\udcbb</div>'
      + '<div class="nr-local-txt">\ub85c\uceec\uc5d0\uc11c \uc9c1\uc811 \uc791\uc5c5\ud558\ub294 \ud56d\ubaa9\uc785\ub2c8\ub2e4<br><span>\uc544\ub798 \uccb4\ud06c \ubc84\ud2bc\uc73c\ub85c \uc644\ub8cc \ud45c\uc2dc\ud558\uc138\uc694</span></div>'
      + '</div>';
  }

  html += '<button class="nr-check-btn' + (isChecked ? ' done' : '') + '" id="navCheckCurBtn">'
    + (isChecked ? '\u21a9\ufe0f \uc644\ub8cc \ucde8\uc18c' : '\u2705 \uc644\ub8cc \uccb4\ud06c (Space)')
    + '</button>';
  html += '<div class="nr-keys">'
    + '<span class="nr-key">Space</span> \uccb4\ud06c &nbsp; '
    + '<span class="nr-key">\u2190 \u2192</span> \uc774\ub3d9 &nbsp; '
    + '<span class="nr-key">Enter</span> \uc5f4\uae30 &nbsp; '
    + '<span class="nr-key">Esc</span> \ub2eb\uae30 &nbsp; '
    + '<span class="nr-key">1-9</span> \uc810\ud504'
    + '</div>';
  html += '</div>';
  document.getElementById('navRight').innerHTML = html;
}

function toggleNavCheck(ti) {
  navSavedChecks[ti] = !navSavedChecks[ti];
  localStorage.setItem(SK + '_tc_' + navStepId, JSON.stringify(navSavedChecks));
  debounceSyncToServer();

  var taskEl = document.querySelector('.nav-task[data-nav-ti="' + ti + '"]');
  if (taskEl) {
    var tkEl = taskEl.querySelector('.nav-tk');
    if (navSavedChecks[ti]) {
      taskEl.classList.add('done'); taskEl.classList.add('check-flash');
      if (tkEl) tkEl.innerHTML = '&#10003;';
      setTimeout(function() { taskEl.classList.remove('check-flash'); }, 400);
    } else {
      taskEl.classList.remove('done');
      if (tkEl) tkEl.textContent = (ti + 1);
    }
  }

  updateNavProgress(navNavInfo, navSavedChecks);
  renderNavRight(navTaskIdx, navNavInfo);

  if (navSavedChecks[ti]) {
    var nextIdx = -1;
    for (var n = 0; n < navNavInfo.nav.length; n++) { if (!navSavedChecks[n]) { nextIdx = n; break; } }
    if (nextIdx >= 0) { navTaskIdx = nextIdx; setTimeout(function() { setActiveNavTask(nextIdx, navNavInfo, true); }, 250); }
    if (nextIdx < 0) { showNavToast('\ud83c\udf89 \ubaa8\ub4e0 \ud56d\ubaa9 \uc644\ub8cc! Enter\ub85c \ub2e8\uacc4 \uc644\ub8cc'); }
  }
}

function setActiveNavTask(idx, navInfo, navigate) {
  var tasks = document.querySelectorAll('#navTasks .nav-task');
  for (var i = 0; i < tasks.length; i++) { tasks[i].classList.remove('active'); }
  if (tasks[idx]) { tasks[idx].classList.add('active'); tasks[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  var prevBtn = document.getElementById('navPrevBtn');
  var nextBtn = document.getElementById('navNextBtn');
  if (prevBtn) prevBtn.disabled = (idx === 0);
  if (nextBtn) nextBtn.disabled = (idx >= navInfo.nav.length - 1);
  if (navigate) renderNavRight(idx, navInfo);
}

function updateNavProgress(navInfo, checks) {
  var done = 0;
  for (var i = 0; i < navInfo.nav.length; i++) { if (checks[i]) done++; }
  var total = navInfo.nav.length;
  var pct = Math.round(done / total * 100);
  var txt = document.getElementById('navProgressTxt');
  var fill = document.getElementById('navProgressFill');
  if (txt) txt.textContent = done + ' / ' + total + ' \uc644\ub8cc (' + pct + '%)';
  if (fill) fill.style.width = pct + '%';
  var btn = document.getElementById('navCompleteBtn');
  if (btn) {
    if (done >= total) { btn.classList.add('ready'); btn.textContent = '\u2705 \ub2e8\uacc4 \uc804\uccb4 \uc644\ub8cc (Enter)'; }
    else { btn.classList.remove('ready'); btn.textContent = '\u2705 \ub2e8\uacc4 \uc804\uccb4 \uc644\ub8cc'; }
  }
}

function showNavToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, 2500);
}

function exitNavMode() {
  navActive = false;
  navNavInfo = null;
  navOpenedTabs = {};
  var navContainer = document.getElementById('navContainer');
  navContainer.classList.remove('on');
  document.getElementById('appShell').style.display = '';
  document.getElementById('appShell').classList.add('on');
  if (navKeyHandler) { document.removeEventListener('keydown', navKeyHandler); navKeyHandler = null; }
  if (curPhId) showPhaseView(curPhId);
  else showWelcome();
  renderSidebar();
  updateTopPct();
}

/* ─── PATIENT SECTION ────────────────────────── */
function buildPatientSection() {
  var rows = '';
  if (pts.length === 0) {
    rows = '<tr><td colspan="8"><div class="pt-empty"><div class="pt-empty-icon">\ud83d\ude80</div><div class="pt-empty-txt">[+ \ud658\uc790 \ucd94\uac00] \ub610\ub294 [\uc0d8\ud50c 5\uba85 \ucd94\uac00] \ubc84\ud2bc\uc73c\ub85c \uac00\uc0c1 \ub370\uc774\ud130\ub97c \ucd94\uac00\ud558\uc138\uc694.</div></div></td></tr>';
  } else {
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      rows += '<tr>'
        + '<td>' + esc(p.id.substring(0, 8)) + '\u2026</td>'
        + '<td><b>' + esc(p.name) + '</b></td>'
        + '<td>' + (p.gender === 'M' ? '\ub0a8' : '\uc5ec') + '</td>'
        + '<td>' + esc(p.dept) + '</td>'
        + '<td class="enc-cell" title="' + esc(p.birth_enc || '') + '">' + esc((p.birth_enc || '').substring(0, 18) + (p.birth_enc ? '\u2026' : '\ubbf8\uc554\ud638\ud654')) + '</td>'
        + '<td class="enc-cell" title="' + esc(p.phone_enc || '') + '">' + esc((p.phone_enc || '').substring(0, 18) + (p.phone_enc ? '\u2026' : '\ubbf8\uc554\ud638\ud654')) + '</td>'
        + '<td><span class="ptb ' + (p.status === 'active' ? 'in' : 'out') + '">' + (p.status === 'active' ? '\uc7ac\uc9c4\uc911' : '\ud1f4\uc6d0') + '</span></td>'
        + '<td><button class="pt-del" data-idx="' + i + '">\ud83d\uddd1</button></td>'
        + '</tr>';
    }
  }
  return '<div class="pt-section">'
    + '<div class="pt-hdr"><div class="pt-hdr-l">'
    + '<span class="pt-badge-excel">\ud83c\udfe5 PATIENTS</span>'
    + '<span class="pt-hdr-title">\ud658\uc790 \ub370\uc774\ud130 \uad00\ub9ac \u2014 \uc9c1\uc811 \uc785\ub825 \u2192 AES-256 \uc554\ud638\ud654 \u2192 SQL \uc790\ub3d9 \uc0dd\uc131</span>'
    + '</div>'
    + '<button class="pt-add-btn" id="ptAddBtn">+ \ud658\uc790 \ucd94\uac00</button>'
    + '</div>'
    + '<div class="pt-tbl-wrap"><table class="pt-tbl"><thead><tr>'
    + '<th>ID</th><th>\uc774\ub984</th><th>\uc131\ubcc4</th><th>\uc9c4\ub8cc\uacfc</th>'
    + '<th>\uc0dd\ub144\uc6d4\uc77c(\uc554\ud638\ud654)</th><th>\uc804\ud654\ubc88\ud638(\uc554\ud638\ud654)</th><th>\uc0c1\ud0dc</th><th></th>'
    + '</tr></thead><tbody id="ptTbody">' + rows + '</tbody></table></div>'
    + '<div class="pt-actions">'
    + '<button class="pt-act-btn" id="ptSampleBtn">\ud83d\udccb \uc0d8\ud50c 5\uba85 \ucd94\uac00</button>'
    + '<button class="pt-act-btn pri" id="ptSqlBtn">\ud83d\udcbe SQL INSERT \uc0dd\uc131</button>'
    + '<button class="pt-act-btn" id="ptClearBtn">\ud83d\uddd1 \uc804\uccb4 \uc0ad\uc81c</button>'
    + '</div></div>';
}

function openPatientForm() {
  var body = '<div class="pf-grid">'
    + '<div class="pf-field"><label class="pf-lbl">\uc774\ub984 *</label><input class="pf-inp" id="pf_name" placeholder="\ud64d\uae38\ub3d9"></div>'
    + '<div class="pf-field"><label class="pf-lbl">\uc131\ubcc4</label><select class="pf-sel" id="pf_gen"><option value="M">\ub0a8\uc131</option><option value="F">\uc5ec\uc131</option></select></div>'
    + '<div class="pf-field"><label class="pf-lbl">\uc9c4\ub8cc\uacfc *</label><select class="pf-sel" id="pf_dept"><option>\ub0b4\uacfc</option><option>\uc678\uacfc</option><option>\uc548\uacfc</option><option>\uc815\ud615\uc678\uacfc</option><option>\ud53c\ubd80\uacfc</option><option>\uc2e0\uacbd\uacfc</option><option>\uc18c\uc544\uacfc</option></select></div>'
    + '<div class="pf-field"><label class="pf-lbl">\uc0c1\ud0dc</label><select class="pf-sel" id="pf_st"><option value="active">\uc7ac\uc9c4\uc911</option><option value="out">\ud1f4\uc6d0</option></select></div>'
    + '<div class="pf-field"><label class="pf-lbl">\uc0dd\ub144\uc6d4\uc77c \ud83d\udd10</label><input class="pf-inp" id="pf_birth" type="date"></div>'
    + '<div class="pf-field"><label class="pf-lbl">\uc804\ud654\ubc88\ud638 \ud83d\udd10</label><input class="pf-inp" id="pf_phone" placeholder="010-1234-5678"></div>'
    + '<div class="pf-enc-note pf-full">\ud83d\udd10 \uc0dd\ub144\uc6d4\uc77c\uacfc \uc804\ud654\ubc88\ud638\ub294 AES-256-GCM\uc73c\ub85c \uc790\ub3d9 \uc554\ud638\ud654\ub418\uc5b4 \uc800\uc7a5\ub429\ub2c8\ub2e4.</div>'
    + '</div>';
  openGenericModal('\ud83c\udfe5', '\uc0c8 \ud658\uc790 \ucd94\uac00', '\ud658\uc790 \ub370\uc774\ud130 \uad00\ub9ac', body, '\ud83d\udcbe \uc800\uc7a5 & \uc554\ud638\ud654', function() { savePatient(); });
}

function savePatient() {
  var name = document.getElementById('pf_name').value.trim();
  var gen = document.getElementById('pf_gen').value;
  var dept = document.getElementById('pf_dept').value;
  var st2 = document.getElementById('pf_st').value;
  var birth = document.getElementById('pf_birth').value;
  var phone = document.getElementById('pf_phone').value.trim();
  if (!name) { alert('\uc774\ub984\uc744 \uc785\ub825\ud558\uc138\uc694.'); return; }
  var uid = 'pt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  encryptData(birth || '', 'hospitalKey2024!').then(function(be) {
    encryptData(phone || '', 'hospitalKey2024!').then(function(pe) {
      pts.push({ id: uid, name: name, gender: gen, dept: dept, status: st2, birth_enc: be, phone_enc: pe, created_at: new Date().toISOString() });
      saveSt(); closeModal(); showPhaseView('p4');
      showToast('\u2705 \ud658\uc790 \ucd94\uac00 & \uc554\ud638\ud654 \uc644\ub8cc!');
    });
  });
}

function loadSamples() {
  var samples = [
    { name: '\uae40\uc11c\uc5f0', gender: 'F', dept: '\uc548\uacfc', status: 'active', birth: '1985-03-12', phone: '010-1234-5678' },
    { name: '\uc774\uc900\ud601', gender: 'M', dept: '\ub0b4\uacfc', status: 'active', birth: '1972-08-25', phone: '010-9876-5432' },
    { name: '\ubc15\ubbfc\uc9c0', gender: 'F', dept: '\ud53c\ubd80\uacfc', status: 'out', birth: '1990-11-07', phone: '010-5555-1234' },
    { name: '\ucd5c\ub3d9\ud604', gender: 'M', dept: '\uc815\ud615\uc678\uacfc', status: 'active', birth: '1968-04-30', phone: '010-7777-8888' },
    { name: '\uc815\ud558\ub298', gender: 'F', dept: '\uc2e0\uacbd\uacfc', status: 'active', birth: '1995-06-18', phone: '010-3333-6666' }
  ];
  var proms = samples.map(function(s) {
    return encryptData(s.birth, 'hospitalKey2024!').then(function(be) {
      return encryptData(s.phone, 'hospitalKey2024!').then(function(pe) {
        return { id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6), name: s.name, gender: s.gender, dept: s.dept, status: s.status, birth_enc: be, phone_enc: pe, created_at: new Date().toISOString() };
      });
    });
  });
  Promise.all(proms).then(function(newPts) {
    pts = pts.concat(newPts); saveSt(); showPhaseView('p4');
    showToast('\u2705 \uc0d8\ud50c 5\uba85 \ucd94\uac00!');
  });
}

function genSQL() {
  if (pts.length === 0) { alert('\uba3c\uc800 \ud658\uc790 \ub370\uc774\ud130\ub97c \ucd94\uac00\ud558\uc138\uc694.'); return; }
  var sql1 = 'INSERT INTO patients (id, name, gender, department, status)\nVALUES\n'
    + pts.map(function(p) { return "  ('" + p.id + "','" + p.name + "','" + p.gender + "','" + p.dept + "','" + p.status + "')"; }).join(',\n') + ';';
  var sql2 = 'INSERT INTO patient_sensitive (patient_id, birth_enc, phone_enc)\nVALUES\n'
    + pts.map(function(p) { return "  ('" + p.id + "','" + (p.birth_enc||'').substring(0,30) + "...','" + (p.phone_enc||'').substring(0,30) + "...')"; }).join(',\n') + ';';
  var body = '<div class="m-sec"><div class="m-sec-title">SQL AUTO GENERATED</div>'
    + '<div class="tip-box">\ud83d\udca1 F12 \u2192 Console \ud0ed\uc5d0\uc11c \uc804\uccb4 SQL\uc744 \ubcf5\uc0ac\ud558\uc138\uc694.</div>'
    + '<div class="code-blk"><code>' + esc(sql1) + '\n\n' + esc(sql2) + '</code></div></div>';
  openGenericModal('\ud83d\udcbe', pts.length + '\uba85 SQL INSERT \uc0dd\uc131', 'F12 Console\uc5d0\uc11c \uc804\uccb4 \ubcf5\uc0ac', body, '\ub2eb\uae30', closeModal);
}

/* ─── CRYPTO ─────────────────────────────────── */
function buildCryptoDemo() {
  return '<div class="crypto-box">'
    + '<div class="crypto-title">AES-256-GCM ENCRYPTION LAB</div>'
    + '<div class="crypto-grid">'
    + '<div class="crypto-panel"><div class="cp-title">\ud83d\udd12 ENCRYPT</div>'
    + '<input class="ci" id="ck" type="password" value="hospitalKey2024!" placeholder="\uc554\ud638\ud654 \ud0a4">'
    + '<input class="ci" id="ct" value="010-1234-5678" placeholder="\uc6d0\ubcf8 \ub370\uc774\ud130">'
    + '<button class="cb" id="encBtn">\ud83d\udd12 \uc554\ud638\ud654 \uc2e4\ud589</button>'
    + '<div style="font-size:.65rem;color:var(--txt-muted);margin-top:6px;">DB\uc5d0 \uc800\uc7a5\ub418\ub294 \uc554\ud638\ubb38:</div>'
    + '<div class="co" id="cr">\uc554\ud638\ud654 \ubc84\ud2bc\uc744 \ub20c\ub7ec\ubcf4\uc138\uc694...</div></div>'
    + '<div class="crypto-panel"><div class="cp-title">\ud83d\udd13 DECRYPT</div>'
    + '<input class="ci" id="dk" type="password" value="hospitalKey2024!" placeholder="\ubcf5\ud638\ud654 \ud0a4">'
    + '<input class="ci" id="dc" placeholder="\uc554\ud638\ubb38 (\uc790\ub3d9 \ucc44\uc6cc\uc9d0)">'
    + '<button class="cb" id="decBtn">\ud83d\udd13 \ubcf5\ud638\ud654 \uc2e4\ud589</button>'
    + '<div style="font-size:.65rem;color:var(--txt-muted);margin-top:6px;">\ubcf5\ud638\ud654 \uacb0\uacfc:</div>'
    + '<div class="co ok" id="dr">\ubcf5\ud638\ud654 \ubc84\ud2bc\uc744 \ub20c\ub7ec\ubcf4\uc138\uc694...</div></div></div>'
    + '<button class="cb" style="margin-top:10px;max-width:260px;" id="matchBtn">\ud83d\udd04 \uc6d0\ubcf8 \u2194 \ubcf5\ud638\ud654 \ub9e4\uce6d \uac80\uc99d</button>'
    + '<div class="crypto-match" id="cm"></div></div>';
}

function deriveKey(pw) {
  var enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(pw), { name: 'PBKDF2' }, false, ['deriveKey'])
    .then(function(km) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('hosp-salt-2024'), iterations: 100000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
}

function encryptData(text, pw) {
  if (!text) return Promise.resolve('');
  var enc = new TextEncoder();
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return deriveKey(pw).then(function(key) {
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(text));
  }).then(function(ct) {
    var combined = new Uint8Array(iv.length + new Uint8Array(ct).length);
    combined.set(iv); combined.set(new Uint8Array(ct), iv.length);
    return btoa(String.fromCharCode.apply(null, combined));
  }).catch(function() { return 'ENC_ERROR'; });
}

function decryptData(b64, pw) {
  if (!b64) return Promise.resolve('');
  try {
    var bytes = Uint8Array.from(atob(b64), function(c) { return c.charCodeAt(0); });
    var iv = bytes.slice(0, 12), data = bytes.slice(12);
    return deriveKey(pw).then(function(key) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data); })
      .then(function(dec) { return new TextDecoder().decode(dec); })
      .catch(function() { return 'DECRYPT_FAILED'; });
  } catch(e) { return Promise.resolve('DECRYPT_FAILED'); }
}

function doCryptoEnc() {
  var pw = document.getElementById('ck').value;
  var txt = document.getElementById('ct').value;
  if (!pw || !txt) { alert('\ud0a4\uc640 \ub370\uc774\ud130\ub97c \uc785\ub825\ud558\uc138\uc694.'); return; }
  encryptData(txt, pw).then(function(r) {
    document.getElementById('cr').textContent = r;
    var dcEl = document.getElementById('dc');
    if (dcEl) dcEl.value = r;
  });
}

function doCryptoDec() {
  var pw = document.getElementById('dk').value;
  var ci2 = document.getElementById('dc').value;
  if (!pw || !ci2) { alert('\ud0a4\uc640 \uc554\ud638\ubb38\uc744 \uc785\ub825\ud558\uc138\uc694.'); return; }
  decryptData(ci2, pw).then(function(r) {
    var el = document.getElementById('dr');
    if (el) { el.textContent = r; el.className = 'co ' + (r === 'DECRYPT_FAILED' ? 'err' : 'ok'); }
  });
}

function doCryptoMatch() {
  var origEl = document.getElementById('ct');
  var decEl = document.getElementById('dr');
  var cmEl = document.getElementById('cm');
  if (!origEl || !decEl || !cmEl) return;
  var orig = origEl.value, dec2 = decEl.textContent;
  if (!orig || dec2.indexOf('\ubc84\ud2bc') !== -1 || dec2 === 'DECRYPT_FAILED') {
    cmEl.className = 'crypto-match fail'; cmEl.textContent = '\u274c \uba3c\uc800 \uc554\ud638\ud654 \u2192 \ubcf5\ud638\ud654\ub97c \uc21c\uc11c\ub300\ub85c \uc2e4\ud589\ud558\uc138\uc694'; return;
  }
  if (orig.trim() === dec2.trim()) { cmEl.className = 'crypto-match ok'; cmEl.textContent = '\u2705 \ub9e4\uce6d \uc131\uacf5! \uc6d0\ubcf8: ' + orig + ' = \ubcf5\ud638\ud654: ' + dec2; }
  else { cmEl.className = 'crypto-match fail'; cmEl.textContent = '\u274c \ub9e4\uce6d \uc2e4\ud328! \ud0a4\ub97c \ud655\uc778\ud558\uc138\uc694.'; }
}

/* ─── MODAL ──────────────────────────────────── */
var modalDoneHandler = null;

function openGenericModal(icon, title, num, bodyHtml, doneLabel, doneHandler) {
  document.getElementById('mIcon').textContent = icon;
  document.getElementById('mTitle').textContent = title;
  document.getElementById('mNum').textContent = num;
  document.getElementById('mBody').innerHTML = bodyHtml;
  document.getElementById('mFootL').textContent = '';
  var dBtn = document.getElementById('mDoneBtn');
  dBtn.textContent = doneLabel; dBtn.style.background = '';
  modalDoneHandler = doneHandler;
  document.getElementById('overlay').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function openModal(stepId) {
  var step = null, pi = -1, si = -1;
  for (var i = 0; i < PH.length; i++) {
    for (var j = 0; j < PH[i].steps.length; j++) {
      if (PH[i].steps[j].id === stepId) { step = PH[i].steps[j]; pi = i; si = j; break; }
    }
    if (step) break;
  }
  if (!step) return;
  curStep = stepId; tSt = {};

  var savedModalChecks = {};
  try { savedModalChecks = JSON.parse(localStorage.getItem(SK + '_mc_' + stepId) || '{}'); } catch(e) {}
  tSt = savedModalChecks;

  var phase = PH[pi];
  document.getElementById('mIcon').textContent = phase.icon;
  document.getElementById('mIcon').style.background = phase.color + '20';
  document.getElementById('mIcon').style.color = phase.color;
  document.getElementById('mNum').textContent = phase.icon + ' ' + phase.title + ' \u2014 \ub2e8\uacc4 ' + (pi+1) + '-' + (si+1);
  document.getElementById('mTitle').textContent = step.title;

  var html = '<div class="m-sec"><div class="m-sec-title">MISSION OBJECTIVE</div><div class="m-desc">' + esc(step.desc) + '</div></div>';

  if (NAV_DATA[stepId]) {
    var navCount = NAV_DATA[stepId].nav.length;
    html += '<div class="m-sec"><div class="m-nav-launch" id="mNavLaunch" data-nav-step="' + stepId + '">'
      + '<div class="m-nav-launch-icon">\ud83d\ude80</div>'
      + '<div class="m-nav-launch-txt"><b>\uc2e4\uc2b5 \ub124\ube44\uac8c\uc774\ud130\ub85c \uc2dc\uc791\ud558\uae30</b><br>'
      + '<span>\uac00\uc774\ub4dc \ud328\ub110 + \uc0c8 \ud0ed \uc5f4\uae30 \xb7 ' + navCount + '\uac1c \ud56d\ubaa9 \xb7 \ud0a4\ubcf4\ub4dc \uc9c0\uc6d0</span></div></div></div>';
  }

  if (step.links && step.links.length) {
    html += '<div class="m-sec"><div class="m-sec-title">QUICK LINKS</div><div class="links-row">'
      + step.links.map(function(l) { return '<a class="mlink ' + esc(l.c || 'def') + '" href="' + esc(l.u) + '" target="_blank" rel="noopener">\ud83c\udf10 ' + esc(l.l) + '</a>'; }).join('') + '</div></div>';
  }

  if (step.tasks && step.tasks.length) {
    html += '<div class="m-sec"><div class="m-sec-title">CHECKLIST <span class="m-sec-hint">\ud074\ub9ad\uc73c\ub85c \uc989\uc2dc \uccb4\ud06c</span></div><div class="task-list" id="tList">'
      + step.tasks.map(function(t, i) {
        var isChecked = !!tSt[i];
        return '<div class="task' + (isChecked ? ' dn' : '') + '" data-ti="' + i + '">'
          + '<div class="tk" id="tk_' + i + '">' + (isChecked ? '&#10003;' : '') + '</div>'
          + '<div class="task-txt">' + esc(t) + '</div></div>';
      }).join('') + '</div></div>';
  }

  if (step.code) html += '<div class="m-sec"><div class="m-sec-title">CODE / SQL</div><div class="code-blk"><code>' + esc(step.code) + '</code></div></div>';
  if (step.tip) html += '<div class="tip-box">\ud83d\udca1 <b>\ud301:</b> ' + esc(step.tip) + '</div>';
  if (step.warn) html += '<div class="warn-box">\u26a0\ufe0f <b>\uc8fc\uc758:</b> ' + esc(step.warn) + '</div>';

  document.getElementById('mBody').innerHTML = html;
  updateMTaskSt(step);

  document.getElementById('mBody').onclick = function(e) {
    var taskEl = e.target.closest('.task[data-ti]');
    if (taskEl) {
      var i = parseInt(taskEl.getAttribute('data-ti'));
      tSt[i] = !tSt[i];
      localStorage.setItem(SK + '_mc_' + stepId, JSON.stringify(tSt));
      var tk = document.getElementById('tk_' + i);
      if (tSt[i]) { taskEl.classList.add('dn'); taskEl.classList.add('check-flash'); if (tk) tk.innerHTML = '&#10003;'; setTimeout(function() { taskEl.classList.remove('check-flash'); }, 400); }
      else { taskEl.classList.remove('dn'); if (tk) tk.innerHTML = ''; }
      updateMTaskSt(step);
    }
    var navLaunch = e.target.closest('#mNavLaunch');
    if (navLaunch) { closeModal(); enterNavMode(navLaunch.getAttribute('data-nav-step')); }
  };

  var done = isDone(stepId);
  var dBtn = document.getElementById('mDoneBtn');
  dBtn.textContent = done ? '\u21a9\ufe0f \uc644\ub8cc \ucde8\uc18c' : '\u2705 \uc644\ub8cc!';
  dBtn.style.background = done ? 'rgba(255,255,255,0.1)' : '';
  modalDoneHandler = function() { completeStep(stepId); };
  document.getElementById('overlay').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function updateMTaskSt(step) {
  var done = 0, keys = Object.keys(tSt);
  for (var i = 0; i < keys.length; i++) { if (tSt[keys[i]]) done++; }
  var total = step.tasks ? step.tasks.length : 0;
  document.getElementById('mFootL').textContent = '\uccb4\ud06c\ub9ac\uc2a4\ud2b8: ' + done + ' / ' + total + '\uac1c \uc644\ub8cc';
}

function closeModal() {
  document.getElementById('overlay').classList.remove('on');
  document.body.style.overflow = '';
  curStep = null; modalDoneHandler = null;
}

document.getElementById('mCloseBtn').addEventListener('click', closeModal);
document.getElementById('mCancelBtn').addEventListener('click', closeModal);
document.getElementById('mDoneBtn').addEventListener('click', function() { if (modalDoneHandler) modalDoneHandler(); });
document.getElementById('overlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });

function completeStep(stepId) {
  var wasDone = isDone(stepId);
  setDone(stepId, !wasDone);
  var step = null;
  for (var i = 0; i < PH.length; i++) {
    for (var j = 0; j < PH[i].steps.length; j++) {
      if (PH[i].steps[j].id === stepId) { step = PH[i].steps[j]; break; }
    }
    if (step) break;
  }
  renderSidebar(); updateTopPct(); closeModal();
  if (!wasDone && step) showToast('\ud83c\udf89 "' + step.title.substring(0, 16) + '\u2026" \uc644\ub8cc!');
  if (curPhId) showPhaseView(curPhId);
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, 3000);
}

/* ─── BOOT ───────────────────────────────────── */
initSupabase();
loadSt();
loadData(function() {
  if (!sbReady) {
    /* Supabase SDK not loaded yet, wait a bit */
    setTimeout(function() {
      initSupabase();
      checkAuthState();
    }, 1000);
  } else {
    checkAuthState();
  }
});

function checkAuthState() {
  if (sbReady && sb) {
    sb.auth.getSession().then(function(res) {
      if (res.data && res.data.session && res.data.session.user) {
        launch(res.data.session.user);
      }
      /* else: stay on login screen */
    });

    /* Listen for auth state changes (OAuth redirect callback) */
    sb.auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_IN' && session && session.user) {
        launch(session.user);
      } else if (event === 'SIGNED_OUT') {
        doLogout();
      }
    });
  }
}

})();
