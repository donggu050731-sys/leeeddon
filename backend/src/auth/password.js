/* ===== 비밀번호 =====
   비밀번호 자체는 어디에도 저장하지 않는다. scrypt 로 흩뜨린 값(해시)만 .env 에 둔다.
   해시에서 원래 비밀번호를 되돌릴 수 없으므로, 파일이 유출돼도 비밀번호는 알 수 없다.
   비교할 때는 timingSafeEqual 을 써서 "몇 글자까지 맞았는지"가 시간으로 새어나가지 않게 한다.
*/

import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

/** 비밀번호 → 저장용 문자열 (scrypt:소금:해시) */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return 'scrypt:' + salt + ':' + key;
}

/** 입력한 비밀번호가 저장된 해시와 맞는지 */
export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;

  const [scheme, salt, key] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !key) return false;

  const expected = Buffer.from(key, 'hex');
  const candidate = scryptSync(password, salt, expected.length);

  return timingSafeEqual(candidate, expected);
}
