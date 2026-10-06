/* ===== 방문 예약 서비스 =====
   예약 페이지(booking.html)에서 들어온 값을 검사하고 저장한다.
   화면에서도 같은 검사를 하지만, 화면 검사는 얼마든지 건너뛸 수 있으므로
   '진짜 검사'는 반드시 여기(서버)에서 한다.

   규칙 (숫자는 backend/data/visit.json 의 booking.rules 에서 읽는다)
     - 날짜 : 내일부터 maxDaysAhead 일 이내의 평일. 공휴일(holidays.json)은 안 된다
     - 시간 : start ~ end 사이, stepMinutes 분 단위
     - 이름 · 이메일 · 방문 목적 · 동의 : 모두 필수

   ※ 화면의 frontend/js/booking-rules.js 와 같은 규칙이다. 한쪽을 고치면 다른 쪽도 고친다.

   예약 번호(no)
     - '신청자(이름·이메일) + 방문 희망 시간(날짜·시간)' 한 묶음마다 번호 하나를 붙인다 (1, 2, 3 …).
     - 같은 사람이 다른 시간에 신청하면 새 번호, 같은 사람이 같은 시간에 또 보내면 기존 번호 그대로다.

   시간 겹침 막기
     - 한 날짜·시간에는 예약이 하나만 들어간다. 이미 예약이 있는 시간으로는 새 예약을 받지 않는다 (409).
     - '취소'된 예약은 자리를 차지하지 않는다. 접수 · 확정 · 변경 요청은 모두 자리를 차지한다.
     - 검사와 저장은 updateBookings() 안에서 한 번에 한다. 그래서 두 사람이 같은 시간을
       동시에 보내도 먼저 도착한 한 건만 저장되고, 나머지는 거절된다.

   처리 상태(status) — 관리자 화면의 '예약하기 관리'에서 바꾼다
     requested 접수 · confirmed 확정 · change-requested 변경 요청 · cancelled 취소
*/

import { randomUUID } from 'node:crypto';
import { HttpError } from '../errors.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ['requested', 'confirmed', 'change-requested', 'cancelled'];

/** 같은 예약인지 가리는 기준: 이름 + 이메일 + 날짜 + 시간 (띄어쓰기·대소문자는 무시) */
function bookingKey(booking) {
  const person = (booking.name + '|' + booking.email).toLowerCase().replace(/\s+/g, '');
  return person + '|' + booking.date + '|' + booking.time;
}

/** 한국 기준 오늘 날짜 (YYYY-MM-DD) */
function todayInSeoul() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

function addDays(date, days) {
  const value = new Date(date + 'T00:00:00Z');
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function isWeekend(date) {
  const day = new Date(date + 'T00:00:00Z').getUTCDay();
  return day === 0 || day === 6;
}

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeSlots(rules) {
  const slots = [];
  for (let at = toMinutes(rules.start); at <= toMinutes(rules.end); at += rules.stepMinutes) {
    slots.push(String(Math.floor(at / 60)).padStart(2, '0') + ':' + String(at % 60).padStart(2, '0'));
  }
  return slots;
}

/** 자리를 차지하는 예약인가 (취소된 예약은 자리를 내준다) */
function isActive(booking) {
  return booking.status !== 'cancelled';
}

/** 그 날짜·시간을 이미 차지한 다른 예약 (없으면 undefined) */
function findTaker(list, booking) {
  return list.find(item =>
    item.id !== booking.id && isActive(item) && item.date === booking.date && item.time === booking.time
  );
}

const SLOT_TAKEN = '이미 예약된 시간입니다. 다른 시간을 골라 주세요.';

/** 번호가 없는 예약(번호를 붙이기 전에 들어온 것)에 접수된 순서대로 번호를 붙인다. 붙였으면 true */
function numberMissing(list) {
  const missing = list.filter(item => !item.no).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let next = list.reduce((max, item) => Math.max(max, item.no || 0), 0);
  missing.forEach(item => { item.no = next += 1; });
  return missing.length > 0;
}

function text(value, label, max) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) throw new HttpError(400, label + ' 칸을 채워 주세요.');
  if (trimmed.length > max) throw new HttpError(400, label + ' 은(는) ' + max + '자까지 넣을 수 있습니다.');
  return trimmed;
}

