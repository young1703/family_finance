# Family Finance 서비스 기획/설계 v1

## 1. 확정된 방향
- 플랫폼: 웹 우선 + PWA
- 로그인: Google OAuth 기반
- 권한: 소유자 / 편집자 / 조회자
- 통화: 설정에서 변경 가능, 환율 API 연동
- 카테고리: 시스템 기본 + 사용자 추가 가능
- 노드 표현: 유입(점선), 잔액(실선)
- 광고: MVP 제외

## 2. MVP 범위
1) 가족 그룹 생성/공유/권한 관리
2) 월별 노드-엣지 그래프 시각화
3) 노드/흐름 CRUD 편집
4) 통화 설정 및 환율 환산 표시
5) 기본 카테고리와 사용자 카테고리 공존

## 3. 화면 명세
### 3.1 `/login`
- Google로 계속하기
- 로그인 성공 후 household 존재 여부에 따라 dashboard 또는 onboarding 이동

### 3.2 `/onboarding`
- Household 이름
- 기본 통화
- 시작 월
- 완료 시 기본 카테고리 seed

### 3.3 `/dashboard`
- 월 선택, KPI(총수입/총지출/순흐름/저축률)
- 그래프 캔버스(노드/엣지 편집)
- 좌측 필터(카테고리/검색/표시옵션)
- 우측 상세 패널(선택 노드/엣지 편집)

### 3.4 `/categories`
- 시스템 카테고리와 사용자 카테고리 탭
- 사용자 카테고리 생성/수정/비활성화

### 3.5 `/members`
- 초대, 역할 변경, 멤버 제거
- owner 전용 관리 액션

### 3.6 `/settings`
- 기본 통화 변경
- 환율 자동 갱신(일 1회) 또는 수동 갱신
- 그래프 스케일 옵션(sqrt/log)

## 4. 데이터 모델(초안)
- users
- households
- household_members(role: owner/editor/viewer)
- categories(source_type: system/user)
- nodes(node_type, currency, current_balance, monthly_inflow, pos_x, pos_y)
- flows(from_node_id, to_node_id, amount, currency, cycle, auto_transfer)
- exchange_rates(base, quote, rate, fetched_at)
- monthly_snapshots(월별 캐시)

## 5. 시각화 규칙
- 실선: 잔액(Balance) 크기 반영
- 점선: 유입(Inflow) 크기 반영
- 엣지 두께: 금액 비례(로그 스케일 권장)
- 범례: 선 스타일/두께/색상 의미 명시

## 6. 카테고리 기본 세트
### 수입
- 급여, 부수입, 이자/배당, 기타수입

### 자산/계좌
- 입출금계좌, 예금, 적금, 투자계좌, 현금지갑

### 고정지출
- 주거비, 통신비, 보험료, 구독서비스, 교육비(고정)

### 변동지출
- 식비, 생활용품, 교통비, 의료비, 여가/취미, 경조사/선물

### 저축/목표
- 비상금, 단기목표, 장기목표

## 7. API 명세(초안)
- `POST /api/households`
- `GET /api/households/:id`
- `POST /api/households/:id/invites`
- `PATCH /api/households/:id/members/:userId`
- `GET/POST/PATCH/DELETE` categories, nodes, flows
- `GET /api/fx/latest`
- `POST /api/fx/refresh`
- `GET /api/households/:id/dashboard?month=YYYY-MM`

## 8. 보안/권한
- household 멤버만 접근 허용
- viewer: read only
- editor: 데이터 편집 가능
- owner: 멤버/권한/핵심 설정 가능
- 감사 로그(audit_logs) 권장

## 9. 일정(2.5주)
- 1주차: Auth/온보딩/카테고리 seed
- 2주차: 그래프 + 노드/흐름 CRUD + KPI
- 3주차(반주): 권한/환율/QA/배포

## 10. 다음 구현 산출물
1) SQL 마이그레이션(create/index/RLS)
2) Next.js 폴더 구조 + 컴포넌트 트리
3) 그래프 인터랙션 상세 명세
4) MVP 작업 티켓 분해
