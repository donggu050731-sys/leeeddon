# 이동규 포트폴리오

상명대학교 그린스마트시티학과 프로젝트 포트폴리오.
화면(프론트엔드)과 데이터를 주는 서버(백엔드)를 나눠서 관리한다.

- 웹: https://donggu050731-sys.github.io/leeeddon/
- 오른쪽 위 **공유하기 → PDF 공유** 를 누르면 핵심 내용만 담은 A4 문서로 저장된다.

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
npm run setup      # 백엔드 라이브러리 설치
```

## 개발 중

```bash
npm start          # http://localhost:3000 — 화면과 API를 한 서버에서 같이 띄운다
npm run dev        # 파일을 고치면 서버가 자동으로 다시 시작
```

내용을 고치려면 `backend/data/*.json` 을 고치고 새로고침하면 된다. (서버 재시작 불필요)

## 배포용 묶음 만들기

```bash
npm run build      # dist/ 폴더 생성 (화면 + 데이터 복사본)
```

`main` 브랜치에 push하면 GitHub Actions가 같은 일을 해서 Pages에 올린다.

> **한 번만 해둘 설정:** GitHub 저장소 → Settings → Pages → Source 를 **GitHub Actions** 로 바꾼다.

---

## API

| 주소 | 설명 |
|---|---|
| `GET /api/health` | 서버 상태와 현재 저장소 종류 |
| `GET /api/portfolio` | 전체 내용 (화면이 쓰는 주소) |
| `GET /api/projects` | 프로젝트 목록 |
| `GET /api/projects/:id` | 프로젝트 1건 |

응답은 모두 `{ "data": ... }` 모양이고, 오류는 `{ "error": { "status", "message" } }` 모양이다.

---

## 나중에 DB나 다른 API를 붙일 때

내용을 읽어오는 곳은 `backend/src/repositories/` 한 곳뿐이다. 나머지 코드는 건드리지 않는다.

1. `db.repository.example.js` 를 `db.repository.js` 로 복사해서 내용을 채운다
   (함수 이름과 돌려주는 모양만 `json.repository.js` 와 똑같이 맞추면 된다)
2. `repositories/index.js` 의 `case 'db':` 주석을 푼다
3. `DATA_DRIVER=db DATABASE_URL=... npm start`

화면 쪽에서 서버 주소만 바꾸고 싶다면 `frontend/js/config.js` 의 `apiBase` 만 고치면 된다.
