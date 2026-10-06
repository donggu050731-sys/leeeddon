/* ===== 시작점: 찾아오는 길 페이지 (visit.html) =====
   ① 데이터를 가져오고 → ② 지도·주소를 그리고 → ③ 날씨를 받아 채운다.
   내용 자체는 backend/data/visit.json 에 있다. 이 파일에는 문장을 적지 않는다.
*/

import { loadPortfolio, loadVisit, loadWeather } from './api.js';
import { renderLogo, renderFooter } from './render/sections.js';
import { renderVisit, renderWeather, renderWeatherError } from './render/visit.js';
import { initNav } from './ui/nav.js';
import { observeFadeIn } from './ui/animations.js';
import { el, append } from './dom.js';

// 데이터를 못 불러왔을 때, 빈 화면 대신 이유를 보여준다
function showLoadError(error) {
  console.error('[visit] 데이터를 불러오지 못했습니다.', error);
  const box = el('div', 'load-error');
  append(
    box,
    el('h1', null, '내용을 불러오지 못했습니다'),
    el('p', null, '백엔드 서버(npm start)가 켜져 있는지, 또는 data 폴더의 JSON 파일이 있는지 확인해 주세요.'),
    el('p', 'load-error-detail', String(error && error.message ? error.message : error))
  );
  document.getElementById('visit').replaceChildren(box);
}

async function start() {
  let portfolio;
  let visit;
  try {
    [portfolio, visit] = await Promise.all([loadPortfolio(), loadVisit()]);
  } catch (error) {
    showLoadError(error);
    return;
  }

  renderLogo(document.getElementById('nav-logo'), portfolio.profile);
  renderFooter(document.getElementById('footer'), portfolio.profile);
  renderVisit(document.getElementById('visit'), visit);

  initNav();
  observeFadeIn();

  // 날씨는 외부 서비스에서 오므로, 실패해도 지도·주소는 그대로 보이게 따로 받는다
  const weatherBox = document.getElementById('visit-weather');
  try {
    renderWeather(weatherBox, visit.weather, await loadWeather(visit.place));
  } catch (error) {
    console.warn('[visit] 날씨를 불러오지 못했습니다.', error);
    renderWeatherError(weatherBox, visit.weather);
  }
}

start();
