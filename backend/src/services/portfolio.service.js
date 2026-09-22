/* ===== 서비스 =====
   "무엇을 돌려줄지"를 정하는 곳. 저장소(JSON·DB)가 무엇이든 여기 코드는 그대로다.
   나중에 정렬·필터·비공개 항목 제외 같은 규칙이 생기면 여기에 넣는다.
*/

import { HttpError } from '../errors.js';

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

      return { profile, projects, hometown, journey };
    },

    getProjects() {
      return repository.getProjects();
    },

    async getProject(id) {
      const project = await repository.getProjectById(id);
      if (!project) throw new HttpError(404, '그런 프로젝트가 없습니다: ' + id);
      return project;
    }
  };
}
