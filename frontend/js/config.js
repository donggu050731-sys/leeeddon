/* ===== 연결 설정 =====
   화면이 내용을 어디서 가져올지 정하는 곳. 코드를 몰라도 이 파일만 고치면 된다.

   apiBase        : 백엔드 API 주소.
                    ''(빈 문자열) = 지금 페이지와 같은 서버의 /api 를 쓴다 (로컬 개발용).
                    다른 서버에 올렸다면 'https://내-서버-주소' 처럼 적는다.
   staticDataPath : API에 연결하지 못했을 때 대신 읽는 JSON 폴더.
                    GitHub Pages처럼 서버가 없는 곳에서는 이 경로의 파일을 읽는다.
   useApi         : false 로 두면 API를 아예 시도하지 않고 JSON 파일만 읽는다.
*/
window.PORTFOLIO_CONFIG = {
  apiBase: '',
  staticDataPath: 'data',
  useApi: true
};
