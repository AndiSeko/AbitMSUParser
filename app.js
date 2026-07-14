async function loadData() {
  const metaEl = document.getElementById('meta');
  const badgesEl = document.getElementById('badges');
  const specsEl = document.getElementById('specialties');

  try {
    const res = await fetch('data.json?_=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    renderMeta(data, metaEl, badgesEl);
    renderSpecialties(data, specsEl);
  } catch (e) {
    specsEl.innerHTML = '<div class="error">Не удалось загрузить данные. <br><small>' + e.message + '</small></div>';
  }
}

function renderMeta(data, metaEl, badgesEl) {
  metaEl.textContent = 'Данные на: ' + data.last_updated + ' (обновлено: ' + data.fetched_at + ')';
  badgesEl.innerHTML = '';
  var badges = [data.education_form, data.education_type, data.funding].filter(Boolean);
  badges.forEach(function(b) {
    var el = document.createElement('span');
    el.className = 'badge';
    el.textContent = b;
    badgesEl.appendChild(el);
  });
}

function renderSpecialties(data, specsEl) {
  if (!data.specialties || data.specialties.length === 0) {
    specsEl.innerHTML = '<div class="error">Нет данных по специальности "Программная инженерия"</div>';
    return;
  }

  specsEl.innerHTML = '';
  data.specialties.forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'card';

    var title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = s.name;
    card.appendChild(title);

    var fac = document.createElement('div');
    fac.className = 'card-faculty';
    fac.textContent = s.faculty;
    card.appendChild(fac);

    card.appendChild(renderStats(s));
    card.appendChild(renderBreakdown(s));
    card.appendChild(renderScores(s));

    specsEl.appendChild(card);
  });
}

function renderStats(s) {
  var row = document.createElement('div');
  row.className = 'stats-row';

  row.appendChild(statBox(s.plan, 'План приёма'));
  row.appendChild(statBox(s.total_applications, 'Подано заявлений'));
  row.appendChild(statBox(s.competition, 'Конкурс (чел/место)'));

  return row;
}

function statBox(value, label) {
  var box = document.createElement('div');
  box.className = 'stat-box';

  var val = document.createElement('div');
  val.className = 'stat-value';
  val.textContent = typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value;
  box.appendChild(val);

  var lbl = document.createElement('div');
  lbl.className = 'stat-label';
  lbl.textContent = label;
  box.appendChild(lbl);

  return box;
}

function renderBreakdown(s) {
  var div = document.createElement('div');
  div.className = 'breakdown';

  var h3 = document.createElement('h3');
  h3.textContent = 'Подано заявлений (в том числе)';
  div.appendChild(h3);

  var grid = document.createElement('div');
  grid.className = 'breakdown-grid';

  grid.appendChild(brItem('Всего', s.total_applications));
  grid.appendChild(brItem('На условиях целевой подготовки', s.target_applications));
  grid.appendChild(brItem('Без вступительных испытаний', s.without_exams));
  grid.appendChild(brItem('Вне конкурса', s.out_of_competition));
  grid.appendChild(brItem('По конкурсу', s.by_competition));

  div.appendChild(grid);
  return div;
}

function brItem(label, value) {
  var el = document.createElement('div');
  el.className = 'br-item';
  el.innerHTML = '<span class="br-label">' + label + '</span><span class="br-value">' + value + '</span>';
  return el;
}

function renderScores(s) {
  var div = document.createElement('div');
  div.className = 'scores';

  var h3 = document.createElement('h3');
  h3.textContent = 'Распределение по сумме баллов';
  div.appendChild(h3);

  var dist = s.score_distribution || {};
  var keys = Object.keys(dist);
  var values = keys.map(function(k) { return dist[k]; });
  var maxVal = Math.max.apply(null, values) || 1;

  keys.forEach(function(key) {
    var count = dist[key];
    if (count === 0) return;

    var pct = (count / maxVal) * 100;
    var isMax = count === maxVal && maxVal > 0;

    var row = document.createElement('div');
    row.className = 'score-row' + (isMax ? ' score-max' : '');

    var range = document.createElement('div');
    range.className = 'score-range';
    range.textContent = key;
    row.appendChild(range);

    var wrap = document.createElement('div');
    wrap.className = 'score-bar-wrap';

    var bar = document.createElement('div');
    bar.className = 'score-bar';
    bar.style.width = Math.max(pct, 2) + '%';
    wrap.appendChild(bar);
    row.appendChild(wrap);

    var cnt = document.createElement('div');
    cnt.className = 'score-count';
    cnt.textContent = count;
    row.appendChild(cnt);

    div.appendChild(row);
  });

  return div;
}

loadData();

fetch('https://abitmsuparser.andiseko777.workers.dev/trigger', { mode: 'no-cors' }).catch(function(){});
