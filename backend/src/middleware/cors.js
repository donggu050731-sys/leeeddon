/* ===== CORS =====
   프론트엔드를 다른 주소(예: GitHub Pages)에 올렸을 때도 이 API를 부를 수 있게 허용한다.
   읽기 전용 공개 데이터라 모든 주소(*)에 열어둔다.
   나중에 로그인·쓰기 기능이 생기면 여기서 허용 주소를 좁혀야 한다.
*/

export function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}
