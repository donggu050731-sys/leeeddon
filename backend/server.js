/* ===== 서버 실행 =====
   npm start  (개발 중 자동 재시작: npm run dev)

   환경변수로 바꿀 수 있는 것
     PORT         : 포트 번호 (기본 3000)
     DATA_DRIVER  : 데이터를 어디서 읽을지 — json (기본) / db (나중에 추가)
     DATABASE_URL : DB를 쓸 때의 접속 주소
*/

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './src/app.js';
import { createRepository } from './src/repositories/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(here, 'data');
const FRONTEND_DIR = path.join(here, '..', 'frontend');

const PORT = Number(process.env.PORT) || 3000;
const DRIVER = process.env.DATA_DRIVER || 'json';

const repository = await createRepository({
  driver: DRIVER,
  dataDir: DATA_DIR,
  databaseUrl: process.env.DATABASE_URL
});

const app = createApp({
  repository,
  frontendDir: FRONTEND_DIR,
  dataDir: DATA_DIR
});

app.listen(PORT, () => {
  console.log('포트폴리오 서버 실행 중');
  console.log('  화면 : http://localhost:' + PORT);
  console.log('  API  : http://localhost:' + PORT + '/api/portfolio');
  console.log('  저장소: ' + repository.name);
});
