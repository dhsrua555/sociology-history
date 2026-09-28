/* 사회학사 1차 — 한 절씩 읽고, 사상은 나란히. 읽을 때마다 흰토끼 콩이에게 당근을 */
(function () {
  'use strict';
  var E = window.ECRIN || {};
  var R = window.RABBIT;
  var T = E.thinkers || {};
  var TOPICS = E.topics || [];
  var PAIRS = E.pairs || [];
  var INFL = E.influences || [];
  var READINGS = E.readings || [];
  var EXAM = E.exam || null;
  var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  /* 사상가 목록은 데이터에서 만든다 — 새 사상가 파일을 넣으면 자동으로 늘어난다 */
  var PALETTE = ['#5B6CFF', '#F29D12', '#FF5A4E', '#9B5CFF', '#16B39A', '#F0508C', '#6DBA3A', '#2E9BE6'];
  var ORDER = Object.keys(T).sort(function (a, b) { return (T[a].week || 0) - (T[b].week || 0) || (T[a].born || 0) - (T[b].born || 0); });
  var NUM = {};
  ORDER.forEach(function (id, i) {
    var t = T[id];
    t.color = t.color || PALETTE[i % PALETTE.length];
    t.short = t.short || t.name;
    t.lecture = t.lecture || []; t.textbook = t.textbook || []; t.questions = t.questions || []; t.keys = t.keys || [];
    NUM[id] = (i + 1 < 10 ? '0' : '') + (i + 1);
  });

  var app = document.getElementById('app');
  var mqMobile = window.matchMedia ? window.matchMedia('(max-width: 900px)') : { matches: false };

  /* ───────── 저장 (이 브라우저에만, 실패해도 동작) ───────── */
  var KEY = 'sahak-v2';
  var S = { read: {}, filt: { slide: 1, talk: 1, sum: 1, exam: 1, aux: 1 }, who: null, topic: '', exf: 'all', fs: 0, last: '', c: 0, earned: {}, owned: {}, look: {}, visit: null, name: '콩이', ctab: 'hat' };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { var o = JSON.parse(raw); if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { S[k] = o[k]; }); }
    else {
      var old = JSON.parse(localStorage.getItem('ecrin-sh-v1') || 'null');
      if (old && old.read) Object.keys(old.read).forEach(function (k) { S.read[k.replace(/^(\w+)\.t\./, '$1.tb.')] = 1; });
    }
  } catch (e) { }
  ['read', 'earned', 'owned', 'look'].forEach(function (k) { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
  if (!S.filt || typeof S.filt !== 'object') S.filt = { slide: 1, talk: 1, sum: 1, exam: 1, aux: 1 };
  S.c = Math.max(0, +S.c || 0);
  if (typeof S.name !== 'string' || !S.name.trim()) S.name = '콩이';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }

  /* ───────── 유틸 ───────── */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/==(.+?)==/g, '<mark>$1</mark>')
      .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  }
  function plain(s) { return String(s || '').replace(/^:::.*$/gm, ' ').replace(/^\|[-: |]+\|?\s*$/gm, ' ').replace(/\*\*|==|^#+\s|^>\s?|^\s*([-*]|\d+\.)\s/gm, ' ').replace(/[|*]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function cut(s, n) { s = plain(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clamp(v) { return v < -1 ? -1 : v > 1 ? 1 : v; }
  function mk(tid) { return '<span class="mk" style="--c:' + T[tid].color + '">' + NUM[tid] + '</span>'; }
  function srcChip(s) { return s ? '<span class="chip src">' + esc(s) + '</span>' : ''; }
  function topicById(id) { for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].id === id) return TOPICS[i]; return null; }

  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
  var CR = R.CARROT;
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + R.heart(12, 12.5, 8) + '" fill="#FF3D9A"/></svg>';
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + R.spark(12, 12, 10) + '" fill="#FFC93C"/></svg>';
  var STAR2 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + R.spark(12, 12, 10) + '" fill="#FF8CC6"/></svg>';

  /* ───────── 당근 · 옷장 ───────── */
  var REWARD = { l: 5, tb: 4, q: 3, rd: 2, lecall: 20, vs: 2, ex: 3 };
  function dayKey(t) { var d = new Date(t || Date.now()); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  /* 키마다 한 번만 준다 — 읽음 표시를 껐다 켜도 다시 주지 않는다 */
  function grant(k, amt) { if (S.earned[k] != null) return 0; S.earned[k] = amt; S.c += amt; return amt; }
  function rewardFor(key) {
    var m = /^(\w+)\.(l|tb|q|rd)\.(.+)$/.exec(key); if (!m) return null;
    return m[2] === 'rd' ? { k: 'rd.' + m[3], amt: REWARD.rd } : { k: key, amt: REWARD[m[2]] };
  }
  function gainOf(key) { var g = rewardFor(key); return g && S.earned[g.k] == null ? g.amt : 0; }
  function lecKeys(tid) { return T[tid].lecture.map(function (s) { return tid + '.l.' + s.id; }); }
  function allKeys(kind) { var ks = []; ORDER.forEach(function (tid) { (kind === 'l' ? lecKeys(tid) : T[tid].textbook.map(function (s) { return tid + '.tb.' + s.id; })).forEach(function (k) { ks.push(k); }); }); return ks; }
  function examOutlines() { var qs = []; if (EXAM) EXAM.parts.forEach(function (p) { p.qs.forEach(function (q) { if (q.outline) qs.push(q); }); }); return qs; }
  function lecBonus(tid) { var ks = lecKeys(tid); return ks.length && ks.every(function (k) { return S.read[k]; }) ? grant('lecall.' + tid, REWARD.lecall) : 0; }
  function syncPast() {
    var got = 0;
    Object.keys(S.read).forEach(function (k) { var g = rewardFor(k); if (g) got += grant(g.k, g.amt); });
    ORDER.forEach(function (tid) { got += lecBonus(tid); });
    return got;
  }
  function checkIn() {
    var today = dayKey(), v = S.visit;
    if (v && v.day === today) return null;
    var streak = v && v.day === dayKey(Date.now() - 864e5) ? v.streak + 1 : 1;
    S.visit = { day: today, streak: streak, best: Math.max(streak, (v && v.best) || 0) };
    return { amt: grant('day.' + today, Math.min(5 + streak - 1, 10)), streak: streak };
  }
  var ACHP = {
    lec: function () { var ks = allKeys('l'); return [ks.filter(function (k) { return S.read[k]; }).length, ks.length]; },
    tb: function () { var ks = allKeys('tb'); return [ks.filter(function (k) { return S.read[k]; }).length, ks.length]; },
    vs: function () { return [TOPICS.filter(function (t) { return S.earned['vs.' + t.id] != null; }).length, TOPICS.length]; },
    exam: function () { var qs = examOutlines(); return [qs.filter(function (q) { return S.earned['ex.' + q.n] != null; }).length, qs.length]; },
    streak: function () { return [Math.min((S.visit && S.visit.best) || 0, 7), 7]; }
  };
  function achDone(a) { if (S.earned['ach.' + a] != null) return true; var p = ACHP[a](); return p[1] > 0 && p[0] >= p[1]; }
  function achItem(a) { return R.ITEMS.filter(function (i) { return i.ach === a; })[0]; }
  function checkAch() {
    Object.keys(R.ACH).forEach(function (a) {
      if (S.earned['ach.' + a] != null) return;
      var p = ACHP[a](); if (!p[1] || p[0] < p[1]) return;
      S.earned['ach.' + a] = 0;
      toast('업적 달성 · <b>' + esc(R.ACH[a].name) + '</b>! ‘' + esc(achItem(a).name) + '’이 옷장에 들어왔어요');
      burst(innerWidth / 2, innerHeight * .6, 26, 180);
    });
    save();
  }
  function owns(it) { return !!it && (it.ach ? achDone(it.ach) : (!it.price || !!S.owned[it.id])); }
  function look() { var L = R.norm(S.look); Object.keys(L).forEach(function (s) { if (!owns(R.BY[L[s]])) L[s] = R.DEFAULT[s]; }); return L; }
  function rabbit(label, lk) { return '<span class="rb" role="button" tabindex="0" aria-label="' + esc(label || (S.name + ' 쓰다듬기')) + '">' + R.render(lk || look()) + '</span>'; }
  function shopList() { return R.ITEMS.filter(function (it) { return it.price && !owns(it); }).sort(function (a, b) { return a.price - b.price; }); }

  /* ───────── 효과: 당근 · 파티클 · 말풍선 · 알림 ───────── */
  var SHAPES = [CR, HEART, STAR, STAR2];
  function burst(x, y, n, spread) {
    if (reduced) return;
    for (var i = 0; i < n; i++) {
      var el = document.createElement('span'), a = Math.random() * Math.PI * 2, d = (spread || 90) * (.45 + Math.random() * .75);
      el.className = 'pt';
      el.style.setProperty('--x0', x + 'px'); el.style.setProperty('--y0', y + 'px');
      el.style.setProperty('--x1', (x + Math.cos(a) * d) + 'px'); el.style.setProperty('--y1', (y + Math.sin(a) * d + 28) + 'px');
      el.style.setProperty('--s', (11 + Math.random() * 13).toFixed(0) + 'px');
      el.style.setProperty('--r', ((Math.random() - .5) * 600).toFixed(0) + 'deg');
      el.style.setProperty('--d', (.7 + Math.random() * .5).toFixed(2) + 's');
      el.innerHTML = SHAPES[i % SHAPES.length];
      document.body.appendChild(el);
      setTimeout(el.remove.bind(el), 1400);
    }
  }
  function refreshWallet() { $$('[data-c]').forEach(function (e) { e.textContent = S.c; }); }
  function refreshLook() {
    var w = $('#wallet .face'); if (w) w.innerHTML = R.render(look(), { crop: '25 34 70 70' });
    var b = $('#buddy .rb'); if (b) b.innerHTML = R.render(look());
  }
  function carrotFx(n, anchor) {
    refreshWallet(); save();
    if (!n) return;
    var w = $('#wallet'); if (w) { w.classList.remove('bump'); void w.offsetWidth; w.classList.add('bump'); }
    var bd = $('#buddy'); if (bd && !bd.hidden) { hop($('.rb', bd)); say($('.rb', bd), '+' + n + ' 당근!'); }
    if (reduced) return;
    var r = (anchor || w || document.body).getBoundingClientRect(), x = Math.max(50, Math.min(innerWidth - 50, r.left + r.width / 2)), y = Math.max(40, r.top + Math.min(r.height / 2, 24));
    var el = document.createElement('div'); el.className = 'cfx'; el.innerHTML = CR + '+' + n;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el); setTimeout(el.remove.bind(el), 1500);
    burst(x, y, 12, 80);
  }
  var toastT = 0;
  function toast(html) {
    var old = $('.toast'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.innerHTML = CR + '<span>' + html + '</span>';
    document.body.appendChild(el); clearTimeout(toastT); toastT = setTimeout(function () { el.remove(); }, 3500);
  }
  function hop(el, cls) {
    if (reduced || !el) return;
    cls = cls || 'hop';
    el.classList.remove('hop', 'spin'); void el.offsetWidth; el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 950);
  }
  function lines() {
    var sh = shopList()[0];
    return ['폴짝!', '오늘은 한 절만 읽어도 충분해요.', '읽음 표시를 누르면 당근이 생겨요.', '사상 비교도 같이 봐요!', '족보 답안 설계, 펼쳐 봤어요?', '쉬엄쉬엄 해요.', '당근 ' + S.c + '개 모았어요!',
      sh ? (sh.price <= S.c ? '‘' + sh.name + '’ 살 수 있어요!' : '‘' + sh.name + '’까지 당근 ' + (sh.price - S.c) + '개!') : '옷장을 다 채웠어요!'];
  }
  function say(el, text) {
    if (!el) return;
    var r = el.getBoundingClientRect(), b = document.createElement('div');
    b.className = 'say'; b.textContent = text || (function (L) { return L[Math.floor(Math.random() * L.length)]; })(lines());
    b.style.left = Math.max(80, Math.min(innerWidth - 80, r.left + r.width / 2)) + 'px'; b.style.top = Math.max(50, r.top + 4) + 'px';
    document.body.appendChild(b); setTimeout(b.remove.bind(b), 2000);
  }
  function pet(el) { hop(el); say(el); var r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * .3, 7, 70); }

  /* ───────── 본문 마크업 → 블록 ───────── */
  function table(rows) {
    var cells = rows.filter(function (r) { return !/^\|\s*:?-{2,}/.test(r); }).map(function (r) {
      return r.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) { return c.trim(); });
    });
    if (!cells.length) return '';
    var head = cells.shift();
    return '<div class="tbl"><table><thead><tr>' + head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      cells.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function list(items) {
    var html = '', stack = [];
    items.forEach(function (raw) {
      var ind = raw.match(/^\s*/)[0].length, lv = ind >= 2 ? 1 : 0;
      var tag = /^\s*\d+\./.test(raw) ? 'ol' : 'ul';
      var text = raw.replace(/^\s*([-*]|\d+\.)\s+/, '');
      while (stack.length > lv + 1) html += '</li></' + stack.pop() + '>';
      if (stack.length === lv + 1) {
        if (stack[lv] !== tag) { html += '</li></' + stack.pop() + '><' + tag + '><li>'; stack.push(tag); }
        else html += '</li><li>';
      } else { while (stack.length < lv + 1) { html += '<' + tag + '><li>'; stack.push(tag); } }
      html += inline(text);
    });
    while (stack.length) html += '</li></' + stack.pop() + '>';
    return html;
  }
  function inner(lines) {
    var html = '', i = 0, pbuf = [], m;
    function flush() { if (pbuf.length) { html += '<p>' + inline(pbuf.join(' ')) + '</p>'; pbuf = []; } }
    while (i < lines.length) {
      var L = lines[i];
      if (/^\s*$/.test(L)) { flush(); i++; continue; }
      if ((m = L.match(/^(#{2,3})\s+(.*)$/))) { flush(); html += (m[1].length === 2 ? '<h3>' : '<h4>') + inline(m[2]) + (m[1].length === 2 ? '</h3>' : '</h4>'); i++; continue; }
      if (/^\|/.test(L)) { flush(); var rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]); html += table(rows); continue; }
      if (/^>\s?/.test(L)) { flush(); var q = []; while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, '')); html += '<blockquote>' + q.map(inline).join('<br>') + '</blockquote>'; continue; }
      if (/^\s*([-*]|\d+\.)\s+/.test(L)) { flush(); var it = []; while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) it.push(lines[i++]); html += list(it); continue; }
      pbuf.push(L.trim()); i++;
    }
    flush();
    return html;
  }
  var KIND = { talk: ['b-talk', '강의 녹음'], slide: ['b-slide', '교안'], exam: ['b-exam', '시험 포인트'], link: ['b-aux b-link', '다른 사상가와 연결'], note: ['b-aux b-note', '참고'] };
  function callout(kind, meta, lines) {
    var k = KIND[kind] || KIND.note;
    return '<div class="b ' + k[0] + '"><div class="lab">' + (kind === 'talk' ? '<span class="rec" aria-hidden="true"></span>' : '') + '<span class="k">' + k[1] + '</span>' + (meta ? '<span>' + esc(meta) + '</span>' : '') + '</div><div class="tx">' + inner(lines) + '</div></div>';
  }
  /* mode 'lec': 콜아웃 밖 글은 '정리'(필터로 끌 수 있음), 'plain': 교재·답·리딩 본문 */
  function blocks(src, mode) {
    var lines = String(src || '').replace(/\r/g, '').split('\n'), out = [], buf = [], i = 0, m;
    function flush() {
      if (!buf.length) return; var h = inner(buf); buf = [];
      if (h) out.push('<div class="b ' + (mode === 'lec' ? 'b-sum' : 'b-book') + ' tx">' + h + '</div>');
    }
    while (i < lines.length) {
      var L = lines[i];
      if ((m = L.match(/^:::\s*(\w+)\s*(.*)$/))) {
        flush(); var inn = []; i++;
        while (i < lines.length && !/^:::\s*$/.test(lines[i])) inn.push(lines[i++]);
        i++; out.push(callout(m[1], m[2].trim(), inn)); continue;
      }
      if ((m = L.match(/^(#{2,3})\s+(.*)$/))) { flush(); out.push('<div class="b b-head">' + (m[1].length === 2 ? '<h3>' : '<h4>') + inline(m[2]) + (m[1].length === 2 ? '</h3>' : '</h4>') + '</div>'); i++; continue; }
      buf.push(L); i++;
    }
    flush();
    return out.join('');
  }
  function firstCallout(src, kind, max) {
    var re = new RegExp('^:::\\s*' + kind + '([^\\n]*)\\n([\\s\\S]*?)\\n:::\\s*$', 'gm'), m;
    while ((m = re.exec(src))) if (m[0].length <= max) return m[0];
    return '';
  }

  /* ───────── 항목 ───────── */
  var TABS = [['l', '강의 정리'], ['q', '교수님의 질문'], ['tb', '교재'], ['rd', '리딩']];
  function readingsFor(tid) {
    var t = T[tid];
    var own = READINGS.filter(function (x) { return x.thinker === tid; });
    var same = READINGS.filter(function (x) { return x.thinker !== tid && x.week === t.week; });
    return own.concat(same);
  }
  function itemsOf(tid, tab) {
    var t = T[tid];
    if (tab === 'q') return t.questions.map(function (q, i) { return { id: 'q' + i, title: q.q, pv: cut(q.a, 60), q: q, key: tid + '.q.' + i }; });
    if (tab === 'tb') return t.textbook.map(function (s) { return { id: s.id, title: s.title, pv: cut(s.body, 60), body: s.body, key: tid + '.tb.' + s.id }; });
    if (tab === 'rd') return readingsFor(tid).map(function (x) { return { id: 'r-' + x.id, title: x.author + (x.year ? ' (' + x.year + ')' : ''), pv: x.title, rd: x, key: tid + '.rd.' + x.id }; });
    return t.lecture.map(function (s) {
      var sl = /:::\s*slide[^\n]*\n([\s\S]*?)\n:::/.exec(s.body);
      return { id: s.id, title: s.title, pv: cut(sl ? sl[1] : s.body, 60), body: s.body, src: s.src, key: tid + '.l.' + s.id };
    });
  }
  function progress(tid) {
    var keys = itemsOf(tid, 'l').concat(itemsOf(tid, 'tb')).map(function (x) { return x.key; });
    var d = keys.filter(function (k) { return S.read[k]; }).length;
    return { done: d, total: keys.length, f: keys.length ? d / keys.length : 0 };
  }
  function hashFor(tid, tab, id) { return '#t-' + tid + (tab === 'l' ? '' : '-' + tab) + (id ? '.' + id : ''); }

  /* ───────── 홈 ───────── */
  var hello = '';
  function allQuestions() { var qs = []; ORDER.forEach(function (tid) { T[tid].questions.forEach(function (q, i) { qs.push({ tid: tid, i: i, q: q.q }); }); }); return qs; }
  function helloLine() {
    if (hello) return hello;
    var sh = shopList(), can = sh.filter(function (it) { return it.price <= S.c; });
    if (can.length) return '당근 <b>' + S.c + '</b>개면 옷장에서 <b>' + can.length + '</b>가지를 살 수 있어요!';
    if (sh.length) return '다음 목표는 <b>' + esc(sh[0].name) + '</b>. 당근 <b>' + (sh[0].price - S.c) + '</b>개만 더!';
    return '옷장을 다 채웠어요. 이제 시험만 남았어요!';
  }
  function viewHome() {
    var cont = S.last ? '#' + S.last : '#t-' + ORDER[0];
    var nSec = 0; ORDER.forEach(function (tid) { nSec += T[tid].lecture.length; });
    var nQ = EXAM ? EXAM.parts.reduce(function (a, p) { return a + p.qs.length; }, 0) : 0;
    var word = '사회학사'.split('').map(function (ch, i) { return '<span class="hl" style="--i:' + i + ';--tw:' + (i % 2 ? '-5deg' : '5deg') + '">' + ch + '</span>'; }).join('') + '<span class="hl dot" style="--i:4">.</span>';
    var h = '<section class="hero"><div class="hero-l"><div class="eyebrow"><span>History of Sociology</span><b>Part 01</b><span>' + esc(ORDER.map(function (tid) { return T[tid].en.split(' ').pop(); }).join(' → ')) + '</span></div>' +
      '<h1 aria-label="사회학사">' + word + '</h1><p class="en">Read it slowly, <b>compare</b> it side by side.<span class="cur" aria-hidden="true"></span></p>' +
      '<p class="lede">강의 녹음과 교안을 교안 순서대로 나누고, 교재와 리딩을 붙였습니다. 한 번에 한 절씩, 필요한 종류만 골라 읽고, 다 읽으면 ' + esc(S.name) + '에게 당근을 주세요.</p>' +
      '<div class="cta"><a class="btn pri mag" href="' + cont + '">' + (S.last ? '이어서 읽기' : '처음부터 읽기') + ARROW + '</a><a class="btn mag" href="#vs">사상 비교' + ARROW + '</a><a class="btn mag" href="#exam">족보</a></div></div>' +
      '<div class="stage tilt" data-tilt="6"><div class="halo"></div><svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48"/></svg>' +
      '<span class="orb o1" aria-hidden="true">' + HEART + '</span><span class="orb o2" aria-hidden="true">' + CR + '</span><span class="orb o3" aria-hidden="true">' + STAR + '</span>' +
      rabbit() + '<div class="bubble" id="hello">' + helloLine() + '</div>' +
      '<div class="tag"><b>' + esc(S.name) + '</b><a href="#closet">' + CR + '<span data-c>' + S.c + '</span> · 옷장</a></div></div>' +
      '<div class="stats"><div><b data-n="' + ORDER.length + '">' + two(ORDER.length) + '</b><span>사상가</span></div><div><b data-n="' + nSec + '">' + two(nSec) + '</b><span>강의 절</span></div><div><b data-n="' + READINGS.length + '">' + two(READINGS.length) + '</b><span>리딩</span></div><div><b data-n="' + nQ + '">' + two(nQ) + '</b><span>족보 문항</span></div></div></section>';

    var keys = []; ORDER.forEach(function (tid) { T[tid].keys.forEach(function (k) { keys.push(k); }); });
    var names = ORDER.map(function (tid) { return T[tid].en + ' · ' + T[tid].life; });
    function track(arr) { var s = arr.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join(''); return '<div class="mq-track">' + s + s + s + s + '</div>'; }
    h += '<div class="marquee" aria-hidden="true">' + track(keys) + '</div><div class="marquee" aria-hidden="true">' + track(names) + '</div>';

    h += '<section class="band"><div class="band-h"><div><span class="lbl">01 · Thinkers</span><h2>사상가별로 읽기<i>.</i></h2></div><p>절을 다 읽고 ‘읽음 표시’를 누르면 진도가 오르고 당근이 생깁니다. 한 사람의 강의 정리를 끝까지 읽으면 당근 ' + REWARD.lecall + '개를 더 드려요.</p></div><div class="rows">';
    ORDER.forEach(function (tid, i) {
      var t = T[tid], p = progress(tid);
      h += '<a class="rowx fx" href="#t-' + tid + '" style="--c:' + t.color + ';--i:' + i + '">' + mk(tid) + '<div class="nm">' + esc(t.name) + '<small>' + esc(t.en) + ' · ' + esc(t.life) + '</small></div>' +
        '<div class="keys">' + t.keys.slice(0, 4).map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</div>' +
        '<div class="prog"><span>' + p.done + ' / ' + p.total + ' 읽음</span><span class="bar"><i style="width:' + Math.round(p.f * 100) + '%"></i></span></div><span class="go">' + ARROW + '</span></a>';
    });
    h += '</div></section>';

    if (TOPICS.length) {
      h += '<section class="band"><div class="band-h"><div><span class="lbl">02 · Compare</span><h2>주제로 나란히 보기<i>.</i></h2></div><p>같은 질문에 네 사람이 각각 무엇이라 했는지 한 화면에 모았습니다. 문장마다 출처(교안·강의·교재·리딩)가 붙어 있습니다.</p></div><div class="topics2">' +
        TOPICS.map(function (tp, i) { return '<a class="fx tilt" data-tilt="7" href="#vs.' + tp.id + '" style="--i:' + i + '"><span class="mk">' + two(i + 1) + '</span><b>' + esc(tp.label) + '</b><small>' + esc(tp.q) + '</small>' + (tp.exam ? '<span class="chip pink">' + esc(tp.exam) + '</span>' : '') + '</a>'; }).join('') + '</div></section>';
    }

    var src = T[ORDER[0]] ? T[ORDER[0]].lecture.map(function (s) { return s.body; }).join('\n') : '';
    var sSlide = firstCallout(src, 'slide', 420), sTalk = firstCallout(src, 'talk', 360), sExam = firstCallout(src, 'exam', 560);
    h += '<section class="band"><div class="band-h"><div><span class="lbl">03 · How to read</span><h2>자료는 모양으로 구분됩니다<i>.</i></h2></div><p>강의 정리 화면의 ‘보기’에서 종류별로 켜고 끌 수 있습니다. 교안만 훑거나 시험 포인트만 모아 볼 수 있습니다.</p></div><div class="legend">' +
      (sSlide ? '<div class="item">' + blocks(sSlide, 'lec') + '<p>흰 상자 = 강의 교안 원문</p></div>' : '') +
      (sTalk ? '<div class="item">' + blocks(sTalk, 'lec') + '<p>분홍 세로선 = 강의 녹음 (녹음 파일 · 시각)</p></div>' : '') +
      (sExam ? '<div class="item">' + blocks(sExam, 'lec') + '<p>분홍 상자 = 족보와 이어지는 시험 포인트</p></div>' : '') +
      '</div></section>';

    var qs = allQuestions();
    if (qs.length) {
      var pk = qs[Math.floor(Date.now() / 864e5) % qs.length];
      h += '<section class="band"><div class="band-h"><div><span class="lbl">04 · Today</span><h2>오늘의 질문<i>.</i></h2></div><p>교안 Ⅰ. 문제제기에서 하루에 하나씩 골랐습니다.</p></div><div class="qcard" id="qday">' + qday(pk) + rabbit(S.name + ' 쓰다듬기', Object.assign({}, look(), { eyes: 'e-focus' })) + '</div></section>';
    }
    return h;
  }
  function qday(pk) {
    var t = T[pk.tid];
    return '<div class="who">' + mk(pk.tid) + '<span>' + esc(t.name) + ' · 교안 문제제기</span></div><p class="q">' + esc(pk.q) + '</p><div class="row"><a class="btn pri mag" href="' + hashFor(pk.tid, 'q', 'q' + pk.i) + '">답 정리 보기' + ARROW + '</a><button class="btn mag" id="qnext" type="button">다른 질문</button></div>';
  }
  function countUp() {
    if (reduced) return;
    $$('.stats b[data-n]').forEach(function (b) {
      var n = +b.dataset.n, t0 = performance.now();
      (function step(t) { var k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3); b.textContent = two(Math.round(n * e)); if (k < 1) requestAnimationFrame(step); })(t0);
    });
  }
  function bindHome() {
    var box = $('#qday');
    if (box) box.addEventListener('click', function (e) {
      if (!e.target.closest('#qnext')) return;
      var qs = allQuestions(), rb = $('.rb', box);
      box.innerHTML = qday(qs[Math.floor(Math.random() * qs.length)]);
      if (rb) box.appendChild(rb);
      box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
      hop(rb);
    });
    countUp();
    hello = '';
  }

  /* ───────── 사상가 페이지: 목록 + 한 절씩 ───────── */
  var FK = [['slide', '교안', '#B9A6B2'], ['talk', '강의 녹음', 'var(--pink)'], ['sum', '정리', 'var(--ink-3)'], ['exam', '시험 포인트', '#FF8CC6'], ['aux', '연결·참고', 'var(--line-2)']];
  var FS = ['보통', '크게', '더 크게'];
  function doneHTML(key) {
    var on = !!S.read[key], g = gainOf(key);
    return '<i></i>' + (on ? '다 읽었어요' : '읽음 표시') + (!on && g ? '<span class="gain">+' + g + CR + '</span>' : '');
  }
  function viewThinker(r) {
    var tid = r.id, t = T[tid], tab = r.tab, items = itemsOf(tid, tab), idx = -1;
    if (r.anchor) items.forEach(function (x, i) { if (x.id === r.anchor) idx = i; });
    if (idx < 0 && !mqMobile.matches && items.length) idx = 0;
    r.idx = idx;
    var nRead = items.filter(function (x) { return S.read[x.key]; }).length;
    var tabName = TABS.filter(function (x) { return x[0] === tab; })[0][1];

    var h = '<div style="--c:' + t.color + '"><header class="t-head"><span class="big" aria-hidden="true">' + NUM[tid] + '</span><div class="eyebrow">' + mk(tid) + '<span>' + esc(t.weekLabel || '') + '</span><span>' + esc(t.country || '') + '</span></div>' +
      '<h1>' + esc(t.name) + '</h1><p class="en">' + esc(t.en) + ' · ' + esc(t.life) + '</p>' +
      (t.thesis ? '<p class="thesis">' + esc(t.thesis) + '</p>' : '') + '</header>';
    h += '<nav class="tabs2" aria-label="자료 종류">' + TABS.map(function (tb) {
      return '<a href="' + hashFor(tid, tb[0]) + '" aria-current="' + (tab === tb[0]) + '">' + tb[1] + '<span class="n">' + two(itemsOf(tid, tb[0]).length) + '</span></a>';
    }).join('') + '<a class="out" href="#vs">사상 비교 →</a></nav>';

    h += '<div class="chat ' + (idx >= 0 ? 'mode-thread' : 'mode-list') + '"><aside class="rooms" aria-label="' + tabName + ' 목록"><div class="rh lbl"><span>' + tabName + ' · ' + two(items.length) + '</span><span>' + two(nRead) + ' 읽음</span></div><ol>' +
      items.map(function (x, i) {
        return '<li><a class="room" href="' + hashFor(tid, tab, x.id) + '" aria-current="' + (i === idx) + '"><span class="no">' + two(i + 1) + '</span><span class="tt"><b>' + esc(x.title) + '</b><small>' + esc(x.pv) + '</small></span><span class="ck' + (S.read[x.key] ? ' on' : '') + '" data-key="' + esc(x.key) + '"></span></a></li>';
      }).join('') + '</ol></aside>';
    h += '<section class="thread">' + (idx >= 0 ? threadHTML(tid, tab, items, idx) : '') + '</section></div></div>';
    return h;
  }
  function filterClasses() { return FK.filter(function (k) { return !S.filt[k[0]]; }).map(function (k) { return 'hide-' + k[0]; }).join(' '); }
  function threadHTML(tid, tab, items, idx) {
    var x = items[idx], on = !!S.read[x.key], h = '', chips = '';
    if (tab === 'l') chips = (x.src || '').split('·').map(function (s) { s = s.trim(); return s ? '<span class="chip' + (/강의/.test(s) ? ' pink' : '') + '">' + esc(s) + '</span>' : ''; }).join('');
    if (tab === 'tb') chips = '<span class="chip">코저 『사회사상사』 · ' + esc(T[tid].name) + ' 장</span>';
    if (tab === 'q') chips = '<span class="chip">교안 Ⅰ. 문제제기</span>';
    if (tab === 'rd') chips = '<span class="chip' + (x.rd.kind === '핵심' ? ' pink' : '') + '">' + esc(x.rd.kind) + ' 리딩</span>' + (x.rd.thinker !== tid && T[x.rd.thinker] ? '<span class="chip">' + esc(T[x.rd.thinker].short) + ' 리딩</span>' : '');
    h += '<div class="th-top"><a class="btn back" href="' + hashFor(tid, tab) + '">' + BACK + '목록</a>' +
      '<span class="lbl">' + two(idx + 1) + ' / ' + two(items.length) + '</span>' +
      '<h2>' + esc(tab === 'q' ? '교수님의 질문 ' + (idx + 1) : x.title) + '</h2>' +
      '<div class="row">' + chips + '<button class="done" type="button" data-key="' + esc(x.key) + '" aria-pressed="' + on + '">' + doneHTML(x.key) + '</button></div></div>';
    if (tab === 'l') {
      h += '<div class="filters" role="group" aria-label="보고 싶은 내용만 고르기"><span class="lbl">보기</span>' +
        FK.map(function (k) { return '<button class="fbtn" type="button" data-k="' + k[0] + '" aria-pressed="' + !!S.filt[k[0]] + '" style="--k:' + k[2] + '"><i></i>' + k[1] + '</button>'; }).join('') +
        '<button class="fbtn plain" type="button" data-k="all">모두 보기</button><button class="fbtn plain" type="button" data-k="fs">글자 ' + FS[S.fs || 0] + '</button></div>';
    }
    h += '<div class="msgs ' + (tab === 'l' ? filterClasses() : '') + '" id="msgs">';
    if (tab === 'l' || tab === 'tb') h += blocks(x.body, tab === 'l' ? 'lec' : 'plain');
    if (tab === 'q') h += '<div class="b qhead">' + esc(x.q.q) + '</div>' + blocks(x.q.a, 'plain');
    if (tab === 'rd') {
      var rd = x.rd;
      h += '<div class="b rdhead"><div class="ti">' + esc(rd.title) + '</div><div class="mt">' + esc(rd.author) + (rd.year ? ' (' + rd.year + ')' : '') + ' · ' + esc(rd.source || '') + '</div><p class="gist">' + inline(rd.gist || '') + '</p></div>' + blocks(rd.body, 'plain');
    }
    h += '<div class="b b-empty" id="emptymsg" hidden>고른 종류의 내용이 이 절에는 없습니다. 위의 ‘보기’에서 다른 종류를 켜 보세요.</div></div>';
    var prev = items[idx - 1], next = items[idx + 1];
    h += '<nav class="th-nav" aria-label="앞뒤 절">' + (prev ? '<a href="' + hashFor(tid, tab, prev.id) + '"><small>← 이전</small>' + esc(cut(prev.title, 34)) + '</a>' : '') +
      (next ? '<a class="next" href="' + hashFor(tid, tab, next.id) + '"><small>다음 →</small>' + esc(cut(next.title, 34)) + '</a>' : '') + '</nav>';
    return h;
  }
  function checkEmpty() {
    var m = $('#msgs'), e = $('#emptymsg'); if (!m || !e) return;
    e.hidden = $$('.b:not(.b-head):not(.b-empty)', m).some(function (b) { return getComputedStyle(b).display !== 'none'; });
  }
  function applyFs() { document.documentElement.classList.remove('fs1', 'fs2'); if (S.fs) document.documentElement.classList.add('fs' + S.fs); }
  function bindThinker(r) {
    var rooms = $('.rooms'), curRoom = $('.room[aria-current="true"]');
    if (rooms && curRoom && !mqMobile.matches) rooms.scrollTop = Math.max(0, curRoom.offsetTop - rooms.clientHeight / 3);
    $$('.done').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.key, on = !S.read[k], got = 0;
        if (on) {
          S.read[k] = 1;
          var g = rewardFor(k); if (g) got += grant(g.k, g.amt);
          if (/\.l\./.test(k)) { var bonus = lecBonus(r.id); if (bonus) { got += bonus; setTimeout(function () { toast(esc(T[r.id].name) + ' 강의 정리 완주! 보너스 당근 <b>+' + bonus + '</b>'); }, 700); } }
        } else delete S.read[k];
        save();
        b.setAttribute('aria-pressed', on); b.innerHTML = doneHTML(k);
        $$('.ck').forEach(function (c) { if (c.dataset.key === k) c.classList.toggle('on', on); });
        var rh = $('.rooms .rh span:last-child'); if (rh) rh.textContent = two($$('.room .ck.on').length) + ' 읽음';
        if (on) { hop(b, 'hop'); var bb = b.getBoundingClientRect(); if (!got) burst(bb.left + bb.width / 2, bb.top + bb.height / 2, 8, 60); }
        carrotFx(got, b);
        if (on) checkAch();
      });
    });
    $$('.fbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.k;
        if (k === 'fs') { S.fs = ((S.fs || 0) + 1) % 3; applyFs(); b.textContent = '글자 ' + FS[S.fs]; save(); return; }
        if (k === 'all') FK.forEach(function (f) { S.filt[f[0]] = 1; });
        else S.filt[k] = S.filt[k] ? 0 : 1;
        save();
        $$('.fbtn').forEach(function (x) { if (S.filt.hasOwnProperty(x.dataset.k)) x.setAttribute('aria-pressed', !!S.filt[x.dataset.k]); });
        var m = $('#msgs'); if (m) m.className = 'msgs ' + filterClasses();
        checkEmpty();
      });
    });
    checkEmpty();
  }

  /* ───────── 사상 비교 ───────── */
  function who() {
    var w = (Array.isArray(S.who) ? S.who : ORDER).filter(function (id) { return T[id]; });
    if (!w.length) w = ORDER.slice();
    return ORDER.filter(function (id) { return w.indexOf(id) >= 0; });
  }
  function viewVs(r) {
    var tp = topicById(r.anchor) || topicById(S.topic) || TOPICS[0], W = who();
    var h = '<header class="vs-head"><span class="lbl">Compare</span><h1>사상 비교<i>.</i></h1><p>주제를 고르면 네 사람의 입장이 나란히 놓이고, 아래에 두 사람씩의 관계가 이어집니다. 보고 싶은 사람만 켜 두세요. 주제를 처음 열 때마다 당근 ' + REWARD.vs + '개.</p>' +
      '<div class="pick" role="group" aria-label="비교할 사상가"><span class="lbl">비교할 사람</span>' + ORDER.map(function (tid) {
        return '<button type="button" data-t="' + tid + '" aria-pressed="' + (W.indexOf(tid) >= 0) + '" style="--c:' + T[tid].color + '">' + mk(tid) + esc(T[tid].short) + '</button>';
      }).join('') + '</div></header>';
    h += '<div class="topicbar"><div class="seg" role="group" aria-label="주제">' + TOPICS.map(function (x) {
      return '<button type="button" data-tp="' + x.id + '" aria-pressed="' + (!!tp && x.id === tp.id) + '">' + esc(x.label) + (x.exam ? '<span class="x">' + esc(x.exam.replace('족보 ', '')) + '</span>' : '') + '</button>';
    }).join('') + '</div></div><div id="vsbody"></div>';
    return h;
  }
  function relmap(tp, W) {
    var n = W.length, cx = 140, cy = 124, R0 = 88, pos = {};
    W.forEach(function (tid, i) { var a = Math.PI + i * 2 * Math.PI / n; pos[tid] = [cx + R0 * Math.cos(a), cy + R0 * Math.sin(a)]; });
    var s = '<svg viewBox="0 -12 280 284" role="img" aria-label="선택한 사상가 사이의 관계">';
    PAIRS.forEach(function (p) {
      if (!pos[p.a] || !pos[p.b]) return;
      var a = pos[p.a], b = pos[p.b], hot = p.points.some(function (x) { return x.topic === tp.id; });
      var d = 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1) + ' L' + b[0].toFixed(1) + ',' + b[1].toFixed(1);
      s += '<path class="ln' + (hot ? ' on' : '') + '" d="' + d + '"/><path class="hit" data-pair="' + p.id + '" d="' + d + '"><title>' + esc(T[p.a].short + ' × ' + T[p.b].short + ' · ' + p.title) + '</title></path>';
    });
    W.forEach(function (tid) {
      var p = pos[tid], t = T[tid], ly = p[1] < cy - 20 ? p[1] - 30 : p[1] + 40;
      s += '<g class="nd" data-t="' + tid + '" style="transform-origin:' + p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px"><title>' + esc(t.name) + ' 강의 정리로</title><circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="20" stroke="' + t.color + '"/><text class="no" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" style="fill:color-mix(in oklab, ' + t.color + ' 72%, #000)">' + NUM[tid] + '</text><text x="' + p[0].toFixed(1) + '" y="' + ly.toFixed(1) + '">' + esc(t.short) + '</text></g>';
    });
    return s + '</svg><p class="hint">분홍 선은 이 주제로 이어진 두 사람입니다. 선을 누르면 관계로 이동합니다.</p>';
  }
  function renderVsBody(tpId) {
    var tp = topicById(tpId) || TOPICS[0], W = who(), box = $('#vsbody');
    if (!tp || !box) return;
    S.topic = tp.id; save();
    $$('.topicbar [data-tp]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tp === tp.id); });
    var h = '<div class="vs-lead"><div><div class="q">' + esc(tp.q) + '</div>' + (tp.lead ? '<p class="lead">' + inline(tp.lead) + '</p>' : '') +
      (tp.exam ? '<p class="exam"><a class="chip pink" href="#exam">' + esc(tp.exam) + ' 문항 보기 →</a></p>' : '') + '</div>' +
      (W.length > 1 ? '<div class="relmap">' + relmap(tp, W) + '</div>' : '') + '</div>';
    h += '<div class="cols">' + W.map(function (tid, i) {
      var t = T[tid], pts = (tp.points && tp.points[tid]) || [];
      return '<article class="col fx" style="--c:' + t.color + ';--i:' + i + '"><a class="hd" href="#t-' + tid + '">' + mk(tid) + '<b>' + esc(t.name) + '</b><small>' + esc(t.en) + '</small></a>' +
        (pts.length ? '<ul>' + pts.map(function (p) { return '<li>' + inline(p.t) + srcChip(p.s) + '</li>'; }).join('') + '</ul>' : '<p class="none">이 주제는 자료에서 직접 다루지 않습니다.</p>') + '</article>';
    }).join('') + '</div>';

    var prs = PAIRS.filter(function (p) { return W.indexOf(p.a) >= 0 && W.indexOf(p.b) >= 0; });
    if (prs.length) {
      h += '<div class="sec-h"><div><span class="lbl">Pairs</span><h2>두 사람씩 보면</h2></div><p>‘' + esc(tp.label) + '’와 이어지는 대목을 먼저 보여 줍니다. 나머지는 펼쳐서 볼 수 있습니다.</p></div><div class="pairs">' + prs.map(function (p) {
        var hot = p.points.filter(function (x) { return x.topic === tp.id; }), rest = p.points.filter(function (x) { return x.topic !== tp.id; });
        function li(x, isHot) { var tt = topicById(x.topic); return '<li' + (isHot ? ' class="hot"' : '') + '>' + (tt && !isHot ? '<span class="tp">' + esc(tt.label) + '</span>' : '') + inline(x.t) + srcChip(x.s) + '</li>'; }
        return '<article class="pair fx" id="pr-' + p.id + '"><div class="hd">' + mk(p.a) + mk(p.b) + '<b>' + esc(T[p.a].short + ' × ' + T[p.b].short) + '</b><span class="t">' + esc(p.title) + '</span>' + (p.exam ? '<span class="chip pink">' + esc(p.exam) + '</span>' : '') + '</div><p class="line">' + esc(p.line) + '</p>' +
          (hot.length ? '<ul>' + hot.map(function (x) { return li(x, true); }).join('') + '</ul>' : '<p class="none">이 주제로 직접 이어진 대목은 없습니다.</p>') +
          (rest.length ? '<details><summary>다른 주제 ' + rest.length + '개</summary><ul>' + rest.map(function (x) { return li(x, false); }).join('') + '</ul></details>' : '') + '</article>';
      }).join('') + '</div>';
    }

    function inflLi(x) { return '<li><span class="nm">' + x.who.filter(function (w) { return T[w]; }).map(mk).join('') + esc(x.label) + '<small>' + esc(x.sub) + '</small></span><p>' + inline(x.t) + srcChip(x.s) + '</p></li>'; }
    var ins = INFL.filter(function (x) { return x.dir === 'in' && x.who.some(function (w) { return W.indexOf(w) >= 0; }); });
    var outs = INFL.filter(function (x) { return x.dir === 'out' && x.who.some(function (w) { return W.indexOf(w) >= 0; }); });
    if (ins.length || outs.length) {
      h += '<div class="sec-h"><div><span class="lbl">Lineage</span><h2>받은 영향과 물려준 유산</h2></div><p>이름 앞 번호는 그 영향과 이어진 사상가입니다.</p></div><div class="infl"><div><h3>받은 영향</h3><ul>' + ins.map(inflLi).join('') + '</ul></div><div><h3>물려준 유산</h3><ul>' + outs.map(inflLi).join('') + '</ul></div></div>';
    }

    h += '<div class="sec-h"><div><span class="lbl">Overview</span><h2>모든 주제 한눈에</h2></div></div><details class="overview"><summary>주제 × 사상가 표 펼치기</summary><div class="tbl"><table><thead><tr><th>주제</th>' + W.map(function (tid) { return '<th>' + mk(tid) + esc(T[tid].short) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      TOPICS.map(function (x) { return '<tr><td><button type="button" data-tp="' + x.id + '">' + esc(x.label) + '</button></td>' + W.map(function (tid) { var p = x.points && x.points[tid]; return '<td>' + (p && p.length ? inline(p[0].t) : '<span class="muted">—</span>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details>';
    box.innerHTML = h;
    $$('.relmap .hit', box).forEach(function (el) {
      el.addEventListener('click', function () { var c = $('#pr-' + el.dataset.pair); if (c) { $$('.pair').forEach(function (p) { p.classList.remove('focus'); }); c.classList.add('focus'); c.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); } });
    });
    $$('.relmap .nd', box).forEach(function (el) { el.addEventListener('click', function () { location.hash = '#t-' + el.dataset.t; }); });
    $$('.overview [data-tp]', box).forEach(function (b) { b.addEventListener('click', function () { setTopic(b.dataset.tp, true); }); });
    var got = grant('vs.' + tp.id, REWARD.vs);
    if (got) { carrotFx(got, $('.topicbar [aria-pressed="true"]')); checkAch(); }
  }
  function setTopic(id, scroll) {
    try { history.replaceState(null, '', '#vs.' + id); } catch (e) { }
    renderVsBody(id);
    if (scroll) { var tb = $('.topicbar'); if (tb) window.scrollTo({ top: Math.max(0, tb.getBoundingClientRect().top + window.scrollY - 120), behavior: reduced ? 'auto' : 'smooth' }); }
  }
  function bindVs(r) {
    $$('.topicbar [data-tp]').forEach(function (b) { b.addEventListener('click', function () { setTopic(b.dataset.tp, false); }); });
    $$('.pick [data-t]').forEach(function (b) {
      b.addEventListener('click', function () {
        var w = who(), id = b.dataset.t, i = w.indexOf(id);
        if (i >= 0) { if (w.length === 1) return; w.splice(i, 1); } else w.push(id);
        S.who = w; save();
        $$('.pick [data-t]').forEach(function (x) { x.setAttribute('aria-pressed', who().indexOf(x.dataset.t) >= 0); });
        renderVsBody(S.topic);
      });
    });
    var tp = topicById(r.anchor) || topicById(S.topic) || TOPICS[0];
    if (tp) renderVsBody(tp.id);
  }

  /* ───────── 족보 ───────── */
  function viewExam() {
    if (!EXAM) return '<header class="ex-head"><h1>족보</h1><p class="muted">족보 자료가 아직 없습니다.</p></header>';
    var only = S.exf === 'first', k = 0;
    var h = '<header class="ex-head"><span class="lbl">Past exam</span><h1>족보<i>.</i></h1><p class="muted">' + esc(EXAM.title) + ' · ' + esc(EXAM.meta) + '</p><p class="ex-note">' + inline(EXAM.note || '') + '</p>' +
      '<div class="seg" role="group" aria-label="문항 거르기"><button type="button" data-f="all" aria-pressed="' + !only + '">모든 문항</button><button type="button" data-f="first" aria-pressed="' + only + '">지금 자료로 쓸 수 있는 문항만</button></div></header>';
    var RL = { '1차': ['1차 범위', 'pink'], '2차': ['2차 범위', ''], '혼합': ['일부 1차', 'pink'] };
    EXAM.parts.forEach(function (part) {
      var qs = part.qs.filter(function (q) { return !only || q.range !== '2차'; });
      if (!qs.length) return;
      h += '<div class="part-h"><b>' + esc(part.kind) + '</b><small>' + esc(part.rule) + '</small></div>';
      qs.forEach(function (q) {
        var rl = RL[q.range] || ['', ''], tp = q.lens ? topicById(q.lens) : null, fresh = q.outline && S.earned['ex.' + q.n] == null;
        h += '<article class="eq fx' + (q.range !== '2차' ? ' first' : '') + '" id="e' + q.n + '" style="--i:' + (k++) + '"><span class="n">' + two(+q.n || 0) + '</span><div><p class="tx0">' + esc(q.text) + '</p>' +
          (q.subs ? '<ul class="subs">' + q.subs.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '') +
          (q.box ? '<div class="box">' + esc(q.box) + '</div>' : '') +
          '<div class="tags"><span class="chip ' + rl[1] + '">' + rl[0] + '</span>' + (q.thinkers || []).filter(function (t) { return T[t]; }).map(function (t) { return '<a class="chip" href="#t-' + t + '">' + esc(T[t].short) + '</a>'; }).join('') +
          (tp ? '<a class="chip" href="#vs.' + tp.id + '">비교: ' + esc(tp.label) + ' →</a>' : '') + '</div>' +
          (q.outline ? '<details><summary>' + (q.range === '2차' ? '1차 자료와 이어지는 부분' : '답안 설계 보기') + (fresh ? ' · +' + REWARD.ex + CR : '') + '</summary><div class="ol tx">' + blocks(q.outline, 'plain') + '</div></details>' : '') +
          '</div></article>';
      });
    });
    return h;
  }
  function bindExam() {
    $$('.ex-head [data-f]').forEach(function (b) { b.addEventListener('click', function () { S.exf = b.dataset.f; save(); cur = null; render(); }); });
    $$('.eq details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        var n = d.closest('.eq').id.slice(1), got = grant('ex.' + n, REWARD.ex);
        if (got) { var sm = $('summary', d); carrotFx(got, sm); var c = sm.querySelector('.cr'); if (c) { c.remove(); sm.innerHTML = sm.innerHTML.replace(/ · \+\d+$/, ''); } checkAch(); }
      });
    });
  }

  /* ───────── 옷장 ───────── */
  function slotOf(id) { return R.SLOTS.filter(function (s) { return s.id === id; })[0]; }
  function viewCloset(r) {
    if (slotOf(r.anchor)) S.ctab = r.anchor;
    if (!slotOf(S.ctab)) S.ctab = 'hat';
    var v = S.visit || { streak: 0 };
    var nOwn = R.ITEMS.filter(function (it) { return it.price && owns(it); }).length, nAll = R.ITEMS.filter(function (it) { return it.price || it.ach; }).length;
    nOwn += R.ITEMS.filter(function (it) { return it.ach && owns(it); }).length;
    var earn = [
      ['강의 정리 한 절 읽음 표시', '+' + REWARD.l, '절마다 한 번'],
      ['교재 한 절 읽음 표시', '+' + REWARD.tb, '절마다 한 번'],
      ['교수님의 질문 읽음 표시', '+' + REWARD.q, '질문마다 한 번'],
      ['리딩 한 편 읽음 표시', '+' + REWARD.rd, '리딩마다 한 번'],
      ['한 사상가의 강의 정리를 끝까지', '+' + REWARD.lecall, '사상가마다 한 번'],
      ['사상 비교 주제 처음 열기', '+' + REWARD.vs, '주제마다 한 번'],
      ['족보 답안 설계 처음 펼치기', '+' + REWARD.ex, '문항마다 한 번'],
      ['매일 첫 방문', '+5~10', '연속으로 오면 하루에 1개씩 늘어요']
    ];
    var h = '<header class="cl-head"><span class="lbl">Closet</span><h1>' + esc(S.name) + '의 옷장<i>.</i></h1><p>읽음 표시를 누르고, 비교 주제를 열고, 족보 답안 설계를 펼칠 때마다 당근이 쌓입니다. 아이템을 누르면 먼저 입혀 볼 수 있고, 마음에 들면 당근으로 사 주세요. 고른 차림은 사이트 곳곳의 ' + esc(S.name) + '가 그대로 입고 나옵니다.</p></header>';
    h += '<div class="closet"><section class="fit" aria-label="피팅룸"><div class="fit-stage tilt" data-tilt="5"><div class="nm"><label><span class="lbl">Name</span><br><input id="rbname" maxlength="8" value="' + esc(S.name) + '" aria-label="토끼 이름" autocomplete="off"></label><span class="chip pink">모은 아이템 ' + nOwn + ' / ' + nAll + '</span></div><div id="fitrb"></div></div>' +
      '<div class="purse">' + CR + '<div><b data-c>' + S.c + '</b><br><span>당근</span></div><small>' + (v.streak > 1 ? '연속 방문 ' + v.streak + '일째' : '오늘도 와 줘서 고마워요') + '<br>모은 당근 총 ' + totalEarned() + '개</small></div>' +
      '<div class="fit-info" id="fitinfo" aria-live="polite"></div>' +
      '<div class="fit-tools"><button class="btn mag" type="button" id="rand">무작위 코디</button><button class="btn mag" type="button" id="reset">처음 차림으로</button></div></section>' +
      '<section class="racks" aria-label="아이템"><div class="rack-tabs" role="tablist" aria-label="아이템 종류">' + R.SLOTS.map(function (sl) { return '<button type="button" role="tab" data-slot="' + sl.id + '" aria-selected="' + (sl.id === S.ctab) + '">' + sl.name + '<small>' + sl.en + '</small></button>'; }).join('') + '</div><div class="rack" id="rack" role="tabpanel"></div></section></div>';
    h += '<section class="earn"><div><h3>당근 버는 법</h3><ul>' + earn.map(function (e) { return '<li><span>' + e[0] + '<small>' + e[2] + '</small></span><b>' + e[1] + CR + '</b></li>'; }).join('') + '</ul><p class="muted" style="font-size:12.5px;margin-top:10px">읽음 표시를 꺼도 한 번 받은 당근은 그대로예요. 기록은 이 브라우저에만 저장됩니다.</p></div>' +
      '<div class="ach"><h3>업적으로 여는 아이템</h3><ul>' + Object.keys(R.ACH).map(function (a) {
        var it = achItem(a), p = ACHP[a](), ok = achDone(a);
        return '<li class="' + (ok ? 'ok' : '') + '"><span><b>' + esc(it.name) + '</b><small>' + esc(R.ACH[a].how) + '</small></span><span class="ap"><span class="bar"><i style="width:' + (ok ? 100 : Math.round(Math.min(1, p[1] ? p[0] / p[1] : 0) * 100)) + '%"></i></span>' + (ok ? '해금!' : p[0] + ' / ' + p[1]) + '</span></li>';
      }).join('') + '</ul></div></section>';
    return h;
  }
  function totalEarned() { var n = 0; Object.keys(S.earned).forEach(function (k) { n += +S.earned[k] || 0; }); return n; }
  function bindCloset() {
    var sel = null, trial = look();
    var fit = $('#fitrb'), info = $('#fitinfo'), rack = $('#rack');
    function state(it) { return look()[it.slot] === it.id ? 'on' : owns(it) ? 'owned' : it.ach ? 'locked' : 'shop'; }
    function thumb(it) { var base = { fur: look().fur, ears: look().ears, hat: 'h-none', held: 'p-none' }; base[it.slot] = it.id; return R.render(base, { crop: slotOf(it.slot).crop }); }
    function tag(it, st) {
      if (st === 'on') return '<span class="pr"><em>입는 중</em></span>';
      if (st === 'owned') return '<span class="pr"><em>보유</em></span>';
      if (st === 'locked') return '<span class="pr"><em class="lock">업적</em></span>';
      return '<span class="pr' + (it.price > S.c ? ' short' : '') + '">' + CR + it.price + '</span>';
    }
    function drawFit() { fit.innerHTML = rabbit(S.name + ' 쓰다듬기', trial); }
    function drawTabs() { $$('.rack-tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.slot === S.ctab)); }); }
    function drawRack() {
      rack.innerHTML = R.ITEMS.filter(function (it) { return it.slot === S.ctab; }).map(function (it, i) {
        var st = state(it);
        return '<button type="button" class="tile fx tilt ' + st + (sel === it.id ? ' sel' : '') + '" data-tilt="10" style="--i:' + i + '" data-id="' + it.id + '" aria-pressed="' + (sel === it.id) + '"><span class="th">' + thumb(it) + '</span><span class="nm">' + esc(it.name) + '</span>' + tag(it, st) + '</button>';
      }).join('');
    }
    function drawInfo() {
      if (!sel) {
        var L = look(), worn = R.SLOTS.filter(function (s) { return !/-none$/.test(L[s.id]) && L[s.id] !== R.DEFAULT[s.id]; }).map(function (s) { return esc(R.BY[L[s.id]].name); });
        info.innerHTML = '<div class="fi-head"><b>무엇을 입혀 볼까요?</b></div><p>아래 목록에서 아이템을 누르면 ' + esc(S.name) + '에게 먼저 입혀 봐요. 지금 차림: ' + (worn.length ? worn.join(', ') : '기본 차림(분홍 리본 · 당근)') + '</p>';
        return;
      }
      var it = R.BY[sel], st = state(it), act;
      if (st === 'on') act = '<span class="chip pink">지금 입는 중</span>';
      else if (st === 'owned') act = '<button class="btn pri mag" type="button" id="fwear">입히기</button>';
      else if (st === 'locked') { var p = ACHP[it.ach](); act = '<span class="need">🔒 ' + esc(R.ACH[it.ach].how) + ' (' + p[0] + ' / ' + p[1] + ')</span>'; }
      else if (S.c >= it.price) act = '<button class="btn pri mag" type="button" id="fbuy">' + CR + it.price + '개로 사 주기</button>';
      else act = '<button class="btn" type="button" disabled>' + CR + it.price + '</button><span class="need">당근 ' + (it.price - S.c) + '개 더 모으면 살 수 있어요</span>';
      info.innerHTML = '<div class="fi-head"><b>' + esc(it.name) + '</b><span class="chip">' + esc(slotOf(it.slot).name) + '</span></div>' + (it.desc ? '<p>' + esc(it.desc) + '</p>' : '') + '<div class="fi-act">' + act + (st !== 'on' ? '<button class="btn" type="button" id="fback">벗기</button>' : '') + '</div>';
      var w = $('#fwear'), b = $('#fbuy'), bk = $('#fback');
      if (w) w.addEventListener('click', function () { wear(it, false); });
      if (b) b.addEventListener('click', function () {
        if (S.c < it.price || owns(it)) return;
        S.c -= it.price; S.owned[it.id] = Date.now(); wear(it, true);
      });
      if (bk) bk.addEventListener('click', function () { sel = null; trial = look(); drawAll(); });
    }
    function wear(it, bought) {
      S.look[it.slot] = it.id; save(); refreshWallet(); refreshLook();
      sel = null; trial = look(); drawAll();
      var rb = $('.rb', fit), r = rb.getBoundingClientRect();
      hop(rb, bought ? 'spin' : 'hop');
      if (bought) { burst(r.left + r.width / 2, r.top + r.height / 2, 34, 200); toast('<b>' + esc(it.name) + '</b> 구입! 바로 입혀 줬어요'); }
      else { burst(r.left + r.width / 2, r.top + r.height * .4, 10, 90); toast(esc(it.name) + ' 입었어요'); }
    }
    function pick(id) {
      var it = R.BY[id]; if (!it) return;
      sel = id; trial = look(); trial[it.slot] = id;
      drawFit(); drawInfo(); drawRack();
      hop($('.rb', fit));
    }
    function drawAll() { drawFit(); drawInfo(); drawTabs(); drawRack(); }
    rack.addEventListener('click', function (e) { var t = e.target.closest('.tile'); if (t) pick(t.dataset.id); });
    $$('.rack-tabs button').forEach(function (b) { b.addEventListener('click', function () { S.ctab = b.dataset.slot; save(); try { history.replaceState(null, '', '#closet.' + S.ctab); } catch (e) { } drawTabs(); drawRack(); }); });
    $('#rbname').addEventListener('input', function (e) {
      var v = e.target.value.trim(); S.name = v || '콩이'; save();
      var h1 = $('.cl-head h1'); if (h1) h1.innerHTML = esc(S.name) + '의 옷장<i>.</i>';
    });
    $('#rand').addEventListener('click', function () {
      R.SLOTS.forEach(function (s) { var own = R.ITEMS.filter(function (it) { return it.slot === s.id && owns(it); }); if (own.length) S.look[s.id] = own[Math.floor(Math.random() * own.length)].id; });
      save(); refreshLook(); sel = null; trial = look(); drawAll();
      var rb = $('.rb', fit), r = rb.getBoundingClientRect(); hop(rb, 'spin'); burst(r.left + r.width / 2, r.top + r.height / 2, 16, 140);
    });
    $('#reset').addEventListener('click', function () { S.look = {}; save(); refreshLook(); sel = null; trial = look(); drawAll(); hop($('.rb', fit)); });
    drawAll();
  }

  /* ───────── 검색 ───────── */
  var IDX = null;
  function buildIndex() {
    IDX = [];
    ORDER.forEach(function (tid) {
      var t = T[tid];
      t.lecture.forEach(function (s) { IDX.push({ h: hashFor(tid, 'l', s.id), t: t.short + ' · ' + s.title, x: plain(s.body) }); });
      t.textbook.forEach(function (s) { IDX.push({ h: hashFor(tid, 'tb', s.id), t: t.short + ' · 교재 · ' + s.title, x: plain(s.body) }); });
      t.questions.forEach(function (q, i) { IDX.push({ h: hashFor(tid, 'q', 'q' + i), t: t.short + ' · 질문 · ' + q.q, x: plain(q.a) }); });
    });
    READINGS.forEach(function (x) { if (T[x.thinker]) IDX.push({ h: hashFor(x.thinker, 'rd', 'r-' + x.id), t: '리딩 · ' + x.author + ' · ' + x.title, x: plain(x.gist + ' ' + x.body) }); });
    TOPICS.forEach(function (tp) { var txt = ''; Object.keys(tp.points || {}).forEach(function (k) { (tp.points[k] || []).forEach(function (p) { txt += ' ' + (T[k] ? T[k].short : '') + ' ' + p.t; }); }); IDX.push({ h: '#vs.' + tp.id, t: '비교 · ' + tp.label, x: plain(tp.q + ' ' + (tp.lead || '') + txt) }); });
    PAIRS.forEach(function (p) { if (T[p.a] && T[p.b]) IDX.push({ h: '#vs', t: '비교 · ' + T[p.a].short + ' × ' + T[p.b].short + ' · ' + p.title, x: plain(p.line + ' ' + p.points.map(function (x) { return x.t; }).join(' ')) }); });
    if (EXAM) EXAM.parts.forEach(function (pt) { pt.qs.forEach(function (q) { IDX.push({ h: '#exam.e' + q.n, t: '족보 ' + q.n + '번', x: plain(q.text + ' ' + (q.box || '') + ' ' + (q.subs || []).join(' ') + ' ' + (q.outline || '')) }); }); });
  }
  function doSearch(q) {
    if (!IDX) buildIndex();
    var toks = q.trim().toLowerCase().split(/\s+/).filter(Boolean), out = $('#sres');
    if (!toks.length) { out.innerHTML = '<li class="empty">예: 아노미, 군사형, 잉여가치, 클로틸드, 신채호</li>'; return; }
    var res = IDX.map(function (it) {
      var hay = (it.t + ' ' + it.x).toLowerCase(), sc = 0;
      for (var i = 0; i < toks.length; i++) { var c = hay.split(toks[i]).length - 1; if (!c) return null; sc += c + (it.t.toLowerCase().indexOf(toks[i]) >= 0 ? 8 : 0); }
      return { it: it, sc: sc };
    }).filter(Boolean).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 30);
    if (!res.length) { out.innerHTML = '<li class="empty">‘' + esc(q) + '’가 들어간 곳이 없습니다. 다른 말로 찾아보세요.</li>'; return; }
    var re = new RegExp('(' + toks.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'gi');
    out.innerHTML = res.map(function (r, n) {
      var x = r.it.x, p = x.toLowerCase().indexOf(toks[0]), a = Math.max(0, p - 40), snip = (a ? '…' : '') + x.slice(a, a + 120) + '…';
      return '<li><a href="' + r.it.h + '"' + (n === 0 ? ' class="sel"' : '') + '><div class="st">' + esc(r.it.t).replace(re, '<mark>$1</mark>') + '</div><div class="ss">' + esc(snip).replace(re, '<mark>$1</mark>') + '</div></a></li>';
    }).join('');
  }
  function openSearch() { $('#search').hidden = false; var i = $('#sq'); i.value = ''; doSearch(''); setTimeout(function () { i.focus(); }, 20); }
  function closeSearch() { $('#search').hidden = true; }

  /* ───────── 라우터 · 전환 ───────── */
  function parse(h) {
    h = (h || '').replace(/^#/, ''); var m;
    if ((m = h.match(/^t-([a-z]+)(?:-(q|tb|rd))?(?:\.([\w-]+))?$/)) && T[m[1]]) return { v: 't', id: m[1], tab: m[2] || 'l', anchor: m[3] || '' };
    if ((m = h.match(/^vs(?:\.([\w-]+))?$/))) return { v: 'vs', anchor: m[1] || '' };
    if (/^(map|timeline)/.test(h)) return { v: 'vs', anchor: '' };
    if ((m = h.match(/^exam(?:\.([\w-]+))?$/))) return { v: 'exam', anchor: m[1] || '' };
    if ((m = h.match(/^closet(?:\.([\w-]+))?$/))) return { v: 'closet', anchor: m[1] || '' };
    return { v: 'home' };
  }
  function kindOf(a, b) {
    if (!a) return 'none';
    if (a.v === 't' && b.v === 't' && a.id === b.id) return a.tab === b.tab ? 'step' : 'tab';
    if (a.v === b.v && b.v !== 't') return 'none';
    return 'page';
  }
  var cur = null;
  function render() {
    var r = parse(location.hash), kind = kindOf(cur, r);
    if (cur && cur.v === 'vs' && r.v === 'vs') { var tp = topicById(r.anchor) || topicById(S.topic) || TOPICS[0]; if (tp) renderVsBody(tp.id); cur = r; return; }
    if (cur && cur.v === 'closet' && r.v === 'closet') { cur = r; return; }
    var step = kind === 'step';
    var html = r.v === 't' ? viewThinker(r) : r.v === 'vs' ? viewVs(r) : r.v === 'exam' ? viewExam() : r.v === 'closet' ? viewCloset(r) : viewHome();
    app.innerHTML = '<div class="view"' + (step ? ' style="animation:none"' : '') + '>' + html + '</div>';
    $$('#nav a').forEach(function (a) { a.setAttribute('aria-current', a.dataset.v === (r.v === 't' ? r.id : r.v) ? 'page' : 'false'); });
    var w = $('#wallet'); if (w) w.setAttribute('aria-current', r.v === 'closet' ? 'page' : 'false');
    if (r.v === 't') bindThinker(r);
    if (r.v === 'vs') bindVs(r);
    if (r.v === 'exam') bindExam();
    if (r.v === 'home') bindHome();
    if (r.v === 'closet') bindCloset();
    var bd = $('#buddy'); if (bd) bd.hidden = r.v === 'home' || r.v === 'closet';
    document.title = (r.v === 't' ? T[r.id].name + ' · ' : r.v === 'vs' ? '사상 비교 · ' : r.v === 'exam' ? '족보 · ' : r.v === 'closet' ? S.name + '의 옷장 · ' : '') + '사회학사 1차';
    if (r.v === 't') { S.last = location.hash.replace(/^#/, ''); save(); }
    var th = $('.thread');
    if (th && !reduced && (step || kind === 'tab')) th.classList.add(step ? (cur.idx >= 0 && r.idx < cur.idx ? 'in-l' : 'in-r') : 'in-f');
    var target = r.v === 'exam' && r.anchor ? document.getElementById(r.anchor) : null;
    if (target) setTimeout(function () { target.scrollIntoView({ block: 'start' }); var d = target.querySelector('details'); if (d) d.open = true; }, 30);
    else if (step && !mqMobile.matches) {
      var chat = $('.chat'); if (chat) { var top = chat.getBoundingClientRect().top + window.scrollY - 100; if (window.scrollY > top) window.scrollTo(0, top); }
    } else window.scrollTo(0, 0);
    cur = r;
    schedule();
  }

  /* 페이지가 바뀔 때: 누른 자리에서 분홍 커튼이 번지고, 토끼가 목적지 이름을 들고 뛴다 */
  var curtain = $('#curtain'), coverT = 0, outT = 0, pt = null;
  document.addEventListener('pointerdown', function (e) { pt = { x: e.clientX, y: e.clientY }; }, true);
  function titleFor(r) {
    if (r.v === 't') return [NUM[r.id] + ' · ' + T[r.id].en, T[r.id].name];
    if (r.v === 'vs') return ['Compare', '사상 비교'];
    if (r.v === 'exam') return ['Past exam', '족보'];
    if (r.v === 'closet') return ['Closet', S.name + '의 옷장'];
    return ['History of Sociology', '사회학사'];
  }
  function onHash() {
    var r = parse(location.hash);
    if (coverT) return; /* 커튼이 덮는 중이면 덮은 뒤에 마지막 주소로 그린다 */
    if (reduced || !curtain || kindOf(cur, r) !== 'page') { render(); return; }
    var p = pt || { x: innerWidth / 2, y: innerHeight / 2 }, t = titleFor(r);
    curtain.style.setProperty('--vx', p.x + 'px'); curtain.style.setProperty('--vy', p.y + 'px');
    $('.ct', curtain).innerHTML = '<span class="rb">' + R.render(look()) + '</span><small>' + esc(t[0]) + '</small><b>' + esc(t[1]) + '</b>';
    clearTimeout(outT);
    curtain.hidden = false; curtain.className = 'curtain'; void curtain.offsetWidth; curtain.className = 'curtain in';
    coverT = setTimeout(function () {
      coverT = 0; render();
      curtain.className = 'curtain out';
      outT = setTimeout(function () { curtain.hidden = true; curtain.className = 'curtain'; }, 600);
    }, 540);
    pt = null;
  }

  /* ───────── 마우스: 토끼 시선 · 글자 · 빛 · 기울기 · 자석 ───────── */
  var M = { x: innerWidth / 2, y: innerHeight * .3, raf: 0, tilt: null, mag: null };
  function tick() {
    M.raf = 0;
    var W = innerWidth, H = innerHeight, root = document.documentElement.style;
    root.setProperty('--px', (M.x / W - .5).toFixed(3)); root.setProperty('--py', (M.y / H - .5).toFixed(3));
    $$('.rb').forEach(function (el) {
      var r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > H) return;
      var dx = (M.x - (r.left + r.width / 2)) / Math.max(220, W * .32), dy = (M.y - (r.top + r.height * .42)) / Math.max(220, H * .38);
      el.style.setProperty('--lx', clamp(dx).toFixed(3)); el.style.setProperty('--ly', clamp(dy).toFixed(3));
    });
    $$('.hl').forEach(function (el) {
      var r = el.getBoundingClientRect(), d = Math.hypot(M.x - (r.left + r.width / 2), M.y - (r.top + r.height / 2)), p = Math.max(0, 1 - d / 280);
      el.style.setProperty('--p', (p * p).toFixed(3));
    });
  }
  function schedule() { if (!M.raf && !reduced) M.raf = requestAnimationFrame(tick); }
  function unTilt() { if (M.tilt) { M.tilt.classList.remove('on'); M.tilt.style.removeProperty('--rx'); M.tilt.style.removeProperty('--ry'); M.tilt = null; } }
  function unMag() { if (M.mag) { M.mag.style.removeProperty('--gx'); M.mag.style.removeProperty('--gy'); M.mag = null; } }
  if (!reduced) {
    document.addEventListener('pointermove', function (e) {
      M.x = e.clientX; M.y = e.clientY; schedule();
      if (e.pointerType !== 'mouse' || !e.target.closest) return;
      var fx = e.target.closest('.fx');
      if (fx) { var a = fx.getBoundingClientRect(); fx.style.setProperty('--mx', (e.clientX - a.left).toFixed(0) + 'px'); fx.style.setProperty('--my', (e.clientY - a.top).toFixed(0) + 'px'); }
      var tl = e.target.closest('.tilt');
      if (tl !== M.tilt) unTilt();
      if (tl) { var b = tl.getBoundingClientRect(), nx = (e.clientX - b.left) / b.width - .5, ny = (e.clientY - b.top) / b.height - .5, amt = +tl.dataset.tilt || 8; M.tilt = tl; tl.classList.add('on'); tl.style.setProperty('--rx', (-ny * amt).toFixed(2) + 'deg'); tl.style.setProperty('--ry', (nx * amt).toFixed(2) + 'deg'); }
      var mg = e.target.closest('.mag');
      if (mg !== M.mag) unMag();
      if (mg) { var g = mg.getBoundingClientRect(); M.mag = mg; mg.style.setProperty('--gx', ((e.clientX - g.left - g.width / 2) * .22).toFixed(1) + 'px'); mg.style.setProperty('--gy', ((e.clientY - g.top - g.height / 2) * .32).toFixed(1) + 'px'); }
    }, { passive: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { unTilt(); unMag(); } });
    window.addEventListener('scroll', schedule, { passive: true });
  }

  /* ───────── 공통 ───────── */
  $('#nav').innerHTML = ORDER.map(function (tid) { return '<a href="#t-' + tid + '" data-v="' + tid + '">' + mk(tid) + esc(T[tid].short) + '</a>'; }).join('') +
    '<a href="#vs" data-v="vs">사상 비교</a><a href="#exam" data-v="exam">족보</a>';
  var wal = $('#wallet'); if (wal) wal.innerHTML = '<span class="face" aria-hidden="true"></span>' + CR + '<b data-c>' + S.c + '</b>';
  var bud = $('#buddy'); if (bud) bud.innerHTML = rabbit();
  refreshLook();
  $('#searchbtn').addEventListener('click', openSearch);
  $('#search').addEventListener('click', function (e) { if (e.target.id === 'search') closeSearch(); });
  $('#sq').addEventListener('input', function (e) { doSearch(e.target.value); });
  $('#sres').addEventListener('click', function (e) { if (e.target.closest('a')) closeSearch(); });
  document.addEventListener('click', function (e) { var rb = e.target.closest && e.target.closest('.rb'); if (rb && !rb.closest('.curtain')) pet(rb); });
  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement || {}).tagName || '';
    var rb = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('rb') ? document.activeElement : null;
    if (rb && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pet(rb); return; }
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(tag)) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
    if (e.key === 'Enter' && !$('#search').hidden) { var a = $('#sres a.sel'); if (a) { location.hash = a.getAttribute('href'); closeSearch(); } }
  });
  if (mqMobile.addEventListener) mqMobile.addEventListener('change', function () { if (cur && cur.v === 't') { cur = null; render(); } });
  applyFs();

  /* 첫 방문 인사 · 예전 읽음 기록도 당근으로 */
  var back = syncPast(), ci = checkIn();
  save(); refreshWallet();
  if (ci && ci.amt) hello = '오늘 첫 방문! 당근 <b>+' + ci.amt + '</b>' + (ci.streak > 1 ? ' · 연속 ' + ci.streak + '일째' : '') + (back ? '<br>지금까지 읽은 기록으로 <b>+' + back + '</b>도 받았어요.' : '');
  else if (back) hello = '지금까지 읽은 기록으로 당근 <b>+' + back + '</b>을 받았어요!';
  window.addEventListener('hashchange', onHash);
  render();
  if ((ci && ci.amt) || back) {
    var msg = (ci && ci.amt ? '오늘 첫 방문 당근 <b>+' + ci.amt + '</b>' : '') + (ci && ci.amt && back ? ' · ' : '') + (back ? '지난 기록 <b>+' + back + '</b>' : '');
    setTimeout(function () { toast(msg); var w2 = $('#wallet'); if (w2) { w2.classList.add('bump'); } }, 900);
  }
  setTimeout(checkAch, (ci && ci.amt) || back ? 4600 : 800);
})();
