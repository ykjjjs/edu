# STELLAR EDU - Web Service Mastery Platform

## Project Overview
- **Name**: STELLAR EDU (웹서비스 구축 완전정복)
- **Version**: v7.0 (Space Theme)
- **Goal**: SNUBH 병원 직원 대상 서버리스 웹서비스 구축 핸즈온 교육 플랫폼
- **Tech Stack**: Hono + TypeScript + Cloudflare Pages + Space UI Theme

## URLs
- **Sandbox**: See GetServiceUrl output
- **Production**: Deploy via `npm run deploy`

## Features

### Completed
- 9 Phase, 24단계 전체 교육 커리큘럼
- 첨단 우주 디자인 UI (Starfield Canvas, Neon Glow, Orbital Animation)
- Google 계정 시뮬레이션 로그인 + 데모 모드
- Supabase 스타일 사이드바 네비게이션 (접기/펼치기)
- 단계별 모달 실습 (체크리스트, 코드블록, 링크, 팁/주의)
- 환자 데이터 CRUD (Phase 4)
- AES-256-GCM 암호화/복호화 라이브 데모
- SQL INSERT 자동 생성
- localStorage 진행 상태 영구 저장
- 모바일 반응형 (햄버거 메뉴)
- 보안 헤더 HTTP 레벨 적용 (X-Frame-Options, CSP 등)
- 콘솔 에러 0개

### Design Theme: SPACE / COSMIC
- Deep space dark background (#030014)
- Neon cyan (#00f0ff) + purple (#a855f6) + green (#39ff14) accent colors
- Orbitron display font for headers
- Canvas starfield animation with twinkling
- Orbital ring animation on login screen
- Floating planet animation
- Glass morphism cards with neon borders
- Gradient glow effects on buttons and interactive elements

## Data Architecture
- **JSON Data**: `/static/phases.json` (9 phases, 24 steps)
- **Client Storage**: localStorage for progress + patient data
- **Encryption**: Web Crypto API (AES-256-GCM + PBKDF2)

## Deployment
- **Platform**: Cloudflare Pages (Hono Framework)
- **Build**: `npm run build` (Vite SSR build)
- **Dev**: `pm2 start ecosystem.config.cjs`
- **Deploy**: `npm run deploy`
- **Status**: Active
- **Last Updated**: 2026-03-26

## Key Changes from v6
| v6 | v7 (STELLAR EDU) |
|----|-------------------|
| Supabase green theme | Space/cosmic dark theme |
| Single HTML file | Hono + Cloudflare Pages |
| JSON in `<script>` tag | Separate JSON file via fetch |
| MutationObserver events | Event delegation pattern |
| Meta security headers | HTTP-level security headers |
| 2+ console errors | 0 console errors |
