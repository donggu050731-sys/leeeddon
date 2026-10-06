/* ===== 시작점: 방문 예약 페이지 (booking.html) =====
   '찾아오는 길'의 [방문 예약하기] 버튼을 누르면 오는 페이지.
   지금은 틀(제목)만 있다. 예약 내용은 정해진 뒤 채운다.
   문구는 backend/data/visit.json 의 booking 에 있다. 이 파일에는 문장을 적지 않는다.
*/

import { loadPortfolio, loadVisit } from './api.js';
import { renderLogo, renderFooter } from './render/sections.js';
import { renderBooking } from './render/visit.js';
import { initNav } from './ui/nav.js';
import { observeFadeIn } from './ui/animations.js';

async function start() {
  const [portfolio, visit] = await Promise.all([loadPortfolio(), loadVisit()]);

  renderLogo(document.getElementById('nav-logo'), portfolio.profile);
  renderFooter(document.getElementById('footer'), portfolio.profile);
  renderBooking(document.getElementById('booking'), visit.booking);

  initNav();
  observeFadeIn();
}

start().catch(error => console.error('[booking] 데이터를 불러오지 못했습니다.', error));
