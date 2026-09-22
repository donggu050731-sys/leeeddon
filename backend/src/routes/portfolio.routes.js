/* ===== 주소(라우트) =====
   GET /api/health           서버가 살아 있는지 확인
   GET /api/portfolio        전체 내용 (화면이 쓰는 주소)
   GET /api/projects         프로젝트 목록
   GET /api/projects/:id     프로젝트 1건
*/

import { Router } from 'express';
import { createPortfolioController } from '../controllers/portfolio.controller.js';
import { createPortfolioService } from '../services/portfolio.service.js';

export function createPortfolioRouter(repository) {
  const router = Router();
  const controller = createPortfolioController(createPortfolioService(repository));

  router.get('/health', (req, res) => {
    res.json({ data: { status: 'ok', storage: repository.name } });
  });

  router.get('/portfolio', controller.getPortfolio);
  router.get('/projects', controller.getProjects);
  router.get('/projects/:id', controller.getProject);

  return router;
}
