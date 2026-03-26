/* ═══════════════════════════════════════════════════════
   STELLAR EDU — Main Application
   콘솔 에러 0개를 목표로 한 클린 아키텍처
   ═══════════════════════════════════════════════════════ */
(function() {
'use strict';

/* ─── STARFIELD ──────────────────────────────── */
var canvas = document.getElementById('starfield');
var ctx = canvas.getContext('2d');
var stars = [];
var STAR_COUNT = 200;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = [];
  for (var i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.15,
      dy: (Math.random() - 0.5) * 0.15,
      a: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var time = Date.now() * 0.001;
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i];
    s.x += s.dx;
    s.y += s.dy;
    if (s.x < 0) s.x = canvas.width;
    if (s.x > canvas.width) s.x = 0;
    if (s.y < 0) s.y = canvas.height;
    if (s.y > canvas.height) s.y = 0;
    var alpha = s.a * (0.6 + 0.4 * Math.sin(time * s.twinkleSpeed * 60));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,210,255,' + alpha + ')';
    ctx.fill();
  }
  requestAnimationFrame(drawStars);
}

resizeCanvas();
initStars();
drawStars();
window.addEventListener('resize', function() {
  resizeCanvas();
  initStars();
});

/* ─── DATA LOADING ───────────────────────────── */
var PH = [];
var dataLoaded = false;

function loadData(callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/static/phases.json', true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        PH = JSON.parse(xhr.responseText);
        dataLoaded = true;
        callback();
      } catch(e) {
        console.error('JSON parse error:', e);
      }
    }
  };
  xhr.onerror = function() {
    console.error('Failed to load phases data');
  };
  xhr.send();
}

/* ─── STATE ──────────────────────────────────── */
var SK = 'stellar_edu_v7';
var st = {};
var pts = [];
var curUser = null;
var curPhId = null;
var curStep = null;
var tSt = {};
var sbClosed = {};

function loadSt() {
  try { st = JSON.parse(localStorage.getItem(SK + '_s') || '{}'); } catch(e) { st = {}; }
  try { pts = JSON.parse(localStorage.getItem(SK + '_p') || '[]'); } catch(e) { pts = []; }
}
function saveSt() {
  localStorage.setItem(SK + '_s', JSON.stringify(st));
  localStorage.setItem(SK + '_p', JSON.stringify(pts));
}
function isDone(id) { return !!st[id]; }
function setDone(id, v) { st[id] = v; saveSt(); }
function allSteps() {
  var r = [];
  for (var i = 0; i < PH.length; i++) {
    for (var j = 0; j < PH[i].steps.length; j++) {
      r.push(PH[i].steps[j]);
    }
  }
  return r;
}
function totalDone() {
  var steps = allSteps();
  var c = 0;
  for (var i = 0; i < steps.length; i++) { if (isDone(steps[i].id)) c++; }
  return c;
}
function pDone(p) {
  var c = 0;
  for (var i = 0; i < p.steps.length; i++) { if (isDone(p.steps[i].id)) c++; }
  return c;
}
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── AUTH ────────────────────────────────────── */
document.getElementById('gBtn').addEventListener('click', function() {
  var e = prompt('구글 이메일 입력 (데모):', 'user@gmail.com');
  if (e) launch(e);
});
document.getElementById('demoBtn').addEventListener('click', function() {
  launch('demo@stellar.edu');
});
document.getElementById('logoutBtn').addEventListener('click', function() {
  localStorage.removeItem(SK + '_user');
  curUser = null;
  document.getElementById('appShell').classList.remove('on');
  document.getElementById('loginScreen').style.display = 'flex';
});

function launch(email) {
  curUser = email;
  localStorage.setItem(SK + '_user', email);
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').classList.add('on');
  document.getElementById('userAv').textContent = email[0].toUpperCase();
  renderSidebar();
  updateTopPct();
  showWelcome();
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

  // Attach events using event delegation instead of individual listeners
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
      showPhaseView(phid);
      setTimeout(function() { openModal(sid); }, 100);
      document.getElementById('sidebar').classList.remove('open');
    }
  };

  // Footer
  var done2 = totalDone();
  var total2 = allSteps().length;
  var pct = total2 ? Math.round(done2 / total2 * 100) : 0;
  document.getElementById('sbFpTxt').textContent = done2 + ' / ' + total2 + ' \ub2e8\uacc4 \uc644\ub8cc';
  document.getElementById('sbFpFill').style.width = pct + '%';
}

