/* ===== 서버 실행 =====
   npm start  (개발 중 자동 재시작: npm run dev)

   환경변수 (backend/.env 파일에 적어두면 자동으로 읽는다)
     PORT                 : 포트 번호 (기본 3000)
     DATA_DRIVER          : 데이터를 어디서 읽을지 — json (기본) / db (나중에 추가)
     DATABASE_URL         : DB를 쓸 때의 접속 주소
     ADMIN_PASSWORD_HASH  : 관리자 비밀번호의 해시. npm run set-password 로 만든다.
                            비밀번호 원문은 어디에도 저장되지 않는다.
     ALLOWED_ORIGIN       : API 사용을 허용할 주소 (기본 전체 허용)
*/

import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './src/app.js';
import { createRepository } from './src/repositories/index.js';
import { createSessionStore } from './src/auth/sessions.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(here, 'data');
// 방문 예약처럼 방문자가 남긴 정보를 두는 곳 (git 에도, 공개 사이트에도 올라가지 않는다)
const STORAGE_DIR = path.join(here, 'storage');
const FRONTEND_DIR = path.join(here, '..', 'frontend');
const ENV_FILE = path.join(here, '.env');

// 비밀번호 해시 등은 .env 에 둔다 (git 에 올라가지 않는 파일)
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const PORT = Number(process.env.PORT) || 3000;
const DRIVER = process.env.DATA_DRIVER || 'json';
const PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

// 내 컴퓨터에서만 열리게 한다. 이렇게 하지 않으면 같은 와이파이에 있는
// 다른 기기에서도 관리자 페이지에 접속해 비밀번호를 넣어볼 수 있다.
// 다른 기기에서 일부러 보려면 HOST=0.0.0.0 으로 실행한다.
const HOST = process.env.HOST || '127.0.0.1';

const repository = await createRepository({
  driver: DRIVER,
  dataDir: DATA_DIR,
  storageDir: STORAGE_DIR,
  databaseUrl: process.env.DATABASE_URL
});

const app = createApp({
  repository,
  sessions: createSessionStore(),
  passwordHash: PASSWORD_HASH,
  frontendDir: FRONTEND_DIR
});

// 브라우저에 따라 'localhost' 를 IPv6 주소(::1)로 먼저 찾는 경우가 있다.
// 127.0.0.1 만 열어두면 그때 "연결할 수 없음"이 뜨므로, 내 컴퓨터 전용 주소인 ::1 도 함께 연다.
// (둘 다 내 컴퓨터 안에서만 통하는 주소라 다른 기기에서는 여전히 접속할 수 없다)
if (HOST === '127.0.0.1') {
  app.listen(PORT, '::1').on('error', () => {}); // IPv6 를 못 쓰는 컴퓨터에서는 그냥 넘어간다
}

app.listen(PORT, HOST, () => {
  console.log('포트폴리오 서버 실행 중 (' + (HOST === '127.0.0.1' ? '내 컴퓨터에서만 접속 가능' : HOST) + ')');
  console.log('  화면    : http://localhost:' + PORT);
  console.log('  관리자  : http://localhost:' + PORT + '/admin.html');
  console.log('  API     : http://localhost:' + PORT + '/api/portfolio');
  console.log('  저장소  : ' + repository.name);

  if (!PASSWORD_HASH) {
    console.log('');
    console.log('  ⚠ 관리자 비밀번호가 아직 없습니다. 관리자 화면을 쓰려면:');
    console.log('     npm run set-password');
  }
});
