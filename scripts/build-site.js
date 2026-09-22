/* ===== 정적 사이트 만들기 =====
   실행: npm run build   →  dist/ 폴더가 만들어진다.

   하는 일
     1) frontend/ 를 통째로 dist/ 에 복사
     2) backend/data/*.json 을 dist/data/ 에 복사
        (서버가 없는 GitHub Pages에서는 화면이 이 JSON 파일을 직접 읽는다)

   내용의 원본은 언제나 backend/data 한 곳뿐이다. dist/data 는 그 복사본이므로 직접 고치지 않는다.
   GitHub Actions(.github/workflows/deploy-pages.yml)도 이 스크립트를 그대로 쓴다.
*/

import { cp, rm, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND = path.join(root, 'frontend');
const DATA = path.join(root, 'backend', 'data');
const DIST = path.join(root, 'dist');

await rm(DIST, { recursive: true, force: true });
await cp(FRONTEND, DIST, { recursive: true });

await mkdir(path.join(DIST, 'data'), { recursive: true });
const files = (await readdir(DATA)).filter(name => name.endsWith('.json'));
for (const name of files) {
  await cp(path.join(DATA, name), path.join(DIST, 'data', name));
}

console.log('dist/ 준비 완료 — 화면 파일 + 데이터 ' + files.length + '개 (' + files.join(', ') + ')');