function updateTopPct() {
  if (!dataLoaded) return;
  var done = totalDone();
  var total = allSteps().length;
  var pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('topPct').textContent = pct + '%';
}

/* ─── WELCOME ────────────────────────────────── */
function showWelcome() {
  if (!dataLoaded) return;
  curPhId = null;
  var done = totalDone();
  var total = allSteps().length;
  var pct = total ? Math.round(done / total * 100) : 0;

  var html = '<div class="welcome-hero"><div class="wh-inner">'
    + '<div class="wh-hi">\uc548\ub155\ud558\uc138\uc694, ' + esc(curUser) + ' \ud83d\udc4b</div>'
    + '<div class="wh-title">STELLAR <span>EDU</span></div>'
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
    var d = pDone(p);
    var t = p.steps.length;
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

  // Event delegation for phase cards
  ci.onclick = function(e) {
    var card = e.target.closest('.ph-card');
    if (card) {
      showPhaseView(card.getAttribute('data-phid'));
    }
  };
}

/* ─── PHASE VIEW ─────────────────────────────── */
function showPhaseView(phId) {
  if (!dataLoaded) return;
  curPhId = phId;
  var phase = null;
  var pi = -1;
  for (var i = 0; i < PH.length; i++) {
    if (PH[i].id === phId) { phase = PH[i]; pi = i; break; }
  }
  if (!phase) return;

  var done = pDone(phase);
  var total = phase.steps.length;
  var allDone2 = done === total;

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

  // Patient section for phase p4
  if (phId === 'p4') {
    html += buildPatientSection() + buildCryptoDemo();
  }

  html += '<div class="steps-list">';
  for (var si = 0; si < phase.steps.length; si++) {
    html += renderStepCard(phase.steps[si], pi, si);
  }
  html += '</div>';

  ci.innerHTML = html;

  // Event delegation for all clicks in content
  ci.onclick = function(e) {
    // Back button
    if (e.target.closest('#backBtn')) {
      showWelcome();
      return;
    }
    // Step card buttons
    var stepEl = e.target.closest('[data-step-id]');
    if (stepEl) {
      e.stopPropagation();
      openModal(stepEl.getAttribute('data-step-id'));
      return;
    }
    // Patient actions
    if (e.target.closest('#ptAddBtn')) { openPatientForm(); return; }
    if (e.target.closest('#ptSampleBtn')) { loadSamples(); return; }
    if (e.target.closest('#ptSqlBtn')) { genSQL(); return; }
    if (e.target.closest('#ptClearBtn')) {
      if (confirm('\ubaa8\ub4e0 \ud658\uc790 \ub370\uc774\ud130\ub97c \uc0ad\uc81c\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?')) {
        pts = []; saveSt(); showPhaseView('p4');
      }
      return;
    }
    // Delete patient
    var delBtn = e.target.closest('.pt-del');
    if (delBtn) {
      var idx = parseInt(delBtn.getAttribute('data-idx'));
      if (!isNaN(idx)) { pts.splice(idx, 1); saveSt(); showPhaseView('p4'); }
      return;
    }
    // Crypto buttons
    if (e.target.closest('#encBtn')) { doCryptoEnc(); return; }
    if (e.target.closest('#decBtn')) { doCryptoDec(); return; }
    if (e.target.closest('#matchBtn')) { doCryptoMatch(); return; }
  };

  renderSidebar();
  updateTopPct();
}

function renderStepCard(s, pi, si) {
  var done = isDone(s.id);
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
    + '<button class="sc-btn" data-step-id="' + s.id + '">' + (done ? '\ud83d\udccb \ubcf5\uc2b5' : '\u25b6 \uc9c4\uc785') + '</button>'
    + '</div></div></div>';
}

/* ─── PATIENT SECTION ────────────────────────── */
function buildPatientSection() {
  var rows = '';
  if (pts.length === 0) {
    rows = '<tr><td colspan="8"><div class="pt-empty">'
      + '<div class="pt-empty-icon">\ud83d\ude80</div>'
      + '<div class="pt-empty-txt">[+ \ud658\uc790 \ucd94\uac00] \ub610\ub294 [\uc0d8\ud50c 5\uba85 \ucd94\uac00] \ubc84\ud2bc\uc73c\ub85c \uac00\uc0c1 \ub370\uc774\ud130\ub97c \ucd94\uac00\ud558\uc138\uc694.</div>'
      + '</div></td></tr>';
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

/* ─── PATIENT FORM ───────────────────────────── */
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
  openGenericModal('\ud83c\udfe5', '\uc0c8 \ud658\uc790 \ucd94\uac00', '\ud658\uc790 \ub370\uc774\ud130 \uad00\ub9ac', body, '\ud83d\udcbe \uc800\uc7a5 & \uc554\ud638\ud654', function() {
    savePatient();
  });
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
      pts.push({
        id: uid, name: name, gender: gen, dept: dept, status: st2,
        birth_enc: be, phone_enc: pe, created_at: new Date().toISOString()
      });
      saveSt();
      closeModal();
      showPhaseView('p4');
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
        return {
          id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: s.name, gender: s.gender, dept: s.dept, status: s.status,
          birth_enc: be, phone_enc: pe, created_at: new Date().toISOString()
        };
      });
    });
  });
  Promise.all(proms).then(function(newPts) {
    pts = pts.concat(newPts);
    saveSt();
    showPhaseView('p4');
    showToast('\u2705 \uc0d8\ud50c 5\uba85 \ucd94\uac00!');
  });
}

