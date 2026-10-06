/* ===== 서비스 (공개용) =====
   "무엇을 돌려줄지"를 정하는 곳. 저장소(JSON·DB)가 무엇이든 여기 코드는 그대로다.

   ★ 공개 사이트에는 status 가 'published' 인 프로젝트만 나간다.
     초안(draft)은 관리자 화면에서만 보인다. 거르는 일은 반드시 여기서 한다.
*/

import { HttpError } from '../errors.js';

/** status 가 없던 예전 자료는 공개로 본다 */
function isPublished(project) {
  return (project.status || 'published') === 'published';
}

function publicProjects(projects) {
  return { ...projects, items: projects.items.filter(isPublished) };
}

export function createPortfolioService(repository) {
  return {
    /** 화면이 한 번에 받아가는 전체 묶음 */
    async getPortfolio() {
      const [profile, projects, hometown, journey] = await Promise.all([
        repository.getProfile(),
        repository.getProjects(),
        repository.getHometown(),
        repository.getJourney()
      ]);

      return { profile, projects: publicProjects(projects), hometown, journey };
    },

    /** '찾아오는 길' 페이지 내용 */
    getVisit() {
      return repository.getVisit();
    },

    async getProjects() {
      return publicProjects(await repository.getProjects());
    },

    async getProject(id) {
      const project = await repository.getProjectById(id);
      if (!project || !isPublished(project)) {
        throw new HttpError(404, '그런 프로젝트가 없습니다: ' + id);
      }
      return project;
    }
  };
}
