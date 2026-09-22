/* ===== 정적 사이트 만들기 =====
   실행: npm run build   →  dist/ 폴더가 만들어진다.

   하는 일
     1) frontend/ 를 dist/ 에 복사 — 단, 관리자 화면은 뺀다
        (관리자 기능은 백엔드가 있어야 동작하고, 공개 사이트에 둘 이유도 없다)
     2) backend/data/*.json 을 dist/data/ 에 복사 — 단, 초안(draft) 프로젝트는 뺀다
        (서버 없이 JSON을 직접 읽는 곳이라, 초안이 섞이면 그대로 보이기 때문)

   내용의 원본은 언제나 backend/data 한 곳뿐이다. dist/data 는 그 복사본이므로 직접 고치지 않는다.
   GitHub Actions(.github/workflows/deploy-pages.yml)도 이 스크립트를 그대로 쓴다.
*/

import { cp, rm, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND = path.join(root, 'frontend');
const DATA = path.join(root, 'backend', 'data');
const DIST = path.join(root, 'dist');

// 공개 사이트에 올리지 않을 관리자 전용 파일
const ADMIN_ONLY = ['admin.html', path.join('css', 'admin.css'), path.join('js', 'admin')];

await rm(DIST, { recursive: true, force: true });
await cp(FRONTEND, DIST, { recursive: true });

for (const target of ADMIN_ONLY) {
  await rm(path.join(DIST, target), { recursive: true, force: true });
}

await mkdir(path.join(DIST, 'data'), { recursive: true });

const files = (await readdir(DATA)).filter(name => name.endsWith('.json'));
let hiddenDrafts = 0;

for (const name of files) {
  const value = JSON.parse(await readFile(path.join(DATA, name), 'utf8'));

  if (name === 'projects.json' && Array.isArray(value.items)) {
    const before = value.items.length;
    value.items = value.items.filter(item => (item.status || 'published') === 'published');
    hiddenDrafts += before - value.items.length;
  }

  await writeFile(path.join(DIST, 'data', name), JSON.stringify(value, null, 2) + '\n', 'utf8');
}

console.log('dist/ 준비 완료');
console.log('  데이터 ' + files.length + '개 (' + files.join(', ') + ')');
console.log('  초안 제외: ' + hiddenDrafts + '건 / 관리자 화면 제외됨');