function genSQL() {
  if (pts.length === 0) { alert('\uba3c\uc800 \ud658\uc790 \ub370\uc774\ud130\ub97c \ucd94\uac00\ud558\uc138\uc694.'); return; }
  var sql1 = 'INSERT INTO patients (id, name, gender, department, status)\nVALUES\n'
    + pts.map(function(p) {
      return "  ('" + p.id + "','" + p.name + "','" + p.gender + "','" + p.dept + "','" + p.status + "')";
    }).join(',\n') + ';';
  var sql2 = 'INSERT INTO patient_sensitive (patient_id, birth_enc, phone_enc)\nVALUES\n'
    + pts.map(function(p) {
      var be = (p.birth_enc || '').substring(0, 30) + '...';
      var pe = (p.phone_enc || '').substring(0, 30) + '...';
      return "  ('" + p.id + "','" + be + "','" + pe + "')";
    }).join(',\n') + ';';

  var body = '<div class="m-sec"><div class="m-sec-title">SQL AUTO GENERATED</div>'
    + '<div class="tip-box">\ud83d\udca1 F12 \u2192 Console \ud0ed\uc5d0\uc11c \uc804\uccb4 SQL\uc744 \ubcf5\uc0ac\ud558\uc138\uc694.</div>'
    + '<div class="code-blk"><code>' + esc(sql1) + '\n\n' + esc(sql2) + '</code></div></div>';
  openGenericModal('\ud83d\udcbe', pts.length + '\uba85 SQL INSERT \uc0dd\uc131', 'F12 Console\uc5d0\uc11c \uc804\uccb4 \ubcf5\uc0ac', body, '\ub2eb\uae30', closeModal);
}

/* ─── CRYPTO DEMO ────────────────────────────── */
function buildCryptoDemo() {
  return '<div class="crypto-box">'
    + '<div class="crypto-title">AES-256-GCM ENCRYPTION LAB</div>'
    + '<div class="crypto-grid">'
    + '<div class="crypto-panel"><div class="cp-title">\ud83d\udd12 ENCRYPT</div>'
    + '<input class="ci" id="ck" type="password" value="hospitalKey2024!" placeholder="\uc554\ud638\ud654 \ud0a4">'
    + '<input class="ci" id="ct" value="010-1234-5678" placeholder="\uc6d0\ubcf8 \ub370\uc774\ud130">'
    + '<button class="cb" id="encBtn">\ud83d\udd12 \uc554\ud638\ud654 \uc2e4\ud589</button>'
    + '<div style="font-size:.65rem;color:var(--txt-muted);margin-top:6px;">DB\uc5d0 \uc800\uc7a5\ub418\ub294 \uc554\ud638\ubb38:</div>'
    + '<div class="co" id="cr">\uc554\ud638\ud654 \ubc84\ud2bc\uc744 \ub20c\ub7ec\ubcf4\uc138\uc694...</div>'
    + '</div>'
    + '<div class="crypto-panel"><div class="cp-title">\ud83d\udd13 DECRYPT</div>'
    + '<input class="ci" id="dk" type="password" value="hospitalKey2024!" placeholder="\ubcf5\ud638\ud654 \ud0a4">'
    + '<input class="ci" id="dc" placeholder="\uc554\ud638\ubb38 (\uc790\ub3d9 \ucc44\uc6cc\uc9d0)">'
    + '<button class="cb" id="decBtn">\ud83d\udd13 \ubcf5\ud638\ud654 \uc2e4\ud589</button>'
    + '<div style="font-size:.65rem;color:var(--txt-muted);margin-top:6px;">\ubcf5\ud638\ud654 \uacb0\uacfc:</div>'
    + '<div class="co ok" id="dr">\ubcf5\ud638\ud654 \ubc84\ud2bc\uc744 \ub20c\ub7ec\ubcf4\uc138\uc694...</div>'
    + '</div></div>'
    + '<button class="cb" style="margin-top:10px;max-width:260px;" id="matchBtn">\ud83d\udd04 \uc6d0\ubcf8 \u2194 \ubcf5\ud638\ud654 \ub9e4\uce6d \uac80\uc99d</button>'
    + '<div class="crypto-match" id="cm"></div>'
    + '</div>';
}

