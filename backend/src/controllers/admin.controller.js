/* ===== 관리자 컨트롤러 =====
   로그인과 프로젝트 저장/수정/삭제 요청을 받는다.
   비밀번호는 로그인 요청의 본문으로만 들어오고, 응답이나 로그에 절대 담지 않는다.
*/

import { HttpError } from '../errors.js';
import { verifyPassword } from '../auth/password.js';

export function createAdminController({ service, bookings, sessions, limiter, passwordHash }) {
  function ensureConfigured() {
    if (!passwordHash) {
      throw new HttpError(
        503,
        '관리자 비밀번호가 설정되지 않았습니다. 터미널에서 npm run set-password 를 먼저 실행해 주세요.'
      );
    }
  }

  return {
    login(req, res, next) {
      try {
        ensureConfigured();

        const who = req.ip || 'unknown';
        const locked = limiter.lockedMinutes(who);
        if (locked > 0) {
          throw new HttpError(429, '로그인 시도가 너무 많습니다. ' + locked + '분 뒤에 다시 시도해 주세요.');
        }

        const password = typeof req.body?.password === 'string' ? req.body.password : '';

        if (!verifyPassword(password, passwordHash)) {
          const left = limiter.fail(who);
          throw new HttpError(401, '비밀번호가 맞지 않습니다. (남은 시도 ' + left + '회)');
        }

        limiter.succeed(who);
        res.json({ data: sessions.issue() });
      } catch (error) {
        next(error);
      }
    },

    logout(req, res) {
      sessions.revoke(req.adminToken);
      res.json({ data: { ok: true } });
    },

    session(req, res) {
      res.json({ data: { ok: true } });
    },

    async list(req, res, next) {
      try {
        res.json({ data: await service.listProjects() });
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        // ?force=1 이면 중복이어도 따로 저장한다
        const force = req.query.force === '1';
        res.status(201).json({ data: await service.createProject(req.body || {}, { force }) });
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        res.json({ data: await service.updateProject(req.params.id, req.body || {}) });
      } catch (error) {
        next(error);
      }
    },

    async merge(req, res, next) {
      try {
        res.json({ data: await service.mergeIntoProject(req.params.id, req.body || {}) });
      } catch (error) {
        next(error);
      }
    },

    async setStatus(req, res, next) {
      try {
        res.json({ data: await service.setStatus(req.params.id, req.body?.status) });
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      try {
        await service.deleteProject(req.params.id);
        res.json({ data: { ok: true } });
      } catch (error) {
        next(error);
      }
    },

    async listBookings(req, res, next) {
      try {
        res.json({ data: await bookings.list() });
      } catch (error) {
        next(error);
      }
    },

    async setBookingStatus(req, res, next) {
      try {
        res.json({ data: await bookings.setStatus(req.params.id, req.body?.status) });
      } catch (error) {
        next(error);
      }
    }
  };
}
