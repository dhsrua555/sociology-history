/* 사회학사 — 흰토끼 콩이: 몸 · 꾸미기 아이템
   render(look, o) 는 viewBox 0 0 120 150 의 SVG 문자열을 돌려준다 (o.crop 으로 잘라 보기).
   아이템 draw 는 함수 하나(main) 또는 레이어별 { back, main, front, top }.
   얼굴 쪽 그룹(.rb-face · .rb-hat · .rb-ears)은 CSS 변수 --lx --ly 로 마우스를 따라 움직인다. */
(function () {
  'use strict';
  let uid = 0;
  const r2 = v => Math.round(v * 100) / 100;
  const MONO = "'Martian Mono','IBM Plex Sans KR',monospace";
  const SANS = "'IBM Plex Sans KR','Noto Sans KR','Malgun Gothic',sans-serif";
  const P = '#FF4FA3', P2 = '#FF8CC6', P3 = '#FFD1E6', GOLD = '#FFC93C', NAVY = '#3D4E9E', GREEN = '#5DBB63', ORANGE = '#FF9A3C', WOOD = '#8A5A34', CHAR = '#2B2233';

  const HEAD = 'M60 38 C81 38 95 51 95 68 C95 85 80 95 60 95 C40 95 25 85 25 68 C25 51 39 38 60 38 Z';
  const BODY = 'M40 141 C35 119 40 93 60 91 C80 93 85 119 80 141 Z';

  const SLOTS = [
    { id: 'hat', name: '모자', en: 'Hats', crop: '14 -4 92 72' },
    { id: 'face', name: '얼굴', en: 'Face', crop: '18 42 84 56' },
    { id: 'eyes', name: '표정', en: 'Mood', crop: '20 38 80 56' },
    { id: 'neck', name: '목', en: 'Neck', crop: '22 80 76 52' },
    { id: 'outfit', name: '옷', en: 'Outfits', crop: '18 84 84 64' },
    { id: 'held', name: '소품', en: 'Props', crop: '0 28 120 122' },
    { id: 'ears', name: '귀', en: 'Ears', crop: '2 -3 116 100' },
    { id: 'fur', name: '털색', en: 'Fur', crop: '2 -3 116 153' },
    { id: 'bg', name: '배경', en: 'Scene', crop: '0 0 120 150' }
  ];
  const DEFAULT = { hat: 'h-ribbon', face: 'f-none', eyes: 'e-dot', neck: 'n-none', outfit: 'o-none', held: 'p-carrot', ears: 'ea-up', fur: 'fu-white', bg: 'b-none' };

  /* 업적으로 여는 아이템 (진행도 계산은 app.js) */
  const ACH = {
    lec: { name: '강의 완주', how: '강의 정리의 모든 절에 읽음 표시하기' },
    tb: { name: '교재 완주', how: '교재의 모든 절에 읽음 표시하기' },
    vs: { name: '비교의 달인', how: '사상 비교의 모든 주제 열어 보기' },
    exam: { name: '족보 정복', how: '족보의 답안 설계를 모두 펼쳐 보기' },
    streak: { name: '단골 토끼', how: '7일 연속으로 들르기' }
  };

  /* ---------- 작은 도형 ---------- */
  const st = (c, w) => ` stroke="${c.L}" stroke-width="${w || 1.6}" stroke-linejoin="round" stroke-linecap="round"`;
  const heart = (x, y, s) => `M${r2(x)} ${r2(y + s * .85)} C${r2(x - s * 1.25)} ${r2(y + s * .05)} ${r2(x - s * .85)} ${r2(y - s * .95)} ${r2(x)} ${r2(y - s * .3)} C${r2(x + s * .85)} ${r2(y - s * .95)} ${r2(x + s * 1.25)} ${r2(y + s * .05)} ${r2(x)} ${r2(y + s * .85)} Z`;
  const spark = (x, y, s) => `M${r2(x)} ${r2(y - s)} Q${r2(x)} ${r2(y)} ${r2(x + s)} ${r2(y)} Q${r2(x)} ${r2(y)} ${r2(x)} ${r2(y + s)} Q${r2(x)} ${r2(y)} ${r2(x - s)} ${r2(y)} Q${r2(x)} ${r2(y)} ${r2(x)} ${r2(y - s)} Z`;
  function flower(x, y, r, fill, mid, c) {
    let s = '';
    for (let k = 0; k < 5; k++) {
      const a = (-90 + k * 72) * Math.PI / 180;
      s += `<circle cx="${r2(x + Math.cos(a) * r * .58)}" cy="${r2(y + Math.sin(a) * r * .58)}" r="${r2(r * .5)}" fill="${fill}"${c ? st(c, .9) : ''}/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r="${r2(r * .3)}" fill="${mid || GOLD}"/>`;
  }
  const lay = (it, k, c) => {
    if (!it || !it.draw) return '';
    if (typeof it.draw === 'function') return k === 'main' ? it.draw(c) : '';
    return it.draw[k] ? it.draw[k](c) : '';
  };

  /* ---------- 털색 ---------- */
  const FUR = {
    'fu-white': { body: '#FFFFFF', ear: '#FFFFFF', earIn: '#FFB8D4', line: '#3B2A35', eye: '#3B2A35', blush: '#FFB1CF', nose: '#FF7FB4' },
    'fu-cream': { body: '#FFF1DA', ear: '#FFF1DA', earIn: '#FFC2CC', line: '#4A3530', eye: '#3B2A2A', blush: '#FFB1C0', nose: '#FF8FA8' },
    'fu-gray': { body: '#DCDFE9', ear: '#DCDFE9', earIn: '#F7B9CF', line: '#3A3547', eye: '#2B2838', blush: '#F8A9C6', nose: '#F27AAE', belly: '#F2F3F8' },
    'fu-choco': { body: '#C29274', ear: '#B5836A', earIn: '#F1B3C2', line: '#4A2E24', eye: '#2A1A14', blush: '#F59AB0', nose: '#E96F95', belly: '#E7C7AE' },
    'fu-dutch': {
      body: '#FFFFFF', ear: '#6F5E6A', earIn: '#E7A4BE', line: '#3B2A35', eye: '#241A20', blush: '#FFB1CF', nose: '#FF7FB4',
      head: c => `<g clip-path="url(#${c.u}h)" fill="#6F5E6A"><path d="M22 40 L55 40 C53 50 52 58 52.5 66 C53 74 49 80 42 84 C34 88 24 84 20 76 Z"/><path d="M98 40 L65 40 C67 50 68 58 67.5 66 C67 74 71 80 78 84 C86 88 96 84 100 76 Z"/></g>`,
      body2: c => `<g clip-path="url(#${c.u}b)"><path d="M30 127 C45 122 75 122 90 127 L90 150 L30 150 Z" fill="#6F5E6A"/></g>`
    },
    'fu-pink': { body: '#FFE0EE', ear: '#FFE0EE', earIn: '#FF9FC8', line: '#4A2A3C', eye: '#3B2A35', blush: '#FF93BF', nose: '#FF5FA2' }
  };

  /* ---------- 몸 ---------- */
  function earsBack(kind, f, c) {
    const L = `<g class="ear-l"><ellipse cx="47" cy="22" rx="8.6" ry="21.5" transform="rotate(-10 47 22)" fill="${f.ear}"${st(c)}/><ellipse cx="47.6" cy="24.5" rx="4.3" ry="15" transform="rotate(-10 47.6 24.5)" fill="${f.earIn}"/></g>`;
    if (kind === 'ea-one') {
      return L + `<g class="ear-r"><path d="M66 43 C64 31 66 20 73 15 C81 10 95 12 102 22 C105 27 102 32 97 30 C91 27 85 25 81 28 C78 31 78 37 79 44 Z" fill="${f.ear}"${st(c)}/>`
        + `<path d="M76 17.5 C83 14 94 16 99 23 C95 22.5 88 21.5 83 23 C80 24 77.5 21 76 17.5 Z" fill="${f.earIn}"/></g>`;
    }
    return L + `<g class="ear-r"><ellipse cx="73" cy="22" rx="8.6" ry="21.5" transform="rotate(10 73 22)" fill="${f.ear}"${st(c)}/><ellipse cx="72.4" cy="24.5" rx="4.3" ry="15" transform="rotate(10 72.4 24.5)" fill="${f.earIn}"/></g>`;
  }
  function earsLop(f, c) {
    const one = `<path d="M44 42 C32 41 21 52 18 67 C16 80 19 90 26 91 C33 92 36 82 37 71 C38 60 42 51 48 46 Z" fill="${f.ear}"${st(c)}/><path d="M41 47 C33 50 26 60 24 71 C23 80 25 85 28 85 C31.5 85 33 78 34 70 C35 61 38 54 42 50 Z" fill="${f.earIn}"/>`;
    return `<g class="ear-l">${one}</g><g class="ear-r" transform="translate(120 0) scale(-1 1)">${one}</g>`;
  }
  const tail = (f, c) => `<circle cx="86" cy="133" r="7.5" fill="${f.body}"${st(c)}/>`;
  const body = (f, c) => `<path d="${BODY}" fill="${f.body}"${st(c)}/>` + (f.belly ? `<g clip-path="url(#${c.u}b)"><ellipse cx="60" cy="122" rx="13" ry="17" fill="${f.belly}"/></g><path d="${BODY}" fill="none"${st(c)}/>` : '') + (f.body2 ? f.body2(c) + `<path d="${BODY}" fill="none"${st(c)}/>` : '');
  const feet = (f, c) => `<ellipse cx="48" cy="141" rx="10" ry="5.2" fill="${f.body}"${st(c)}/><ellipse cx="72" cy="141" rx="10" ry="5.2" fill="${f.body}"${st(c)}/>`;
  const pawFill = f => f.belly || f.body;
  /* 팔: 윤곽선 굵은 선 위에 털(또는 소매) 색 선을 겹쳐 그린 관. 어깨 끝은 머리 밑에 숨는다 */
  const ARM = 'M44.8 90 Q43.4 104 51.4 112.6 M75.2 90 Q76.6 104 68.6 112.6';
  const arms = (c, fill) => `<path d="${ARM}" fill="none" stroke="${c.L}" stroke-width="9.6" stroke-linecap="round"/><path d="${ARM}" fill="none" stroke="${fill}" stroke-width="6.4" stroke-linecap="round"/>`;
  const paws = (f, c) => `<ellipse cx="52" cy="113" rx="5.4" ry="4.5" transform="rotate(-32 52 113)" fill="${pawFill(f)}"${st(c)}/><ellipse cx="68" cy="113" rx="5.4" ry="4.5" transform="rotate(32 68 113)" fill="${pawFill(f)}"${st(c)}/>`;
  const head = (f, c) => `<path d="${HEAD}" fill="${f.body}"${st(c)}/>` + (f.head ? f.head(c) + `<path d="${HEAD}" fill="none"${st(c)}/>` : '');
  const nose = f => `<path d="M57.4 73.4 Q60 72.2 62.6 73.4 Q61.4 76.2 60 76.4 Q58.6 76.2 57.4 73.4 Z" fill="${f.nose}"/>`;
  const mouth = c => `<path d="M60 76.4 V78.2 M60 78.2 Q58 80.8 55.6 79.3 M60 78.2 Q62 80.8 64.4 79.3" fill="none" stroke="${c.L}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>`;
  const blush = f => `<ellipse cx="37.5" cy="77.5" rx="5.6" ry="3.1" fill="${f.blush}" opacity=".8"/><ellipse cx="82.5" cy="77.5" rx="5.6" ry="3.1" fill="${f.blush}" opacity=".8"/>`;
  const dotEye = (x, f) => `<g class="rb-eye"><ellipse cx="${x}" cy="66" rx="4.3" ry="5.3" fill="${f.eye}"/><circle cx="${x + 1.5}" cy="64" r="1.6" fill="#fff"/><circle cx="${x - 1.1}" cy="68.4" r=".8" fill="#fff" opacity=".85"/></g>`;
  const dotEyes = c => dotEye(46, c.f) + dotEye(74, c.f);

  /* ---------- 아이템 ---------- */
  const ITEMS = [
    /* 모자 */
    { id: 'h-none', slot: 'hat', name: '모자 없음', price: 0 },
    { id: 'h-ribbon', slot: 'hat', name: '분홍 리본', price: 0, desc: '콩이의 기본 차림. 왼쪽 귀에 단 큰 리본이에요.',
      draw: c => `<g transform="rotate(-18 44 41)"><path d="M43 42 L39 51 L42.4 50.2 L44.4 53 L45 43 Z" fill="${P}"${st(c, 1.3)}/><path d="M45 42 L50 50.5 L46.6 50.4 L45.4 53.2 L43.6 43 Z" fill="${P}"${st(c, 1.3)}/>`
        + `<path d="M44 41 C38 33 28 33 29 41 C30 48 39 46 44 41 Z" fill="${P}"${st(c, 1.4)}/><path d="M44 41 C50 33 60 33 59 41 C58 48 49 46 44 41 Z" fill="${P}"${st(c, 1.4)}/>`
        + `<path d="M33 39 q3 -3 6 -.5 M49 38.5 q3 -2.5 6 .5" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="44" cy="41" r="3.3" fill="#E23D8E"${st(c, 1.3)}/></g>` },
    { id: 'h-sprout', slot: 'hat', name: '새싹 핀', price: 10, desc: '머리 위에 새싹이 쏙. 오늘 배운 게 자라는 중이에요.',
      draw: c => `<path d="M60 39.5 C60 35 60.4 31.5 61.6 28.5" fill="none" stroke="#3E9B5B" stroke-width="2" stroke-linecap="round"/><path d="M61.4 30 C58.5 23.5 51 23 49.5 26.5 C52.5 31 57.5 31.4 61.4 30 Z" fill="#8ED99A"${st(c, 1.3)}/><path d="M61.6 29 C64.5 21.5 72 20.5 74 24.4 C71 29.8 65.5 30.4 61.6 29 Z" fill="#8ED99A"${st(c, 1.3)}/>` },
    { id: 'h-beret', slot: 'hat', name: '베레모', price: 20, desc: '파리 카페에 앉아 있을 것 같은 분홍 베레모.',
      draw: c => `<path d="M34.5 45 C32 35 46 27.5 62 28 C78 28.5 89 34.5 87 42.5 C85 47.5 71 46.5 60 46.5 C49 46.5 37 49.5 34.5 45 Z" fill="${P}"${st(c)}/><path d="M62 28.2 C62 25.4 63 23.4 65.4 22.2" fill="none"${st(c, 2)}/><path d="M41 38 C46 33 55 31 62 31" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" fill="none" stroke-linecap="round"/>` },
    { id: 'h-knit', slot: 'hat', name: '귀 구멍 니트 모자', price: 25, desc: '귀가 쏙 나오는 니트 모자. 방울이 달렸어요.',
      draw: c => `<path d="M28.5 58 C27.5 43 41 33.5 60 33.5 C79 33.5 92.5 43 91.5 58 Z" fill="${P2}"${st(c)}/><path d="M27.5 56 C45 51.5 75 51.5 92.5 56 L92.5 61.5 C75 57 45 57 27.5 61.5 Z" fill="${P}"${st(c)}/>`
        + `<path d="M34 55 v4.4 M40 53.8 v4.4 M46 53 v4.4 M52 52.6 v4.4 M58 52.4 v4.4 M64 52.4 v4.4 M70 52.8 v4.4 M76 53.4 v4.4 M82 54.2 v4.4 M88 55.3 v4.4" stroke="${c.L}" stroke-opacity=".3" stroke-width="1" stroke-linecap="round"/>`
        + `<circle cx="60" cy="30" r="6.2" fill="#FFF3F8"${st(c)}/><path d="M57 28 l1.6 1.6 M61.6 27.6 l-1 2 M59.6 32.4 l1.4 -1" stroke="${c.L}" stroke-opacity=".3" stroke-width=".9"/>` },
    { id: 'h-headphone', slot: 'hat', name: '강의 녹음 헤드폰', price: 30, desc: '녹음 파일을 한 번 더 들을 때 필요한 헤드폰.',
      draw: c => `<path d="M27 64 C25 41 41 31 60 31 C79 31 95 41 93 64" fill="none" stroke="${c.L}" stroke-width="6" stroke-linecap="round"/><path d="M27 64 C25 41 41 31 60 31 C79 31 95 41 93 64" fill="none" stroke="${P}" stroke-width="3.2" stroke-linecap="round"/>`
        + `<rect x="18.5" y="55" width="12.5" height="22" rx="6" fill="${P}"${st(c)}/><rect x="26.5" y="58.5" width="5.5" height="15" rx="2.7" fill="${P3}"${st(c, 1.2)}/>`
        + `<rect x="89" y="55" width="12.5" height="22" rx="6" fill="${P}"${st(c)}/><rect x="88" y="58.5" width="5.5" height="15" rx="2.7" fill="${P3}"${st(c, 1.2)}/>` },
    { id: 'h-flower', slot: 'hat', name: '꽃 화관', price: 35, desc: '분홍 · 하양 · 노랑 꽃을 엮은 화관.',
      draw: c => {
        const pts = [[31, 53, P2], [38.5, 45.5, '#fff'], [48, 40.5, GOLD], [60, 38.6, P2], [72, 40.5, '#fff'], [81.5, 45.5, GOLD], [89, 53, P2]];
        const leaf = [[34.5, 48.5, -40], [43, 42.2, -25], [54, 39, -8], [66, 39, 8], [77, 42.2, 25], [85.5, 48.5, 40]].map(p => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="3.6" ry="1.8" transform="rotate(${p[2]} ${p[0]} ${p[1]})" fill="${GREEN}"${st(c, .9)}/>`).join('');
        return leaf + pts.map(p => flower(p[0], p[1], 5.4, p[2], p[2] === GOLD ? '#FF8A3C' : GOLD, c)).join('');
      } },
    { id: 'h-straw', slot: 'hat', name: '밀짚모자', price: 40, desc: '분홍 리본을 두른 밀짚모자. 소풍 가는 날에.',
      draw: c => `<ellipse cx="60" cy="43" rx="36" ry="8.6" fill="#F6D68F"${st(c)}/><path d="M34 43.5 C40 47.5 80 47.5 86 43.5 M29 41 C38 36.5 82 36.5 91 41" fill="none" stroke="#C9A04E" stroke-width=".9" stroke-opacity=".7"/>`
        + `<path d="M44 43 C44 31 50 26 60 26 C70 26 76 31 76 43 C70 45 50 45 44 43 Z" fill="#F0C972"${st(c)}/><path d="M44.2 37 C50 39 70 39 75.8 37 L76 42 C70 44 50 44 44 42 Z" fill="${P}"${st(c, 1.2)}/>`
        + `<path d="M76 40 C82 41 86 45 84 50 C81 47 79 45 76 43 Z" fill="${P}"${st(c, 1.2)}/>` },
    { id: 'h-top', slot: 'hat', name: '실크해트', price: 60, desc: '19세기 신사의 모자. 분홍 띠를 둘렀어요.',
      draw: c => `<g transform="rotate(7 60 38)"><path d="M47.5 38 L49.5 13.5 C49.6 11.8 70.4 11.8 70.5 13.5 L72.5 38 Z" fill="${CHAR}"${st(c)}/><path d="M48.1 30.5 L71.9 30.5 L72.4 36 L47.6 36 Z" fill="${P}"/><ellipse cx="60" cy="38.6" rx="21" ry="4.2" fill="${CHAR}"${st(c)}/><path d="M52 16 L51 28" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-linecap="round"/></g>` },
    { id: 'h-cap', slot: 'hat', name: '학사모', ach: 'lec', desc: '강의 정리를 끝까지 읽은 토끼만 쓰는 학사모.',
      draw: c => `<path d="M44 40 C44 34.5 76 34.5 76 40 L76 45 C66 41.5 54 41.5 44 45 Z" fill="${CHAR}"${st(c)}/><path d="M29 32.5 L60 21.5 L91 32.5 L60 43.5 Z" fill="${CHAR}"${st(c)}/><path d="M60 32.5 L84.5 36 L86 47.5" fill="none" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round"/><rect x="83.6" y="46.5" width="5" height="8" rx="1.6" fill="${GOLD}"${st(c, 1)}/><circle cx="60" cy="32.5" r="2.2" fill="${GOLD}"/>` },
    { id: 'h-crown', slot: 'hat', name: '족보 왕관', ach: 'exam', desc: '족보의 답안 설계를 전부 펼쳐 본 토끼의 왕관.',
      draw: c => `<path d="M43.5 42 L41.5 22 L51 30 L60 17.5 L69 30 L78.5 22 L76.5 42 Z" fill="${GOLD}"${st(c)}/><path d="M43.3 37.5 L76.7 37.5" stroke="${c.L}" stroke-opacity=".3" stroke-width="1"/><circle cx="60" cy="33.5" r="2.6" fill="${P}"${st(c, 1)}/><circle cx="50.5" cy="35" r="1.8" fill="#8EC5FF"${st(c, .9)}/><circle cx="69.5" cy="35" r="1.8" fill="#8EC5FF"${st(c, .9)}/><circle cx="41.5" cy="21.5" r="2" fill="${GOLD}"${st(c, 1)}/><circle cx="60" cy="17" r="2" fill="${GOLD}"${st(c, 1)}/><circle cx="78.5" cy="21.5" r="2" fill="${GOLD}"${st(c, 1)}/>` },

    /* 얼굴 */
    { id: 'f-none', slot: 'face', name: '맨얼굴', price: 0 },
    { id: 'f-band', slot: 'face', name: '반창고', price: 10, desc: '밤새 공부하다 생긴 훈장.',
      draw: c => `<g transform="rotate(-24 36 58)"><rect x="27.5" y="54.5" width="17" height="7" rx="3.5" fill="#F6D2B5"${st(c, 1.2)}/><rect x="33.4" y="55.4" width="5.2" height="5.2" rx="1" fill="#EDB894"/><circle cx="30.5" cy="57" r=".45" fill="${c.L}" opacity=".4"/><circle cx="30.5" cy="59.2" r=".45" fill="${c.L}" opacity=".4"/><circle cx="41.5" cy="57" r=".45" fill="${c.L}" opacity=".4"/><circle cx="41.5" cy="59.2" r=".45" fill="${c.L}" opacity=".4"/></g>` },
    { id: 'f-star', slot: 'face', name: '반짝이 스티커', price: 15, desc: '볼에 붙인 별 스티커 세 개.',
      draw: c => `<path d="${spark(35.5, 76, 4.4)}" fill="${GOLD}"${st(c, 1)}/><path d="${spark(84.5, 75, 3.6)}" fill="${P2}"${st(c, 1)}/><path d="${spark(89.5, 81, 2.2)}" fill="#8EC5FF"${st(c, .8)}/>` },
    { id: 'f-round', slot: 'face', name: '동그란 안경', price: 25, desc: '교재 글씨가 작을 때 쓰는 동그란 안경.',
      draw: c => `<g fill="rgba(255,255,255,.22)" stroke="${c.L}" stroke-width="1.8"><circle cx="46" cy="66" r="8.6"/><circle cx="74" cy="66" r="8.6"/></g><path d="M54.6 64.6 Q60 61.6 65.4 64.6 M37.4 64.8 L27 62.6 M82.6 64.8 L93 62.6" fill="none" stroke="${c.L}" stroke-width="1.8" stroke-linecap="round"/><path d="M41 61.5 q2.5 -2 5 -1.6 M69 61.5 q2.5 -2 5 -1.6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>` },
    { id: 'f-mustache', slot: 'face', name: '말린 콧수염', price: 30, desc: '19세기 초상화 속 신사처럼.',
      draw: c => `<path d="M60 77.4 C57 74.8 52 74.8 49 77.8 C46.4 80.6 42.4 80.2 41 77.2 C41.6 82.8 49.6 84.2 55 81.2 C57.4 80 59 79.2 60 79.2 C61 79.2 62.6 80 65 81.2 C70.4 84.2 78.4 82.8 79 77.2 C77.6 80.2 73.6 80.6 71 77.8 C68 74.8 63 74.8 60 77.4 Z" fill="#6B4A3A"${st(c, 1.1)}/>` },
    { id: 'f-mono', slot: 'face', name: '외알 안경', price: 40, desc: '금테 외알 안경과 가는 줄.',
      draw: c => `<circle cx="74" cy="66" r="9" fill="rgba(255,255,255,.22)" stroke="#D39B2A" stroke-width="2.1"/><circle cx="74" cy="66" r="9" fill="none" stroke="${c.L}" stroke-width=".7" stroke-opacity=".6"/><path d="M81.6 71 C86.5 79 85 88 79.5 94" fill="none" stroke="#D39B2A" stroke-width="1.1" stroke-dasharray="1.6 1.3"/><path d="M69 61.5 q2.5 -2 5 -1.6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>` },
    { id: 'f-heart', slot: 'face', name: '하트 선글라스', price: 45, desc: '시험이 끝난 날 쓰는 하트 선글라스.',
      draw: c => `<path d="${heart(46, 66.5, 8.2)}" fill="${P}" fill-opacity=".92"${st(c, 1.5)}/><path d="${heart(74, 66.5, 8.2)}" fill="${P}" fill-opacity=".92"${st(c, 1.5)}/><path d="M54.8 63.6 Q60 60.8 65.2 63.6 M36.4 63 L27 61 M83.6 63 L93 61" fill="none" stroke="${c.L}" stroke-width="1.6" stroke-linecap="round"/><path d="M40.5 62 q2 -2 4.5 -1.4 M68.5 62 q2 -2 4.5 -1.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".8"/>` },

    /* 표정 */
    { id: 'e-dot', slot: 'eyes', name: '동글 눈', price: 0, desc: '기본 눈. 가끔 깜빡여요.', draw: dotEyes },
    { id: 'e-smile', slot: 'eyes', name: '웃는 눈', price: 10, desc: '다 읽고 나면 이런 얼굴.',
      draw: c => `<path d="M41 68 Q46 61.2 51 68 M69 68 Q74 61.2 79 68" fill="none" stroke="${c.L}" stroke-width="2.3" stroke-linecap="round"/>` },
    { id: 'e-sleepy', slot: 'eyes', name: '졸린 눈', price: 10, desc: '밤샘 공부 중. 조금만 더!',
      draw: c => `<path d="M41 66.5 Q46 70.5 51 66.5 M69 66.5 Q74 70.5 79 66.5" fill="none" stroke="${c.L}" stroke-width="2.2" stroke-linecap="round"/><path d="M41.5 66.8 l-1.8 -1.4 M78.5 66.8 l1.8 -1.4" stroke="${c.L}" stroke-width="1.2" stroke-linecap="round"/><text x="92" y="46" font-size="8" font-weight="700" fill="${c.L}" fill-opacity=".45" font-family="${MONO}">z</text><text x="98" y="39" font-size="6" font-weight="700" fill="${c.L}" fill-opacity=".3" font-family="${MONO}">z</text>` },
    { id: 'e-wink', slot: 'eyes', name: '윙크', price: 15, desc: '한쪽 눈을 찡긋.',
      draw: c => dotEye(46, c.f) + `<path d="M69.5 67.5 Q74 61.8 78.5 67.5" fill="none" stroke="${c.L}" stroke-width="2.3" stroke-linecap="round"/>` },
    { id: 'e-focus', slot: 'eyes', name: '집중 모드', price: 20, desc: '족보 앞에서 눈썹에 힘을 줬어요.',
      draw: c => dotEyes(c) + `<path d="M39.5 56.6 L51 59.8 M80.5 56.6 L69 59.8" stroke="${c.L}" stroke-width="2.2" stroke-linecap="round"/>` },
    { id: 'e-sparkle', slot: 'eyes', name: '반짝 눈', price: 20, desc: '새 아이템을 봤을 때의 눈.',
      draw: c => [46, 74].map(x => `<g class="rb-eye"><ellipse cx="${x}" cy="66" rx="5" ry="6.2" fill="${c.f.eye}"/><path d="${spark(x + 1.4, 63.6, 2.6)}" fill="#fff"/><circle cx="${x - 1.6}" cy="69" r="1" fill="#fff"/></g>`).join('') + `<path d="${spark(33, 56, 2.4)}" fill="${GOLD}"/><path d="${spark(88, 55, 1.8)}" fill="${P2}"/>` },
    { id: 'e-heart', slot: 'eyes', name: '하트 눈', price: 30, desc: '좋아하는 사상가를 만났을 때.',
      draw: c => `<path d="${heart(46, 66.5, 5.2)}" fill="${P}"${st(c, 1.1)}/><path d="${heart(74, 66.5, 5.2)}" fill="${P}"${st(c, 1.1)}/><path d="M43.5 63.6 q1 -1.2 2.4 -1" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M71.5 63.6 q1 -1.2 2.4 -1" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/>` },

    /* 목 */
    { id: 'n-none', slot: 'neck', name: '목 장식 없음', price: 0 },
    { id: 'n-bell', slot: 'neck', name: '방울 목걸이', price: 15, desc: '움직일 때마다 딸랑.',
      draw: c => `<path d="M39 93 C50 101.5 70 101.5 81 93 L81 97.5 C70 106 50 106 39 97.5 Z" fill="${P}"${st(c, 1.3)}/><circle cx="60" cy="105.5" r="4.4" fill="${GOLD}"${st(c, 1.3)}/><path d="M57 105.2 h6 M60 106.8 v2.2" stroke="${c.L}" stroke-width="1" stroke-linecap="round"/><circle cx="58.4" cy="103.8" r=".9" fill="#fff" opacity=".8"/>` },
    { id: 'n-bow', slot: 'neck', name: '나비넥타이', price: 15, desc: '발표하는 날의 분홍 나비넥타이.',
      draw: c => `<path d="M60 99.5 L50.5 94.3 C48.6 93.4 47 94.6 47 96.4 L47 102.6 C47 104.4 48.6 105.6 50.5 104.7 Z" fill="${P}"${st(c, 1.3)}/><path d="M60 99.5 L69.5 94.3 C71.4 93.4 73 94.6 73 96.4 L73 102.6 C73 104.4 71.4 105.6 69.5 104.7 Z" fill="${P}"${st(c, 1.3)}/><rect x="57.2" y="96.8" width="5.6" height="5.4" rx="1.8" fill="#E23D8E"${st(c, 1.2)}/><circle cx="51.5" cy="97.5" r=".9" fill="#fff" opacity=".7"/><circle cx="51.5" cy="101.3" r=".9" fill="#fff" opacity=".7"/><circle cx="68.5" cy="97.5" r=".9" fill="#fff" opacity=".7"/><circle cx="68.5" cy="101.3" r=".9" fill="#fff" opacity=".7"/>` },
    { id: 'n-tie', slot: 'neck', name: '줄무늬 넥타이', price: 20, desc: '남색에 분홍 줄무늬.',
      draw: c => `<defs><clipPath id="${c.u}tie"><path d="M58 100.5 L62 100.5 L64.6 121 L60 126 L55.4 121 Z"/></clipPath></defs><path d="M58 100.5 L62 100.5 L64.6 121 L60 126 L55.4 121 Z" fill="${NAVY}"/><g clip-path="url(#${c.u}tie)" stroke="${P2}" stroke-width="1.6"><path d="M52 104 L68 112 M52 111 L68 119 M52 118 L68 126"/></g><path d="M58 100.5 L62 100.5 L64.6 121 L60 126 L55.4 121 Z" fill="none"${st(c, 1.3)}/><path d="M56.8 95.6 L63.2 95.6 L62.2 100.8 L57.8 100.8 Z" fill="${NAVY}"${st(c, 1.3)}/>` },
    { id: 'n-scarf', slot: 'neck', name: '니트 목도리', price: 30, desc: '도서관이 추울 때 두르는 목도리.',
      draw: c => `<path d="M33 89.5 C44 100 76 100 87 89.5 L89 96.5 C77 108.5 43 108.5 31 96.5 Z" fill="${P}"${st(c)}/><path d="M34 93.4 C45 103 75 103 86 93.4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="3 2.4"/>`
        + `<path d="M69 101 L80 100 L83 124 L71 124.5 Z" fill="${P}"${st(c)}/><path d="M70 108 L81.2 107.4 M70.8 115 L82 114.4" stroke="#fff" stroke-opacity=".7" stroke-width="2.2"/><path d="M72 124.6 v3.4 M75 124.5 v3.4 M78 124.3 v3.4 M81 124.1 v3.4" stroke="${P}" stroke-width="1.5" stroke-linecap="round"/>` },
    { id: 'n-ruff', slot: 'neck', name: '레이스 칼라', price: 35, desc: '초상화 속 옷깃처럼 둥글게 부푼 레이스.',
      draw: c => { let s = ''; for (let k = 0; k <= 8; k++) { const t = k / 8, x = 38 + 44 * t, y = 95.5 + Math.sin(Math.PI * t) * 7; s += `<circle cx="${r2(x)}" cy="${r2(y)}" r="5.2" fill="#FFFFFF"${st(c, 1.2)}/>`; } return s + `<path d="M40 97 C50 106 70 106 80 97" fill="none" stroke="${P2}" stroke-width="1.2" stroke-dasharray="1.4 1.8"/>`; } },
    { id: 'n-pearl', slot: 'neck', name: '진주 목걸이', price: 45, desc: '작은 진주를 한 줄로.',
      draw: c => { let s = ''; for (let k = 0; k <= 12; k++) { const t = k / 12, x = 42 + 36 * t, y = 95 + Math.sin(Math.PI * t) * 9.5; s += `<circle cx="${r2(x)}" cy="${r2(y)}" r="1.9" fill="#FFF7EE"${st(c, .8)}/>`; } return s + `<path d="${heart(60, 107.5, 2.6)}" fill="${P}"${st(c, .9)}/>`; } },

    /* 옷 (몸 모양으로 잘라 그린다) */
    { id: 'o-none', slot: 'outfit', name: '옷 없음', price: 0 },
    { id: 'o-apron', slot: 'outfit', name: '작업 앞치마', price: 20, desc: '주머니가 큰 분홍 앞치마.',
      draw: c => `<path d="M46 104 L74 104 L77 142 L43 142 Z" fill="${P3}"${st(c, 1.3)}/><path d="M46 104 C48 98 52 95 55 94 M74 104 C72 98 68 95 65 94" fill="none" stroke="${P}" stroke-width="1.8"/><rect x="52" y="122" width="16" height="10" rx="2" fill="${P2}"${st(c, 1.1)}/><path d="M60 122 v10" stroke="${c.L}" stroke-opacity=".3" stroke-width="1"/>` },
    { id: 'o-hoodie', slot: 'outfit', sleeve: P2, name: '분홍 후드티', price: 30, desc: '시험 기간 교복.',
      draw: c => `<rect x="30" y="85" width="60" height="60" fill="${P2}"/><path d="M38 92 C46 101 74 101 82 92" fill="none"${st(c, 1.3)}/><path d="M55 98.5 L54 110 M65 98.5 L66 110" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><circle cx="54" cy="110.6" r="1.1" fill="#fff"/><circle cx="66" cy="110.6" r="1.1" fill="#fff"/><path d="M46 124 L74 124 L76 134 L44 134 Z" fill="none"${st(c, 1.2)}/><path d="M30 136 H90" stroke="${P}" stroke-width="3"/>` },
    { id: 'o-vest', slot: 'outfit', sleeve: '#DCE8FF', name: '셔츠와 니트 조끼', price: 35, desc: '도서관 단골의 차림.',
      draw: c => `<rect x="30" y="85" width="60" height="60" fill="#DCE8FF"/><path d="M40 96 L60 118 L80 96 L90 96 L90 145 L30 145 L30 96 Z" fill="${P2}"/><path d="M40 96 L60 118 L80 96" fill="none" stroke="${P}" stroke-width="2.4"/>`
        + `<g stroke="#fff" stroke-opacity=".55" stroke-width="1"><path d="M40 112 L50 122 L40 132 L30 122 Z M80 112 L90 122 L80 132 L70 122 Z M60 124 L68 132 L60 140 L52 132 Z" fill="none"/></g><path d="M53 93 L60 101 L67 93" fill="#fff"${st(c, 1.1)}/>` },
    { id: 'o-overall', slot: 'outfit', name: '멜빵바지', price: 40, desc: '하늘하늘 청 멜빵.',
      draw: c => `<path d="M47 108 L73 108 L73 118 C78 118 86 122 90 128 L90 145 L30 145 L30 128 C34 122 42 118 47 118 Z" fill="#8FB3EA"${st(c, 1.2)}/><path d="M49 108 L44 92 M71 108 L76 92" stroke="#8FB3EA" stroke-width="3.2"/><circle cx="50" cy="111" r="1.4" fill="${GOLD}"${st(c, .7)}/><circle cx="70" cy="111" r="1.4" fill="${GOLD}"${st(c, .7)}/><rect x="54" y="113" width="12" height="8" rx="1.5" fill="#A9C6F0"${st(c, 1)}/><path d="M60 128 v17" stroke="${c.L}" stroke-opacity=".3" stroke-width="1"/>` },
    { id: 'o-jacket', slot: 'outfit', sleeve: P, name: '과잠', price: 50, desc: '학과 점퍼. 가슴에 S 자수.',
      draw: c => `<rect x="30" y="85" width="60" height="60" fill="${P}"/><path d="M52 92 L60 104 L68 92" fill="#FFF3F8"${st(c, 1.2)}/><path d="M60 104 V142" stroke="${c.L}" stroke-opacity=".45" stroke-width="1.2"/><circle cx="60" cy="112" r="1.2" fill="#FFF3F8"/><circle cx="60" cy="121" r="1.2" fill="#FFF3F8"/><circle cx="60" cy="130" r="1.2" fill="#FFF3F8"/>`
        + `<text x="44.5" y="127" font-size="10" font-weight="700" fill="#FFF3F8" font-family="${MONO}">S</text><path d="M30 135 H90 M30 138.5 H90" stroke="#FFF3F8" stroke-width="1.6"/>` },
    { id: 'o-dress', slot: 'outfit', sleeve: P, name: '도트 원피스', price: 50, desc: '하얀 물방울 무늬의 분홍 원피스.',
      draw: c => { let d = ''; for (let y = 102; y < 145; y += 7) for (let x = 34 + ((y / 7) % 2) * 3.5; x < 88; x += 7) d += `<circle cx="${x}" cy="${y}" r="1.2" fill="#fff" opacity=".85"/>`; let sc = ''; for (let x = 30; x < 90; x += 6) sc += `<path d="M${x} 138 q3 4 6 0" fill="${P3}"${st(c, 1)}/>`; return `<rect x="30" y="85" width="60" height="60" fill="${P}"/>${d}<path d="M44 96 C52 104 68 104 76 96" fill="none" stroke="#fff" stroke-width="2"/>${sc}<rect x="30" y="140" width="60" height="6" fill="${P3}"/>`; } },
    { id: 'o-trench', slot: 'outfit', sleeve: '#DDBB8A', name: '트렌치코트', price: 60, desc: '비 오는 날 도서관 가는 길.',
      draw: c => `<rect x="30" y="85" width="60" height="60" fill="#DDBB8A"/><path d="M50 91 L60 110 L70 91 L77 96 L66 116 L54 116 L43 96 Z" fill="#CFA870"${st(c, 1.1)}/><path d="M53 93 L60 108 L67 93" fill="#fff"/><rect x="30" y="121" width="60" height="5" fill="#B98E57"/><rect x="56.5" y="120" width="7" height="7" rx="1" fill="none"${st(c, 1)}/>`
        + `<g fill="#6B4A3A"><circle cx="54" cy="112" r="1.2"/><circle cx="66" cy="112" r="1.2"/><circle cx="54" cy="132" r="1.2"/><circle cx="66" cy="132" r="1.2"/></g>` },
    { id: 'o-suit', slot: 'outfit', sleeve: CHAR, name: '연미복', price: 70, desc: '분홍 조끼를 받쳐 입은 19세기풍 연미복.',
      draw: c => `<rect x="30" y="85" width="60" height="60" fill="${CHAR}"/><path d="M48 92 L60 138 L72 92 Z" fill="#fff"/><path d="M52 104 L60 138 L68 104 L66 124 L60 136 L54 124 Z" fill="${P}"${st(c, 1)}/><path d="M48 92 L56 118 L50 118 Z M72 92 L64 118 L70 118 Z" fill="#433849"/><g fill="${GOLD}"><circle cx="60" cy="113" r="1"/><circle cx="60" cy="120" r="1"/></g>` },
    { id: 'o-gown', slot: 'outfit', sleeve: CHAR, name: '학위 가운', ach: 'tb', desc: '교재를 끝까지 읽은 토끼의 가운.',
      draw: c => `<rect x="30" y="85" width="60" height="60" fill="${CHAR}"/><path d="M44 92 L56 145 M76 92 L64 145" stroke="${P}" stroke-width="5"/><path d="M44 92 L56 145 M76 92 L64 145" stroke="${GOLD}" stroke-width="1.2"/><path d="M36 128 C48 132 72 132 84 128" fill="none" stroke="#433849" stroke-width="1.4"/>` },

    /* 소품 */
    { id: 'p-none', slot: 'held', name: '빈손', price: 0 },
    { id: 'p-carrot', slot: 'held', name: '당근', price: 0, desc: '콩이의 기본 소품이자 이 사이트의 화폐.',
      draw: c => `<path d="M66.5 103 C71 104.5 72.5 108 70.6 110.6 L52.6 128.2 C51.4 129.4 49.4 128.4 50 126.8 L61.6 105 C62.8 102.8 64.6 102.4 66.5 103 Z" fill="${ORANGE}"${st(c)}/><path d="M59.4 111.6 l3.2 1.6 M56.4 117.6 l2.8 1.4 M63.8 107.2 l2.2 1" stroke="${c.L}" stroke-opacity=".45" stroke-width="1.1" stroke-linecap="round"/>`
        + `<path d="M67 104 C68 97 71.5 92.6 77 92 C75 96.5 72.4 100.4 68.6 104.4 Z" fill="${GREEN}"${st(c, 1.3)}/><path d="M68.4 105 C72.8 100.4 78.4 100 82.6 101.6 C79 104.8 74.2 106.6 69.4 106.6 Z" fill="${GREEN}"${st(c, 1.3)}/>` },
    { id: 'p-pen', slot: 'held', name: '분홍 형광펜', price: 10, desc: '시험 포인트에 긋는 형광펜.',
      draw: c => `<g transform="rotate(38 62 114)"><rect x="58.5" y="98" width="7.4" height="26" rx="2" fill="${P}"${st(c, 1.3)}/><rect x="58.5" y="98" width="7.4" height="7.6" rx="2" fill="${P3}"${st(c, 1.3)}/><path d="M59.4 124 L65 124 L63.4 129 L61 129 Z" fill="#FF7FC0"${st(c, 1.1)}/><path d="M60.6 108 v12" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/></g>` },
    { id: 'p-book', slot: 'held', name: '두꺼운 교재', price: 20, desc: '늘 들고 다니는 두꺼운 교재.',
      draw: c => `<rect x="44.5" y="100.5" width="31" height="25" rx="2.4" fill="${P}"${st(c)}/><rect x="44.5" y="100.5" width="5" height="25" rx="1.6" fill="#E23D8E"${st(c, 1.1)}/><path d="M76 103 V124" stroke="#fff" stroke-width="1.6"/><rect x="53" y="106" width="18" height="6.4" rx="1" fill="#FFF3F8"/><text x="62" y="110.9" text-anchor="middle" font-size="4.4" font-weight="700" fill="${P}" font-family="${SANS}">사회사상사</text><path d="M54 116.5 h16 M54 119.5 h11" stroke="#fff" stroke-opacity=".6" stroke-width="1.1" stroke-linecap="round"/>` },
    { id: 'p-coffee', slot: 'held', name: '밤샘 커피', price: 20, desc: '아이스 아메리카노, 분홍 뚜껑.',
      draw: c => `<path d="M51 104.5 L69 104.5 L66.6 126.2 C66.4 127.6 65.2 128.4 63.8 128.4 L56.2 128.4 C54.8 128.4 53.6 127.6 53.4 126.2 Z" fill="#fff"${st(c)}/><path d="M52.4 111.5 L67.6 111.5 L66.8 119 L53.2 119 Z" fill="#C98A5A"${st(c, 1.1)}/><path d="${heart(60, 115, 1.9)}" fill="#fff"/><rect x="49.2" y="100.4" width="21.6" height="4.8" rx="2" fill="${P}"${st(c, 1.3)}/><path d="M62 100.5 L65.5 92" stroke="${P}" stroke-width="2" stroke-linecap="round"/>` },
    { id: 'p-tea', slot: 'held', name: '찻잔', price: 25, desc: '금테 두른 도자기 찻잔.',
      draw: c => `<ellipse cx="60" cy="123" rx="13" ry="2.8" fill="#fff"${st(c, 1.3)}/><path d="M68.6 111 C74.5 110.5 74.5 118.4 67.6 118" fill="none"${st(c, 1.6)}/><path d="M50.5 108 L69.5 108 C69.5 116.5 66 121.5 60 121.5 C54 121.5 50.5 116.5 50.5 108 Z" fill="#fff"${st(c)}/><path d="M51 112 C57 113.4 63 113.4 69 112" fill="none" stroke="${P}" stroke-width="1.6"/><ellipse cx="60" cy="108" rx="9.5" ry="1.9" fill="#C98A5A"${st(c, 1)}/><path d="M50.6 108.4 h18.8" stroke="${GOLD}" stroke-width=".8"/>` },
    { id: 'p-mag', slot: 'held', name: '돋보기', price: 25, desc: '작은 글씨도 놓치지 않는 돋보기.',
      draw: c => `<path d="M66 120 L77.5 109" stroke="${WOOD}" stroke-width="4" stroke-linecap="round"/><path d="M66 120 L77.5 109" stroke="${c.L}" stroke-width="5.4" stroke-linecap="round" opacity=".0"/><circle cx="83" cy="103.5" r="8.8" fill="rgba(190,225,255,.55)" stroke="${GOLD}" stroke-width="2.6"/><circle cx="83" cy="103.5" r="10.2" fill="none" stroke="${c.L}" stroke-width="1"/><path d="M78.4 100.5 q2 -3.4 5.8 -3.6" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>` },
    { id: 'p-balloon', slot: 'held', name: '하트 풍선', price: 30, desc: '왼쪽 위로 두둥실.',
      draw: { back: c => `<path d="M52 112 C45 99 29 88 23.5 62" fill="none" stroke="${c.L}" stroke-width=".9"/><path d="${heart(22, 50, 11)}" fill="${P}"${st(c)}/><path d="M13.5 46 q2 -4.5 7 -4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/><path d="M22.2 59.6 l-2 3.2 h4 Z" fill="${P}"${st(c, 1)}/>` } },
    { id: 'p-exam', slot: 'held', name: 'A+ 시험지', price: 35, desc: '언젠가 받을 그 시험지.',
      draw: c => `<g transform="rotate(-7 60 115)"><rect x="45.5" y="100" width="29" height="31" rx="2" fill="#fff"${st(c)}/><text x="49" y="112" font-size="9.5" font-weight="700" fill="${P}" font-family="${MONO}">A+</text><circle cx="67.4" cy="108.6" r="4.6" fill="none" stroke="${P}" stroke-width="1.3"/><path d="M49 117 h21 M49 121 h21 M49 125 h14" stroke="${c.L}" stroke-opacity=".3" stroke-width="1.1" stroke-linecap="round"/></g>` },
    { id: 'p-flag', slot: 'held', name: '합격 깃발', price: 40, desc: '응원 깃발을 번쩍.',
      draw: c => `<path d="M70 114 L100.5 41.5" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/><path d="M100 42.4 C105.6 44.6 110.6 43.6 118 46.6 L111.4 60.4 C104.6 57.8 99.8 58.8 94.2 56.6 Z" fill="${P}"${st(c, 1.3)}/><text x="106.3" y="54" text-anchor="middle" font-size="6.2" font-weight="700" fill="#fff" font-family="${SANS}" transform="rotate(14 106.3 52)">합격</text><circle cx="100.8" cy="40.8" r="1.8" fill="${GOLD}"${st(c, .8)}/>` },
    { id: 'p-scale', slot: 'held', name: '비교 저울', ach: 'vs', desc: '두 사상을 나란히 달아 보는 저울.',
      draw: { back: c => `<path d="M92 143 L112 143 L108.6 138.6 L95.4 138.6 Z" fill="${GOLD}"${st(c, 1.2)}/><path d="M102 139 V104" stroke="${GOLD}" stroke-width="2.4"/><path d="M102 139 V104" stroke="${c.L}" stroke-width=".8" opacity=".35"/><path d="M89 105 L115 102" stroke="${GOLD}" stroke-width="2.2" stroke-linecap="round"/><circle cx="102" cy="103.4" r="2.2" fill="${P}"${st(c, .9)}/>`
        + `<path d="M89 105 L85 116 M89 105 L93 116 M115 102 L111 113 M115 102 L119 113" stroke="${c.L}" stroke-width=".7" stroke-opacity=".6"/><path d="M83.6 116 Q89 121.6 94.4 116 Z" fill="${GOLD}"${st(c, 1)}/><path d="M109.6 113 Q115 118.6 120.4 113 Z" fill="${GOLD}"${st(c, 1)}/><circle cx="89" cy="114" r="2" fill="${P}"/><path d="${spark(115, 110.6, 2.4)}" fill="${P2}"/>` } },

    /* 귀 */
    { id: 'ea-up', slot: 'ears', name: '쫑긋 귀', price: 0, desc: '두 귀가 똑바로.' },
    { id: 'ea-one', slot: 'ears', name: '한쪽 접힌 귀', price: 15, desc: '오른쪽 귀가 살짝 접혔어요.' },
    { id: 'ea-lop', slot: 'ears', name: '롭이어', price: 25, desc: '두 귀가 축 늘어진 롭이어.' },

    /* 털색 */
    { id: 'fu-white', slot: 'fur', name: '눈처럼 하양', price: 0, desc: '콩이 본래의 털.' },
    { id: 'fu-cream', slot: 'fur', name: '크림', price: 20, desc: '우유를 살짝 탄 크림색.' },
    { id: 'fu-gray', slot: 'fur', name: '연회색', price: 20, desc: '배가 하얀 연회색 토끼.' },
    { id: 'fu-choco', slot: 'fur', name: '초코', price: 30, desc: '밀크초콜릿 색 털.' },
    { id: 'fu-dutch', slot: 'fur', name: '더치 무늬', price: 40, desc: '얼굴 가운데가 하얀 두 가지 색.' },
    { id: 'fu-pink', slot: 'fur', name: '딸기우유', ach: 'streak', desc: '7일 연속으로 온 토끼에게만.' },

    /* 배경 */
    { id: 'b-none', slot: 'bg', name: '배경 없음', price: 0 },
    { id: 'b-grid', slot: 'bg', name: '모눈 노트', price: 10, desc: '분홍 모눈이 있는 노트 한 장.',
      draw: c => { let g = ''; for (let k = 14; k < 146; k += 8) g += `M8 ${k} H112 `; for (let k = 12; k < 112; k += 8) g += `M${k} 8 V146 `; return `<defs><clipPath id="${c.u}bg"><rect x="6" y="6" width="108" height="142" rx="16"/></clipPath></defs><rect x="6" y="6" width="108" height="142" rx="16" fill="#fff"/><path d="${g}" clip-path="url(#${c.u}bg)" stroke="${P3}" stroke-width=".7"/><rect x="6" y="6" width="108" height="142" rx="16" fill="none" stroke="${P3}" stroke-width="1.4"/>`; } },
    { id: 'b-dots', slot: 'bg', name: '분홍 도트', price: 10, desc: '동그란 분홍 판에 물방울.',
      draw: c => { let d = ''; for (let y = 22; y < 150; y += 11) for (let x = 6 + ((y / 11) % 2) * 5.5; x < 118; x += 11) d += `<circle cx="${r2(x)}" cy="${y}" r="1.8"/>`; return `<defs><clipPath id="${c.u}bg"><circle cx="60" cy="82" r="56"/></clipPath></defs><circle cx="60" cy="82" r="56" fill="#FFE4F1"/><g clip-path="url(#${c.u}bg)" fill="${P2}" opacity=".7">${d}</g>`; } },
    { id: 'b-stripe', slot: 'bg', name: '캔디 스트라이프', price: 15, desc: '사선 줄무늬 분홍 카드.',
      draw: c => { let s = ''; for (let k = -150; k < 130; k += 14) s += `M${k} 150 L${k + 150} 0 `; return `<defs><clipPath id="${c.u}bg"><rect x="6" y="10" width="108" height="136" rx="22"/></clipPath></defs><rect x="6" y="10" width="108" height="136" rx="22" fill="#FFEAF4"/><path d="${s}" clip-path="url(#${c.u}bg)" stroke="#FFD3E8" stroke-width="6"/>`; } },
    { id: 'b-hearts', slot: 'bg', name: '하트 비', price: 20, desc: '하트가 톡톡 떨어져요.',
      draw: c => { const hs = [[18, 30, 5, P2], [100, 22, 6, P], [104, 64, 4, '#C9A7FF'], [14, 84, 6, P], [98, 110, 5, P2], [22, 126, 4, '#C9A7FF'], [34, 12, 3, P], [86, 44, 3, '#FFB36B']]; return `<circle cx="60" cy="82" r="56" fill="#FFF1F8"/>` + hs.map(h => `<path d="${heart(h[0], h[1], h[2])}" fill="${h[3]}"${st(c, .9)}/>`).join(''); } },
    { id: 'b-books', slot: 'bg', name: '도서관 책장', price: 35, desc: '알록달록한 책이 꽂힌 책장.',
      draw: c => { const cols = [P, '#8EA6FF', GOLD, '#8ED99A', '#C9A7FF', '#FF9A7A', P2, '#7FD1C8']; let b = ''; [[14, 46], [14, 96], [14, 144]].forEach((row, ri) => { let x = 12; let k = ri * 3; while (x < 106) { const w = 5 + ((k * 7) % 4), h = 22 + ((k * 5) % 9); b += `<rect x="${x}" y="${row[1] - h}" width="${w}" height="${h}" rx="1" fill="${cols[k % cols.length]}"${st(c, .8)}/>`; x += w + 1; k++; } }); return `<rect x="6" y="6" width="108" height="142" rx="12" fill="#F7E6D6"${st(c, 1.2)}/>${b}<path d="M6 47 H114 M6 97 H114" stroke="${WOOD}" stroke-width="3"/>`; } },
    { id: 'b-board', slot: 'bg', name: '강의실 칠판', price: 35, desc: '분필 낙서가 남은 칠판.',
      draw: c => `<rect x="4" y="8" width="112" height="112" rx="8" fill="#C69B6D"${st(c, 1.2)}/><rect x="9" y="13" width="102" height="102" rx="4" fill="#2F5D50"/><g fill="none" stroke="#F4F1E8" stroke-opacity=".85" stroke-width="1.3" stroke-linecap="round"><path d="M16 26 q6 -6 12 0 t12 0"/><path d="M84 24 L100 24 M96 20 L100 24 L96 28"/><circle cx="96" cy="50" r="6"/><path d="M16 50 L24 42 L32 50"/></g><text x="15" y="108" font-size="7" fill="#F4F1E8" fill-opacity=".85" font-family="${MONO}">Q.</text><rect x="4" y="118" width="112" height="5" rx="2" fill="#B08658"${st(c, 1)}/><rect x="86" y="115" width="10" height="3" rx="1.2" fill="#fff"/>` },
    { id: 'b-stars', slot: 'bg', name: '별밤', price: 40, desc: '밤하늘에 초승달과 별.',
      draw: c => { const s = [[20, 36, 3], [34, 18, 2], [96, 60, 2.4], [16, 92, 2], [104, 104, 3], [28, 122, 1.8], [80, 16, 1.6], [58, 14, 2.2]]; return `<circle cx="60" cy="80" r="57" fill="#2E2F66"/><path d="M92 20 A15 15 0 1 0 106 42 A12 12 0 1 1 92 20 Z" fill="${GOLD}"/>` + s.map(p => `<path d="${spark(p[0], p[1], p[2] * 1.6)}" fill="#FFF3C4"/>`).join(''); } },
    { id: 'b-burst', slot: 'bg', name: '핑크 선버스트', price: 45, desc: '무대 조명처럼 퍼지는 빛.',
      draw: c => { let r = ''; for (let k = 0; k < 24; k++) { const a1 = k * Math.PI / 12, a2 = a1 + Math.PI / 24; r += `<path d="M60 82 L${r2(60 + Math.cos(a1) * 90)} ${r2(82 + Math.sin(a1) * 90)} L${r2(60 + Math.cos(a2) * 90)} ${r2(82 + Math.sin(a2) * 90)} Z"/>`; } return `<defs><clipPath id="${c.u}bg"><circle cx="60" cy="82" r="57"/></clipPath></defs><circle cx="60" cy="82" r="57" fill="#FFE0EF"/><g clip-path="url(#${c.u}bg)" fill="#FFC4DF">${r}</g>`; } }
  ];
  const BY = {};
  ITEMS.forEach(it => { BY[it.id] = it; });

  function norm(look) {
    const L = Object.assign({}, DEFAULT);
    if (look && typeof look === 'object') Object.keys(DEFAULT).forEach(s => { const it = BY[look[s]]; if (it && it.slot === s) L[s] = look[s]; });
    return L;
  }

  function render(look, o) {
    o = o || {};
    const L = norm(look);
    const f = FUR[L.fur] || FUR['fu-white'];
    const c = { f, L: f.line, u: 'rb' + (++uid) };
    const g = s => BY[L[s]];
    const hat = g('hat'), face = g('face'), eyes = g('eyes'), neck = g('neck'), outfit = g('outfit'), held = g('held'), bg = g('bg');
    const lop = L.ears === 'ea-lop';
    const s = [
      `<defs><clipPath id="${c.u}b"><path d="${BODY}"/></clipPath><clipPath id="${c.u}h"><path d="${HEAD}"/></clipPath></defs>`,
      bg && bg.draw ? `<g class="rb-bg">${lay(bg, 'main', c)}</g>` : '',
      `<ellipse class="rb-shadow" cx="60" cy="145.6" rx="29" ry="3.6" fill="rgba(90,20,60,.13)"/>`,
      `<g class="rb-all">`,
      lay(held, 'back', c),
      lop ? '' : `<g class="rb-ears">${earsBack(L.ears, f, c)}</g>`,
      tail(f, c),
      body(f, c),
      outfit && outfit.draw ? `<g clip-path="url(#${c.u}b)">${lay(outfit, 'main', c)}</g><path d="${BODY}" fill="none"${st(c)}/>` : '',
      lay(outfit, 'top', c),
      arms(c, (outfit && outfit.sleeve) || pawFill(f)),
      feet(f, c),
      lay(neck, 'main', c),
      lay(held, 'main', c),
      paws(f, c),
      lay(held, 'front', c),
      `<g class="rb-head">`,
      head(f, c),
      `<g class="rb-face">`, blush(f), (eyes && eyes.draw ? eyes.draw(c) : dotEyes(c)), nose(f), (L.face === 'f-mustache' ? '' : mouth(c)), lay(face, 'main', c), `</g>`,
      lop ? `<g class="rb-ears rb-lop">${earsLop(f, c)}</g>` : '',
      `<g class="rb-hat">${lay(hat, 'main', c)}</g>`,
      `</g></g>`
    ].join('');
    const label = o.label ? `role="img" aria-label="${o.label}"` : 'aria-hidden="true" focusable="false"';
    return `<svg class="rb-svg" viewBox="${o.crop || '0 0 120 150'}" ${label}>${s}</svg>`;
  }

  /* 당근 아이콘 (화폐) */
  const CARROT = '<svg class="cr" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 6.3 C17.6 6.9 18.5 8.9 17.3 10.5 L8.2 20.9 C7.4 21.8 6 21.1 6.4 20 L12 8.3 C12.8 6.7 14 6 15.4 6.3 Z" fill="#FF9A3C" stroke="#3B2A35" stroke-width="1.3" stroke-linejoin="round"/><path d="M15 6.6 C15.1 3.9 16.6 2 19.2 1.8 C18.6 3.8 17.6 5.4 16.2 6.8 Z M16.4 7.5 C18.5 5.9 21 5.9 22.6 7.1 C20.9 8.3 18.9 8.8 17 8.4 Z" fill="#5DBB63" stroke="#3B2A35" stroke-width="1.1" stroke-linejoin="round"/><path d="M11.4 11.4 l1.8 .9 M9.8 14.6 l1.7 .8" stroke="#3B2A35" stroke-width="1" stroke-linecap="round"/></svg>';

  window.RABBIT = { SLOTS, DEFAULT, ACH, ITEMS, BY, FUR, render, norm, CARROT, heart, spark };
})();
