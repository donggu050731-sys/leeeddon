/* ===== /data/*.json =====
   화면이 API에 연결하지 못했을 때 읽는 예비 경로.
   파일을 그대로 내보내면 초안(draft)까지 보이므로, 반드시 서비스를 거쳐 걸러서 내보낸다.
*/

import { Router } from 'express';
import { createPortfolioService } from '../services/portfolio.service.js';

export function createDataRouter(repository) {
  const router = Router();
  const service = createPortfolioService(repository);

  const send = (load) => async (req, res, next) => {
    try {
      res.json(await load());
    } catch (error) {
      next(error);
    }
  };

  router.get('/profile.json', send(() => repository.getProfile()));
  router.get('/projects.json', send(() => service.getProjects()));   // 공개된 것만
  router.get('/hometown.json', send(() => repository.getHometown()));
  router.get('/journey.json', send(() => repository.getJourney()));
  router.get('/visit.json', send(() => repository.getVisit()));
  router.get('/holidays.json', send(() => repository.getHolidays()));

  return router;
}
