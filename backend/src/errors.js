/* ===== 에러 =====
   상태 코드를 함께 담아 던지는 에러. (예: 404 = 찾는 것이 없음)
*/

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
