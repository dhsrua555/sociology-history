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
  var EXAMS = E.exams || (E.exam ? [E.exam] : []);
  var QBY = {};
  EXAMS.forEach(function (ex) { ex.parts.forEach(function (p) { p.qs.forEach(function (q) { q.id = (ex.pre || '') + q.n; q.ex = ex; q.label = q.no ? (p.tag || p.kind) + ' ' + q.no : q.n + '번'; QBY[q.id] = q; }); }); });
  var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  /* 사상가 목록은 데이터에서 만든다 — 새 사상가 파일을 넣으면 자동으로 늘어난다 */
  var PALETTE = ['#5B6CFF', '#F29D12', '#FF5A4E', '#9B5CFF', '#16B39A', '#F0508C', '#6DBA3A', '#2E9BE6'];
  var ORDER = Object.keys(T).sort(function (a, b) { return (T[a].week || 0) - (T[b].week || 0) || (T[a].born || 0) - (T[b].born || 0); });
  var NUM = {};
  var NW = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'][ORDER.length] || String(ORDER.length);
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
  var S = { read: {}, filt: { slide: 1, talk: 1, sum: 1, deep: 1, exam: 1, aux: 1 }, who: null, topic: '', exf: 'all', fs: 0, last: '', c: 0, earned: {}, owned: {}, look: {}, visit: null, name: '콩이', ctab: 'hat' };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { var o = JSON.parse(raw); if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { S[k] = o[k]; }); }
    else {
      var old = JSON.parse(localStorage.getItem('ecrin-sh-v1') || 'null');
      if (old && old.read) Object.keys(old.read).forEach(function (k) { S.read[k.replace(/^(\w+)\.t\./, '$1.tb.')] = 1; });
    }
  } catch (e) { }
  ['read', 'earned', 'owned', 'look'].forEach(function (k) { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
  if (!S.filt || typeof S.filt !== 'object') S.filt = { slide: 1, talk: 1, sum: 1, deep: 1, exam: 1, aux: 1 };
  if (S.filt.deep === undefined) S.filt.deep = 1;
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
  function plain(s) { return String(s || '').replace(/^:::.*$/gm, ' ').replace(/^\[(big|flow|vs|cards|why|quote|table|note)\]/gm, ' ').replace(/^@\s/gm, ' ').replace(/ :: /g, ' ').replace(/^\|[-: |]+\|?\s*$/gm, ' ').replace(/\*\*|==|^#+\s|^>\s?|^\s*([-*]|\d+\.)\s/gm, ' ').replace(/[|*]/g, ' ').replace(/\s+/g, ' ').trim(); }
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
  function outlineOf(q) { if (q.outline) return q.outline; var s = q.same && QBY[q.same]; return s ? s.outline || '' : ''; }
  function allExamQs() { var qs = []; EXAMS.forEach(function (ex) { ex.parts.forEach(function (p) { p.qs.forEach(function (q) { qs.push(q); }); }); }); return qs; }
  function examOutlines() { return allExamQs().filter(function (q) { return !!outlineOf(q); }); }
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
    exam: function () { var qs = examOutlines(); return [qs.filter(function (q) { return S.earned['ex.' + q.id] != null; }).length, qs.length]; },
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
    return '<div class="tbl' + (head.length <= 2 ? ' narrow' : '') + '"><table><thead><tr>' + head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
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
      /* 상자 안의 시각 블록([flow]·[vs]…)과 출처 줄(@ 교재 · 강의 …) */
      if (/^\[(big|flow|vs|cards|why|quote|table|note)\]/.test(L)) { flush(); var ch = []; while (i < lines.length && !/^\s*$/.test(lines[i])) ch.push(lines[i++]); html += '<div class="b-vis">' + slideHTML(ch.join('\n')) + '</div>'; continue; }
      if ((m = L.match(/^@\s+(.*)$/))) { flush(); html += '<p class="srcs">' + m[1].split(/\s+·\s+/).map(srcChip).join('') + '</p>'; i++; continue; }
      pbuf.push(L.trim()); i++;
    }
    flush();
    return html;
  }
  var KIND = { talk: ['b-talk', '강의 녹음'], slide: ['b-slide', '교안'], deep: ['b-deep', '풀어 보기'], exam: ['b-exam', '시험 포인트'], link: ['b-aux b-link', '다른 사상가와 연결'], note: ['b-aux b-note', '참고'] };
  function callout(kind, meta, lines) {
    var k = KIND[kind] || KIND.note;
    /* 풀어 보기: 개념 이름을 제목으로 크게 */
    if (kind === 'deep') return '<div class="b b-deep"><div class="lab"><span class="k">' + k[1] + '</span></div>' + (meta ? '<p class="dt">' + inline(meta) + '</p>' : '') + '<div class="tx">' + inner(lines) + '</div></div>';
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
      /* 비교 슬라이드와 같은 시각 블록: [flow]·[vs]·[table]… 부터 빈 줄까지 */
      if (/^\[(big|flow|vs|cards|why|quote|table|note)\]/.test(L)) {
        flush(); var ch = [];
        while (i < lines.length && !/^\s*$/.test(lines[i])) ch.push(lines[i++]);
        out.push('<div class="b ' + (mode === 'lec' ? 'b-sum' : 'b-book') + ' b-vis">' + slideHTML(ch.join('\n')) + '</div>'); continue;
      }
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
    var nQ = allExamQs().length;
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
      h += '<section class="band"><div class="band-h"><div><span class="lbl">02 · Compare</span><h2>주제로 나란히 보기<i>.</i></h2></div><p>같은 질문에 ' + NW + ' 사람이 각각 무엇이라 했는지 한 화면에 모았습니다. 문장마다 출처(교안·강의·교재·리딩)가 붙어 있습니다.</p></div><div class="topics2">' +
        TOPICS.map(function (tp, i) { return '<a class="fx tilt" data-tilt="7" href="#vs.' + tp.id + '" style="--i:' + i + '"><span class="mk">' + two(i + 1) + '</span><b>' + esc(tp.label) + '</b><small>' + esc(tp.q) + '</small>' + (tp.exam ? '<span class="chip pink">' + esc(tp.exam) + '</span>' : '') + '</a>'; }).join('') + '</div></section>';
    }

    var src = T[ORDER[0]] ? T[ORDER[0]].lecture.map(function (s) { return s.body; }).join('\n') : '';
    var sSlide = firstCallout(src, 'slide', 420), sTalk = firstCallout(src, 'talk', 360), sExam = firstCallout(src, 'exam', 560);
    var sDeep = (function () { var m = /^:::\s*deep([^\n]*)\n([\s\S]*?)\n:::\s*$/m.exec(src); return m ? '::: deep' + m[1] + '\n' + m[2].split(/\n(?=### )/)[0] + '\n:::' : ''; })();
    h += '<section class="band"><div class="band-h"><div><span class="lbl">03 · How to read</span><h2>자료는 모양으로 구분됩니다<i>.</i></h2></div><p>강의 정리 화면의 ‘보기’에서 종류별로 켜고 끌 수 있습니다. 교안만 훑거나 시험 포인트만 모아 볼 수 있습니다.</p></div><div class="legend">' +
      (sSlide ? '<div class="item">' + blocks(sSlide, 'lec') + '<p>흰 상자 = 강의 교안 원문</p></div>' : '') +
      (sTalk ? '<div class="item">' + blocks(sTalk, 'lec') + '<p>분홍 세로선 = 강의 녹음 (녹음 파일 · 시각)</p></div>' : '') +
      (sDeep ? '<div class="item">' + blocks(sDeep, 'lec') + '<p>연보라 상자 = 풀어 보기 (개념을 자료 안에서 차근차근 풀어 쓴 설명)</p></div>' : '') +
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
  var FK = [['slide', '교안', '#B9A6B2'], ['talk', '강의 녹음', 'var(--pink)'], ['sum', '정리', 'var(--ink-3)'], ['deep', '풀이', 'var(--lilac)'], ['exam', '시험 포인트', '#FF8CC6'], ['aux', '연결·참고', 'var(--line-2)']];
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

  /* ───────── 사상 비교: 슬라이드 마크업 ───────── */
  function splitSrc(t) { var m = /\s@([^@]+)$/.exec(t); return m ? [t.slice(0, m.index), m[1].trim()] : [t, '']; }
  function colorFor(label) { var s = plain(label || ''); for (var i = 0; i < ORDER.length; i++) if (s.indexOf(T[ORDER[i]].short) === 0) return T[ORDER[i]].color; return ''; }
  function chipOf(s) { return s ? '<span class="chip src">' + esc(s) + '</span>' : ''; }
  function slideHTML(src) {
    var out = '';
    String(src || '').replace(/\r/g, '').split(/\n\s*\n/).forEach(function (chunk) {
      var lines = chunk.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) return;
      var m = /^\[(\w+)\]\s*(.*)$/.exec(lines[0]), type = m ? m[1] : 'note', head = m ? m[2].trim() : '';
      var items = [], text = [], rows = [], cap = '', srcs = [];
      (m ? lines.slice(1) : lines).forEach(function (l) {
        if (/^@/.test(l)) { srcs.push(l.slice(1).trim()); return; }
        if (/^= /.test(l)) { cap = l.slice(2); return; }
        if (/^\|/.test(l)) { rows.push(l); return; }
        if (/^- /.test(l)) {
          var ps = splitSrc(l.slice(2)), t = ps[0], hot = /^\*/.test(t);
          if (hot) t = t.slice(1);
          var k = t.indexOf(' :: ');
          items.push({ h: k >= 0 ? t.slice(0, k) : '', d: k >= 0 ? t.slice(k + 4) : t, s: ps[1], hot: hot });
          return;
        }
        text.push(l);
      });
      var foot = (cap ? '<p class="cap">' + inline(cap) + '</p>' : '') + (srcs.length ? '<div class="srcs">' + srcs.map(chipOf).join('') + '</div>' : '');
      var ttl = head && type !== 'big' && type !== 'why' && type !== 'quote' && type !== 'vs' ? '<p class="sl-h">' + inline(head) + '</p>' : '';
      if (type === 'big') {
        out += '<div class="sl sl-big"><p class="bg">' + inline(head) + '</p>' + (text.length ? '<p class="sub">' + inline(text.join(' ')) + '</p>' : '') + foot + '</div>';
      } else if (type === 'flow') {
        out += '<div class="sl sl-flow">' + ttl + '<ol class="flow' + (items.length > 4 ? ' long' : '') + '" style="--n:' + items.length + '">' + items.map(function (it, i) {
          return '<li class="' + (it.hot ? 'hot' : '') + '" style="--i:' + i + '"><b>' + inline(it.h || it.d) + '</b>' + (it.h ? '<small>' + inline(it.d) + '</small>' : '') + chipOf(it.s) + '</li>';
        }).join('') + '</ol>' + foot + '</div>';
      } else if (type === 'vs') {
        var hs = head.split(' | '), labeled = items.some(function (it) { return it.h; }), cl = colorFor(hs[0]), cr = colorFor(hs[1]);
        out += '<div class="sl sl-vs"><div class="vsg' + (labeled ? '' : ' nolab') + (cl ? ' cl' : '') + '" style="' + (cl ? '--cl:' + cl + ';' : '') + (cr ? '--cr:' + cr : '') + '"><div class="vh l">' + inline(hs[0] || '') + '</div><div class="vx">VS</div><div class="vh r">' + inline(hs[1] || '') + '</div>' +
          items.map(function (it, i) {
            var c = it.d.split(' | ');
            return '<div class="vk">' + (it.h ? inline(it.h) : '<i></i>') + '</div><div class="vc l" style="--i:' + i + '">' + inline(c[0] || '') + '</div><div class="vc r" style="--i:' + i + '">' + inline(c[1] || '') + chipOf(it.s) + '</div>';
          }).join('') + '</div>' + foot + '</div>';
      } else if (type === 'cards') {
        out += '<div class="sl sl-cards">' + ttl + '<div class="cards">' + items.map(function (it, i) {
          return '<div class="cd' + (it.hot ? ' hot' : '') + '" style="--i:' + i + '"><span class="no">' + two(i + 1) + '</span><b>' + inline(it.h || it.d) + '</b>' + (it.h ? '<p>' + inline(it.d) + '</p>' : '') + chipOf(it.s) + '</div>';
        }).join('') + '</div>' + foot + '</div>';
      } else if (type === 'why') {
        out += '<div class="sl sl-why"><p class="wq"><span aria-hidden="true">?</span>' + inline(head) + '</p><ul>' + items.map(function (it, i) {
          return '<li style="--i:' + i + '"><b>' + inline(it.h || it.d) + '</b>' + (it.h ? '<span>' + inline(it.d) + '</span>' : '') + chipOf(it.s) + '</li>';
        }).join('') + '</ul>' + foot + '</div>';
      } else if (type === 'quote') {
        out += '<figure class="sl sl-quote"><blockquote>' + inline(text.join(' ')) + '</blockquote><figcaption>' + (head ? '<b>' + inline(head) + '</b>' : '') + srcs.map(chipOf).join('') + '</figcaption></figure>';
      } else if (type === 'table') {
        out += '<div class="sl sl-table">' + ttl + table(rows) + foot + '</div>';
      } else {
        out += '<div class="sl sl-note">' + inline(text.join(' ')) + foot + '</div>';
      }
    });
    return out;
  }
  function slidePlain(src) { return String(src || '').replace(/^\[\w+\]/gm, ' ').replace(/@[^\n]*/g, ' ').replace(/ :: | \| /g, ' ').replace(/[*=|-]/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ───────── 사상 비교: 화면 ───────── */
  function sidesOf(tp) { return (tp && tp.sides) || {}; }
  function tabsOf(tp) { return ORDER.filter(function (tid) { return sidesOf(tp)[tid]; }).concat(['wrap']); }
  function pairById(id) { for (var i = 0; i < PAIRS.length; i++) if (PAIRS[i].id === id) return PAIRS[i]; return null; }
  function vsCrumb(label, prev, next) {
    return '<nav class="crumb"><a class="btn back2" href="#vs">' + BACK + '사상 비교</a><span class="lbl">' + label + '</span><span class="pn">' +
      (prev ? '<a class="iconbtn" href="' + prev + '" aria-label="이전">' + BACK + '</a>' : '') + (next ? '<a class="iconbtn" href="' + next + '" aria-label="다음">' + ARROW + '</a>' : '') + '</span></nav>';
  }
  function viewVsHub() {
    var h = '<header class="vs-head"><span class="lbl">Compare</span><h1>사상 비교<i>.</i></h1><p>주제를 고르면 ' + NW + ' 사람의 핵심이 한 줄씩 나란히 놓이고, 한 사람씩 슬라이드처럼 넘겨 보며 자세히 볼 수 있습니다. 주제를 처음 열 때마다 당근 ' + REWARD.vs + '개.</p></header>';
    h += '<section class="band"><div class="band-h"><div><span class="lbl">01 · Topics</span><h2>주제로 비교하기<i>.</i></h2></div><p>점 ' + NW + ' 개는 ' + NW + ' 사람입니다. 채워진 점은 그 사람이 이 주제를 직접 다룬다는 뜻입니다.</p></div><div class="tgrid">' +
      TOPICS.map(function (tp, i) {
        var seen = S.earned['vs.' + tp.id] != null;
        return '<a class="tcard fx tilt" data-tilt="6" href="#vs.' + tp.id + '" style="--i:' + i + '"><span class="no">' + two(i + 1) + '</span><b>' + esc(tp.label) + '</b><small>' + esc(tp.q) + '</small>' +
          '<span class="dots">' + ORDER.map(function (tid) { return '<i class="' + (sidesOf(tp)[tid] ? 'on' : '') + '" style="--c:' + T[tid].color + '" title="' + esc(T[tid].short) + '"></i>'; }).join('') + '</span>' +
          (tp.exam ? '<span class="chip pink">' + esc(tp.exam) + '</span>' : '') + (seen ? '<span class="seen" title="열어 봄">✓</span>' : '') + '</a>';
      }).join('') + '</div></section>';
    h += '<section class="band"><div class="band-h"><div><span class="lbl">02 · Pairs</span><h2>두 사람씩 맞붙이기<i>.</i></h2></div><p>두 사람의 입장을 왼쪽·오른쪽에 놓고 주제별로 맞대어 봅니다.</p></div><div class="pgrid">' +
      PAIRS.filter(function (p) { return T[p.a] && T[p.b]; }).map(function (p, i) {
        return '<a class="pcard fx" href="#vs-pr.' + p.id + '" style="--i:' + i + ';--ca:' + T[p.a].color + ';--cb:' + T[p.b].color + '"><span class="duo">' + mk(p.a) + '<em>VS</em>' + mk(p.b) + '</span><b>' + esc(T[p.a].short + ' × ' + T[p.b].short) + '</b><span class="t">' + esc(p.title) + '</span><small>' + esc(p.line) + '</small>' + (p.exam ? '<span class="chip pink">' + esc(p.exam) + '</span>' : '') + '</a>';
      }).join('') + '</div></section>';
    h += '<section class="band"><div class="band-h"><div><span class="lbl">03 · More</span><h2>더 넓게 보기<i>.</i></h2></div></div><div class="mgrid">' +
      '<a class="mcard fx" href="#vs-all"><b>한눈에 표</b><small>' + TOPICS.length + '개 주제 × ' + NW + ' 사람의 한 줄 핵심을 표 하나에</small>' + ARROW + '</a>' +
      '<a class="mcard fx" href="#vs-lin"><b>받은 영향과 물려준 유산</b><small>누구에게 배웠고, 누구에게 넘겨주었나</small>' + ARROW + '</a></div></section>';
    return h;
  }
  function glanceHTML(tp, tab) {
    return '<section class="glance" aria-label="' + NW + ' 사람 한눈에"><div class="gl" style="--gn:' + ORDER.length + '">' + ORDER.map(function (tid) {
      var sd = sidesOf(tp)[tid], t = T[tid];
      if (!sd) return '<div class="gcard off" style="--c:' + t.color + '"><span class="hd">' + mk(tid) + '<b>' + esc(t.short) + '</b></span><p>자료에서 직접 다루지 않습니다.</p></div>';
      return '<button type="button" class="gcard" data-tab="' + tid + '" aria-pressed="' + (tab === tid) + '" style="--c:' + t.color + '"><span class="hd">' + mk(tid) + '<b>' + esc(t.short) + '</b></span><p>' + inline(sd.key) + '</p></button>';
    }).join('') + '</div></section>';
  }
  function tabsHTML(tp, tab) {
    return '<div class="stabs" role="tablist" aria-label="보고 싶은 사람">' + tabsOf(tp).map(function (id) {
      var on = id === tab;
      return '<button type="button" role="tab" data-tab="' + id + '" aria-selected="' + on + '"' + (id === 'wrap' ? ' class="wr"' : ' style="--c:' + T[id].color + '"') + '>' + (id === 'wrap' ? '차이 정리' : mk(id) + esc(T[id].short)) + '</button>';
    }).join('') + '<span class="kb" aria-hidden="true">← → 키로 넘기기</span></div>';
  }
  function pairMini(p, x) {
    return '<a class="pmini" href="#vs-pr.' + p.id + '"><span class="duo">' + mk(p.a) + mk(p.b) + '</span><b>' + inline(x.t) + '</b><span class="ab"><span style="--c:' + T[p.a].color + '"><em>' + esc(T[p.a].short) + '</em>' + inline(x.a) + '</span><span style="--c:' + T[p.b].color + '"><em>' + esc(T[p.b].short) + '</em>' + inline(x.b) + '</span></span></a>';
  }
  function relatedPairs(tp, tid) {
    var list = [];
    PAIRS.forEach(function (p) {
      if (!T[p.a] || !T[p.b] || (tid && p.a !== tid && p.b !== tid)) return;
      p.points.forEach(function (x) { if (x.topic === tp.id) list.push(pairMini(p, x)); });
    });
    return list;
  }
  function panelHTML(tp, tab) {
    var tabs = tabsOf(tp), i = tabs.indexOf(tab), prev = tabs[i - 1], next = tabs[i + 1];
    function nm(id) { return id === 'wrap' ? '차이 정리' : T[id].short; }
    var foot = '<footer class="sfoot">' + (prev ? '<button type="button" class="btn" data-tab="' + prev + '">' + BACK + esc(nm(prev)) + '</button>' : '<span></span>') +
      '<span class="pg">' + two(i + 1) + ' / ' + two(tabs.length) + '</span>' + (next ? '<button type="button" class="btn pri" data-tab="' + next + '">' + esc(nm(next)) + ARROW + '</button>' : '<span></span>') + '</footer>';
    if (tab === 'wrap') {
      var rel = relatedPairs(tp, null), W = ORDER.filter(function (tid) { return T[tid]; });
      return '<article class="slide wrap">' +
        '<header class="sh"><span class="sq">차이 정리</span><span class="pg2">' + esc(tp.label) + '</span></header>' +
        '<h2 class="skey">' + esc(tp.q) + '</h2>' +
        '<div class="sbody">' + slideHTML(tp.wrap) + '</div>' +
        (rel.length ? '<div class="sl sl-rel"><p class="sl-h">두 사람씩 맞대 보면</p><div class="relwrap">' + (W.length > 1 ? '<div class="relmap">' + relmap(tp, W) + '</div>' : '') + '<div class="pminis">' + rel.join('') + '</div></div></div>' : '') +
        foot + '</article>';
    }
    var t = T[tab], sd = sidesOf(tp)[tab], rp = relatedPairs(tp, tab);
    return '<article class="slide" style="--c:' + t.color + '">' +
      '<header class="sh">' + mk(tab) + '<span class="who"><b>' + esc(t.name) + '</b><small>' + esc(t.en) + '</small></span><a class="to" href="#t-' + tab + '">강의 정리로 →</a></header>' +
      '<h2 class="skey">' + inline(sd.key) + '</h2>' +
      (sd.tags && sd.tags.length ? '<div class="stags">' + sd.tags.map(function (g) { return '<span>#' + esc(g) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="sbody">' + slideHTML(sd.body) + '</div>' +
      (rp.length ? '<div class="sl sl-rel"><p class="sl-h">이 주제로 맞붙는 두 사람</p><div class="pminis">' + rp.join('') + '</div></div>' : '') +
      foot + '</article>';
  }
  function viewVsTopic(r) {
    var tp = topicById(r.anchor), i = TOPICS.indexOf(tp), tabs = tabsOf(tp), tab = tabs.indexOf(r.tab) >= 0 ? r.tab : tabs[0];
    r.tab = tab;
    var prev = TOPICS[i - 1], next = TOPICS[i + 1];
    var h = vsCrumb('주제 ' + two(i + 1) + ' / ' + two(TOPICS.length), prev ? '#vs.' + prev.id : '', next ? '#vs.' + next.id : '');
    h += '<header class="tp-head"><span class="no">' + two(i + 1) + '</span><div><h1>' + esc(tp.label) + '<i>.</i></h1><p class="q">' + esc(tp.q) + '</p></div>' +
      (tp.exam ? '<a class="chip pink" href="#exam">' + esc(tp.exam) + ' →</a>' : '') + '</header>' +
      (tp.lead ? '<blockquote class="tp-lead">' + inline(tp.lead) + '</blockquote>' : '');
    h += glanceHTML(tp, tab) + tabsHTML(tp, tab) + '<section class="deck" id="deck">' + panelHTML(tp, tab) + '</section>';
    h += '<nav class="th-nav vs-nav" aria-label="앞뒤 주제">' + (prev ? '<a href="#vs.' + prev.id + '"><small>← 이전 주제</small>' + esc(prev.label) + '</a>' : '') +
      (next ? '<a class="next" href="#vs.' + next.id + '"><small>다음 주제 →</small>' + esc(next.label) + '</a>' : '') + '</nav>';
    return h;
  }
  function setTab(id, dir) {
    var r = cur; if (!r || r.sub !== 'topic') return;
    var tp = topicById(r.anchor), tabs = tabsOf(tp); if (tabs.indexOf(id) < 0 || id === r.tab) return;
    var back = tabs.indexOf(id) < tabs.indexOf(r.tab);
    r.tab = id;
    try { history.replaceState(null, '', '#vs.' + tp.id + '.' + id); } catch (e) { }
    var deck = $('#deck'); deck.innerHTML = panelHTML(tp, id);
    if (!reduced) { deck.classList.remove('in-l', 'in-r'); void deck.offsetWidth; deck.classList.add(back ? 'in-l' : 'in-r'); }
    $$('.stabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === id)); });
    $$('.glance [data-tab]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tab === id)); });
    bindDeck();
    var st = $('.stabs'); if (st && dir !== 'key') { var top = st.getBoundingClientRect().top + window.scrollY - 90; if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' }); }
    schedule();
  }
  function centerTab() {
    var st = $('.stabs'), b = st && $('[aria-selected="true"]', st);
    if (b) st.scrollLeft = Math.max(0, b.offsetLeft - st.clientWidth / 2 + b.offsetWidth / 2);
  }
  function bindDeck() {
    centerTab();
    $$('.relmap .hit').forEach(function (el) { el.addEventListener('click', function () { location.hash = '#vs-pr.' + el.dataset.pair; }); });
    $$('.relmap .nd').forEach(function (el) { el.addEventListener('click', function () { setTab(el.dataset.t); }); });
  }
  function bindVsTopic(r) {
    var tp = topicById(r.anchor);
    bindDeck();
    var got = grant('vs.' + tp.id, REWARD.vs);
    if (got) { setTimeout(function () { carrotFx(got, $('.tp-head h1')); checkAch(); }, 350); }
  }
  function relmap(tp, W) {
    var n = W.length, cx = 140, cy = 124, R0 = 88, pos = {};
    W.forEach(function (tid, i) { var a = Math.PI + i * 2 * Math.PI / n; pos[tid] = [cx + R0 * Math.cos(a), cy + R0 * Math.sin(a)]; });
    var s = '<svg viewBox="0 -12 280 284" role="img" aria-label="이 주제로 이어진 두 사람들">';
    PAIRS.forEach(function (p) {
      if (!pos[p.a] || !pos[p.b]) return;
      var a = pos[p.a], b = pos[p.b], hot = p.points.some(function (x) { return x.topic === tp.id; });
      var d = 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1) + ' L' + b[0].toFixed(1) + ',' + b[1].toFixed(1);
      s += '<path class="ln' + (hot ? ' on' : '') + '" d="' + d + '"/><path class="hit" data-pair="' + p.id + '" d="' + d + '"><title>' + esc(T[p.a].short + ' × ' + T[p.b].short + ' · ' + p.title) + '</title></path>';
    });
    W.forEach(function (tid) {
      var p = pos[tid], t = T[tid], ly = p[1] < cy - 20 ? p[1] - 30 : p[1] + 40, on = !!sidesOf(tp)[tid];
      s += '<g class="nd' + (on ? '' : ' off') + '" data-t="' + tid + '" style="transform-origin:' + p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px"><title>' + esc(t.name) + '</title><circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="20" stroke="' + t.color + '"/><text class="no" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" style="fill:color-mix(in oklab, ' + t.color + ' 72%, #000)">' + NUM[tid] + '</text><text x="' + p[0].toFixed(1) + '" y="' + ly.toFixed(1) + '">' + esc(t.short) + '</text></g>';
    });
    return s + '</svg><p class="hint">분홍 선 = 이 주제로 맞붙는 두 사람. 선을 누르면 두 사람 비교로.</p>';
  }
  function viewVsPair(r) {
    var p = pairById(r.anchor), list = PAIRS.filter(function (x) { return T[x.a] && T[x.b]; }), i = list.indexOf(p), prev = list[i - 1], next = list[i + 1];
    var A = T[p.a], B = T[p.b];
    var pts = p.points.slice().sort(function (x, y) { return TOPICS.indexOf(topicById(x.topic)) - TOPICS.indexOf(topicById(y.topic)); });
    var h = vsCrumb('두 사람씩 · ' + two(i + 1) + ' / ' + two(list.length), prev ? '#vs-pr.' + prev.id : '', next ? '#vs-pr.' + next.id : '');
    h += '<header class="pr-head"><div class="duo-big"><a class="who l" href="#t-' + p.a + '" style="--c:' + A.color + '">' + mk(p.a) + '<b>' + esc(A.name) + '</b><small>' + esc(A.en) + ' · ' + esc(A.life) + '</small></a><span class="vsx">VS</span><a class="who r" href="#t-' + p.b + '" style="--c:' + B.color + '">' + mk(p.b) + '<b>' + esc(B.name) + '</b><small>' + esc(B.en) + ' · ' + esc(B.life) + '</small></a></div>' +
      '<h1>' + esc(p.title) + '<i>.</i></h1><p class="line">' + esc(p.line) + '</p>' + (p.exam ? '<a class="chip pink" href="#exam">' + esc(p.exam) + ' →</a>' : '') + '</header>';
    h += '<div class="plist">' + pts.map(function (x, k) {
      var tp = topicById(x.topic);
      return '<article class="pslide" style="--i:' + k + ';--ca:' + A.color + ';--cb:' + B.color + '"><div class="ptop">' + (tp ? '<a class="chip" href="#vs.' + tp.id + '">' + two(TOPICS.indexOf(tp) + 1) + ' ' + esc(tp.label) + '</a>' : '') + '<span class="k">' + two(k + 1) + '</span></div>' +
        '<h3>' + inline(x.t) + '</h3><div class="ab2"><div class="c l"><span class="nm">' + mk(p.a) + esc(A.short) + '</span><p>' + inline(x.a) + '</p></div><span class="vx" aria-hidden="true">VS</span><div class="c r"><span class="nm">' + mk(p.b) + esc(B.short) + '</span><p>' + inline(x.b) + '</p></div></div>' +
        (x.note ? '<p class="pnote">' + inline(x.note) + '</p>' : '') + '<div class="srcs">' + chipOf(x.s) + '</div></article>';
    }).join('') + '</div>';
    h += '<nav class="th-nav vs-nav" aria-label="앞뒤 쌍">' + (prev ? '<a href="#vs-pr.' + prev.id + '"><small>← 이전</small>' + esc(T[prev.a].short + ' × ' + T[prev.b].short) + '</a>' : '') +
      (next ? '<a class="next" href="#vs-pr.' + next.id + '"><small>다음 →</small>' + esc(T[next.a].short + ' × ' + T[next.b].short) + '</a>' : '') + '</nav>';
    return h;
  }
  function viewVsAll() {
    var h = vsCrumb('한눈에 표', '', '') + '<header class="vs-head"><span class="lbl">Overview</span><h1>한눈에 표<i>.</i></h1><p>칸을 누르면 그 사람의 슬라이드로 갑니다.</p></header>';
    h += '<div class="tbl overview2"><table><thead><tr><th>주제</th>' + ORDER.map(function (tid) { return '<th style="--c:' + T[tid].color + '">' + mk(tid) + esc(T[tid].short) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      TOPICS.map(function (tp, i) {
        return '<tr><th scope="row"><a href="#vs.' + tp.id + '"><span class="mk">' + two(i + 1) + '</span>' + esc(tp.label) + '</a></th>' + ORDER.map(function (tid) {
          var sd = sidesOf(tp)[tid];
          return '<td>' + (sd ? '<a href="#vs.' + tp.id + '.' + tid + '">' + inline(sd.key) + '</a>' : '<span class="muted">—</span>') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    return h;
  }
  function viewVsLin() {
    function card(x) { return '<li><span class="nm">' + x.who.filter(function (w) { return T[w]; }).map(mk).join('') + '<b>' + esc(x.label) + '</b><small>' + esc(x.sub) + '</small></span><p>' + inline(x.t) + chipOf(x.s) + '</p></li>'; }
    var ins = INFL.filter(function (x) { return x.dir === 'in'; }), outs = INFL.filter(function (x) { return x.dir === 'out'; });
    var h = vsCrumb('영향과 유산', '', '') + '<header class="vs-head"><span class="lbl">Lineage</span><h1>받은 영향과 물려준 유산<i>.</i></h1><p>이름 앞 번호는 그 영향과 이어진 사상가입니다.</p></header>';
    h += '<div class="lin"><section><h2><span>IN</span>받은 영향</h2><ul>' + ins.map(card).join('') + '</ul></section><div class="lin-mid" aria-hidden="true">' + ORDER.map(function (tid) { return mk(tid); }).join('') + '</div><section><h2><span>OUT</span>물려준 유산</h2><ul>' + outs.map(card).join('') + '</ul></section></div>';
    return h;
  }
  function viewVs(r) {
    if (r.sub === 'topic' && topicById(r.anchor)) return viewVsTopic(r);
    if (r.sub === 'pair' && pairById(r.anchor)) return viewVsPair(r);
    if (r.sub === 'all') return viewVsAll();
    if (r.sub === 'lin') return viewVsLin();
    r.sub = 'hub';
    return viewVsHub();
  }
  function bindVs(r) { if (r.sub === 'topic') bindVsTopic(r); }

  /* ───────── 족보 ───────── */
  function viewExam() {
    if (!EXAMS.length) return '<header class="ex-head"><h1>족보</h1><p class="muted">족보 자료가 아직 없습니다.</p></header>';
    var only = S.exf === 'first', k = 0;
    var h = '<header class="ex-head"><span class="lbl">Past exam</span><h1>족보<i>.</i></h1><p class="muted">시험지 ' + EXAMS.length + '개 · 문항 ' + allExamQs().length + '개. 지금 자료로 쓸 수 있는 문항에는 답안 설계를, 나머지에는 지금 자료와 이어지는 고리를 달았습니다.</p>' +
      '<nav class="ex-jump" aria-label="시험지">' + EXAMS.map(function (ex) { return '<a class="chip" href="#exam.x-' + ex.id + '">' + esc(ex.title) + ' →</a>'; }).join('') + '</nav>' +
      '<div class="seg" role="group" aria-label="문항 거르기"><button type="button" data-f="all" aria-pressed="' + !only + '">모든 문항</button><button type="button" data-f="first" aria-pressed="' + only + '">지금 자료로 쓸 수 있는 문항만</button></div></header>';
    var RL = { '1차': ['지금 자료로 답할 수 있음', 'pink'], '2차': ['2차 범위', ''], '혼합': ['일부는 지금 자료로', 'pink'] };
    EXAMS.forEach(function (ex) {
      h += '<section class="exs" id="x-' + ex.id + '"><div class="exs-h"><span class="lbl">' + esc(ex.short || '') + '</span><h2>' + esc(ex.title) + '<i>.</i></h2><p class="muted">' + esc(ex.meta) + '</p>' +
        (ex.strategy ? '<div class="strat"><b>시험 전략 · 수강자 후기</b><ul>' + ex.strategy.map(function (s) { return '<li>' + inline(s) + '</li>'; }).join('') + '</ul></div>' : '') +
        '<p class="ex-note">' + inline(ex.note || '') + '</p></div>';
      ex.parts.forEach(function (part) {
        var qs = part.qs.filter(function (q) { return !only || q.range !== '2차'; });
        if (!qs.length) return;
        h += '<div class="part-h"><b>' + esc(part.kind) + '</b><small>' + esc(part.rule) + '</small></div>';
        qs.forEach(function (q) {
          var rl = RL[q.range] || ['', ''], tp = q.lens ? topicById(q.lens) : null, ol = outlineOf(q), sm = q.same && QBY[q.same], fresh = ol && S.earned['ex.' + q.id] == null;
          h += '<article class="eq fx' + (q.range !== '2차' ? ' first' : '') + '" id="e' + q.id + '" style="--i:' + (k++) + '"><span class="n">' + two(+(q.no || q.n) || 0) + '</span><div>' + (q.no ? '<p class="qk">' + esc(q.label) + '</p>' : '') + (q.text ? '<p class="tx0">' + esc(q.text) + '</p>' : '') +
            (q.subs ? '<ul class="subs">' + q.subs.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '') +
            (q.box ? '<div class="box">' + esc(q.box) + '</div>' : '') +
            (q.given ? '<div class="box given"><b>후기에 적힌 정답</b> ' + esc(q.given) + '</div>' : '') +
            '<div class="tags"><span class="chip ' + rl[1] + '">' + rl[0] + '</span>' + (q.thinkers || []).filter(function (t) { return T[t]; }).map(function (t) { return '<a class="chip" href="#t-' + t + '">' + esc(T[t].short) + '</a>'; }).join('') +
            (tp ? '<a class="chip" href="#vs.' + tp.id + '">비교: ' + esc(tp.label) + ' →</a>' : '') +
            (sm ? '<a class="chip pink" href="#exam.e' + sm.id + '">' + esc(sm.ex.short + ' ' + sm.label) + '과 같은 문항 →</a>' : '') + '</div>' +
            (ol ? '<details><summary>' + (q.range === '2차' ? '지금 자료와 이어지는 부분' : '답안 설계 보기') + (sm && !q.outline ? ' (' + esc(sm.ex.short + ' ' + sm.label) + ')' : '') + (fresh ? ' · +' + REWARD.ex + CR : '') + '</summary><div class="ol tx">' + blocks(ol, 'plain') + '</div></details>' : '') +
            '</div></article>';
        });
      });
      h += '</section>';
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
    TOPICS.forEach(function (tp) {
      IDX.push({ h: '#vs.' + tp.id + '.wrap', t: '비교 · ' + tp.label + ' · 차이 정리', x: plain(tp.q + ' ' + (tp.lead || '')) + ' ' + slidePlain(tp.wrap) });
      Object.keys(sidesOf(tp)).forEach(function (k) { if (!T[k]) return; var sd = tp.sides[k]; IDX.push({ h: '#vs.' + tp.id + '.' + k, t: '비교 · ' + tp.label + ' · ' + T[k].short, x: plain(sd.key) + ' ' + (sd.tags || []).join(' ') + ' ' + slidePlain(sd.body) }); });
    });
    PAIRS.forEach(function (p) { if (T[p.a] && T[p.b]) IDX.push({ h: '#vs-pr.' + p.id, t: '비교 · ' + T[p.a].short + ' × ' + T[p.b].short + ' · ' + p.title, x: plain(p.line + ' ' + p.points.map(function (x) { return x.t + ' ' + x.a + ' ' + x.b + ' ' + (x.note || ''); }).join(' ')) }); });
    allExamQs().forEach(function (q) { IDX.push({ h: '#exam.e' + q.id, t: '족보 · ' + q.ex.short + ' ' + q.label, x: plain(q.text + ' ' + (q.box || '') + ' ' + (q.given || '') + ' ' + (q.subs || []).join(' ') + ' ' + (q.outline || '')) }); });
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
    if ((m = h.match(/^vs-pr\.([\w-]+)$/))) return { v: 'vs', sub: 'pair', anchor: m[1] };
    if (h === 'vs-all') return { v: 'vs', sub: 'all' };
    if (h === 'vs-lin') return { v: 'vs', sub: 'lin' };
    if ((m = h.match(/^vs(?:\.([\w-]+))?(?:\.([\w-]+))?$/))) return { v: 'vs', sub: m[1] ? 'topic' : 'hub', anchor: m[1] || '', tab: m[2] || '' };
    if (/^(map|timeline)/.test(h)) return { v: 'vs', sub: 'hub' };
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
    if (cur && cur.sub === 'topic' && r.sub === 'topic' && cur.anchor === r.anchor && r.tab && r.tab !== cur.tab) { setTab(r.tab); return; }
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
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#app [data-tab]');
    if (b && cur && cur.sub === 'topic') setTab(b.dataset.tab);
  });
  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement || {}).tagName || '';
    if (cur && cur.sub === 'topic' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/INPUT|TEXTAREA|SELECT/.test(tag) && $('#search').hidden && !e.altKey && !e.metaKey && !e.ctrlKey) {
      var tabs = tabsOf(topicById(cur.anchor)), k = tabs.indexOf(cur.tab) + (e.key === 'ArrowRight' ? 1 : -1);
      if (tabs[k]) { e.preventDefault(); setTab(tabs[k], 'key'); }
    }
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
