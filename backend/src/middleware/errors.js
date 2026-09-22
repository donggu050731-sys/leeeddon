/* ===== 없는 주소 · 에러 처리 =====
   API 요청에는 JSON으로, 그 밖에는 짧은 글로 답한다.
*/

export function notFound(req, res, next) {
  if (!req.path.startsWith('/api')) {
    next();
    return;
  }
  res.status(404).json({ error: { status: 404, message: '없는 주소입니다: ' + req.path } });
}

export function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  const status = error.status || 500;

  if (status >= 500) console.error('[error]', error);

  res.status(status).json({
    error: {
      status,
      message: status >= 500 ? '서버에서 문제가 생겼습니다.' : error.message
    }
  });
}
