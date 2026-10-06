/* ===== 저장소: DB (뼈대 예시) =====
   실제로 쓰는 파일이 아니다. DB를 붙일 때 이 파일을 db.repository.js 로 복사해서 채운다.

   순서
     1) 이 파일을 db.repository.js 로 복사
     2) 쓰려는 DB 드라이버 설치 (예: npm install better-sqlite3 / pg / mysql2)
     3) 아래 TODO 부분을 실제 조회 코드로 채우기
     4) repositories/index.js 의 'db' case 주석 풀기
     5) 서버 실행 시 DATA_DRIVER=db DATABASE_URL=... 지정

   지켜야 할 것은 딱 하나 — 아래 함수들이 json.repository.js 와 '같은 모양의 값'을 돌려주는 것.
   그러면 API도 화면도 고칠 필요가 없다.
*/

export function createDbRepository({ databaseUrl }) {
  // const db = new SomeDriver(databaseUrl);

  return {
    name: 'db',

    async getProfile() {
      // TODO: SELECT * FROM profile LIMIT 1  →  profile.json 과 같은 모양으로 변환해서 반환
      throw new Error('아직 구현하지 않았습니다 (getProfile)');
    },

    async getProjects() {
      // TODO: SELECT * FROM projects ORDER BY sort_order
      //       → { label, title, desc, items: [...] } 모양으로 감싸서 반환
      throw new Error('아직 구현하지 않았습니다 (getProjects)');
    },

    async getProjectById(id) {
      // TODO: SELECT * FROM projects WHERE id = ?  (없으면 null 반환)
      throw new Error('아직 구현하지 않았습니다 (getProjectById)');
    },

    async getHometown() {
      // TODO: hometown.json 과 같은 모양
      throw new Error('아직 구현하지 않았습니다 (getHometown)');
    },

    async getJourney() {
      // TODO: { label, title, items: [...] } 모양
      throw new Error('아직 구현하지 않았습니다 (getJourney)');
    },

    async getVisit() {
      // TODO: visit.json 과 같은 모양 (찾아오는 길: 장소·좌표·문구·출처)
      throw new Error('아직 구현하지 않았습니다 (getVisit)');
    },

    async getHolidays() {
      // TODO: { source, items: [{ date, name }] } 모양 (holidays.json 과 같다)
      throw new Error('아직 구현하지 않았습니다 (getHolidays)');
    },

    async addBooking(booking) {
      // TODO: INSERT INTO bookings (id, created_at, status, date, time, name, email, purpose, consent)
      throw new Error('아직 구현하지 않았습니다 (addBooking)');
    },

    async saveProjects(projects) {
      // TODO: 관리자 화면에서 저장할 때 쓰인다.
      //       DB라면 통째로 덮어쓰기보다 INSERT / UPDATE / DELETE 로 나눠 구현하는 편이 낫다.
      throw new Error('아직 구현하지 않았습니다 (saveProjects)');
    }
  };
}
