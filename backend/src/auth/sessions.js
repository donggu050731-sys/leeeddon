/* ===== 로그인 상태(세션) =====
   로그인에 성공하면 긴 임의 문자열(토큰)을 하나 발급한다.
   관리자 화면은 이후 요청마다 그 토큰을 함께 보내고, 서버는 토큰만 확인한다.
   → 비밀번호는 로그인할 때 한 번만 오가고, 그 뒤로는 오가지 않는다.

   토큰은 서버 메모리에만 둔다. 서버를 껐다 켜면 모두 사라져 다시 로그인해야 한다.
   화면 쪽도 토큰을 저장소에 남기지 않으므로, 창을 닫으면 그 즉시 로그인 상태가 사라진다.
*/

import { randomBytes } from 'node:crypto';

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30분 — 창을 닫지 않고 두더라도 오래 열려 있지 않도록

export function createSessionStore({ ttlMs = DEFAULT_TTL_MS } = {}) {
  const sessions = new Map(); // 토큰 → 만료 시각

  function prune() {
    const now = Date.now();
    for (const [token, expiresAt] of sessions) {
      if (expiresAt <= now) sessions.delete(token);
    }
  }

  return {
    issue() {
      prune();
      const token = randomBytes(32).toString('hex');
      sessions.set(token, Date.now() + ttlMs);
      return { token, expiresIn: ttlMs };
    },

    isValid(token) {
      if (!token) return false;
      const expiresAt = sessions.get(token);
      if (!expiresAt) return false;
      if (expiresAt <= Date.now()) {
        sessions.delete(token);
        return false;
      }
      return true;
    },

    revoke(token) {
      sessions.delete(token);
    }
  };
}
