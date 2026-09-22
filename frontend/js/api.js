/* ===== 데이터 가져오기 (프론트엔드 ↔ 백엔드 연결 지점) =====
   화면 코드는 데이터가 어디서 왔는지 몰라도 되도록, 통신은 전부 이 파일에서만 한다.

   순서: ① 백엔드 API 에 물어본다  →  ② 실패하면 정적 JSON 파일을 읽는다
   나중에 DB·외부 API 로 바뀌어도 백엔드만 고치면 되고, 이 파일은 그대로 둔다.
*/

const config = window.PORTFOLIO_CONFIG || {};
const API_BASE = String(config.apiBase || '').replace(/\/$/, '');
const STATIC_PATH = String(config.staticDataPath || 'data').replace(/\/$/, '');
const USE_API = config.useApi !== false;

// 화면이 필요로 하는 데이터 묶음 (JSON 파일 이름과 같다)
const SECTIONS = ['profile', 'projects', 'hometown', 'journey'];

async function readJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(url + ' 응답 오류 (' + response.status + ')');
  return response.json();
}

// 백엔드는 { data: ... } 형태로 답한다. 껍데기를 벗겨서 알맹이만 돌려준다.
function unwrap(body) {
  return body && typeof body === 'object' && 'data' in body ? body.data : body;
}

async function loadFromApi() {
  return unwrap(await readJson(API_BASE + '/api/portfolio'));
}

async function loadFromStaticFiles() {
  const parts = await Promise.all(
    SECTIONS.map(name => readJson(STATIC_PATH + '/' + name + '.json'))
  );
  const result = {};
  SECTIONS.forEach((name, index) => { result[name] = parts[index]; });
  return result;
}

/**
 * 포트폴리오 전체 데이터를 가져온다.
 * @returns {Promise<{profile: object, projects: object, hometown: object, journey: object}>}
 */
export async function loadPortfolio() {
  if (USE_API) {
    try {
      return await loadFromApi();
    } catch (error) {
      console.warn('[api] 백엔드에 연결하지 못해 JSON 파일로 대체합니다.', error);
    }
  }
  return loadFromStaticFiles();
}
