/* ===== 서버 조립 =====
   - /api/...  → 포트폴리오 데이터 API
   - /data/... → JSON 파일 그대로 (프론트엔드의 예비 경로)
   - 그 밖      → frontend 폴더의 화면 파일 (개발 중 한 서버에서 같이 보기 위함)

   실제 배포에서는 화면(GitHub Pages)과 API(서버)가 따로 떨어져 있어도 된다.
*/

import express from 'express';
import { createPortfolioRouter } from './routes/portfolio.routes.js';
import { cors } from './middleware/cors.js';
import { notFound, errorHandler } from './middleware/errors.js';

export function createApp({ repository, frontendDir, dataDir }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(cors);

  app.use('/api', createPortfolioRouter(repository));

  if (dataDir) app.use('/data', express.static(dataDir));
  if (frontendDir) app.use(express.static(frontendDir));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
