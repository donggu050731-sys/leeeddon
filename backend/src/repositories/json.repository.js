/* ===== 저장소: JSON 파일 =====
   data/*.json 을 읽고 쓴다. 파일이 바뀌면 자동으로 다시 읽는다(수정 시각 비교).

   ※ getProjects() 는 초안까지 전부 돌려준다. 공개 여부를 거르는 일은 서비스가 한다.

   나중에 DB로 옮기더라도 이 파일의 '함수 목록'만 그대로 지키면
   서비스·컨트롤러·화면 코드는 하나도 고치지 않아도 된다.
*/

import { readFile, writeFile, rename, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';

export function createJsonRepository({ dataDir, storageDir }) {
  const cache = new Map(); // 파일이름 → { mtimeMs, value }

  // 방문 예약은 data/ 가 아니라 storage/ 에 둔다.
  // data/ 는 공개 사이트로 그대로 복사되는 폴더라, 방문자의 이름·이메일을 두면 안 된다.
  const bookingsFile = path.join(storageDir, 'bookings.json');
  let bookingQueue = Promise.resolve(); // 동시에 들어온 예약이 서로 덮어쓰지 않게 한 줄로 세운다

  async function readBookings() {
    try {
      return JSON.parse(await readFile(bookingsFile, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error; // 파일이 아직 없는 것만 괜찮다
      return [];
    }
  }

  async function writeBookings(list) {
    await mkdir(storageDir, { recursive: true });
    const temp = bookingsFile + '.tmp';
    await writeFile(temp, JSON.stringify(list, null, 2) + '\n', 'utf8');
    await rename(temp, bookingsFile);
  }

  async function read(name) {
    const file = path.join(dataDir, name + '.json');
    const info = await stat(file);
    const cached = cache.get(name);

    if (cached && cached.mtimeMs === info.mtimeMs) return cached.value;

    const value = JSON.parse(await readFile(file, 'utf8'));
    cache.set(name, { mtimeMs: info.mtimeMs, value });
    return value;
  }

  // 임시 파일에 먼저 쓰고 이름을 바꾼다. 쓰다가 멈춰도 원본이 깨지지 않는다.
  async function write(name, value) {
    const file = path.join(dataDir, name + '.json');
    const temp = file + '.tmp';

    await writeFile(temp, JSON.stringify(value, null, 2) + '\n', 'utf8');
    await rename(temp, file);

    cache.delete(name);
  }

  return {
    name: 'json',

    getProfile: () => read('profile'),
    getHometown: () => read('hometown'),
    getJourney: () => read('journey'),
    getVisit: () => read('visit'),
    getHolidays: () => read('holidays'),

    /** 방문 예약 전체 (storage/bookings.json) */
    getBookings: () => readBookings(),

    /**
     * 방문 예약 목록을 읽고 → 고치고 → 저장하는 일을 한 번에 한다.
     * change(list) 가 목록을 직접 고치고, 돌려준 값이 그대로 결과가 된다.
     * (번호 붙이기·상태 바꾸기가 동시에 들어와도 서로 덮어쓰지 않는다)
     */
    updateBookings(change) {
      const done = bookingQueue.then(async () => {
        const list = await readBookings();
        const result = await change(list);
        await writeBookings(list);
        return result;
      });
      bookingQueue = done.catch(() => {});
      return done;
    },

    /** 프로젝트 묶음 전체 ({ label, title, desc, items }) — 초안 포함 */
    getProjects: () => read('projects'),

    /** 프로젝트 1건. 없으면 null */
    async getProjectById(id) {
      const projects = await read('projects');
      return projects.items.find(item => item.id === id) || null;
    },

    /** 프로젝트 묶음 전체를 저장한다 (관리자 화면에서만 사용) */
    saveProjects: (projects) => write('projects', projects)
  };
}
