/* ===== 연결 설정 =====
   화면이 내용을 어디서 가져올지 정하는 곳. 코드를 몰라도 이 파일만 고치면 된다.

   apiBase        : 백엔드 API 주소.
                    ''(빈 문자열) = 지금 페이지와 같은 서버의 /api 를 쓴다 (로컬 개발용).
                    다른 서버에 올렸다면 'https://내-서버-주소' 처럼 적는다.
   staticDataPath : API에 연결하지 못했을 때 대신 읽는 JSON 폴더.
                    GitHub Pages처럼 서버가 없는 곳에서는 이 경로의 파일을 읽는다.
   useApi         : false 로 두면 API를 아예 시도하지 않고 JSON 파일만 읽는다.
   weatherApi     : '찾아오는 길' 페이지의 날씨를 받아오는 외부 서비스 주소 (Open-Meteo, 열쇠 없이 쓸 수 있다).
   bookingEndpoint: 방문 예약을 받아 내 이메일로 전달해 주는 외부 서비스(Formspree)의 폼 주소.
                    Formspree 대시보드 → 폼 → Integration 탭에 나오는 주소다. 비밀 값이 아니다.
                    ''(빈 문자열)로 두면 Formspree 대신 백엔드(/api/bookings)에 저장한다.
*/
window.PORTFOLIO_CONFIG = {
  apiBase: '',
  staticDataPath: 'data',
  useApi: true,
  weatherApi: 'https://api.open-meteo.com/v1/forecast',
  bookingEndpoint: 'https://formspree.io/f/mppqwwpq'
};
