# STELLAR EDU - Web Service Mastery Platform

## Project Overview
- **Name**: STELLAR EDU (v7.0 Space Theme)
- **Goal**: SNUBH 사내강사 교육 플랫폼 - HTML 프로토타입에서 프로덕션까지 전체 웹서비스 구축 실습
- **Author**: 연제진
- **Version**: v7.0-space (2026-03-26)

## URLs
- **Sandbox**: https://3000-imdc0covtr1b86cfytx4w-b32ec7bb.sandbox.novita.ai
- **API Health**: /api/health

## Features (Completed)
- Google 로그인 데모 (localStorage 기반)
- 데모 모드 (즉시 시작)
- 9개 Phase, 24개 Step 커리큘럼
- Supabase 스타일 사이드바 (접기/펼치기)
- Phase 카드 대시보드 (진행률 표시)
- Step 모달 (목표, 링크, 체크리스트, 코드, 팁/주의)
- 환자 데이터 CRUD (추가, 샘플 5명, 삭제)
- AES-256-GCM 암호화/복호화 데모 (Web Crypto API)
- 자동 SQL INSERT 생성
- 암호화 매칭 검증
- 진행률 추적 (localStorage 영구저장)
- 체크리스트 완료/취소 토글
- Toast 알림

## Tech Stack
- **Backend**: Hono + TypeScript (Cloudflare Pages)
- **Frontend**: Vanilla JS + CSS (CDN: Google Fonts)
- **Design**: 첨단 우주 테마 (Nebula + Hologram + Glass)
- **Encryption**: AES-256-GCM (PBKDF2 키 유도, 100k iterations)
- **Storage**: localStorage
- **Security**: HTTP headers (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy)

## Space UI Design
- Deep Space 배경 (#030014) + 네뷸라 그라데이션
- 280+ 컬러 별 + 유성 애니메이션 (Canvas)
- Neon 컬러팔레트: Cyan (#00f0ff), Purple (#a855f6), Green (#39ff14), Pink (#ff2d78)
- Orbitron 디스플레이 폰트 + Noto Sans KR + JetBrains Mono
- Glass-morphism 카드/모달 (backdrop-filter blur)
- Holographic shimmer 효과
- 스캔 라인 + 글로우 보더
- 호버 시 변환 + 그림자 + 빛남 효과
- 전체 반응형 (모바일 사이드바 토글)

## Data Architecture
- **Phase Data**: /static/phases.json (9 phases, 24 steps)
- **State**: localStorage (진행률, 환자 데이터)
- **Encryption**: Web Crypto API (AES-256-GCM)

## Console Errors
- **0개** (Playwright 전체 인터랙션 테스트 통과)
- 로그인 → 대시보드 → Phase 뷰 → 모달 → 체크리스트 → 암호화 → 환자 → 로그아웃 전체 검증

## Deployment
- **Platform**: Cloudflare Pages (Hono)
- **Status**: Active (Sandbox)
- **Tech Stack**: Hono + TypeScript + Vanilla JS + CSS
- **Last Updated**: 2026-03-26
