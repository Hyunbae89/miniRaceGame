// 배경(맵): 서울 도심 / 전통 마을 × 낮 / 밤. 하늘, 랜드마크, 건물, 인도, 응원 시민, 산책, 밤 조명.
import { BUSAN_BANNERS, BUSAN_SIGNS, COLORS, GT, HAIR, OFF, SHOPC, SHOPS, SIGNS, SKIN, TRACK, TRAD_BANNERS, TRAD_SIGNS } from "../constants.js";
import { G } from "../state.js";
import { hsh, rr } from "../util.js";
export function TH() {
  return {
    night: G.mapId.endsWith('night'),
    trad: G.mapId.startsWith('trad'),
    place: G.mapId.split('-')[0]
  };
}
export function stars() {
  const now = performance.now() / 1000;
  G.ctx.fillStyle = '#fff';
  for (let k = 0; k < 70; k++) {
    G.ctx.globalAlpha = .35 + .45 * (.5 + .5 * Math.sin(now * 1.7 + k * 2.3));
    const s = .8 + hsh(k * 5.1) * 1.4;
    G.ctx.fillRect(hsh(k * 3.1) * G.W, hsh(k * 7.7) * (GT - 70), s, s);
  }
  G.ctx.globalAlpha = 1;
  const mx = G.W * .8,
    my = 62;
  G.ctx.fillStyle = 'rgba(255,246,216,.18)';
  G.ctx.beginPath();
  G.ctx.arc(mx, my, 30, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#fff3cf';
  G.ctx.beginPath();
  G.ctx.arc(mx, my, 16, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#14214a';
  G.ctx.beginPath();
  G.ctx.arc(mx + 7, my - 5, 14, 0, 7);
  G.ctx.fill();
}
// 부드러운 산 능선(시차 par)
export function ridge(par, seed, base, amp, col, rocky) {
  const off = G.camX * par;
  G.ctx.fillStyle = col;
  G.ctx.beginPath();
  G.ctx.moveTo(0, base);
  for (let x = 0; x <= G.W + 10; x += 8) {
    const w = (x + off) * .008 + seed;
    let y = .55 + .28 * Math.sin(w) + .12 * Math.sin(w * 2.7 + 1) + .05 * Math.sin(w * 6.1);
    if (rocky) y += .08 * Math.abs(Math.sin(w * 9.3));
    G.ctx.lineTo(x, base - amp * y);
  }
  G.ctx.lineTo(G.W, base);
  G.ctx.closePath();
  G.ctx.fill();
}
export function skyline(par, seed, base, minH, maxH, col, win, winP, signs, night) {
  const off = G.camX * par,
    step = 46,
    i0 = Math.floor((off - 70) / step),
    i1 = Math.ceil((off + G.W) / step);
  for (let i = i0; i <= i1; i++) {
    const w = 30 + hsh(i * 3 + seed) * 26,
      bh = minH + hsh(i * 7 + seed) * (maxH - minH),
      x = i * step - off;
    G.ctx.fillStyle = col;
    G.ctx.fillRect(x, base - bh, w, bh);
    if (hsh(i * 11 + seed) > .7) {
      G.ctx.fillRect(x + w / 2 - 1, base - bh - 10, 2, 10);
      if (night) {
        G.ctx.fillStyle = '#ff4d4d';
        G.ctx.fillRect(x + w / 2 - 1.5, base - bh - 12, 3, 3);
        G.ctx.fillStyle = col;
      }
    }
    G.ctx.fillStyle = win;
    for (let wy = 6; wy < bh - 10; wy += 9) for (let wx = 4; wx < w - 6; wx += 8) if (hsh(i * 31 + wy * 1.7 + wx * .37 + seed) > winP) G.ctx.fillRect(x + wx, base - bh + wy, 4, 5);
    // 한글 간판
    if (signs && hsh(i * 41 + seed) > .5 && bh > 40) {
      const t = SHOPS[Math.floor(hsh(i * 43 + seed) * SHOPS.length)],
        c = SHOPC[Math.floor(hsh(i * 47 + seed) * SHOPC.length)];
      const sy = base - bh + 10 + Math.floor(hsh(i * 53 + seed) * Math.max(1, bh - 40));
      if (night) {
        G.ctx.shadowColor = c;
        G.ctx.shadowBlur = 8;
      }
      G.ctx.fillStyle = night ? c : '#fff';
      G.ctx.fillRect(x + 3, sy, w - 6, 11);
      G.ctx.shadowBlur = 0;
      G.ctx.strokeStyle = c;
      G.ctx.lineWidth = 1.5;
      G.ctx.strokeRect(x + 3, sy, w - 6, 11);
      G.ctx.fillStyle = night ? '#fff' : c;
      G.ctx.font = 'bold 8px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillText(t, x + w / 2, sy + 8.5);
    }
  }
}
// 남산타워: 도심 랜드마크와 한강 언덕에서 함께 쓰는 일반화된 관측 타워
export function namsanTower(x, base, scale, night) {
  const c = G.ctx, s = scale, now = performance.now() / 1000;
  const outline = night ? '#20283a' : '#35434a';
  c.save();
  // 길게 뻗은 탑신과 세 단 전망대
  c.fillStyle = night ? '#b9c6d0' : '#eef1f2';
  c.strokeStyle = outline; c.lineWidth = Math.max(1, 1.2 * s);
  c.fillRect(x - 3*s, base - 78*s, 6*s, 78*s);
  c.strokeRect(x - 3*s, base - 78*s, 6*s, 78*s);
  // 넓은 3단 전망대
  const bands = [
    { y: base - 82*s, w: 20*s, h: 7*s },
    { y: base - 92*s, w: 22*s, h: 8*s },
    { y: base - 103*s, w: 18*s, h: 7*s }
  ];
  for (let b = 0; b < bands.length; b++) {
    const d = bands[b];
    c.fillStyle = night ? (b === 1 ? '#d6d5ce' : '#aebdc8') : (b === 1 ? '#fffdf5' : '#e2e8eb');
    rr(x - d.w/2, d.y, d.w, d.h, 2*s); c.fill();
    c.strokeStyle = outline; c.lineWidth = Math.max(.8, 1*s); c.stroke();
    c.fillStyle = night ? '#ffcf72' : '#8da2a9';
    const count = b === 1 ? 6 : 5;
    for (let k = 0; k < count; k++) {
      const wx = x - d.w/2 + (k + .5) * d.w / count;
      c.fillRect(wx - .8*s, d.y + 2*s, 1.6*s, 3*s);
    }
  }
  // 전망대 위 짧고 굵은 안테나 받침과 가는 안테나
  c.strokeStyle = outline; c.lineWidth = 3*s; c.beginPath(); c.moveTo(x, base - 103*s); c.lineTo(x, base - 112*s); c.stroke();
  c.strokeStyle = night ? '#e2a3a0' : '#d66a55'; c.lineWidth = 1.3*s; c.beginPath(); c.moveTo(x, base - 112*s); c.lineTo(x, base - 132*s); c.stroke();
  if (night) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, base - 94*s, 3*s, x, base - 94*s, 27*s);
    g.addColorStop(0, 'rgba(255,211,125,.24)'); g.addColorStop(1, 'rgba(255,211,125,0)');
    c.fillStyle = g; c.fillRect(x - 29*s, base - 123*s, 58*s, 58*s);
    if (now % 1.4 < .7) { c.fillStyle = '#ff4d4d'; c.beginPath(); c.arc(x, base - 134*s, 2.2*s, 0, 7); c.fill(); }
    c.restore();
  }
  c.restore();
}
function namsanLandmark(x, base, night) {
  const c = G.ctx;
  c.fillStyle = night ? '#1a2a3c' : '#7fa87a';
  c.beginPath();
  c.moveTo(x - 190, base);
  c.quadraticCurveTo(x, base - 150, x + 190, base);
  c.fill();
  namsanTower(x, base - 74, 1, night);
}
function hangangNamsanLandmark(x, base, night) {
  const c = G.ctx;
  c.fillStyle = night ? '#172c32' : '#294f39';
  c.beginPath();
  c.moveTo(x - 280, base);
  c.bezierCurveTo(x - 187, base - 145, x + 187, base - 145, x + 280, base);
  c.fill();
  for (const dx of [-72, 76]) {
    c.strokeStyle = night ? '#b9c3bf' : '#d8ded4'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x + dx, base - 78); c.lineTo(x + dx, base - 107); c.moveTo(x + dx - 3, base - 98); c.lineTo(x + dx + 3, base - 98); c.stroke();
  }
  // 언덕 중앙 정상은 곡선의 제어점 기준 약 109px 위에 있다.
  namsanTower(x, base - 109, .53, night);
}
// 서울 랜드마크: 남산(N서울타워), 롯데월드타워, 63빌딩 — 시차 공간에서 700 간격으로 번갈아 등장
export function landmarks(par, base, night, phase) {
  const off = G.camX * par,
    sp = 700,
    i0 = Math.floor((off - 250) / sp),
    i1 = Math.ceil((off + G.W + 250) / sp),
    now = performance.now() / 1000;
  for (let i = i0; i <= i1; i++) {
    const kind = (i % 3 + 3) % 3,
      x = i * sp + 260 - off;
    if (phase === 0 && kind === 0) {
      namsanLandmark(x, base, night);
      const top = base - 74;
      G.ctx.fillStyle = night ? 'rgba(255,255,255,.7)' : '#1e2b33';
      G.ctx.font = '9px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillText('N서울타워', x, top - 108);
    }
    if (phase === 1 && kind === 1) {
      G.ctx.fillStyle = night ? '#33435f' : '#c9d6df';
      G.ctx.beginPath();
      G.ctx.moveTo(x - 18, base);
      G.ctx.lineTo(x - 6, base - 188);
      G.ctx.lineTo(x - 2, base - 204);
      G.ctx.lineTo(x + 2, base - 204);
      G.ctx.lineTo(x + 6, base - 188);
      G.ctx.lineTo(x + 18, base);
      G.ctx.fill();
      G.ctx.strokeStyle = night ? 'rgba(180,220,255,.8)' : 'rgba(255,255,255,.7)';
      G.ctx.lineWidth = 1.2;
      G.ctx.beginPath();
      G.ctx.moveTo(x, base);
      G.ctx.lineTo(x, base - 196);
      G.ctx.stroke();
      G.ctx.fillStyle = night ? '#9fd3ff' : '#9fb1bf';
      G.ctx.fillRect(x - 1, base - 200, 2, 10);
      if (night) {
        G.ctx.fillStyle = 'rgba(160,210,255,.5)';
        for (let y = base - 10; y > base - 180; y -= 12) G.ctx.fillRect(x - 14 + (base - y) * .065, y, 28 - (base - y) * .13, 1.5);
      }
      G.ctx.fillStyle = night ? 'rgba(255,255,255,.7)' : '#1e2b33';
      G.ctx.font = '9px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillText('롯데월드타워', x, base - 210);
    }
    if (phase === 1 && kind === 2) {
      const g = G.ctx.createLinearGradient(x - 18, 0, x + 18, 0);
      g.addColorStop(0, night ? '#6b5320' : '#f0c766');
      g.addColorStop(1, night ? '#3d2f12' : '#b9832a');
      G.ctx.fillStyle = g;
      G.ctx.beginPath();
      G.ctx.moveTo(x - 19, base);
      G.ctx.lineTo(x - 15, base - 150);
      G.ctx.lineTo(x + 15, base - 138);
      G.ctx.lineTo(x + 19, base);
      G.ctx.fill();
      G.ctx.strokeStyle = night ? 'rgba(255,215,106,.55)' : 'rgba(255,255,255,.35)';
      G.ctx.lineWidth = 1;
      G.ctx.beginPath();
      for (let y = base - 8; y > base - 138; y -= 8) {
        G.ctx.moveTo(x - 18, y);
        G.ctx.lineTo(x + 18, y - (base - y) * .0);
      }
      G.ctx.stroke();
      G.ctx.fillStyle = night ? 'rgba(255,255,255,.7)' : '#1e2b33';
      G.ctx.font = '9px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillText('63빌딩', x, base - 156);
    }
  }
}
// 한옥(기와지붕 곡선, 처마 끝이 들림) / 궁궐 대문
export function roof(x, top, w, col) {
  G.ctx.fillStyle = col;
  G.ctx.beginPath();
  G.ctx.moveTo(x - 14, top - 8);
  G.ctx.quadraticCurveTo(x + w * .25, top + 2, x + w / 2, top + 2);
  G.ctx.quadraticCurveTo(x + w * .75, top + 2, x + w + 14, top - 8);
  G.ctx.lineTo(x + w - 8, top - 16);
  G.ctx.lineTo(x + 8, top - 16);
  G.ctx.closePath();
  G.ctx.fill();
  G.ctx.lineWidth = 3;
  G.ctx.strokeStyle = col;
  G.ctx.beginPath();
  G.ctx.moveTo(x + 2, top - 19);
  G.ctx.quadraticCurveTo(x + w / 2, top - 14, x + w - 2, top - 19);
  G.ctx.stroke();
  G.ctx.strokeStyle = 'rgba(255,255,255,.12)';
  G.ctx.lineWidth = 1;
  G.ctx.beginPath();
  for (let k = x + 4; k < x + w - 4; k += 5) {
    G.ctx.moveTo(k, top - 14);
    G.ctx.lineTo(k - 1, top);
  }
  G.ctx.stroke();
}
export function hanok(x, base, w, night, i) {
  const h = 30,
    top = base - h;
  G.ctx.fillStyle = night ? '#3a3a44' : '#f3ecdc';
  G.ctx.fillRect(x, top, w, h);
  G.ctx.fillStyle = night ? '#2a221c' : '#7a5536';
  for (let k = 0; k <= 4; k++) G.ctx.fillRect(x + k * (w - 4) / 4, top, 4, h);
  for (let k = 0; k < 4; k++) {
    const wx = x + 6 + k * (w - 4) / 4,
      ww = (w - 4) / 4 - 8;
    G.ctx.fillStyle = night && hsh(i * 7 + k) > .35 ? '#ffcf6b' : night ? '#2e2a30' : '#e9dcc0';
    G.ctx.fillRect(wx, top + 7, ww, 14);
    G.ctx.strokeStyle = night ? 'rgba(80,50,20,.8)' : '#9a7a52';
    G.ctx.lineWidth = .8;
    G.ctx.beginPath();
    for (let gx = wx + 4; gx < wx + ww; gx += 4) {
      G.ctx.moveTo(gx, top + 7);
      G.ctx.lineTo(gx, top + 21);
    }
    G.ctx.moveTo(wx, top + 14);
    G.ctx.lineTo(wx + ww, top + 14);
    G.ctx.stroke();
  }
  G.ctx.fillStyle = night ? '#1f4a3c' : '#3e8e6e';
  G.ctx.fillRect(x - 4, top - 3, w + 8, 3);
  roof(x, top - 3, w, night ? '#1c1f26' : '#4a4f57');
}
export function palaceGate(x, base, night) {
  const w = 160;
  G.ctx.fillStyle = night ? '#4a4a52' : '#b9b2a5';
  G.ctx.fillRect(x, base - 34, w, 34);
  G.ctx.strokeStyle = 'rgba(0,0,0,.12)';
  G.ctx.lineWidth = 1;
  G.ctx.beginPath();
  for (let y = base - 34; y < base; y += 8) {
    G.ctx.moveTo(x, y);
    G.ctx.lineTo(x + w, y);
  }
  G.ctx.stroke();
  G.ctx.fillStyle = night ? '#15161c' : '#3a3026';
  G.ctx.beginPath();
  G.ctx.moveTo(x + w / 2 - 16, base);
  G.ctx.lineTo(x + w / 2 - 16, base - 18);
  G.ctx.arc(x + w / 2, base - 18, 16, Math.PI, 0);
  G.ctx.lineTo(x + w / 2 + 16, base);
  G.ctx.fill();
  G.ctx.fillStyle = night ? '#6b1f1f' : '#b23a2b';
  for (let k = 0; k < 7; k++) G.ctx.fillRect(x + 18 + k * 20, base - 56, 5, 22);
  G.ctx.fillStyle = night ? '#1f4a3c' : '#3e8e6e';
  G.ctx.fillRect(x + 10, base - 60, w - 20, 5);
  roof(x + 12, base - 60, w - 24, night ? '#1c1f26' : '#4a4f57');
  G.ctx.fillStyle = night ? '#6b1f1f' : '#b23a2b';
  for (let k = 0; k < 5; k++) G.ctx.fillRect(x + 40 + k * 20, base - 92, 4, 14);
  G.ctx.fillStyle = night ? '#1f4a3c' : '#3e8e6e';
  G.ctx.fillRect(x + 34, base - 95, w - 68, 4);
  roof(x + 42, base - 95, w - 84, night ? '#1c1f26' : '#4a4f57');
  // 처마 사이에 나무 현판을 달고 글자를 판 안에 넣는다.
  G.ctx.fillStyle = night ? '#4b2d1b' : '#6f4024';
  G.ctx.fillRect(x + 48, base - 84, 64, 20);
  G.ctx.fillStyle = night ? '#8a5630' : '#9a6035';
  G.ctx.fillRect(x + 51, base - 81, 58, 14);
  G.ctx.fillStyle = night ? '#ffd987' : '#3a2115';
  G.ctx.font = 'bold 9px serif';
  G.ctx.textAlign = 'center';
  G.ctx.fillText('光化門', x + w / 2, base - 70);
  if (night) {
    G.ctx.save();
    G.ctx.shadowColor = '#ffc36b';
    G.ctx.shadowBlur = 16;
    G.ctx.fillStyle = 'rgba(255,190,105,.25)';
    G.ctx.fillRect(x + 48, base - 84, 64, 20);
    G.ctx.restore();
    const g = G.ctx.createRadialGradient(x + w / 2, base - 40, 10, x + w / 2, base - 40, 110);
    g.addColorStop(0, 'rgba(255,200,120,.25)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    G.ctx.fillStyle = g;
    G.ctx.fillRect(x - 40, base - 150, w + 80, 150);
  }
}
export function tree(x, y) {
  G.ctx.fillStyle = '#7a5536';
  G.ctx.fillRect(x - 3, y - 24, 6, 24);
  G.ctx.fillStyle = '#5f9e5a';
  G.ctx.beginPath();
  G.ctx.arc(x, y - 36, 16, 0, 7);
  G.ctx.arc(x - 11, y - 27, 11, 0, 7);
  G.ctx.arc(x + 11, y - 28, 11, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = 'rgba(255,255,255,.15)';
  G.ctx.beginPath();
  G.ctx.arc(x - 5, y - 42, 6, 0, 7);
  G.ctx.fill();
}
export function pine(x, y, i) {
  const lean = (hsh(i * 5) - .5) * 10;
  G.ctx.strokeStyle = '#8a4b2f';
  G.ctx.lineWidth = 5;
  G.ctx.lineCap = 'round';
  G.ctx.beginPath();
  G.ctx.moveTo(x, y);
  G.ctx.quadraticCurveTo(x + lean, y - 22, x + lean * .4, y - 44);
  G.ctx.stroke();
  G.ctx.fillStyle = '#2f5d3a';
  for (const [dx, dy, rx] of [[-8, -30, 16], [8, -38, 15], [0, -48, 13]]) {
    G.ctx.beginPath();
    G.ctx.ellipse(x + lean * .4 + dx, y + dy, rx, 5, 0, 0, 7);
    G.ctx.fill();
  }
  G.ctx.fillStyle = 'rgba(255,255,255,.08)';
  G.ctx.beginPath();
  G.ctx.ellipse(x + lean * .4, y - 50, 8, 2.5, 0, 0, 7);
  G.ctx.fill();
}
// 구경꾼 한 명(발 위치 x, y). 크기 s는 1.3~1.6배. 밤에는 모두 팔을 흔들고, 오른손 위치를 돌려줘 응원봉을 따로 그림
// pose: 'wave'(흔들기) | 'down'(내림) | 'hold'(현수막 막대를 두 손으로 잡음: hold = { px 막대 x, y1 윗손, y2 아랫손 })
export function spectator(x, y, i, now, trad, night, pose, hold, place) {
  const s = 1.3 + hsh(i * 13) * .3,
    c = COLORS[Math.floor(hsh(i * 5) * COLORS.length)],
    sk = SKIN[Math.floor(hsh(i * 9) * SKIN.length)],
    hr = HAIR[Math.floor(hsh(i * 19) * HAIR.length)];
  pose = pose || (night || hsh(i * 17) > .4 ? 'wave' : 'down');
  const a = Math.sin(now * (night ? 5 : 7) + i * 1.3);
  let hand = null;
  G.ctx.strokeStyle = sk;
  G.ctx.lineWidth = 2.2 * s;
  G.ctx.lineCap = 'round';
  G.ctx.beginPath();
  if (pose === 'hold') {
    G.ctx.moveTo(x - 3 * s, y - 12 * s);
    G.ctx.lineTo(hold.px, hold.y1);
    G.ctx.moveTo(x + 3 * s, y - 12 * s);
    G.ctx.lineTo(hold.px, hold.y2);
  } else if (pose === 'wave') {
    const rx = x + 7 * s,
      ry = y - (20 - a * 3) * s;
    G.ctx.moveTo(x - 3 * s, y - 12 * s);
    G.ctx.lineTo(x - 7 * s, y - (20 + a * 3) * s);
    G.ctx.moveTo(x + 3 * s, y - 12 * s);
    G.ctx.lineTo(rx, ry);
    hand = { x: rx, y: ry, s, a, i };
  } else {
    G.ctx.moveTo(x - 3 * s, y - 12 * s);
    G.ctx.lineTo(x - 5 * s, y - 5 * s);
    G.ctx.moveTo(x + 3 * s, y - 12 * s);
    G.ctx.lineTo(x + 5 * s, y - 5 * s);
  }
  G.ctx.stroke();
  G.ctx.fillStyle = c;
  rr(x - 4 * s, y - 14 * s, 8 * s, 14 * s, 3 * s);
  G.ctx.fill();
  G.ctx.fillStyle = sk;
  G.ctx.beginPath();
  G.ctx.arc(x, y - 18 * s, 4.2 * s, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = hr;
  G.ctx.beginPath();
  G.ctx.arc(x, y - 18.6 * s, 4.4 * s, Math.PI, 0);
  G.ctx.fill();
  if (trad && hsh(i * 29) > .72) {
    G.ctx.fillStyle = '#15161c';
    G.ctx.beginPath();
    G.ctx.ellipse(x, y - 21.5 * s, 8 * s, 1.6 * s, 0, 0, 7);
    G.ctx.fill();
    G.ctx.fillRect(x - 2.6 * s, y - 27 * s, 5.2 * s, 5.5 * s);
  }
  // 피켓(낮에 팔을 내린 사람 중 일부)
  if (!night && pose === 'down' && hsh(i * 23) > .6) {
    const signSet = place === 'busan' ? BUSAN_SIGNS : trad ? TRAD_SIGNS : SIGNS,
      t = signSet[(i % signSet.length + signSet.length) % signSet.length];
    G.ctx.font = 'bold 11px Jua,sans-serif';
    const tw = G.ctx.measureText(t).width + 10,
      sy = y - 40 * s;
    G.ctx.strokeStyle = '#7a5536';
    G.ctx.lineWidth = 2;
    G.ctx.beginPath();
    G.ctx.moveTo(x + 5 * s, sy + 13);
    G.ctx.lineTo(x + 5 * s, y - 6 * s);
    G.ctx.stroke();
    G.ctx.fillStyle = '#fff';
    G.ctx.fillRect(x + 5 * s - tw / 2, sy, tw, 14);
    G.ctx.strokeStyle = '#1e2b33';
    G.ctx.lineWidth = 1;
    G.ctx.strokeRect(x + 5 * s - tw / 2, sy, tw, 14);
    G.ctx.fillStyle = '#e4572e';
    G.ctx.textAlign = 'center';
    G.ctx.fillText(t, x + 5 * s, sy + 11);
  }
  return hand;
}
// 두 사람이 양 끝을 잡고 머리 위로 드는 현수막
const BANNERS = ['끝까지 달려라!', '모두 완주 화이팅!', '미니 레이스 토너먼트', '오늘의 1등은 누구?'];
// 현수막: 양 끝을 나무 막대에 묶고, 두 사람이 바깥쪽에 서서 각자 막대를 두 손으로 잡음.
// 폭은 문구 길이에 맞춰 minSpan~maxSpan(사람 사이 거리), 그래도 넘치면 글자를 줄임
export function bannerPair(x1, minSpan, maxSpan, y, i, now, trad, night, place) {
  const s = 1.45,
    bob = Math.sin(now * 3 + i) * 1.5,
    top = y - 50 * s + bob,
    h = 16,
    gap = 7 * s,
    bannerSet = place === 'busan' ? BUSAN_BANNERS : trad ? TRAD_BANNERS : BANNERS,
    t = bannerSet[Math.floor(hsh(i * 41) * bannerSet.length)];
  let fs = 12;
  G.ctx.font = 'bold ' + fs + 'px Jua,sans-serif';
  const tw = G.ctx.measureText(t).width,
    span = Math.max(minSpan, Math.min(maxSpan, tw + 14 + 2 * gap)),
    room = span - 2 * gap - 10;
  if (tw > room) fs = Math.max(8, Math.floor(fs * room / tw));
  const x2 = x1 + span,
    l = x1 + gap,
    r = x2 - gap,
    g1 = y - 27 * s + bob,
    g2 = y - 18 * s + bob;
  spectator(x1, y, i, now, trad, night, 'hold', { px: l, y1: g1, y2: g2 });
  spectator(x2, y, i + 1, now, trad, night, 'hold', { px: r, y1: g1, y2: g2 });
  // 천(아래 가장자리가 살짝 처짐)
  const sag = 3;
  G.ctx.fillStyle = night ? '#e9e2c8' : '#fffaf0';
  G.ctx.beginPath();
  G.ctx.moveTo(l, top);
  G.ctx.quadraticCurveTo((l + r) / 2, top + sag, r, top);
  G.ctx.lineTo(r, top + h);
  G.ctx.quadraticCurveTo((l + r) / 2, top + h + sag, l, top + h);
  G.ctx.closePath();
  G.ctx.fill();
  G.ctx.strokeStyle = COLORS[(i * 3 % COLORS.length + COLORS.length) % COLORS.length];
  G.ctx.lineWidth = 2;
  G.ctx.stroke();
  G.ctx.fillStyle = '#c0392b';
  G.ctx.font = 'bold ' + fs + 'px Jua,sans-serif';
  G.ctx.textAlign = 'center';
  G.ctx.fillText(t, (l + r) / 2, top + h - 3 + sag / 2);
  // 나무 막대 두 개(끝에 둥근 마개) + 막대를 쥔 주먹
  for (const [px, k] of [[l, i], [r, i + 1]]) {
    G.ctx.strokeStyle = '#8a5a32';
    G.ctx.lineWidth = 3;
    G.ctx.lineCap = 'round';
    G.ctx.beginPath();
    G.ctx.moveTo(px, top - 5);
    G.ctx.lineTo(px, y - 9 * s + bob);
    G.ctx.stroke();
    G.ctx.fillStyle = '#c99a5b';
    G.ctx.beginPath();
    G.ctx.arc(px, top - 6, 2.6, 0, 7);
    G.ctx.fill();
    G.ctx.fillStyle = SKIN[Math.floor(hsh(k * 9) * SKIN.length)];
    for (const gy of [g1, g2]) {
      G.ctx.beginPath();
      G.ctx.arc(px, gy, 2.4, 0, 7);
      G.ctx.fill();
    }
  }
}
// 밤 응원봉: 인도를 어둡게 덮은 뒤 그려서 빛나 보이게. 손에서 팔 방향으로 뻗고 흔들림
const STICKS = ['#ff4fd8', '#3ff2ff', '#7dff6b', '#ffe14d', '#ff8a3d'];
export function glowStick(h) {
  const c = STICKS[Math.floor(hsh(h.i * 37) * STICKS.length)],
    ang = -1.2 + h.a * .5,
    len = 11 * h.s,
    ex = h.x + Math.cos(ang) * len,
    ey = h.y + Math.sin(ang) * len;
  G.ctx.save();
  G.ctx.lineCap = 'round';
  G.ctx.shadowColor = c;
  G.ctx.shadowBlur = 10;
  G.ctx.strokeStyle = c;
  G.ctx.lineWidth = 3.2;
  G.ctx.beginPath();
  G.ctx.moveTo(h.x, h.y);
  G.ctx.lineTo(ex, ey);
  G.ctx.stroke();
  G.ctx.shadowBlur = 0;
  G.ctx.strokeStyle = '#fff';
  G.ctx.lineWidth = 1.2;
  G.ctx.beginPath();
  G.ctx.moveTo(h.x + (ex - h.x) * .3, h.y + (ey - h.y) * .3);
  G.ctx.lineTo(ex, ey);
  G.ctx.stroke();
  G.ctx.restore();
}
// 개 산책 상태(k번 행인): st walk·loose·caught, ox 행인 이동, dx 강아지 위치(행인 기준), say 말, sayT 남은 시간
export function dogState(k) {
  if (!G.dogs) G.dogs = [];
  return G.dogs[k] || (G.dogs[k] = { st: 'walk', taps: 0, ox: 0, dx: 24, t: 0, say: '', sayT: 0 });
}
export const walkerBase = k => 350 + k * 1700 + G.clock * 26 - G.camX + OFF;
// 캔버스 좌표(x, y) 누름 처리. 처리했으면 true(카메라 조작 대신)
export function dogTap(x, y) {
  if (!G.mapId || !G.mapId.startsWith('city') || y < G.H - 40) return false;
  for (let k = 0; k < 4; k++) {
    const D = dogState(k),
      b = walkerBase(k);
    if (D.st === 'walk' && Math.abs(x - (b + D.ox)) < 16) {
      D.taps++;
      D.say = ['어? 왜 그러세요?', '간지러워요~', '앗! 멍멍아!!'][Math.min(D.taps, 3) - 1];
      D.sayT = 1.6;
      if (D.taps >= 3) {
        D.st = 'loose';
        D.t = 0;
        D.dx = D.ox + 24;
      }
      return true;
    }
    if (D.st === 'loose' && Math.abs(x - (b + D.dx)) < 18) {
      D.st = 'caught';
      D.say = '옳지, 착하다! 기다려~';
      D.sayT = 99;
      return true;
    }
  }
  return false;
}
// 행인과 강아지 그리기 + 상태 진행(그림 시간 G.fdt만 씀)
export function dogWalk(k, now) {
  const D = dogState(k),
    b = walkerBase(k),
    y = G.H - 4,
    dt = G.fdt || 0,
    still = G.state === 'run' ? 26 * dt : 0;
  D.sayT -= dt;
  if (D.st === 'walk') {
    if (b + D.ox > -60 && b + D.ox < G.W + 60) walker(b + D.ox, y, k, now);
  } else if (D.st === 'loose') {
    D.t += dt;
    D.dx += 140 * dt;
    if (D.t > .6) D.ox += 90 * dt;
    if (D.t > .6 && D.say !== '멍멍아~ 거기 서!!') {
      D.say = '멍멍아~ 거기 서!!';
      D.sayT = 99;
    }
    // 강아지가 화면 밖으로 멀리 가면 주인이 데리고 돌아옴
    if (b + D.dx > G.W + 200 && b + D.ox > G.W + 60) {
      D.st = 'walk';
      D.taps = 0;
      D.ox = D.dx - 24;
      D.sayT = 0;
    }
    walkPerson(b + D.ox, y, k, now, D.t > .6);
    walkDog(b + D.dx, y, k, now, 1);
  } else {
    // 붙잡힘: 강아지는 제자리(땅 기준)에서 기다리고 주인이 뛰어와 다시 목줄을 잡음
    D.dx -= still;
    D.ox += 90 * dt - still;
    if (D.ox >= D.dx - 24) {
      D.ox = D.dx - 24;
      D.st = 'walk';
      D.taps = 0;
      D.say = '휴, 잡았다!';
      D.sayT = 1.6;
    }
    walkPerson(b + D.ox, y, k, now, 1);
    walkDog(b + D.dx, y, k, now, 0);
  }
  // 말풍선은 트랙·캐릭터보다 위에 보이도록 모아 두었다가 race.js에서 마지막에 그림
  if (D.sayT > 0 && D.say) (G.dogBub || (G.dogBub = [])).push([b + D.ox, y - 32, D.say, Math.min(1, D.sayT / .3)]);
}
// 행인(달리기면 다리·팔을 빠르게)
function walkPerson(x, y, k, now, run) {
  const ph = now * (run ? 16 : 6) + k,
    sw = Math.sin(ph) * (run ? 1.6 : 1),
    c = COLORS[(k * 3 + 2) % COLORS.length],
    sk = SKIN[k % SKIN.length];
  G.ctx.strokeStyle = '#2c3e50';
  G.ctx.lineWidth = 2.4;
  G.ctx.lineCap = 'round';
  G.ctx.beginPath();
  G.ctx.moveTo(x - 1, y - 8);
  G.ctx.lineTo(x - 1 + sw * 3, y);
  G.ctx.moveTo(x + 1, y - 8);
  G.ctx.lineTo(x + 1 - sw * 3, y);
  G.ctx.stroke();
  G.ctx.fillStyle = c;
  rr(x - 4, y - 19, 8, 12, 3);
  G.ctx.fill();
  G.ctx.fillStyle = sk;
  G.ctx.beginPath();
  G.ctx.arc(x, y - 23, 4, 0, 7);
  G.ctx.fill();
  G.ctx.strokeStyle = sk;
  G.ctx.lineWidth = 2;
  G.ctx.beginPath();
  G.ctx.moveTo(x + 2, y - 16);
  G.ctx.lineTo(x + 7, run ? y - 19 - Math.abs(sw) * 2 : y - 11);
  G.ctx.stroke();
}
// 강아지(달리면 다리를 빠르게, 혀를 내밂). 목줄은 뒤로 늘어뜨림
function walkDog(dx, y, k, now, run) {
  const ph = now * (run ? 16 : 6) + k,
    dc = ['#c58b4e', '#f2e2c4', '#3b3b3b', '#e0b36a'][k % 4],
    b = Math.abs(Math.sin(ph * 1.6)) * (run ? 2 : 1.2);
  G.ctx.strokeStyle = '#e4572e';
  G.ctx.lineWidth = 1;
  G.ctx.beginPath();
  G.ctx.moveTo(dx + 5, y - 8 - b);
  G.ctx.lineTo(dx - 12, y - 1);
  G.ctx.stroke();
  G.ctx.strokeStyle = dc;
  G.ctx.lineWidth = 1.8;
  G.ctx.beginPath();
  for (const [lx, o] of [[-4, 0], [-1, Math.PI], [3, Math.PI], [6, 0]]) {
    const l = run ? Math.sin(ph * 1.6 + o) * 3 : 0;
    G.ctx.moveTo(dx + lx, y - 4 - b);
    G.ctx.lineTo(dx + lx + l, y);
  }
  G.ctx.stroke();
  G.ctx.fillStyle = dc;
  G.ctx.beginPath();
  G.ctx.ellipse(dx + 1, y - 6 - b, 6, 3.4, 0, 0, 7);
  G.ctx.fill();
  G.ctx.beginPath();
  G.ctx.arc(dx + 7, y - 9 - b, 3.2, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.beginPath();
  G.ctx.arc(dx + 8.5, y - 9.5 - b, .8, 0, 7);
  G.ctx.fill();
  if (run) {
    G.ctx.fillStyle = '#ef6aa1';
    G.ctx.fillRect(dx + 9, y - 8 - b, 1.6, 2);
  }
}
export function walker(x, y, k, now) {
  const ph = now * 6 + k,
    sw = Math.sin(ph),
    c = COLORS[(k * 3 + 2) % COLORS.length],
    sk = SKIN[k % SKIN.length];
  G.ctx.strokeStyle = '#2c3e50';
  G.ctx.lineWidth = 2.4;
  G.ctx.lineCap = 'round';
  G.ctx.beginPath();
  G.ctx.moveTo(x - 1, y - 8);
  G.ctx.lineTo(x - 1 + sw * 3, y);
  G.ctx.moveTo(x + 1, y - 8);
  G.ctx.lineTo(x + 1 - sw * 3, y);
  G.ctx.stroke();
  G.ctx.fillStyle = c;
  rr(x - 4, y - 19, 8, 12, 3);
  G.ctx.fill();
  G.ctx.fillStyle = sk;
  G.ctx.beginPath();
  G.ctx.arc(x, y - 23, 4, 0, 7);
  G.ctx.fill();
  G.ctx.strokeStyle = sk;
  G.ctx.lineWidth = 2;
  G.ctx.beginPath();
  G.ctx.moveTo(x + 2, y - 16);
  G.ctx.lineTo(x + 7, y - 11);
  G.ctx.stroke();
  const dx = x + 24,
    dc = ['#c58b4e', '#f2e2c4', '#3b3b3b', '#e0b36a'][k % 4],
    b = Math.abs(Math.sin(ph * 1.6)) * 1.2;
  G.ctx.strokeStyle = '#e4572e';
  G.ctx.lineWidth = 1;
  G.ctx.beginPath();
  G.ctx.moveTo(x + 7, y - 11);
  G.ctx.quadraticCurveTo(x + 15, y - 6, dx + 5, y - 8 - b);
  G.ctx.stroke();
  G.ctx.strokeStyle = dc;
  G.ctx.lineWidth = 1.8;
  G.ctx.beginPath();
  for (const [lx, o] of [[-4, 0], [-1, Math.PI], [3, Math.PI], [6, 0]]) {
    const l = Math.sin(ph * 1.6 + o) * 2;
    G.ctx.moveTo(dx + lx, y - 4 - b);
    G.ctx.lineTo(dx + lx + l, y);
  }
  G.ctx.stroke();
  G.ctx.fillStyle = dc;
  G.ctx.beginPath();
  G.ctx.ellipse(dx + 1, y - 6 - b, 6, 3.4, 0, 0, 7);
  G.ctx.fill();
  G.ctx.beginPath();
  G.ctx.arc(dx + 7, y - 9 - b, 3.2, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.beginPath();
  G.ctx.arc(dx + 8.5, y - 9.5 - b, .8, 0, 7);
  G.ctx.fill();
  G.ctx.strokeStyle = dc;
  G.ctx.lineWidth = 1.6;
  G.ctx.beginPath();
  G.ctx.moveTo(dx - 5, y - 7 - b);
  G.ctx.lineTo(dx - 9, y - 10 - b + Math.sin(now * 14) * 2);
  G.ctx.stroke();
}
// 밤 조명: 도심은 가로등, 전통 마을은 청사초롱. 같은 위치로 도로에 빛 웅덩이를 그림
export function lampXs(spacing, offset, cb) {
  const a = Math.floor((G.camX - OFF - offset - 100) / spacing),
    b = Math.ceil((G.camX - OFF - offset + G.W + 100) / spacing);
  for (let i = a; i <= b; i++) cb(i * spacing + offset - G.camX + OFF, i);
}
export function glow(x, y, r, c) {
  const g = G.ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  G.ctx.fillStyle = g;
  G.ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
export function nightLights(th) {
  if (th.trad) lampXs(150, 40, x => {
    G.ctx.strokeStyle = '#3a2a1c';
    G.ctx.lineWidth = 2.5;
    G.ctx.beginPath();
    G.ctx.moveTo(x, GT - 2);
    G.ctx.lineTo(x, GT - 34);
    G.ctx.lineTo(x + 8, GT - 34);
    G.ctx.stroke();
    glow(x + 8, GT - 26, 26, 'rgba(255,170,90,.55)');
    G.ctx.fillStyle = '#d63a3a';
    rr(x + 3, GT - 32, 10, 8, 3);
    G.ctx.fill();
    G.ctx.fillStyle = '#2f5fb2';
    rr(x + 3, GT - 25, 10, 7, 3);
    G.ctx.fill();
    G.ctx.fillStyle = '#ffe9b0';
    G.ctx.fillRect(x + 7, GT - 31, 2, 12);
  });else lampXs(200, 100, x => {
    G.ctx.strokeStyle = '#5d6e78';
    G.ctx.lineWidth = 3;
    G.ctx.beginPath();
    G.ctx.moveTo(x, GT - 2);
    G.ctx.lineTo(x, GT - 62);
    G.ctx.quadraticCurveTo(x, GT - 70, x + 10, GT - 70);
    G.ctx.stroke();
    glow(x + 12, GT - 66, 34, 'rgba(255,230,150,.6)');
    G.ctx.fillStyle = '#fff4c2';
    rr(x + 6, GT - 70, 14, 4, 2);
    G.ctx.fill();
  });
}
export function roadPools(th) {
  const sp = th.trad ? 150 : 200,
    of = th.trad ? 48 : 112;
  lampXs(sp, of, x => {
    G.ctx.save();
    G.ctx.translate(x, GT + 30);
    G.ctx.scale(1, .35);
    glow(0, 0, 110, 'rgba(255,215,140,.28)');
    G.ctx.restore();
  });
}
// 밤 폭죽: 시간만으로 위치·색·크기를 계산(게임 난수를 쓰지 않아 레이스 결과에 영향 없음).
// 0.55초마다 한 발 후보(약 35%는 건너뜀). 꼬리를 끌며 0.6초 올라가 터지고, 1.6초 동안 퍼지며 떨어지다 사라짐
const FW = ['#ff5a5f', '#ffd166', '#4cc9f0', '#b388ff', '#7dff6b', '#ff9f1c', '#ff4fd8'];
export function fireworks(now) {
  const step = .55,
    rise = .6,
    life = 1.6,
    k1 = Math.floor(now / step),
    c = G.ctx;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  for (let k = k1 - Math.ceil((rise + life) / step) - 1; k <= k1; k++) {
    if (hsh(k * 11 + 3) < .35) continue;
    const age = now - (k * step + hsh(k * 5) * step);
    if (age < 0 || age > rise + life) continue;
    const cx = 40 + hsh(k * 13) * (G.W - 80),
      cy = 38 + hsh(k * 17) * 72,
      col = FW[Math.floor(hsh(k * 19) * FW.length)],
      col2 = FW[Math.floor(hsh(k * 23) * FW.length)];
    if (age < rise) {
      const q = age / rise,
        y = GT - 30 - (GT - 30 - cy) * (1 - (1 - q) * (1 - q));
      c.globalAlpha = .8;
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx, y + 16);
      c.lineTo(cx, y);
      c.stroke();
      continue;
    }
    const a = (age - rise) / life,
      R = (46 + hsh(k * 29) * 32) * (1 - Math.pow(1 - Math.min(1, a * 1.7), 3)),
      drop = 24 * a * a,
      n = 22;
    if (a < .1) {
      c.globalAlpha = .5 * (1 - a / .1);
      c.fillStyle = col;
      c.beginPath();
      c.arc(cx, cy, 16, 0, 7);
      c.fill();
    }
    c.globalAlpha = Math.max(0, 1 - a);
    c.lineWidth = 2;
    for (let j = 0; j < n; j++) {
      const ang = j / n * Math.PI * 2 + hsh(k) * .5,
        r = R * (.85 + hsh(k * 31 + j) * .3),
        ex = cx + Math.cos(ang) * r,
        ey = cy + Math.sin(ang) * r + drop;
      c.strokeStyle = j % 2 ? col : col2;
      c.beginPath();
      c.moveTo(cx + Math.cos(ang) * r * .78, cy + Math.sin(ang) * r * .78 + drop * .85);
      c.lineTo(ex, ey);
      c.stroke();
    }
  }
  c.restore();
}
// 밤에 위쪽 인도·관중을 어둡게 덮되, 하늘 쪽 가장자리는 서서히 흐려서 경계선이 안 보이게
function nightShade(top, a) {
  const g = G.ctx.createLinearGradient(0, top - 60, 0, top);
  g.addColorStop(0, 'rgba(8,14,38,0)');
  g.addColorStop(1, 'rgba(8,14,38,' + a + ')');
  G.ctx.fillStyle = g;
  G.ctx.fillRect(0, top - 60, G.W, 60);
  G.ctx.fillStyle = 'rgba(8,14,38,' + a + ')';
  G.ctx.fillRect(0, top, G.W, GT - top);
}
export function cityBg(th) {
  const now = performance.now() / 1000,
    top = GT - 30,
    n8 = th.night;
  if (th.place === 'busan' || th.place === 'hangang' || th.place === 'stone') {
    newPlaceBg(th, now, top);
    return;
  }
  if (n8) fireworks(now);
  if (th.trad) {
    ridge(.05, 1, top + 4, 120, n8 ? '#2a3650' : '#aebccb', true);
    ridge(.1, 5, top + 4, 80, n8 ? '#1f2a3d' : '#8fa79f', true);
    // 한옥 마을 + 일정 간격 궁궐 대문
    const off = G.camX * .3,
      step = 130,
      i0 = Math.floor((off - 200) / step),
      i1 = Math.ceil((off + G.W) / step);
    for (let i = i0; i <= i1; i++) {
      const x = i * step - off;
      if ((i % 7 + 7) % 7 === 3) palaceGate(x - 20, top, n8);else if ((i % 7 + 7) % 7 !== 4) hanok(x, top, 96 + hsh(i) * 10, n8, i);
    }
  } else {
    landmarks(.08, top, n8, 0);
    skyline(.14, 1, top, 50, 140, n8 ? '#26344f' : '#b9c9d6', n8 ? '#ffd76a' : 'rgba(255,255,255,.55)', n8 ? .55 : .45, false, n8);
    landmarks(.14, top, n8, 1);
    skyline(.3, 7, top, 30, 95, n8 ? '#1b2640' : '#91a5b6', n8 ? '#ffe08a' : '#dfe9f0', n8 ? .5 : .45, true, n8);
  }
  // 위쪽 인도: 나무 → 응원 시민 → 펜스(도심) / 돌담(전통)
  G.ctx.fillStyle = th.trad ? n8 ? '#5b5246' : '#d8cdb8' : '#d3d8dc';
  G.ctx.fillRect(0, top, G.W, 30);
  const sp = th.trad ? 220 : 260,
    tw0 = Math.floor((G.camX - OFF - 40) / sp),
    tw1 = Math.ceil((G.camX - OFF + G.W + 40) / sp);
  for (let i = tw0; i <= tw1; i++) {
    const x = i * sp + 70 - G.camX + OFF;
    th.trad ? pine(x, top + 12, i) : tree(x, top + 12);
  }
  // 구경꾼: 36 간격(일부는 빈자리). hsh(i*7)이 큰 자리는 두 사람이 현수막을 들고 다음 네 자리를 비움
  const SP = 36,
    s0 = Math.floor((G.camX - OFF - 120) / SP),
    s1 = Math.ceil((G.camX - OFF + G.W + 40) / SP),
    hands = [];
  for (let i = s0; i <= s1; i++) {
    const x = i * SP + hsh(i) * 8 - G.camX + OFF;
    if (hsh(i * 7) > .92 && [1, 2, 3, 4].every((d) => hsh((i - d) * 7) <= .92)) {
      bannerPair(x, SP * 2, SP * 4, GT - 6, i, now, th.trad, n8, th.place);
      i += 4;
      continue;
    }
    if (hsh(i * 3) > .25) {
      const h = spectator(x, GT - 6, i, now, th.trad, n8);
      if (n8 && h) hands.push(h);
    }
  }
  if (th.trad) {
    // 돌담 + 기와 얹은 담장
    G.ctx.fillStyle = n8 ? '#4a4a52' : '#a39e94';
    G.ctx.fillRect(0, GT - 14, G.W, 11);
    const b0 = Math.floor((G.camX - OFF) / 13);
    for (let i = b0; i <= b0 + G.W / 13 + 2; i++) {
      const x = i * 13 - G.camX + OFF;
      G.ctx.fillStyle = hsh(i) > .5 ? n8 ? '#5a5a62' : '#bdb7ab' : n8 ? '#3f3f47' : '#8f897e';
      G.ctx.beginPath();
      G.ctx.ellipse(x + 6, GT - 9 + i % 2 * 3, 6, 3.2, 0, 0, 7);
      G.ctx.fill();
    }
    G.ctx.fillStyle = n8 ? '#1c1f26' : '#4a4f57';
    G.ctx.fillRect(0, GT - 17, G.W, 4);
  } else {
    G.ctx.fillStyle = '#9aa3ab';
    G.ctx.fillRect(0, GT - 12, G.W, 2);
    G.ctx.fillRect(0, GT - 6, G.W, 2);
    const p0 = Math.floor((G.camX - OFF) / 40);
    for (let i = p0; i <= p0 + G.W / 40 + 1; i++) G.ctx.fillRect(i * 40 - G.camX + OFF, GT - 14, 2, 12);
  }
  G.ctx.fillStyle = th.trad ? n8 ? '#3d3529' : '#b9a98a' : '#a3abb2';
  G.ctx.fillRect(0, GT - 3, G.W, 3);
  // 아래쪽 인도: 강아지와 산책
  const by = GT + G.GD + 20;
  G.ctx.fillStyle = th.trad ? n8 ? '#5b5246' : '#d8cdb8' : '#d3d8dc';
  G.ctx.fillRect(0, by, G.W, G.H - by);
  G.ctx.fillStyle = th.trad ? '#b9a98a' : '#a3abb2';
  G.ctx.fillRect(0, by, G.W, 3);
  for (let k = 0; k < 4; k++) dogWalk(k, now);
  // 밤: 인도와 사람들을 어둡게 덮고 조명만 밝게
  if (n8) {
    nightShade(top, .5);
    G.ctx.fillStyle = 'rgba(8,14,38,.5)';
    G.ctx.fillRect(0, by, G.W, G.H - by);
    nightLights(th);
    for (const h of hands) glowStick(h);
  }
}

function drawLava(c, x, craterY, i, now) {
  const cycle = 5.2, phase = ((now + i * 1.37) % cycle + cycle) % cycle;
  if (phase > 1.45) return;
  const count = 3 + (Math.abs(i) % 3), age = phase / 1.45;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < count; k++) {
    const direction = k % 2 ? -1 : 1, spread = (k - (count - 1) / 2) * 4,
      x0 = x + spread, vx = direction * (18 + (k % 3) * 6), vy = 72 + (k % 2) * 12,
      bx = x0 + vx * age, by = craterY + 4 - vy * age + 42 * age * age,
      alpha = Math.max(0, 1 - age * .82), r = 3 + (k % 2);
    c.globalAlpha = alpha * .3; c.fillStyle = '#ff4b12'; c.beginPath(); c.arc(bx, by, r * 3, 0, 7); c.fill();
    c.globalAlpha = alpha; c.fillStyle = '#ff7a18'; c.beginPath(); c.arc(bx, by, r, 0, 7); c.fill();
    c.fillStyle = '#ffe79a'; c.beginPath(); c.arc(bx, by - 1, r * .42, 0, 7); c.fill();
  }
  c.restore();
}

const DINO_LINES = ['나도 열심히 해서 참가할 거야!', '으쌰으쌰!', '돌멩이쯤이야!', '기다려, 나도 간다~', '공룡도 달릴 줄 안다구!', '헥헥… 그래도 안 멈춰!'];
const DINO_WAIT_LINES = ['나도 달릴 거야!', '준비됐지?'];
function dinoBubble(x, headY, text) {
  const c = G.ctx;
  c.save();
  c.font = '11px Jua,sans-serif';
  const w = Math.min(G.W - 8, c.measureText(text).width + 12), h = 19,
    bx = Math.max(4, Math.min(G.W - w - 4, x - w / 2)),
    tailX = Math.max(bx + 7, Math.min(bx + w - 7, x)),
    tailY = Math.max(h + 5, headY - 2);
  c.fillStyle = 'rgba(255,255,255,.96)';
  c.strokeStyle = 'rgba(30,43,51,.3)';
  c.lineWidth = 1;
  rr(bx, tailY - h, w, h, 6);
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(tailX - 4, tailY - 1);
  c.lineTo(tailX, tailY + 5);
  c.lineTo(tailX + 4, tailY - 1);
  c.fill();
  c.strokeStyle = 'rgba(30,43,51,.3)';
  c.beginPath();
  c.moveTo(tailX - 4, tailY - 1);
  c.lineTo(tailX, tailY + 5);
  c.stroke();
  c.fillStyle = '#1e2b33';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, bx + w / 2, tailY - h / 2);
  c.restore();
}

function drawStoneDino(now, gy) {
  const c = G.ctx, startX = 260, dt = G.fdt || 0;
  const dino = G.dino || (G.dino = { state: 'wait', x: startX, waitT: 0, runT: 0, pantIn: 9, pantT: 0, jumpT: 0, turnT: 0 });
  const active = G.state === 'run' || G.state === 'replay';
  let startAt = null;

  if (G.state === 'run') {
    const lead = G.racers.reduce((x, r) => Math.max(x, r.x), 0);
    if (dino.state === 'wait' && lead >= startX) {
      dino.state = 'turn';
      dino.turnT = 0;
      dino.x = startX;
    }
  } else if (G.state === 'replay') {
    const frames = G.frames || [];
    const first = frames.find(f => f.t >= 0 && f.r.some(r => r.x >= startX));
    startAt = first ? first.t : Infinity;
    if (dino.replayStart !== startAt || dino.lastRp !== undefined && G.rp < dino.lastRp) {
      dino.replayStart = startAt;
      dino.state = 'wait';
      dino.x = startX;
      dino.waitT = dino.runT = 0;
      dino.pantIn = 9;
      dino.pantT = dino.jumpT = dino.turnT = 0;
    }
    dino.lastRp = G.rp;
    if (G.rp >= startAt && dino.state === 'wait') {
      dino.state = 'turn';
      dino.turnT = 0;
    }
  }

  if (active && dino.state === 'wait') dino.waitT = (dino.waitT || 0) + dt;
  if (active && dino.state === 'turn') {
    dino.turnT += dt;
    if (dino.turnT >= .24) {
      dino.state = 'run';
      dino.turnT = .24;
    }
  }
  const turning = active && dino.state === 'turn';
  const panting = active && dino.state === 'pant';
  const running = active && (dino.state === 'run' || panting);
  if (active && dino.state === 'finish') dino.finishT = Math.max(0, (dino.finishT || 0) - dt);
  if (running) {
    if (panting) {
      dino.pantT -= dt;
      if (dino.pantT <= 0) {
        dino.state = 'run';
        dino.pantIn = 8.4;
      }
    } else {
      dino.runT += dt;
      dino.pantIn -= dt;
      if (dino.pantIn <= 0) {
        dino.state = 'pant';
        dino.pantT = 1.6;
        dino.jumpT = 0;
      }
      const leaderFinished = G.fin && G.fin.length > 0;
      // 화면 왼쪽 30% ~ 오른쪽 30%(0.3W~0.7W) 사이를 오가며 앞서거니 뒤서거니
      const wave = Math.sin(dino.runT * Math.PI * 2 / 10);
      const target = leaderFinished ? TRACK + 48 : G.camX - OFF + G.W * (.5 + .2 * wave);
      const oldX = dino.x;
      const distance = Math.max(0, target - oldX);
      if (dino.state === 'run') {
        dino.x = Math.min(TRACK + 48, oldX + Math.min(distance, 320 * dt));
        if (dino.jumpT > 0) dino.jumpT = Math.max(0, dino.jumpT - dt);
        if (dino.x > oldX) {
          const rock = Math.floor(oldX / 260) + 1;
          if (rock * 260 <= dino.x) dino.jumpT = .5;
        }
        if (dino.x >= TRACK + 48) {
          dino.state = 'finish';
          dino.finishT = 3;
        }
      }
    }
  }

  const wx = dino.x || startX;
  const finished = dino.state === 'finish';
  const dx = wx - G.camX + OFF;
  const jump = dino.jumpT > 0 ? 30 * Math.sin(Math.PI * (1 - dino.jumpT / .5)) : turning ? 9 * Math.sin(Math.PI * Math.min(1, dino.turnT / .24)) : 0;
  const walking = running && !panting && !finished;
  const run = dino.runT * 14;
  const idleNow = dino.waitT || now;
  const heave = panting ? Math.sin((1.6 - dino.pantT) * 10) * 2.4 : 0;
  const bob = walking ? (jump ? 0 : Math.abs(Math.sin(run)) * 1.2) : Math.sin(idleNow * 2.2) * 1.2 + heave;
  const y = gy - jump;
  c.fillStyle = 'rgba(60,40,20,.22)'; c.beginPath(); c.ellipse(dx, gy + 3, 14 - jump / 5, 3, 0, 0, 7); c.fill();
  c.save(); c.translate(dx, y - bob);
  // The character faces left while waiting and right after turning to run.
  if (dino.state === 'wait') c.scale(-1, 1);
  c.fillStyle = '#e8913a';
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-14 + k * 6, -19 + k * .5); c.lineTo(-11 + k * 6, -25 + k * .5); c.lineTo(-8 + k * 6, -19 + k * .5); c.fill(); }
  c.strokeStyle = '#3fae8e'; c.lineWidth = 5; c.lineCap = 'round';
  for (const [lx, ph] of [[-5, 0], [4, Math.PI]]) { const sw = walking ? (jump ? .5 : Math.sin(run + ph)) : panting ? Math.sin(now * 8 + ph) * .35 : 0; c.beginPath(); c.moveTo(lx, -6); c.lineTo(lx + sw * 4, 0); c.stroke(); }
  c.fillStyle = '#3fae8e'; c.beginPath(); c.moveTo(-12, -12); c.quadraticCurveTo(-26, -12, -30, -4 + Math.sin(run) * 2); c.quadraticCurveTo(-22, -6, -10, -6); c.fill();
  c.beginPath(); c.ellipse(-2, -12, 13, 9, 0, 0, 7); c.fill(); c.fillStyle = '#f4e7c4'; c.beginPath(); c.ellipse(1, -9, 8, 5.5, 0, 0, 7); c.fill();
  c.fillStyle = '#3fae8e'; c.beginPath(); c.ellipse(11, -24, 9, 7.5, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(16, -21, 6, 4, 0, 0, 7); c.fill();
  c.strokeStyle = '#3fae8e'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(7, -12); c.lineTo(11, -9 + (jump ? -3 : 0)); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(12, -26, 2.6, 0, 7); c.fill(); c.fillStyle = '#10202a'; c.beginPath(); c.arc(12.8, -26, 1.4, 0, 7); c.fill();
  c.strokeStyle = '#10202a'; c.lineWidth = 1; c.beginPath(); c.arc(16, -21.5, 2.6, .1 * Math.PI, .8 * Math.PI); c.stroke();
  if (panting) {
    c.fillStyle = '#ef7183'; c.beginPath(); c.ellipse(20, -18, 2.2, 4.2, -.35, 0, 7); c.fill();
    c.fillStyle = 'rgba(120,210,255,.85)';
    for (const [sx, sy] of [[-9, -28], [26, -32]]) { c.beginPath(); c.ellipse(sx, sy + Math.sin(now * 9 + sx) * 2, 1.7, 3, -.4, 0, 7); c.fill(); }
  }
  c.fillStyle = 'rgba(255,140,120,.5)'; c.beginPath(); c.arc(9, -21, 1.6, 0, 7); c.fill(); c.restore();

  if (finished) {
    if (dino.finishT > 0) dinoBubble(dx, y - bob - 32, '나도 결승선 통과!');
  } else if (panting) {
    dinoBubble(dx, y - bob - 32, '헥헥… 잠깐만…');
  } else if (running || turning) {
    const phase = dino.runT % 7.2;
    if (!panting && phase < 2.5) dinoBubble(dx, y - bob - 32, DINO_LINES[Math.floor(dino.runT / 7.2) % DINO_LINES.length]);
  } else {
    const cycle = 6.5, phase = ((idleNow % cycle) + cycle) % cycle;
    if (phase < 2.2) dinoBubble(dx, y - bob - 32, DINO_WAIT_LINES[Math.floor(idleNow / cycle) % DINO_WAIT_LINES.length]);
  }
}

function stoneMap(th, now, top) {
  const c = G.ctx, n = th.night, gy = GT, cam = G.camX - OFF;
  const tile = (par, gap, fn) => { const o = cam * par, a = Math.floor((o - 200) / gap), b = Math.ceil((o + G.W + 200) / gap); for (let i = a; i <= b; i++) fn(i * gap - o + OFF, i); };
  const sky = c.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, n ? '#26383b' : '#f5c58a'); sky.addColorStop(1, n ? '#43564d' : '#fbe6c4');
  c.fillStyle = sky; c.fillRect(0, 0, G.W, G.H);
  c.fillStyle = n ? '#55483d' : '#a9855c'; c.fillRect(0, gy - 38, G.W, 10);
  c.fillStyle = n ? '#78604a' : '#c29a69'; c.fillRect(0, gy - 38, G.W, 3);
  // Reference volcano, smoke, and distant long-neck dinosaurs.
  tile(.04, 800, (x, i) => {
    c.fillStyle = '#8a6a58'; c.beginPath(); c.moveTo(x-180,gy-30); c.lineTo(x-26,gy-150); c.lineTo(x+26,gy-150); c.lineTo(x+180,gy-30); c.fill();
    c.fillStyle = '#e4572e'; c.beginPath(); c.moveTo(x-26,gy-150); c.lineTo(x-14,gy-128); c.lineTo(x,gy-146); c.lineTo(x+12,gy-126); c.lineTo(x+26,gy-150); c.fill();
    for(let k=0;k<5;k++){const u=(now*.25+k*.2)%1;c.fillStyle='rgba(110,100,95,'+(.45*(1-u))+')';c.beginPath();c.arc(x+u*30*Math.sin(k),gy-156-u*70,8+u*18,0,7);c.fill();}
    if(n) drawLava(c,x,gy-150,i,now);
  });
  tile(.1,520,(x,i)=>{if(hsh(i*9)<.4)return;const b=Math.sin(now*2+i)*2,y=gy-48;c.fillStyle='rgba(90,110,80,.7)';c.beginPath();c.ellipse(x,y+b,30,14,0,0,7);c.fill();c.lineWidth=7;c.strokeStyle='rgba(90,110,80,.7)';c.lineCap='round';c.beginPath();c.moveTo(x+22,y-4+b);c.quadraticCurveTo(x+40,y-40,x+52,y-46+b);c.stroke();c.beginPath();c.moveTo(x-26,y+b);c.quadraticCurveTo(x-50,y+4,x-62,y+12);c.lineWidth=5;c.stroke();for(const lx of[-16,-6,10,20]){c.lineWidth=5;c.beginPath();c.moveTo(x+lx,y+8+b);c.lineTo(x+lx,gy-30);c.stroke();}});
  // Reference pterosaurs.
  for(let k=0;k<3;k++){const bx=((k*330-cam*.25+now*50)%(G.W+100)+G.W+100)%(G.W+100)-50,by=34+k*18,f=Math.sin(now*6+k)*6;c.fillStyle='#7a5a48';c.beginPath();c.moveTo(bx-14,by-f);c.lineTo(bx,by);c.lineTo(bx+14,by-f);c.lineTo(bx+4,by+3);c.lineTo(bx-4,by+3);c.closePath();c.fill();c.beginPath();c.moveTo(bx+3,by);c.lineTo(bx+10,by-2);c.lineTo(bx+3,by+2);c.fill();}
  // Reference ferns, palm-like trees, rocks, and ground.
  tile(.6,110,(x,i)=>{const k=i%3;if(k===0){c.strokeStyle='#7a5a3a';c.lineWidth=3;c.beginPath();c.moveTo(x,gy-6);c.quadraticCurveTo(x+4,gy-30,x,gy-52);c.stroke();c.fillStyle='#4f8f3a';for(let a=0;a<5;a++){const ang=-2.6+a*.55;c.save();c.translate(x,gy-52);c.rotate(ang);c.beginPath();c.ellipse(12,0,13,3.2,0,0,7);c.fill();c.restore();}}else if(k===1){c.fillStyle='#5aa04a';for(let a=-3;a<=3;a++){c.save();c.translate(x,gy-6);c.rotate(a*.32);c.beginPath();c.ellipse(0,-12,2.4,12,0,0,7);c.fill();c.restore();}}else{c.fillStyle='#9a8a7a';c.beginPath();c.ellipse(x,gy-10,16,10,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(x-4,gy-14,6,3,0,0,7);c.fill();}});
  c.fillStyle='#c9a26b';c.fillRect(0,gy-6,G.W,G.H-gy+6);c.fillStyle='#b48a55';tile(1,90,(x,i)=>{c.beginPath();c.ellipse(x,gy+8+((i*3)%3)*6,6+3*hsh(i),2,0,0,7);c.fill();});
  tile(1,260,(x)=>{c.fillStyle='#8a7a6a';c.beginPath();c.ellipse(x,gy+1,7,5,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(x-2,gy-1,3,1.6,0,0,7);c.fill();});
  // Race participant dino on the upper sidewalk, positioned in world space.
  drawStoneDino(now, gy);
  tile(1,300,(x,i)=>{if(hsh(i*4)<.5)return;c.strokeStyle='#f4efe4';c.lineWidth=2.4;c.beginPath();c.moveTo(x-6,gy+10);c.lineTo(x+6,gy+10);c.stroke();c.fillStyle='#f4efe4';for(const side of[-1,1]){c.beginPath();c.arc(x+side*6,gy+8.8,1.6,0,7);c.arc(x+side*6,gy+11.2,1.6,0,7);c.fill();}});
  const hands=[], spacing=72, s0=Math.floor((G.camX-120)/spacing), s1=Math.ceil((G.camX+G.W+120)/spacing);
  for(let i=s0;i<=s1;i++){const x=i*spacing+hsh(i+8)*20-G.camX;if(hsh(i*3)>.25){const h=spectator(x,GT-6,i,now,false,n,undefined,undefined,'stone');if(n&&h)hands.push(h);}}
  c.fillStyle=n?'#4b5057':'#9a8060';c.fillRect(0,GT-16,G.W,4);const f0=Math.floor((G.camX-OFF)/48);for(let i=f0;i<=f0+G.W/48+1;i++)c.fillRect(i*48-G.camX+OFF,GT-16,2,13);
  const by=GT+G.GD+20;c.fillStyle=n?'#34383c':'#9d876c';c.fillRect(0,by,G.W,G.H-by);c.fillStyle=n?'#55575a':'rgba(255,255,255,.6)';c.fillRect(0,by,G.W,2);
  if(n){nightShade(top,.42);c.fillStyle='rgba(8,14,38,.42)';c.fillRect(0,by,G.W,G.H-by);for(const h of hands)glowStick(h);tile(.04,800,(x,i)=>drawLava(c,x,GT-150,i,now));}
}

// 새 장소는 카메라 위치만으로 풍경을 배치해 경기 계산에 영향을 주지 않는다.
function newPlaceBg(th, now, top) {
  const c = G.ctx, n = th.night, p = th.place, off = G.camX;
  if (p === 'stone') return stoneMap(th, now, top);
  // 부산은 수평선을 올리고 그 앞에 넓은 육지를 둬, 건물이 바다가 아닌 땅 위에 서게 함
  const sea = p === 'busan' ? top - 46 : p === 'hangang' ? top - 86 : top - 28;
  if (p !== 'hangang') {
    c.fillStyle = p === 'stone' ? (n ? '#26383b' : '#b7d7b0') : (n ? '#123b56' : '#318bc2');
    c.fillRect(0, sea, G.W, 58);
  }
  if (p === 'busan') {
    // 광안대교와 바다는 가장 뒤에 두고, 다리보다 앞에 낮은 해안 건물을 둔다.
    const step = 940, lo = Math.floor((off * .055 - 260) / step), hi = Math.ceil((off * .055 + G.W + 260) / step);
    for (let i = lo; i <= hi; i++) {
      const x = i * step + 470 - off * .055;
      c.strokeStyle = n ? '#98aabd' : '#e9f0ed'; c.lineWidth = 3; c.beginPath();
      c.moveTo(x - 105, sea - 4); c.lineTo(x - 105, sea - 66); c.moveTo(x + 105, sea - 4); c.lineTo(x + 105, sea - 66);
      c.moveTo(x - 260, sea - 14); c.quadraticCurveTo(x - 170, sea - 16, x - 105, sea - 66); c.quadraticCurveTo(x, sea - 20, x + 105, sea - 66); c.quadraticCurveTo(x + 170, sea - 16, x + 260, sea - 14); c.stroke();
      if (n) for (let k = -10; k <= 10; k++) {
        const d = k * 24, u = d < -105 ? (d + 260) / 155 : d > 105 ? (260 - d) / 155 : (d + 105) / 210;
        const ly = d < -105 || d > 105
          ? sea - 14 * (1 - u) ** 2 - 32 * 2 * u * (1 - u) - 66 * u ** 2
          : sea - 66 * (1 - u) ** 2 - 40 * 2 * u * (1 - u) - 66 * u ** 2;
        const lx = x + d;
        c.globalAlpha = .35 + .65 * (.5 + .5 * Math.sin(now * 4 + hsh(i * 53 + k) * Math.PI * 2));
        c.fillStyle = '#ffe39a'; c.fillRect(lx - 1.5, ly - 1.5, 3, 3);
      }
      c.globalAlpha = 1;
    }
    // 상판은 다리 구간 사이에도 이어져 화면 전체를 가로지른다.
    c.fillStyle = n ? '#b7c3cd' : '#d6dde3'; c.fillRect(0, sea - 14, G.W, 3);
    if (n) for (let x = 0; x < G.W; x += 30) { c.fillStyle = '#ffd875'; c.fillRect(x, sea - 18, 3, 2); }
    // 모래와 낮은 방파제를 깔아 건물 앞의 바다와 육지를 분명히 나눈다.
    c.fillStyle = n ? '#665b50' : '#d8c69f';
    c.fillRect(0, top - 30, G.W, 60);
    c.fillStyle = n ? '#8b8173' : '#eee0bd';
    c.fillRect(0, top - 30, G.W, 4);
    c.fillStyle = n ? '#373f45' : '#8b7658';
    c.fillRect(0, top - 26, G.W, 2);
    c.fillStyle = n ? 'rgba(225,205,165,.28)' : 'rgba(255,255,255,.45)';
    for (let i = Math.floor((off - 80) / 54); i <= Math.ceil((off + G.W + 80) / 54); i++) {
      const x = i * 54 - off;
      c.fillRect(x, top + 5 + hsh(i * 7) * 14, 13 + hsh(i * 11) * 15, 2);
    }
    // 낮은 건물은 드문 간격으로만 나타나 부산 해안선을 열어 둔다.
    for (let i = Math.floor((off * .19 - 100) / 190); i <= Math.ceil((off * .19 + G.W + 100) / 190); i++) {
      if (hsh(i * 9 + 4) < .42) continue;
      const x = i * 190 + 90 - off * .19, bh = 22 + hsh(i * 13) * 25, bw = 42 + hsh(i * 17) * 22, by = top - 24;
      c.fillStyle = n ? '#314657' : '#9bb8c7'; c.fillRect(x, by - bh, bw, bh);
      c.fillStyle = n ? 'rgba(255,218,140,.65)' : 'rgba(255,255,255,.7)';
      for (let wx = x + 5; wx < x + bw - 4; wx += 10) c.fillRect(wx, by - bh + 7, 5, 4);
      if (hsh(i * 21) > .45) {
        const label = ['돼지국밥', '밀면', '편의점'][Math.floor(hsh(i * 25) * 3)], sy = by - bh + 11;
        c.fillStyle = n ? '#e5a95d' : '#fff'; c.fillRect(x + 3, sy, bw - 6, 11);
        c.strokeStyle = n ? '#ffe2a6' : '#d65b42'; c.lineWidth = 1; c.strokeRect(x + 3, sy, bw - 6, 11);
        c.fillStyle = n ? '#26374f' : '#25313b'; c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillText(label, x + bw / 2, sy + 8);
      }
    }
    // 갈매기는 멀리서 느리게 날고, 날갯짓 위상은 시간과 위치로 고정한다.
    for (let k = 0; k < 4; k++) {
      const x = ((k * 260 - off * .3 + now * 40) % (G.W + 80) + G.W + 80) % (G.W + 80) - 40;
      const y = 40 + k * 14 + Math.sin(now * 3 + k) * 5, flap = Math.sin(now * 10 + k) * 4;
      c.strokeStyle = n ? '#d1d9dc' : '#5b6770'; c.lineWidth = 1.4; c.beginPath();
      c.moveTo(x - 7, y - flap); c.quadraticCurveTo(x - 3, y - 2, x, y); c.quadraticCurveTo(x + 3, y - 2, x + 7, y - flap); c.stroke();
    }
    // 오징어잡이 배는 밤에만 갑판 위 등불과 잔잔한 수면 반사를 드러낸다.
    for (let i = Math.floor((off * .13 - 100) / 390); i <= Math.ceil((off * .13 + G.W + 100) / 390); i++) {
      const x = i * 390 + 150 - off * .13 + now * (hsh(i * 4) > .5 ? 3 : -2) % 390,
        y = top + 15 + hsh(i * 7) * 15, boat = 0.7 + hsh(i * 11) * .4;
      c.strokeStyle = n ? 'rgba(232,239,230,.55)' : 'rgba(255,255,255,.58)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 12 * boat, y); c.quadraticCurveTo(x, y + 3, x + 12 * boat, y); c.stroke();
      c.fillStyle = n ? '#d5dedb' : '#f8fbfa'; c.beginPath(); c.moveTo(x - 12 * boat, y - 2); c.lineTo(x + 11 * boat, y - 2); c.lineTo(x + 7 * boat, y + 2); c.lineTo(x - 8 * boat, y + 2); c.fill();
      if (n) {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let k = -3; k <= 3; k++) { const lx = x + k * 3 * boat; glow(lx, y - 9, 10, 'rgba(255,226,167,.28)'); c.fillStyle = '#fff1ce'; c.fillRect(lx - 1, y - 13, 2, 4); }
        c.globalAlpha = .22; c.fillStyle = '#ffe6b0'; c.fillRect(x - 8, y + 4, 16, 2); c.restore();
      }
    }
  } else if (p === 'hangang') {
    // 남산과 타워는 가장 느린 시차로 움직인다.
    const hillStep = 1120, hillOff = off * .035;
    for (let i = Math.floor((hillOff - 500) / hillStep); i <= Math.ceil((hillOff + G.W + 500) / hillStep); i++) {
      hangangNamsanLandmark(i * hillStep + 330 - hillOff, top + 12, n);
    }
    // 강 건너편에는 낮은 아파트를 촘촘히 세워 능선 아래를 채운다.
    const bank = top - 35;
    for (const [par, seed, step, minH, maxH] of [[.065, 31, 39, 22, 48], [.14, 57, 48, 28, 57]]) {
      const layerOff = off * par, i0 = Math.floor((layerOff - 70) / step), i1 = Math.ceil((layerOff + G.W + 70) / step);
      for (let i = i0; i <= i1; i++) {
        const x = i * step - layerOff, bw = 31 + hsh(i * 3 + seed) * 22,
          bh = minH + hsh(i * 7 + seed) * (maxH - minH), by = bank + (hsh(i * 13 + seed) > .82 ? 4 : 0);
        c.fillStyle = n ? (par < .1 ? '#344352' : '#29384a') : (par < .1 ? '#e8e5d9' : '#d5d9d4');
        c.fillRect(x, by - bh, bw, bh);
        c.fillStyle = n ? '#ffd58a' : '#aab7b4';
        for (let wy = by - bh + 5, floor = 0; wy < by - 3; wy += 9, floor++) {
          for (let wx = x + 4, col = 0; wx < x + bw - 3; wx += 7, col++) {
            if (!n || hsh(i * 31 + floor * 17 + col * 3 + seed) > .48) c.fillRect(wx, wy, 3, 4);
          }
        }
        c.fillStyle = n ? '#202e3d' : '#bbc3bd'; c.fillRect(x - 1, by - bh, bw + 2, 2);
      }
    }
    // 강물은 산책로 턱에서 끝나고, 강변 산책로가 관중석 앞까지 이어진다.
    c.fillStyle = n ? '#102d49' : '#315f87'; c.fillRect(0, top - 45, G.W, 45);
    const waterOff = off * .42;
    for (let i = Math.floor((waterOff - 30) / 76); i <= Math.ceil((waterOff + G.W + 30) / 76); i++) {
      const x = i * 76 - waterOff + hsh(i * 2) * 24, y = top - 40 + hsh(i * 3) * 64;
      c.strokeStyle = n ? 'rgba(159,190,207,.4)' : 'rgba(190,220,231,.58)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 1, x + 17, y); c.stroke();
    }
    // 아파트 앞 붉은 철제 트러스교.
    const redPar = .2, redOff = off * redPar, redStep = 190;
    c.strokeStyle = n ? '#b66a61' : '#c94737'; c.lineWidth = 2.4;
    for (let i = Math.floor((redOff - 20) / redStep); i <= Math.ceil((redOff + G.W + 20) / redStep); i++) {
      const x = i * redStep - redOff, y = top - 31;
      // chord와 양 끝 기둥을 먼저 그려 열차가 교량 내부에 놓이게 한다.
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + redStep, y); c.moveTo(x, y - 16); c.lineTo(x + redStep, y - 16); c.moveTo(x, y); c.lineTo(x, y - 16); c.moveTo(x + redStep, y); c.lineTo(x + redStep, y - 16); c.stroke();
    }
    c.fillStyle = n ? '#d5b1a2' : '#e6d3bd'; c.fillRect(0, top - 32, G.W, 3);
    if (n) for (let x = 10; x < G.W; x += 28) { c.fillStyle = '#ffd27c'; c.fillRect(x, top - 36, 3, 2); }
    // 가끔 2~3량 전철이 붉은 트러스교 안을 지난다.
    const trainPhase = (now * 18) % (G.W + 180);
    if (trainPhase < G.W + 90) {
      const tx = trainPhase - 90;
      for (let car = 0; car < 3; car++) {
        const x = tx + car * 36, y = top - 42;
        c.fillStyle = n ? '#e5dfca' : '#f1f2ec'; rr(x, y, 33, 9, 2); c.fill();
        c.fillStyle = n ? '#d5a951' : '#d14f43'; c.fillRect(x + 2, y + 4, 29, 2);
        c.fillStyle = n ? '#ffd98a' : '#a9cfdd'; c.fillRect(x + 5, y + 2, 5, 4); c.fillRect(x + 19, y + 2, 5, 4);
        if (n) {
          c.fillStyle = '#ffe4a3'; c.fillRect(x + 25, y + 2, 3, 4);
          if (car === 2) {
            c.save(); c.shadowColor = '#ffe8aa'; c.shadowBlur = 6;
            c.fillStyle = '#fff0c2'; c.beginPath(); c.arc(x + 31, y + 4.5, 1.5, 0, 7); c.fill(); c.restore();
          }
        }
      }
    }
    // X 보강재를 열차 앞에 그려 차체가 트러스 사이로 보이게 한다.
    c.strokeStyle = n ? '#b66a61' : '#c94737'; c.lineWidth = 2.4;
    for (let i = Math.floor((redOff - 20) / redStep); i <= Math.ceil((redOff + G.W + 20) / redStep); i++) {
      const x = i * redStep - redOff, y = top - 31;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 16); c.moveTo(x + redStep, y); c.lineTo(x + redStep, y - 16); c.stroke();
      for (let k = 0; k < redStep; k += 19) {
        c.beginPath(); c.moveTo(x + k, y - 16); c.lineTo(x + k + 19, y); c.moveTo(x + k + 19, y - 16); c.lineTo(x + k, y); c.stroke();
      }
    }
    // 회색 데크는 붉은 트러스 바로 밑에 놓고, 교각은 강물 안에서 끝낸다.
    c.fillStyle = n ? '#8393a0' : '#c8d0d2'; c.fillRect(0, top - 27, G.W, 4);
    c.fillStyle = n ? '#dce0dc' : '#edf0ed'; c.fillRect(0, top - 28, G.W, 2);
    const pierStep = 150, pierOff = off * .28;
    for (let i = Math.floor((pierOff - 30) / pierStep); i <= Math.ceil((pierOff + G.W + 30) / pierStep); i++) {
      const x = i * pierStep - pierOff + 70;
      c.strokeStyle = n ? '#aeb9bd' : '#9aa8ad'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x - 14, top - 26); c.lineTo(x, top + 12); c.lineTo(x + 14, top - 26); c.stroke();
      c.fillStyle = n ? '#bfc8c9' : '#84939a'; c.fillRect(x - 3, top + 10, 6, 3);
      if (n) { c.fillStyle = '#ffd77e'; c.fillRect(x - 2, top - 30, 4, 2); }
    }
    if (n) for (let x = 18; x < G.W; x += 42) { c.fillStyle = '#ffe19a'; c.fillRect(x, top - 31, 3, 2); }
    // 오리배는 V자 교각 사이의 물길을 따라 천천히 떠간다.
    for (let i = Math.floor((pierOff - 100) / pierStep); i <= Math.ceil((pierOff + G.W + 100) / pierStep); i++) {
      const phase = ((now * 2 + hsh(i * 7) * 90) % 90), drift = phase < 45 ? phase : 90 - phase,
        x = i * pierStep - pierOff + 145 - 5 + drift - 22, y = top - 12 + hsh(i * 11) * 4;
      c.fillStyle = n ? '#e6e2d5' : '#fff'; c.beginPath(); c.ellipse(x, y, 12, 4, 0, 0, 7); c.fill();
      c.fillStyle = n ? '#c8a95f' : '#f3bd3e'; c.beginPath(); c.arc(x + 1, y - 4, 4, Math.PI, 0); c.fill();
      c.strokeStyle = n ? 'rgba(255,220,145,.45)' : 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(x - 14, y + 4); c.lineTo(x + 14, y + 4); c.stroke();
    }
  }

  if (p !== 'hangang') { c.fillStyle = p === 'stone' ? (n ? '#223c32' : '#50733d') : (n ? '#193d50' : '#f1dfb4'); c.fillRect(0, top + 4, G.W, 26); }
  const spacing = 72, s0 = Math.floor((off - 120) / spacing), s1 = Math.ceil((off + G.W + 120) / spacing);
  for (let i = s0; i <= s1; i++) {
    const x = i * spacing + hsh(i) * 20 - off;
    if (p === 'stone') { c.fillStyle = n ? '#326042' : '#4f8f3a'; c.beginPath(); c.ellipse(x, top + 5, 5, 19, Math.sin(i) * .2, 0, 7); c.ellipse(x + 6, top + 5, 4, 15, -.4, 0, 7); c.fill(); }
    else if (p === 'busan' && i % 4 === 0) { c.fillStyle = n ? '#493c3b' : '#846f53'; c.fillRect(x, top - 2, 3, 23); c.fillStyle = n ? '#dfaa79' : '#e5a948'; c.beginPath(); c.moveTo(x - 15, top - 2); c.lineTo(x + 17, top - 2); c.lineTo(x + 8, top - 13); c.lineTo(x - 7, top - 13); c.fill(); }
    else if (p !== 'stone' && p !== 'hangang') tree(x, top + 24);
  }
  if (p === 'busan') {
    for (let i = Math.floor((off - 90) / 330); i <= Math.ceil((off + G.W + 90) / 330); i++) {
      if (hsh(i * 17 + 2) < .35) continue;
      const x = i * 330 + 150 - off, label = ['돼지국밥', '밀면', '편의점'][Math.abs(i) % 3];
      c.fillStyle = n ? '#443b38' : '#725c43'; c.fillRect(x - 1, top + 7, 2, 17);
      c.fillStyle = n ? '#f1c66f' : '#fff'; rr(x - 23, top - 3, 46, 13, 2); c.fill();
      c.strokeStyle = n ? '#ffe2a6' : '#d65b42'; c.lineWidth = 1; c.strokeRect(x - 23, top - 3, 46, 13);
      c.fillStyle = '#25313b'; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillText(label, x, top + 6);
    }
  }
  const hands = [];
  if (p !== 'hangang') for (let i = s0; i <= s1; i++) { const x = i * spacing + hsh(i + 8) * 20 - off; if (hsh(i * 3) > .25) { const h = spectator(x, GT - 6, i, now, false, n, undefined, undefined, p); if (n && h) hands.push(h); } }
  c.fillStyle = n ? '#4b5057' : p === 'busan' ? '#d4c39b' : p === 'hangang' ? '#63885e' : '#9a8060';
  c.fillRect(0, p === 'hangang' ? top : top + 30, G.W, GT - (p === 'hangang' ? top : top + 30));
  if (p === 'hangang') {
    // 강물 가장자리의 낮은 턱과 넓은 포장 산책로가 관중 발밑을 받친다.
    c.fillStyle = n ? '#56645e' : '#a4ad91'; c.fillRect(0, top, G.W, 3);
    c.fillStyle = n ? '#777d78' : '#c4c0ae'; c.fillRect(0, GT - 30, G.W, 14);
    c.fillStyle = n ? '#a5a092' : '#e0d8c3'; c.fillRect(0, GT - 30, G.W, 2);
    c.fillStyle = n ? 'rgba(34,42,39,.45)' : 'rgba(112,105,85,.35)';
    for (let x = 30; x < G.W; x += 56) c.fillRect(x, GT - 28, 1, 11);
    c.fillStyle = n ? '#404a45' : '#87937c'; c.fillRect(0, GT - 16, G.W, 2);
  }
  if (p === 'hangang') for (let i = s0; i <= s1; i++) { const x = i * spacing + hsh(i + 8) * 20 - off; if (hsh(i * 3) > .25) { const h = spectator(x, GT - 6, i, now, false, n, undefined, undefined, p); if (n && h) hands.push(h); } }
  c.fillStyle = n ? '#242c34' : p === 'busan' ? '#b69a67' : p === 'hangang' ? '#63885e' : '#715437'; c.fillRect(0, GT - 16, G.W, 4);
  const fence0 = Math.floor((G.camX - OFF) / 48);
  for (let i = fence0; i <= fence0 + G.W / 48 + 1; i++) c.fillRect(i * 48 - G.camX + OFF, GT - 16, 2, 13);
  const by = GT + G.GD + 20; c.fillStyle = n ? '#34383c' : p === 'busan' ? '#d8c69f' : p === 'hangang' ? '#d8dfcb' : '#9d876c'; c.fillRect(0, by, G.W, G.H - by); c.fillStyle = n ? '#55575a' : 'rgba(255,255,255,.6)'; c.fillRect(0, by, G.W, 2);
  if (p === 'hangang') {
    // A compact convenience kiosk sits above the grass fill so it remains visible.
    for (let i = Math.floor((off - 100) / 420); i <= Math.ceil((off + G.W + 100) / 420); i++) {
      const x = i * 420 + 220 - off;
      c.fillStyle = n ? '#57454a' : '#fff'; c.fillRect(x - 17, GT - 20, 34, 19);
      c.fillStyle = n ? '#a87856' : '#2fb67c'; c.fillRect(x - 17, GT - 20, 34, 5);
      c.fillStyle = n ? '#ffe19a' : '#25313b'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillText('편의점', x, GT - 16);
      c.fillStyle = n ? '#8fa5ac' : '#bfe3f2'; c.fillRect(x - 12, GT - 12, 24, 9);
    }
  }
  if (n) { nightShade(top, .42); c.fillStyle = 'rgba(8,14,38,.42)'; c.fillRect(0, by, G.W, G.H - by); if (p !== 'stone') nightLights(th); for (const h of hands) glowStick(h); }
}
