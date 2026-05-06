# Family Finance 로컬 실행/테스트 가이드

이 문서는 현재까지 구현된 Family Finance 프로젝트를 로컬에서 실행하고, DB/타입체크/UI 데모까지 확인하는 방법을 정리합니다.

## 1. 현재 구현 범위 요약

현재 저장소는 **실서비스 완성본이 아니라 MVP 기반 + 데모 UI** 상태입니다.

완료된 영역:

- PostgreSQL/Supabase 호환 DB 스키마 및 마이그레이션
- RLS 정책과 owner/editor/viewer 권한 모델 기초
- auth user 동기화 트리거 및 household 생성 RPC
- 월별 snapshot 재계산 RPC
- DB smoke test 및 GitHub Actions CI 설정
- TypeScript API contract/handler/repository skeleton
- `web/` 정적 데모 UI
  - 월별 mock 데이터
  - 노드/흐름 그래프 렌더링
  - 노드 드래그 및 위치 저장
  - 흐름 추가/삭제
  - KPI 동적 계산
  - JSON export/import

아직 미구현인 영역:

- 실제 인증/Google OAuth 화면
- 실제 HTTP 서버/라우터
- 실제 DB repository 구현
- `web/` 데모 UI와 DB/API 실연동
- 가족 초대/권한 관리 UI
- Next.js/React 기반 제품 UI

---

## 2. 사전 준비

로컬 실행을 위해 아래 도구가 필요합니다.

### 필수

- Node.js + npm
- Docker + Docker Compose
- PostgreSQL client (`psql`, `pg_isready`)
- Python 3 (`make ui-demo` 정적 서버 실행용)

### 권장 버전

- Node.js 20+
- PostgreSQL/Postgres Docker image 16
- Python 3.10+

---

## 3. 빠른 실행 순서

프로젝트 루트에서 아래 순서로 실행합니다.

```bash
npm install
npm run typecheck
make up
make test-db
make ui-demo
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:4173
```

종료할 때는 별도 터미널에서 아래 명령을 실행합니다.

```bash
make down
```

---

## 4. 명령어별 상세 설명

### 4.1 의존성 설치

```bash
npm install
```

`package.json`의 TypeScript 및 zod 의존성을 설치합니다.

### 4.2 TypeScript 정적 검사

```bash
npm run typecheck
```

내부적으로 `tsc --noEmit`을 실행합니다. 현재 API skeleton과 zod shim 타입이 깨지지 않았는지 확인합니다.

### 4.3 Postgres 컨테이너 실행

```bash
make up
```

`docker-compose.yml`의 `postgres` 서비스를 백그라운드로 실행합니다.

기본 접속 정보:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5432/family_finance
```

### 4.4 DB 마이그레이션 + smoke test 전체 실행

```bash
make test-db
```

`make test-db`는 아래 단계를 순서대로 수행합니다.

1. `db-wait`: Postgres 준비 대기
2. `db-reset`: public schema 초기화
3. `db-migrate`: `db/migrations/0001` ~ `0004` 적용
4. `db-smoke`: `scripts/run_migration_smoke.sh` 실행

### 4.5 UI 데모 실행

```bash
make ui-demo
```

Python 정적 서버로 `web/` 디렉터리를 서빙합니다.

접속 주소:

```text
http://localhost:4173
```

---

## 5. UI 데모에서 확인할 기능

`http://localhost:4173`에서 아래 기능을 직접 확인할 수 있습니다.

### 월 선택

- 상단의 월 선택 드롭다운에서 `2026-05`, `2026-04`, `2026-03`을 선택할 수 있습니다.
- 각 월은 별도 mock 상태로 저장됩니다.

### 그래프 보기

- 중앙 SVG 영역에서 수입/계좌/저축/지출 노드를 볼 수 있습니다.
- 화살표는 금액 흐름을 나타냅니다.
- 화살표 두께는 금액 크기에 따라 달라집니다.

### 노드 선택

- 노드를 클릭하면 우측 패널에 노드 상세가 표시됩니다.
- 표시 항목:
  - 노드명
  - 잔액
  - 월 유입
  - ID
  - 좌표

### 노드 드래그

- 노드를 드래그하면 위치가 변경됩니다.
- 드래그 종료 시 mock API를 통해 월별 localStorage 상태에 저장됩니다.

### 흐름 추가

- 좌측 패널의 `흐름 추가 (데모)` 폼에서 From/To/금액을 입력합니다.
- `추가` 버튼을 누르면 새 흐름이 그래프와 흐름 목록에 반영됩니다.
- KPI도 즉시 갱신됩니다.

