# Family Finance 프로젝트 핸드오프 문서 (for OpenCode)

## 1) 프로젝트 개요

가족 단위의 월간 자금 흐름(수입 → 계좌 → 지출/저축)을 **그래프(노드/엣지)** 형태로 시각화하고, 향후 편집/공유까지 지원하는 웹 기반 서비스입니다.

- 목표 플랫폼: Web-first + PWA
- 권한 모델: owner / editor / viewer
- 인증: Google OAuth (Supabase Auth 연동 전제)
- 핵심 가치: 돈의 흐름을 한눈에 파악하고, 가족 구성원과 투명하게 공유

---

## 2) 기술 스택 및 아키텍처

### 백엔드/데이터
- PostgreSQL (Supabase 호환 스키마)
- Row Level Security (RLS) 기반 멀티테넌시
- 서버 측 helper function / trigger / RPC 중심 설계

### 프론트엔드(현재)
- `web/` 정적 데모 UI (HTML + JS)
- 아직 Next.js/React 앱 본체는 미도입

### 타입/계약
- TypeScript 기반 API 스켈레톤
- `zod` 대체를 위한 로컬 shim (`src/shims/zod.ts`)

### CI
- GitHub Actions
  - typecheck
  - Postgres 서비스 기반 migration + smoke test

---

## 3) 현재 데이터베이스 설계 요약

마이그레이션 파일:
- `db/migrations/0001_family_finance_init.sql`
- `db/migrations/0002_rls_and_seeds.sql`
- `db/migrations/0003_auth_sync_and_household_bootstrap.sql`
- `db/migrations/0004_monthly_snapshot_recalc.sql`

핵심 테이블:
- users
- households
- household_members
- categories
- nodes
- flows
- exchange_rates
- monthly_snapshots

핵심 함수/RPC:
- `app_user_id`, `is_household_member`, `is_household_owner`, `can_edit_household`
- `create_household_with_owner(...)`
- `recalculate_monthly_snapshots(...)`

운영 포인트:
- 주요 테이블 RLS 활성화 및 role 별 policy 정의
- system category seed 데이터 삽입
- `updated_at` trigger 운영 (`nodes`, `flows`)

---

## 4) API 스켈레톤 현황

디렉터리: `src/api/`
- `schemas.ts`: 요청 스키마 정의
- `contracts.ts`: 엔드포인트별 스키마 매핑
- `handlers.ts`: 검증 + repository 호출 골격
- `repositories.ts`: DB 접근 인터페이스
- `errors.ts`: API 에러 타입

주의:
- 실제 HTTP 서버 라우터(Express/Fastify/Next Route Handler)와의 연결은 아직 미구현
- Repository 실제 구현(Supabase/Postgres adapter) 미구현

---

## 5) 데모 UI 현황 (`web/`)

파일:
- `web/index.html`
- `web/app.js`

현재 동작:
- SVG 기반 그래프 렌더링
- 노드 선택/상세 표시
- 노드 드래그 이동 (위치 제한)
- localStorage 기반 레이아웃/상태 저장
- 흐름(Flow) 추가 폼
- 흐름 목록 및 삭제
- KPI(총수입/총지출/저축률) 동적 재계산
- 레이아웃 초기화

한계:
- 데모 데이터 in-memory/localStorage 사용
- DB/API 실연동 없음
- 인증/권한/실시간 협업 없음

---

## 6) 로컬 개발/검증 방법

### 주요 명령
- DB 기동: `make up`
- DB 검증(리셋+마이그레이션+스모크): `make test-db`
- UI 데모: `make ui-demo` (http://localhost:4173)
- 타입검사: `npm run typecheck`
- DB 종료: `make down`

### 스모크 테스트
- `scripts/run_migration_smoke.sh` → `db/tests/policy_smoke.sql` 실행

### 브랜치 워크플로우
- 신규 PR 브랜치 생성: `scripts/new_pr_branch.sh main feature/<task>`
- 기존 브랜치 동기화: `scripts/sync_base.sh main <branch>`

---

## 7) 현재까지 완료된 작업 (요약)

1. **DB 스키마/인덱스/enum 구축 완료**
2. **RLS 및 owner/editor/viewer 정책 적용 완료**
3. **auth.users 동기화 트리거 + household bootstrap RPC 완료**
4. **monthly snapshot 재계산 RPC 완료**
5. **마이그레이션 스모크 테스트 스크립트/CI 파이프라인 구축 완료**
6. **TypeScript API 스켈레톤 및 검증 구조 마련 완료**
7. **가시적 데모 UI(그래프 편집 기초) 구현 완료**
8. **개발/브랜치 운영 스크립트 및 문서화 완료**

---

## 8) 남은 작업 (우선순위)

### P0 (MVP 기능 완성 필수)
1. **실제 서버 라우팅 계층 구현**
   - contracts/schemas/handlers를 HTTP 엔드포인트로 연결
2. **Repository 실제 구현**
   - Postgres/Supabase adapter 작성
3. **UI ↔ API 연결**
   - `web/app.js`의 in-memory state 제거
   - dashboard/nodes/flows API 호출로 대체
4. **인증/권한 통합**
   - Google OAuth login + JWT 기반 RLS 확인

### P1 (품질/운영)
5. 에러 처리/로깅/관측성 강화
6. 테스트 확대 (unit/integration/e2e)
7. 마이그레이션 롤백 전략 및 데이터 백업 정책 보강

### P2 (제품 확장)
8. 카테고리 관리 UI/멤버 관리 UI 구현
9. 환율 API 연동 및 다중 통화 계산 고도화
10. PWA 오프라인/설치 UX 개선

---

## 9) OpenCode가 바로 시작할 추천 작업 순서

1. `make up && make test-db`로 로컬 DB 상태 검증
2. 서버 프레임워크 선택(권장: Next.js Route Handler 또는 Fastify)
3. `src/api/repositories.ts` 구현체 작성
4. `src/api/handlers.ts`를 실제 라우트에 연결
5. `web/app.js`를 API fetch 기반으로 전환
6. 드래그 좌표 저장 API(`PATCH /nodes/:id/position`) 연결
7. flows create/delete를 API 연동
8. 로그인/household context 주입 후 RLS 동작 검증

---

## 10) 리스크 및 주의사항

- 현재 `web/`는 데모용이라 제품 코드와 분리되어 있음 (향후 프레임워크 앱으로 이관 필요)
- zod shim은 제한 환경 대응용이므로, 실제 배포에서는 정식 zod 사용 권장
- RLS 정책은 강력하지만, 서버에서 household context 누락 시 UX 오류가 발생할 수 있음
- 환율/다중통화 계산은 아직 단순화되어 있으므로 재무 정합성 검증 필요

---

## 11) 체크리스트 (handoff done criteria)

- [ ] DB 마이그레이션 0001~0004 적용 성공
- [ ] smoke test 통과
- [ ] typecheck 통과
- [ ] API 실제 라우팅 최소 3개 연결 (household/nodes/flows)
- [ ] UI에서 노드 이동/흐름 추가가 API 연동으로 동작
- [ ] owner/editor/viewer 권한별 동작 수동 검증

