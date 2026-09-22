/* ===== 로그인 시도 제한 =====
   비밀번호를 마구 넣어보는 시도를 막는다.
   같은 접속지에서 연속 5번 틀리면 15분 동안 잠근다. (성공하면 기록을 지운다)
   → 네 자리 숫자(1만 가지)를 모두 넣어보려면 20일 넘게 걸리므로 대입 시도가 사실상 어렵다.
*/

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export function createLoginLimiter({ maxAttempts = MAX_ATTEMPTS, lockMs = LOCK_MS } = {}) {
  const attempts = new Map(); // 접속지 → { count, lockedUntil }

  return {
    /** 잠겨 있으면 남은 시간(분), 아니면 0 */
    lockedMinutes(key) {
      const record = attempts.get(key);
      if (!record || !record.lockedUntil) return 0;
      const remain = record.lockedUntil - Date.now();
      if (remain <= 0) {
        attempts.delete(key);
        return 0;
      }
      return Math.ceil(remain / 60000);
    },

    fail(key) {
      const record = attempts.get(key) || { count: 0, lockedUntil: 0 };
      record.count += 1;
      if (record.count >= maxAttempts) record.lockedUntil = Date.now() + lockMs;
      attempts.set(key, record);
      return Math.max(0, maxAttempts - record.count);
    },

    succeed(key) {
      attempts.delete(key);
    }
  };
}
