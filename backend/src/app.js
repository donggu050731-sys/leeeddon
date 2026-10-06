/* ===== 서버 조립 =====
   - /api/admin/... → 관리자 전용 (로그인 필요)
   - /api/...       → 공개 데이터 API (+ 방문 예약 접수: POST /api/bookings)
   - /data/...      → 공개 데이터 JSON (프론트엔드의 예비 경로, 초안은 빠진다)
   - 그 밖           → frontend 폴더의 화면 파일 (개발 중 한 서버에서 같이 보기 위함)

   실제 배포에서는 화면(GitHub Pages)과 API(서버)가 따로 떨어져 있어도 된다.
*/

import express from 'express';
import { createPortfolioRouter } from './routes/portfolio.routes.js';
import { createAdminRouter } from './routes/admin.routes.js';
import { createDataRouter } from './routes/data.routes.js';
import { createBookingRouter } from './routes/booking.routes.js';
import { cors } from './middleware/cors.js';
import { notFound, errorHandler } from './middleware/errors.js';

export function createApp({ repository, sessions, passwordHash, frontendDir }) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(express.json({ limit: '256kb' }));
  app.use(cors);

  app.use('/api/admin', createAdminRouter({ repository, sessions, passwordHash }));
  app.use('/api', createBookingRouter(repository));
  app.use('/api', createPortfolioRouter(repository));

  app.use('/data', createDataRouter(repository));
  if (frontendDir) app.use(express.static(frontendDir));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
