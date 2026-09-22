/* ===== CORS =====
   프론트엔드를 다른 주소(예: GitHub Pages)에 올렸을 때도 이 API를 부를 수 있게 허용한다.

   관리자 기능은 '로그인 토큰'으로 지키므로 주소를 열어둬도 비밀번호 없이는 아무것도 못 한다.
   (브라우저가 자동으로 보내는 쿠키를 쓰지 않기 때문에, 남의 사이트에서 몰래 요청을 보내도 통하지 않는다.)
   나중에 인터넷 서버에 올린다면 ALLOWED_ORIGIN 환경변수로 허용 주소를 좁히는 것을 권한다.
*/

export function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}
