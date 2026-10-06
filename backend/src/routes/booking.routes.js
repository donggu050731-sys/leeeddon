/* ===== 주소(라우트): 방문 예약 =====
   GET  /api/holidays    공휴일 목록 (캘린더에서 막을 날짜)
   GET  /api/bookings/taken  이미 예약된 날짜·시간 (예약 페이지에서 고르지 못하게 막을 시간)
   POST /api/bookings    예약 1건 접수 → backend/storage/bookings.json 에 저장

   예약은 로그인 없이 누구나 보낼 수 있으므로, 같은 곳에서 너무 자주 보내면 잠시 막는다.
*/

import { Router } from 'express';
import { createBookingService } from '../services/booking.service.js';
import { HttpError } from '../errors.js';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export function createBookingRouter(repository) {
  const router = Router();
  const service = createBookingService(repository);
  const recent = new Map(); // 보낸 곳(IP) → 최근에 보낸 시각들

  function tooMany(who) {
    const now = Date.now();
    const times = (recent.get(who) || []).filter(time => now - time < WINDOW_MS);
    if (times.length >= MAX_PER_WINDOW) {
      recent.set(who, times);
      return true;
    }
    times.push(now);
    recent.set(who, times);
    return false;
  }

  router.get('/holidays', async (req, res, next) => {
    try {
      res.json({ data: await service.getHolidays() });
    } catch (error) {
      next(error);
    }
  });

  router.get('/bookings/taken', async (req, res, next) => {
    try {
      res.json({ data: await service.getTakenSlots() });
    } catch (error) {
      next(error);
    }
  });

  router.post('/bookings', async (req, res, next) => {
    try {
      if (tooMany(req.ip || 'unknown')) {
        throw new HttpError(429, '예약 요청이 너무 많습니다. 잠시 뒤에 다시 시도해 주세요.');
      }
      res.status(201).json({ data: await service.create(req.body) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
