/* ===== 관리자 화면 ↔ 백엔드 통신 =====
   비밀번호는 로그인할 때 한 번만 보내고, 그 뒤에는 서버가 준 토큰만 주고받는다.

   ★ 토큰은 이 파일 안의 변수에만 담는다 (메모리).
     브라우저 저장소(sessionStorage·localStorage·쿠키)에 남기지 않으므로
     새로고침하거나 창을 닫으면 곧바로 사라지고, 매번 비밀번호를 다시 입력해야 한다.
*/

const config = window.PORTFOLIO_CONFIG || {};
const API_BASE = String(config.apiBase || '').replace(/\/$/, '');
const OLD_TOKEN_KEY = 'portfolio-admin-token';   // 예전 버전이 저장소에 남겨둔 값

let token = '';   // 창을 닫으면 함께 사라진다

/** 예전 버전이 브라우저에 남겨둔 토큰이 있으면 지운다 */
export function clearStoredTokens() {
  [window.sessionStorage, window.localStorage].forEach(store => {
    try {
      store.removeItem(OLD_TOKEN_KEY);
    } catch (error) {
      /* 저장소를 못 쓰는 환경이면 지울 것도 없다 */
    }
  });
}

export function isLoggedIn() {
  return Boolean(token);
}

async function request(method, path, body, { auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = 'Bearer ' + token;

  const response = await fetch(API_BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error?.message || '요청에 실패했습니다. (' + response.status + ')';
    const failure = new Error(message);
    failure.status = response.status;
    failure.details = payload?.error?.details || null;   // 예: 중복된 프로젝트 정보
    throw failure;
  }

  return payload?.data;
}

export async function login(password) {
  const data = await request('POST', '/api/admin/login', { password }, { auth: false });
  token = data.token;
  return data;
}

export async function logout() {
  try {
    await request('POST', '/api/admin/logout');
  } catch (error) {
    /* 이미 만료됐어도 아래에서 토큰을 버린다 */
  }
  token = '';
}

/**
 * 창을 닫거나 다른 곳으로 이동할 때 서버 쪽 로그인도 즉시 끊는다.
 * keepalive 를 주면 페이지가 사라지는 중에도 요청이 끝까지 전달된다.
 */
export function revokeOnLeave() {
  if (!token) return;

  try {
    fetch(API_BASE + '/api/admin/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      keepalive: true
    });
  } catch (error) {
    /* 못 보내도 서버의 토큰은 짧은 시간 뒤 스스로 만료된다 */
  }

  token = '';
}

export function listProjects() {
  return request('GET', '/api/admin/projects');
}

/** force 를 주면 같은 제목이 있어도 그냥 따로 저장한다 */
export function createProject(project, { force = false } = {}) {
  return request('POST', '/api/admin/projects' + (force ? '?force=1' : ''), project);
}

/** 지금 입력한 내용을 기존 프로젝트에 합친다 */
export function mergeProject(id, project) {
  return request('POST', '/api/admin/projects/' + encodeURIComponent(id) + '/merge', project);
}

export function updateProject(id, project) {
  return request('PUT', '/api/admin/projects/' + encodeURIComponent(id), project);
}

export function setStatus(id, status) {
  return request('PATCH', '/api/admin/projects/' + encodeURIComponent(id) + '/status', { status });
}

export function deleteProject(id) {
  return request('DELETE', '/api/admin/projects/' + encodeURIComponent(id));
}
