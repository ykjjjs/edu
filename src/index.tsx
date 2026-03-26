import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-pages'

const app = new Hono()

// Security headers via HTTP (not meta tags)
app.use('*', async (c, next) => {
  await next()
  c.header('X-Frame-Options', 'DENY')
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
})

app.get('/static/*', serveStatic())
app.get('/favicon.svg', serveStatic())
app.get('/favicon.ico', (c) => {
  return c.redirect('/favicon.svg', 301)
})

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', version: 'v8.1-turbo-nav' })
})

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
<title>STELLAR EDU v8.1 - Turbo Navigator</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;600&family=Orbitron:wght@400;600;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/styles.css">
</head>
<body>
<canvas id="starfield"></canvas>
<div id="loginScreen">
  <div class="login-card">
    <div class="orbit-ring"></div>
    <div class="login-logo">
      <div class="planet"></div>
    </div>
    <div class="login-title">STELLAR <span>EDU</span></div>
    <div class="login-sub-kr">웹서비스 구축 완전정복</div>
    <div class="login-sub">HTML Prototype &rarr; GitHub &rarr; Cloudflare &rarr; Supabase<br>Google Auth &rarr; Telegram &rarr; Full Production Pipeline</div>
    <button class="google-btn" id="gBtn">
      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Google 계정으로 시작하기
    </button>
    <div class="login-note">로그인 정보는 서버로 전송되지 않습니다 (데모 모드)</div>
    <button class="demo-btn" id="demoBtn">
      <span class="demo-icon">&#9733;</span> 데모 모드로 바로 시작
    </button>
    <div class="login-tags">
      <span class="login-tag"><span class="tag-dot" style="background:#FF6B6B"></span>GitHub</span>
      <span class="login-tag"><span class="tag-dot" style="background:#F6821F"></span>Cloudflare</span>
      <span class="login-tag"><span class="tag-dot" style="background:#3ECF8E"></span>Supabase</span>
      <span class="login-tag"><span class="tag-dot" style="background:#4285F4"></span>Google OAuth</span>
      <span class="login-tag"><span class="tag-dot" style="background:#229ED9"></span>Telegram</span>
      <span class="login-tag"><span class="tag-dot" style="background:#A855F6"></span>AES-256</span>
    </div>
  </div>
</div>
<div id="appShell">
  <nav class="topbar">
    <div style="display:flex;align-items:center;gap:10px;">
      <button class="hamburger" id="hambBtn">&#9776;</button>
      <div class="topbar-logo">
        <span class="logo-star">&#10023;</span>
        <span class="logo-text">STELLAR</span>
        <span class="logo-accent">EDU</span>
      </div>
    </div>
    <div class="topbar-right">
      <div class="top-pct"><span class="pct-ring"></span>전체 <b id="topPct">0%</b></div>
      <div class="user-av" id="userAv">?</div>
      <button class="logout-btn" id="logoutBtn">로그아웃</button>
    </div>
  </nav>
  <div class="app-body">
    <aside class="sidebar" id="sidebar">
      <div class="sb-logo-area">
        <div class="sb-logo-title">MISSION CONTROL</div>
        <div class="sb-logo-sub">Phase 0~8 &middot; 전체 공정 실습</div>
      </div>
      <div class="sb-inner" id="sbMenu"></div>
      <div class="sb-footer">
        <div class="sb-fp-txt" id="sbFpTxt">0 / 0 단계 완료</div>
        <div class="sb-fp-bar"><div class="sb-fp-fill" id="sbFpFill" style="width:0%"></div></div>
      </div>
    </aside>
    <main class="content">
      <div class="content-inner" id="contentInner"></div>
    </main>
  </div>
</div>
<div class="overlay" id="overlay">
  <div class="modal" id="modal">
    <div class="m-hdr">
      <div class="m-hdr-icon" id="mIcon"></div>
      <div class="m-hdr-txt">
        <div class="m-num" id="mNum"></div>
        <div class="m-title" id="mTitle"></div>
      </div>
      <button class="m-x" id="mCloseBtn">&times;</button>
    </div>
    <div class="m-body" id="mBody"></div>
    <div class="m-foot">
      <div class="m-foot-l" id="mFootL"></div>
      <div class="m-btns">
        <button class="btn-cls" id="mCancelBtn">닫기</button>
        <button class="btn-done" id="mDoneBtn">&#10003; 완료!</button>
      </div>
    </div>
  </div>
</div>
<div class="toast" id="toast"></div>
<div class="nav-container" id="navContainer">
  <div class="nav-left" id="navLeft"></div>
  <div class="nav-right">
    <iframe class="nav-iframe" id="navIframe" src="about:blank" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox"></iframe>
    <div class="nav-placeholder" id="navPlaceholder" style="display:none"></div>
  </div>
</div>
<script src="/static/app.js"></script>
</body>
</html>`)
})

export default app