export function createBookingService(repository) {
  return {
    /** 공휴일 목록 (캘린더가 쓴다) */
    getHolidays() {
      return repository.getHolidays();
    },

    /** 이미 예약된 날짜·시간 목록. 누가 예약했는지는 담지 않는다 (예약 페이지가 쓴다) */
    async getTakenSlots() {
      const list = await repository.getBookings();
      return list.filter(isActive).map(({ date, time }) => ({ date, time }));
    },

    /** 예약 1건을 검사하고 저장한다 */
    async create(input) {
      const [visit, holidays] = await Promise.all([repository.getVisit(), repository.getHolidays()]);
      const { rules, fields } = visit.booking;
      const body = input && typeof input === 'object' ? input : {};

      const date = typeof body.date === 'string' ? body.date : '';
      const today = todayInSeoul();
      if (!DATE.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z'))) {
        throw new HttpError(400, '날짜를 선택해 주세요.');
      }
      if (date <= today || date > addDays(today, rules.maxDaysAhead)) {
        throw new HttpError(400, '예약할 수 없는 날짜입니다.');
      }
      if (isWeekend(date) || holidays.items.some(item => item.date === date)) {
        throw new HttpError(400, '주말과 공휴일은 예약할 수 없습니다.');
      }

      if (!timeSlots(rules).includes(body.time)) {
        throw new HttpError(400, '희망 시간을 선택해 주세요.');
      }

      const email = text(body.email, fields.email.label, fields.email.max);
      if (!EMAIL.test(email)) throw new HttpError(400, fields.email.error);

      if (body.consent !== true) {
        throw new HttpError(400, '정보 전달에 동의해야 예약할 수 있습니다.');
      }

      const booking = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'requested',
        date,
        time: body.time,
        name: text(body.name, fields.name.label, fields.name.max),
        email,
        purpose: text(body.purpose, fields.purpose.label, fields.purpose.max),
        consent: true
      };

      const saved = await repository.updateBookings(list => {
        numberMissing(list);

        // 같은 사람이 같은 시간으로 또 보낸 것 → 새로 만들지 않고 기존 예약을 돌려준다
        const same = list.find(item => isActive(item) && bookingKey(item) === bookingKey(booking));
        if (same) return same;

        // 다른 사람이 이미 차지한 시간 → 받지 않는다
        if (findTaker(list, booking)) throw new HttpError(409, SLOT_TAKEN);

        list.push(booking);
        numberMissing(list);
        return booking;
      });

      // 저장한 내용을 그대로 돌려주지 않는다 (예약 번호와 접수 시각만)
      return { id: saved.id, no: saved.no, createdAt: saved.createdAt };
    },

    /** [관리자] 예약 전체 — 최근에 들어온 것이 위로 */
    async list() {
      let list = await repository.getBookings();
      if (list.some(item => !item.no)) {
        list = await repository.updateBookings(stored => {
          numberMissing(stored);
          return stored;
        });
      }
      return [...list].sort((a, b) => (b.no || 0) - (a.no || 0));
    },

    /** [관리자] 처리 상태 바꾸기 */
    async setStatus(id, status) {
      if (!STATUSES.includes(status)) {
        throw new HttpError(400, '처리 상태는 접수 · 확정 · 변경 요청 · 취소 중 하나여야 합니다.');
      }

      return repository.updateBookings(list => {
        const booking = list.find(item => item.id === id);
        if (!booking) throw new HttpError(404, '그런 예약이 없습니다: ' + id);

        // 취소했던 예약을 되살릴 때, 그 사이 다른 예약이 같은 시간을 차지했으면 막는다
        if (status !== 'cancelled') {
          const taker = findTaker(list, booking);
          if (taker) {
            throw new HttpError(409, '같은 날짜·시간에 다른 예약(예약 번호 ' + taker.no + ')이 있어 되살릴 수 없습니다.');
          }
        }

        booking.status = status;
        booking.updatedAt = new Date().toISOString();
        return booking;
      });
    }
  };
}
