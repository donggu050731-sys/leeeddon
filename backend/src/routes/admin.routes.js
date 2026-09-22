/* ===== 관리자 주소(라우트) =====
   POST   /api/admin/login              로그인 (비밀번호 → 토큰)
   POST   /api/admin/logout             로그아웃
   GET    /api/admin/session            로그인 상태 확인
   GET    /api/admin/projects           프로젝트 전체 (초안 포함)
   POST   /api/admin/projects           새 프로젝트 저장 (?force=1 이면 중복 허용)
   PUT    /api/admin/projects/:id       프로젝트 수정
   POST   /api/admin/projects/:id/merge 중복된 프로젝트에 내용 합치기
   PATCH  /api/admin/projects/:id/status 공개 ↔ 초안 전환
   DELETE /api/admin/projects/:id       프로젝트 삭제

   로그인 말고는 전부 requireAdmin 을 지나야 한다.
*/

import { Router } from 'express';
import { createAdminController } from '../controllers/admin.controller.js';
import { createAdminService } from '../services/admin.service.js';
import { createRequireAdmin } from '../middleware/auth.js';
import { createLoginLimiter } from '../auth/login-limiter.js';

export function createAdminRouter({ repository, sessions, passwordHash }) {
  const router = Router();
  const controller = createAdminController({
    service: createAdminService(repository),
    sessions,
    limiter: createLoginLimiter(),
    passwordHash
  });
  const requireAdmin = createRequireAdmin(sessions);

  router.post('/login', controller.login);
  router.post('/logout', requireAdmin, controller.logout);
  router.get('/session', requireAdmin, controller.session);

  router.get('/projects', requireAdmin, controller.list);
  router.post('/projects', requireAdmin, controller.create);
  router.put('/projects/:id', requireAdmin, controller.update);
  router.post('/projects/:id/merge', requireAdmin, controller.merge);
  router.patch('/projects/:id/status', requireAdmin, controller.setStatus);
  router.delete('/projects/:id', requireAdmin, controller.remove);

  return router;
}
