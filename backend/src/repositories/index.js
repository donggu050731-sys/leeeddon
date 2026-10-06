/* ===== 저장소 고르기 =====
   "데이터를 어디서 가져올지"를 여기 한 곳에서 정한다.
   지금은 JSON 파일을 쓰고, 나중에 DB를 붙이면 아래 switch 에 한 줄만 추가하면 된다.

   저장소가 반드시 갖춰야 하는 함수 (이 목록이 곧 약속이다):
     getProfile()          → 프로필 객체
     getProjects()         → { label, title, desc, items: [...] }
     getProjectById(id)    → 프로젝트 1건 또는 null
     getHometown()         → 고향(수원) 객체
     getJourney()          → { label, title, items: [...] }
     saveProjects(projects) → 프로젝트 묶음 전체 저장 (관리자 화면이 쓴다)
     getVisit()            → 찾아오는 길 · 방문 예약의 문구와 규칙
     getHolidays()         → { source, items: [{ date, name }] }
     getBookings()         → 방문 예약 전체 (배열)
     updateBookings(change) → 방문 예약 목록을 읽고·고치고·저장 (change 가 목록을 고친다)
*/

import { createJsonRepository } from './json.repository.js';

export async function createRepository({ driver, dataDir, storageDir, databaseUrl }) {
  switch (driver) {
    case 'json':
      return createJsonRepository({ dataDir, storageDir });

    // DB를 붙일 때: db.repository.example.js 를 db.repository.js 로 복사해 채운 뒤
    // 아래 두 줄의 주석을 풀면 DATA_DRIVER=db 로 전환된다.
    // case 'db':
    //   return createDbRepository({ databaseUrl });

    default:
      throw new Error('알 수 없는 저장소 종류입니다: ' + driver + " (쓸 수 있는 값: 'json')");
  }
}
