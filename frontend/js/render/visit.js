/* ===== 찾아오는 길 그리기 (지도 · 주소 · 날씨 · 출처) =====
   내용은 backend/data/visit.json 에서 온다.
   지도는 OpenStreetMap 의 끼워 넣기(embed) 화면을 쓴다. 열쇠(API 키)가 필요 없다.
*/

import { el, append, sectionHeader } from '../dom.js';

const OSM = 'https://www.openstreetmap.org';

/** 좌표를 가운데 두고 span 만큼 위아래·좌우로 벌린 지도 주소 */
function mapEmbedUrl(place, span) {
  const bbox = [
    place.lon - span.lon, place.lat - span.lat,
    place.lon + span.lon, place.lat + span.lat
  ].join(',');
  const params = new URLSearchParams({ bbox, layer: 'mapnik', marker: place.lat + ',' + place.lon });
  return OSM + '/export/embed.html?' + params;
}

function mapLinkUrl(place) {
  return OSM + '/?mlat=' + place.lat + '&mlon=' + place.lon + '#map=17/' + place.lat + '/' + place.lon;
}

function externalLink(className, text, href) {
  const link = el('a', className, text);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function mapCard(visit) {
  const card = el('div', 'visit-card visit-map fade-in');

  const frame = el('iframe', 'visit-map-frame');
  frame.src = mapEmbedUrl(visit.place, visit.map.span);
  frame.title = visit.place.name + ' ' + visit.map.title;
  frame.loading = 'lazy';

  append(card, frame, externalLink('visit-map-link', visit.map.linkText + ' ↗', mapLinkUrl(visit.place)));
  return card;
}

function addressCard(visit) {
  const card = el('div', 'visit-card fade-in');
  append(
    card,
    el('p', 'visit-card-title', visit.address.title),
    el('p', 'visit-place-name', visit.place.name),
    el('address', 'visit-address', visit.place.address)
  );
  return card;
}

function weatherCard(visit) {
  const card = el('div', 'visit-card fade-in');
  const body = el('div', 'visit-weather');
  body.id = 'visit-weather';
  body.setAttribute('aria-live', 'polite');
  body.appendChild(el('p', 'visit-weather-note', visit.weather.loading));

  append(card, el('p', 'visit-card-title', visit.weather.title), body);
  return card;
}

function sourceLine(sources) {
  const line = el('p', 'visit-sources fade-in');
  line.appendChild(document.createTextNode(sources.prefix + ': '));
  sources.items.forEach((item, index) => {
    if (index > 0) line.appendChild(document.createTextNode(' · '));
    line.appendChild(document.createTextNode(item.label + ' '));
    line.appendChild(externalLink(null, item.name, item.href));
  });
  return line;
}

/** 정보 아래의 '방문 예약하기' 버튼 — 예약 페이지로 이동한다 */
function bookingButton(booking) {
  const wrap = el('div', 'visit-booking fade-in');
  const button = el('a', 'hero-cta', booking.buttonText);
  button.href = booking.href;
  button.appendChild(el('span', 'arrow', '→'));
  wrap.appendChild(button);
  return wrap;
}

/** 페이지 전체 (날씨 칸은 '불러오는 중' 상태로 먼저 그린다) */
export function renderVisit(section, visit) {
  const grid = el('div', 'visit-grid');
  const side = el('div', 'visit-side');
  append(side, addressCard(visit), weatherCard(visit));
  append(grid, mapCard(visit), side);

  section.replaceChildren(
    sectionHeader(visit.label, visit.title, visit.desc),
    grid,
    sourceLine(visit.sources),
    bookingButton(visit.booking)
  );
}

function weatherStat(label, value, unit) {
  const stat = el('div', 'visit-stat');
  const number = el('p', 'visit-stat-value', String(value));
  number.appendChild(el('span', 'visit-stat-unit', unit));
  append(stat, el('p', 'visit-stat-label', label), number);
  return stat;
}

/**
 * 날씨 칸을 채운다.
 * @param {HTMLElement} box
 * @param {object} labels visit.json 의 weather
 * @param {{temperature: number, temperatureUnit: string, humidity: number, humidityUnit: string, time: string}} weather
 */
export function renderWeather(box, labels, weather) {
  const stats = el('div', 'visit-stats');
  append(
    stats,
    weatherStat(labels.temperatureLabel, weather.temperature, weather.temperatureUnit),
    weatherStat(labels.humidityLabel, weather.humidity, weather.humidityUnit)
  );
  box.replaceChildren(stats, el('p', 'visit-weather-note', labels.timePrefix + ' ' + weather.time));
}

/** 날씨를 못 받았을 때 */
export function renderWeatherError(box, labels) {
  box.replaceChildren(el('p', 'visit-weather-note', labels.error));
}
