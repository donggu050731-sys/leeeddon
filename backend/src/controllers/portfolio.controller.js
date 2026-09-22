/* ===== 컨트롤러 =====
   요청을 받아 서비스에 넘기고, 답을 { data: ... } 모양으로 돌려준다.
   여기에는 업무 규칙을 넣지 않는다 (그건 서비스가 한다).
*/

export function createPortfolioController(service) {
  return {
    async getPortfolio(req, res, next) {
      try {
        res.json({ data: await service.getPortfolio() });
      } catch (error) {
        next(error);
      }
    },

    async getProjects(req, res, next) {
      try {
        res.json({ data: await service.getProjects() });
      } catch (error) {
        next(error);
      }
    },

    async getProject(req, res, next) {
      try {
        res.json({ data: await service.getProject(req.params.id) });
      } catch (error) {
        next(error);
      }
    }
  };
}