/* ─── CRYPTO FUNCTIONS ───────────────────────── */
function deriveKey(pw) {
  var enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(pw), { name: 'PBKDF2' }, false, ['deriveKey'])
    .then(function(km) {
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode('hosp-salt-2024'), iterations: 100000, hash: 'SHA-256' },
        km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
      );
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
    combined.set(iv);
    combined.set(new Uint8Array(ct), iv.length);
    return btoa(String.fromCharCode.apply(null, combined));
  }).catch(function() { return 'ENC_ERROR'; });
}

function decryptData(b64, pw) {
  if (!b64) return Promise.resolve('');
  try {
    var bytes = Uint8Array.from(atob(b64), function(c) { return c.charCodeAt(0); });
    var iv = bytes.slice(0, 12);
    var data = bytes.slice(12);
    return deriveKey(pw).then(function(key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data);
    }).then(function(dec) {
      return new TextDecoder().decode(dec);
    }).catch(function() { return 'DECRYPT_FAILED'; });
  } catch(e) {
    return Promise.resolve('DECRYPT_FAILED');
  }
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
    if (el) {
      el.textContent = r;
      el.className = 'co ' + (r === 'DECRYPT_FAILED' ? 'err' : 'ok');
    }
  });
}

function doCryptoMatch() {
  var origEl = document.getElementById('ct');
  var decEl = document.getElementById('dr');
  var cmEl = document.getElementById('cm');
  if (!origEl || !decEl || !cmEl) return;
  var orig = origEl.value;
  var dec2 = decEl.textContent;
  if (!orig || dec2.indexOf('\ubc84\ud2bc') !== -1 || dec2 === 'DECRYPT_FAILED') {
    cmEl.className = 'crypto-match fail';
    cmEl.textContent = '\u274c \uba3c\uc800 \uc554\ud638\ud654 \u2192 \ubcf5\ud638\ud654\ub97c \uc21c\uc11c\ub300\ub85c \uc2e4\ud589\ud558\uc138\uc694';
    return;
  }
  if (orig.trim() === dec2.trim()) {
    cmEl.className = 'crypto-match ok';
    cmEl.textContent = '\u2705 \ub9e4\uce6d \uc131\uacf5! \uc6d0\ubcf8: ' + orig + ' = \ubcf5\ud638\ud654: ' + dec2;
  } else {
    cmEl.className = 'crypto-match fail';
    cmEl.textContent = '\u274c \ub9e4\uce6d \uc2e4\ud328! \ud0a4\ub97c \ud655\uc778\ud558\uc138\uc694.';
  }
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
  dBtn.textContent = doneLabel;
  dBtn.style.background = '';
  modalDoneHandler = doneHandler;
  document.getElementById('overlay').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function openModal(stepId) {
  var step = null;
  var pi = -1;
  var si = -1;
  for (var i = 0; i < PH.length; i++) {
    for (var j = 0; j < PH[i].steps.length; j++) {
      if (PH[i].steps[j].id === stepId) {
        step = PH[i].steps[j];
        pi = i; si = j;
        break;
      }
    }
    if (step) break;
  }
  if (!step) return;
  curStep = stepId;
  tSt = {};
  var phase = PH[pi];

  document.getElementById('mIcon').textContent = phase.icon;
  document.getElementById('mIcon').style.background = phase.color + '20';
  document.getElementById('mIcon').style.color = phase.color;
  document.getElementById('mNum').textContent = phase.icon + ' ' + phase.title + ' \u2014 \ub2e8\uacc4 ' + (pi + 1) + '-' + (si + 1);
  document.getElementById('mTitle').textContent = step.title;

  var html = '<div class="m-sec"><div class="m-sec-title">MISSION OBJECTIVE</div><div class="m-desc">' + esc(step.desc) + '</div></div>';

  if (step.links && step.links.length) {
    html += '<div class="m-sec"><div class="m-sec-title">QUICK LINKS</div><div class="links-row">'
      + step.links.map(function(l) {
        return '<a class="mlink ' + esc(l.c || 'def') + '" href="' + esc(l.u) + '" target="_blank" rel="noopener">\ud83c\udf10 ' + esc(l.l) + '</a>';
      }).join('') + '</div></div>';
  }

  if (step.tasks && step.tasks.length) {
    html += '<div class="m-sec"><div class="m-sec-title">CHECKLIST</div><div class="task-list" id="tList">'
      + step.tasks.map(function(t, i) {
        return '<div class="task" data-ti="' + i + '">'
          + '<div class="tk" id="tk_' + i + '"></div>'
          + '<div class="task-txt">' + esc(t) + '</div>'
          + '</div>';
      }).join('') + '</div></div>';
  }

  if (step.code) {
    html += '<div class="m-sec"><div class="m-sec-title">CODE / SQL</div>'
      + '<div class="code-blk"><code>' + esc(step.code) + '</code></div></div>';
  }
  if (step.tip) html += '<div class="tip-box">\ud83d\udca1 <b>\ud301:</b> ' + esc(step.tip) + '</div>';
  if (step.warn) html += '<div class="warn-box">\u26a0\ufe0f <b>\uc8fc\uc758:</b> ' + esc(step.warn) + '</div>';

  document.getElementById('mBody').innerHTML = html;
  updateMTaskSt(step);

  // Attach task click events via delegation on mBody
  var mBody = document.getElementById('mBody');
  mBody.onclick = function(e) {
    var taskEl = e.target.closest('.task[data-ti]');
    if (taskEl) {
      var i = parseInt(taskEl.getAttribute('data-ti'));
      tSt[i] = !tSt[i];
      var tk = document.getElementById('tk_' + i);
      if (tSt[i]) {
        taskEl.classList.add('dn');
        if (tk) tk.innerHTML = '&#10003;';
      } else {
        taskEl.classList.remove('dn');
        if (tk) tk.innerHTML = '';
      }
      updateMTaskSt(step);
    }
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
  var done = 0;
  var keys = Object.keys(tSt);
  for (var i = 0; i < keys.length; i++) { if (tSt[keys[i]]) done++; }
  var total = step.tasks ? step.tasks.length : 0;
  document.getElementById('mFootL').textContent = '\uccb4\ud06c\ub9ac\uc2a4\ud2b8: ' + done + ' / ' + total + '\uac1c \uc644\ub8cc';
}

function closeModal() {
  document.getElementById('overlay').classList.remove('on');
  document.body.style.overflow = '';
  curStep = null;
  modalDoneHandler = null;
}

// Wire up modal buttons once
document.getElementById('mCloseBtn').addEventListener('click', closeModal);
document.getElementById('mCancelBtn').addEventListener('click', closeModal);
document.getElementById('mDoneBtn').addEventListener('click', function() {
  if (modalDoneHandler) modalDoneHandler();
});
document.getElementById('overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

function completeStep(stepId) {
  var wasDone = isDone(stepId);
  setDone(stepId, !wasDone);
  var step = null;
  var pi = -1;
  var si = -1;
  for (var i = 0; i < PH.length; i++) {
    for (var j = 0; j < PH[i].steps.length; j++) {
      if (PH[i].steps[j].id === stepId) {
        step = PH[i].steps[j];
        pi = i; si = j; break;
      }
    }
    if (step) break;
  }
  // Re-render card
  var card = document.getElementById('card_' + stepId);
  if (card && step) {
    var tmpDiv = document.createElement('div');
    tmpDiv.innerHTML = renderStepCard(step, pi, si);
    var newCard = tmpDiv.firstChild;
    // Attach click handlers
    var btns = newCard.querySelectorAll('[data-step-id]');
    for (var b = 0; b < btns.length; b++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          openModal(btn.getAttribute('data-step-id'));
        });
      })(btns[b]);
    }
    card.replaceWith(newCard);
  }
  renderSidebar();
  updateTopPct();
  closeModal();
  if (!wasDone && step) showToast('\ud83c\udf89 "' + step.title.substring(0, 16) + '\u2026" \uc644\ub8cc!');
}

/* ─── TOAST ──────────────────────────────────── */
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, 3000);
}

/* ─── BOOT ───────────────────────────────────── */
loadSt();
loadData(function() {
  var savedUser = localStorage.getItem(SK + '_user');
  if (savedUser) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').classList.add('on');
    document.getElementById('userAv').textContent = savedUser[0].toUpperCase();
    curUser = savedUser;
    renderSidebar();
    updateTopPct();
    showWelcome();
  }
});

})();
