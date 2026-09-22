/* ===== 관리자 확인 =====
   관리자 전용 주소는 모두 이 검사를 먼저 지나간다.
   요청 헤더의 토큰이 유효하지 않으면 401(로그인 필요)로 막는다.
*/

import { HttpError } from '../errors.js';

export function createRequireAdmin(sessions) {
  return function requireAdmin(req, res, next) {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!sessions.isValid(token)) {
      next(new HttpError(401, '로그인이 필요합니다.'));
      return;
    }

    req.adminToken = token;
    next();
  };
}
