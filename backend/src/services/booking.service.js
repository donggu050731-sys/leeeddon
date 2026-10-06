/* ===== 방문 예약 서비스 =====
   예약 페이지(booking.html)에서 들어온 값을 검사하고 저장한다.
   화면에서도 같은 검사를 하지만, 화면 검사는 얼마든지 건너뛸 수 있으므로
   '진짜 검사'는 반드시 여기(서버)에서 한다.

   규칙 (숫자는 backend/data/visit.json 의 booking.rules 에서 읽는다)
     - 날짜 : 내일부터 maxDaysAhead 일 이내의 평일. 공휴일(holidays.json)은 안 된다
     - 시간 : start ~ end 사이, stepMinutes 분 단위
     - 이름 · 이메일 · 방문 목적 · 동의 : 모두 필수

   ※ 화면의 frontend/js/booking-rules.js 와 같은 규칙이다. 한쪽을 고치면 다른 쪽도 고친다.
*/

import { randomUUID } from 'node:crypto';
import { HttpError } from '../errors.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

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

      await repository.addBooking(booking);

      // 저장한 내용을 그대로 돌려주지 않는다 (접수 번호와 시각만)
      return { id: booking.id, createdAt: booking.createdAt };
    }
  };
}
