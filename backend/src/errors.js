/* ===== 에러 =====
   상태 코드를 함께 담아 던지는 에러. (예: 404 = 찾는 것이 없음, 409 = 이미 같은 것이 있음)
   details 에는 화면이 다음 행동을 고르는 데 필요한 정보를 담는다. (예: 중복된 프로젝트가 무엇인지)
*/

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    if (details) this.details = details;
  }
}
