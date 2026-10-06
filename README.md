# 이동규 포트폴리오

상명대학교 그린스마트시티학과 프로젝트 포트폴리오.
화면(프론트엔드)과 데이터를 주는 서버(백엔드)를 나눠서 관리한다.

- 웹: https://desktop-tutorial-mu-gray.vercel.app/ (Vercel) · https://donggu050731-sys.github.io/leeeddon/ (GitHub Pages)
  - `main` 에 push 하면 두 곳이 각각 자동으로 다시 배포된다
- 오른쪽 위 **공유하기 → PDF 공유** 를 누르면 핵심 내용만 담은 A4 문서로 저장된다.
- 프로젝트 추가·수정은 **관리자 화면**(http://localhost:3000/admin.html)에서 한다.

---

## 폴더 구조

```
frontend/                화면 (HTML·CSS·JS) — 이 폴더만 GitHub Pages에 올라간다
  index.html             빈 틀. 내용은 JS가 데이터를 받아서 채운다
  css/                   tokens → base → layout → components → responsive → print 순서로 읽힌다
  js/
    config.js            서버 주소 설정 (여기만 고치면 연결 대상이 바뀐다)
    api.js               데이터 요청 (API 실패 시 JSON 파일로 자동 대체)
    dom.js               요소를 만드는 도구
    render/              화면 그리기 (섹션별)
    ui/                  동작 (네비·애니메이션·모달·공유)
    pdf.js               인쇄용 구조화 문서 만들기
  assets/                이미지

backend/                 API 서버 (Node + Express)
  server.js              실행 진입점
  data/*.json            ★ 내용의 원본. 글을 고칠 때는 여기를 고친다
  src/
    routes/              주소 정의
    controllers/         요청 받기 · 응답 보내기
    services/            무엇을 돌려줄지 정하는 규칙
    repositories/        데이터를 어디서 읽을지 (지금: JSON 파일 / 나중: DB)

scripts/build-site.js    frontend + backend/data → dist/ (배포용 묶음)
.github/workflows/       main에 push하면 dist/ 를 GitHub Pages에 올린다
```

---

## 처음 한 번만

```bash
npm run setup           # 백엔드 라이브러리 설치
npm run set-password    # 관리자 비밀번호 정하기
```

관리자 화면은 **창을 닫거나 새로고침하면 로그인이 풀린다.** 로그인 정보를 브라우저에 저장하지 않기 때문이며,
들어갈 때마다 비밀번호를 다시 입력해야 한다.

비밀번호는 화면에 보이지 않게 입력하고, 원문은 어디에도 저장되지 않는다.
흩뜨린 값(해시)만 `backend/.env` 에 저장되며 이 파일은 git 에 올라가지 않는다.
잊어버렸다면 `npm run set-password` 를 다시 실행해 새로 정하면 된다.

## 개발 중

```bash
npm start          # http://localhost:3000 — 화면과 API를 한 서버에서 같이 띄운다
                   # 내 컴퓨터에서만 열린다 (다른 기기에서도 보려면 HOST=0.0.0.0)
npm run dev        # 파일을 고치면 서버가 자동으로 다시 시작
```

내용을 고치는 방법은 두 가지다.

1. **관리자 화면** — http://localhost:3000/admin.html (프로젝트 추가·수정·삭제)
2. `backend/data/*.json` 직접 수정 (표·분석이 들어간 기존 프로젝트는 이 방법으로)

둘 다 저장하면 웹사이트를 새로고침했을 때 바로 반영된다. (서버 재시작 불필요)

## 관리자 화면

| 칸 | 필수 여부 |
|---|---|
| 제목 · 내가 한 역할 · 설명 · 날짜 · 참여인원 수 | **공개**로 저장하려면 모두 필수 |
| 참고사항 | 선택 |

- **초안** — 빈칸이 있어도 저장된다. 웹사이트에는 보이지 않고 관리자 화면에서만 보인다.
- **공개** — 참고사항을 뺀 모든 칸이 채워져야 저장된다. 웹사이트와 PDF에 바로 들어간다.
- 표·분석이 들어간 기존 프로젝트 4건은 목록에 보이지만 내용 수정은 막혀 있고, 공개/초안 전환만 된다.

### 중복 확인

같은 제목(띄어쓰기·대소문자 무시)의 프로젝트가 이미 있으면 저장을 멈추고 무엇을 할지 물어본다.

| 고를 수 있는 것 | 하는 일 |
|---|---|
| 기존 것에 합치기 | 지금 입력한 칸만 기존 프로젝트에 덮어쓰고, 비워둔 칸은 그대로 둔다 |
| 기존 것을 지우고 새로 저장 | 확인 창을 거친 뒤 기존 것을 지우고 새로 만든다 |
| 그래도 따로 저장 | 같은 제목으로 둘 다 남긴다 |
| 취소 | 아무것도 저장하지 않는다 |

표·분석이 든 기존 프로젝트와 제목이 겹치면 합치기·삭제는 막히고, 따로 저장이나 취소만 고를 수 있다.
이미 있는 프로젝트를 수정하다가 제목이 다른 프로젝트와 겹치면 저장이 막힌다. (합치기는 새로 저장할 때만 제안한다)

> 관리자 화면은 백엔드가 있어야 동작한다. GitHub Pages(공개 사이트)에는 올라가지 않는다.
> 관리자 화면에서 바꾼 내용을 공개 사이트에 반영하려면 `backend/data` 변경분을 커밋·push 하면 된다.

## 배포용 묶음 만들기

```bash
npm run build      # dist/ 폴더 생성 (화면 + 데이터 복사본)
```

`main` 브랜치에 push하면 GitHub Actions가 같은 일을 해서 Pages에 올린다.

> **한 번만 해둘 설정:** GitHub 저장소 → Settings → Pages → Source 를 **GitHub Actions** 로 바꾼다.

---

## API

공개 API (누구나)

| 주소 | 설명 |
|---|---|
| `GET /api/health` | 서버 상태와 현재 저장소 종류 |
| `GET /api/portfolio` | 전체 내용 (화면이 쓰는 주소) |
| `GET /api/projects` | 프로젝트 목록 — **공개된 것만** |
| `GET /api/projects/:id` | 프로젝트 1건 |
| `GET /api/visit` | 찾아오는 길 (장소 · 좌표 · 문구) |
| `GET /api/holidays` | 공휴일 목록 (예약 캘린더에서 막을 날짜) |
| `POST /api/bookings` | 방문 예약 접수 → `backend/storage/bookings.json` 에 저장 |

관리자 API (로그인 필요 · 헤더에 `Authorization: Bearer <토큰>`)

| 주소 | 설명 |
|---|---|
| `POST /api/admin/login` | 비밀번호 → 토큰 발급 (5번 틀리면 15분 잠김, 토큰은 30분 뒤 만료) |
| `GET /api/admin/projects` | 초안까지 전부 |
| `GET /api/admin/bookings` | 방문 예약 전체 |
| `PATCH /api/admin/bookings/:id/status` | 예약 처리 상태 바꾸기 (접수 · 확정 · 변경 요청 · 취소) |
| `POST /api/admin/projects` | 새 프로젝트 |
| `PUT /api/admin/projects/:id` | 수정 |
| `PATCH /api/admin/projects/:id/status` | 공개 ↔ 초안 |
| `DELETE /api/admin/projects/:id` | 삭제 |

응답은 모두 `{ "data": ... }` 모양이고, 오류는 `{ "error": { "status", "message" } }` 모양이다.

---

## 나중에 DB나 다른 API를 붙일 때

내용을 읽어오는 곳은 `backend/src/repositories/` 한 곳뿐이다. 나머지 코드는 건드리지 않는다.

1. `db.repository.example.js` 를 `db.repository.js` 로 복사해서 내용을 채운다
   (함수 이름과 돌려주는 모양만 `json.repository.js` 와 똑같이 맞추면 된다)
2. `repositories/index.js` 의 `case 'db':` 주석을 푼다
3. `DATA_DRIVER=db DATABASE_URL=... npm start`

화면 쪽에서 서버 주소만 바꾸고 싶다면 `frontend/js/config.js` 의 `apiBase` 만 고치면 된다.
