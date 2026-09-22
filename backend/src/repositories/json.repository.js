/* ===== 저장소: JSON 파일 =====
   data/*.json 을 읽어 온다. 파일이 바뀌면 자동으로 다시 읽는다(수정 시각 비교).

   나중에 DB로 옮기더라도 이 파일의 '함수 목록'만 그대로 지키면
   서비스·컨트롤러·화면 코드는 하나도 고치지 않아도 된다.
*/

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export function createJsonRepository({ dataDir }) {
  const cache = new Map(); // 파일이름 → { mtimeMs, value }

  async function read(name) {
    const file = path.join(dataDir, name + '.json');
    const info = await stat(file);
    const cached = cache.get(name);

    if (cached && cached.mtimeMs === info.mtimeMs) return cached.value;

    const value = JSON.parse(await readFile(file, 'utf8'));
    cache.set(name, { mtimeMs: info.mtimeMs, value });
    return value;
  }

  return {
    name: 'json',

    getProfile: () => read('profile'),
    getHometown: () => read('hometown'),
    getJourney: () => read('journey'),

    /** 프로젝트 묶음 전체 ({ label, title, desc, items }) */
    getProjects: () => read('projects'),

    /** 프로젝트 1건. 없으면 null */
    async getProjectById(id) {
      const projects = await read('projects');
      return projects.items.find(item => item.id === id) || null;
    }
  };
}
