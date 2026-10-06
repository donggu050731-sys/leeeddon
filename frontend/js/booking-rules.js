/* ===== 방문 예약 규칙 (날짜 · 시간 · 이메일 검사) =====
   "어떤 날짜·시간을 고를 수 있는가"를 한곳에 모았다. 화면 그리는 코드는 여기에 묻기만 한다.
   숫자(시간 범위·예약 가능 기간)는 backend/data/visit.json 의 booking.rules 에 있다.

   ※ 서버의 backend/src/services/booking.service.js 와 같은 규칙이다. 한쪽을 고치면 다른 쪽도 고친다.

   날짜는 모두 'YYYY-MM-DD' 글자로 다룬다 (시간대 때문에 하루가 밀리는 일을 막기 위함).
*/

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parse(date) {
  return new Date(date + 'T00:00:00Z');
}

/** 한국 기준 오늘 날짜 */
export function todayString() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

export function addDays(date, days) {
  const value = parse(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** 요일 번호 (0 = 일요일 … 6 = 토요일) */
export function weekdayOf(date) {
  return parse(date).getUTCDay();
}

/**
 * 그 날짜를 고를 수 있는지 알려준다.
 * @returns {null|'past'|'far'|'weekend'|'holiday'} null 이면 고를 수 있다
 */
export function dateStatus(date, { today, maxDaysAhead, holidays }) {
  if (date <= today) return 'past';
  if (date > addDays(today, maxDaysAhead)) return 'far';
  const day = weekdayOf(date);
  if (day === 0 || day === 6) return 'weekend';
  if (holidays.some(item => item.date === date)) return 'holiday';
  return null;
}

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** 고를 수 있는 시간 목록. 예: 13:00, 13:30, … 18:00 */
export function timeSlots(rules) {
  const slots = [];
  for (let at = toMinutes(rules.start); at <= toMinutes(rules.end); at += rules.stepMinutes) {
    slots.push(String(Math.floor(at / 60)).padStart(2, '0') + ':' + String(at % 60).padStart(2, '0'));
  }
  return slots;
}

/** 이메일 모양(이름@주소.끝)인가 */
export function isEmail(value) {
  return EMAIL.test(String(value).trim());
}

/** 사람이 읽는 날짜. 예: 2026년 10월 12일 (월) */
export function formatDate(date, weekdays) {
  const [year, month, day] = date.split('-').map(Number);
  return year + '년 ' + month + '월 ' + day + '일 (' + weekdays[weekdayOf(date)] + ')';
}