### 흐름 삭제

- 좌측의 `흐름 목록`에서 각 항목의 `삭제` 버튼을 누르면 흐름이 제거됩니다.
- 그래프, KPI, 노드 유입액이 함께 갱신됩니다.

### JSON 내보내기/가져오기

- `내보내기`: 현재 월 데이터를 JSON 파일로 다운로드합니다.
- `가져오기`: JSON 파일을 선택해 현재 월 데이터로 복원합니다.

### 레이아웃 초기화

- `레이아웃 초기화` 버튼을 누르면 현재 선택한 월 데이터가 기본 데모 상태로 초기화됩니다.

---

## 6. DB만 수동으로 검증하는 방법

Makefile을 쓰지 않고 직접 실행하려면 아래 순서로 진행합니다.

```bash
export DATABASE_URL='postgres://postgres:postgres@localhost:5432/family_finance'
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0001_family_finance_init.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0002_rls_and_seeds.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0003_auth_sync_and_household_bootstrap.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0004_monthly_snapshot_recalc.sql
./scripts/run_migration_smoke.sh
```

주의: 기존 DB에 같은 객체가 남아 있으면 충돌할 수 있으므로, 로컬 검증은 `make test-db`처럼 schema reset 후 실행하는 방식을 권장합니다.

---

## 7. 현재 아키텍처상 중요한 한계

현재 `web/` 데모는 실제 DB와 연결되어 있지 않습니다.

- `web/app.js`는 UI 상호작용을 담당합니다.
- `web/mockApi.js`는 실제 API처럼 보이는 비동기 mock 계층입니다.
- mock 데이터는 브라우저 `localStorage`에 저장됩니다.

따라서 `make test-db`로 DB를 검증한 뒤 `make ui-demo`를 실행해도, UI는 아직 DB 데이터를 읽지 않습니다. 다음 구현 단계에서 `mockApi.js`를 실제 HTTP API 호출로 교체해야 합니다.

---

## 8. 다음 개발자가 이어서 할 작업

우선순위가 높은 다음 작업은 아래와 같습니다.

1. 실제 서버 라우팅 계층 선택 및 도입
   - 예: Next.js Route Handler, Fastify, Express
2. `src/api/repositories.ts` 실제 구현
   - PostgreSQL/Supabase adapter
3. `src/api/handlers.ts`를 HTTP route에 연결
4. `web/mockApi.js`를 실제 `fetch` 기반 API client로 교체
5. 드래그 위치 저장 API 연결
6. 흐름 추가/삭제 API 연결
7. household/month context를 실제 DB query에 반영
8. Google OAuth 및 RLS 통합 검증

---

## 9. 문제 해결

### `DATABASE_URL is required`

`./scripts/run_migration_smoke.sh`를 직접 실행할 때 `DATABASE_URL`이 없으면 발생합니다.

해결:

```bash
export DATABASE_URL='postgres://postgres:postgres@localhost:5432/family_finance'
./scripts/run_migration_smoke.sh
```

또는 `make test-db`를 사용하세요.

### `pg_isready: command not found`

PostgreSQL client가 설치되어 있지 않은 상태입니다.

해결:

- macOS: `brew install libpq` 또는 `brew install postgresql`
- Ubuntu/Debian: `sudo apt-get install postgresql-client`

### `docker compose`가 실패하는 경우

Docker Desktop 또는 Docker daemon이 실행 중인지 확인하세요.

```bash
docker compose version
docker ps
```

### UI가 열리지 않는 경우

`make ui-demo`를 실행한 터미널이 계속 켜져 있어야 합니다.

다른 터미널/브라우저에서 아래 주소를 엽니다.

```text
http://localhost:4173
```

### UI 데이터가 꼬인 경우

브라우저 localStorage에 demo state가 남아 있을 수 있습니다.

해결 방법:

1. UI의 `레이아웃 초기화` 버튼 사용
2. 브라우저 개발자 도구에서 localStorage key `family_finance_demo_state_v2` 삭제

---

## 10. 로컬 검증 체크리스트

- [ ] `npm install` 성공
- [ ] `npm run typecheck` 성공
- [ ] `make up` 성공
- [ ] `make test-db` 성공
- [ ] `make ui-demo` 후 `http://localhost:4173` 접속 성공
- [ ] 월 선택 변경 시 그래프가 유지/분리되는지 확인
- [ ] 노드 드래그 후 새로고침해도 위치 유지 확인
- [ ] 흐름 추가/삭제 시 KPI 갱신 확인
- [ ] JSON export/import 동작 확인
- [ ] `make down`으로 DB 컨테이너 종료
