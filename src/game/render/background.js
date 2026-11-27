// 배경(맵): 서울 도심 / 전통 마을 × 낮 / 밤. 하늘, 랜드마크, 건물, 인도, 응원 시민, 산책, 밤 조명.
import { BUSAN_SIGNS, COLORS, GT, HAIR, OFF, SHOPC, SHOPS, SIGNS, SKIN } from "../constants.js";
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
      G.ctx.fillStyle = night ? '#1a2a3c' : '#7fa87a';
      G.ctx.beginPath();
      G.ctx.moveTo(x - 190, base);
      G.ctx.quadraticCurveTo(x, base - 150, x + 190, base);
      G.ctx.fill();
      const top = base - 74;
      G.ctx.fillStyle = night ? '#cfd8e3' : '#eef1f4';
      G.ctx.fillRect(x - 3, top - 70, 6, 70);
      G.ctx.fillStyle = night ? '#ffe38a' : '#fff';
      G.ctx.beginPath();
      G.ctx.ellipse(x, top - 60, 11, 6, 0, 0, 7);
      G.ctx.fill();
      G.ctx.fillStyle = night ? '#ffd25a' : '#d6dde3';
      G.ctx.fillRect(x - 7, top - 70, 14, 5);
      G.ctx.strokeStyle = night ? '#ff6b6b' : '#e4572e';
      G.ctx.lineWidth = 2;
      G.ctx.beginPath();
      G.ctx.moveTo(x, top - 70);
      G.ctx.lineTo(x, top - 100);
      G.ctx.stroke();
      G.ctx.strokeStyle = '#fff';
      G.ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        G.ctx.moveTo(x, top - 74 - k * 9);
        G.ctx.lineTo(x, top - 78 - k * 9);
      }
      G.ctx.stroke();
      if (night && now % 1.4 < .7) {
        G.ctx.fillStyle = '#ff4d4d';
        G.ctx.beginPath();
        G.ctx.arc(x, top - 101, 2.2, 0, 7);
        G.ctx.fill();
      }
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
  G.ctx.fillStyle = night ? '#ffd76a' : '#1e2b33';
  G.ctx.font = 'bold 9px serif';
  G.ctx.textAlign = 'center';
  G.ctx.fillText('光化門', x + w / 2, base - 64);
  if (night) {
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
    const signSet = place === 'busan' ? BUSAN_SIGNS : SIGNS,
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
export function bannerPair(x1, minSpan, maxSpan, y, i, now, trad, night) {
  const s = 1.45,
    bob = Math.sin(now * 3 + i) * 1.5,
    top = y - 50 * s + bob,
    h = 16,
    gap = 7 * s,
    t = BANNERS[Math.floor(hsh(i * 41) * BANNERS.length)];
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
      bannerPair(x, SP * 2, SP * 4, GT - 6, i, now, th.trad, n8);
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

function stoneMap(th, now, top) {
  const c = G.ctx, n = th.night, gy = GT, cam = G.camX - OFF;
  const tile = (par, gap, fn) => { const o = cam * par, a = Math.floor((o - 200) / gap), b = Math.ceil((o + G.W + 200) / gap); for (let i = a; i <= b; i++) fn(i * gap - o + OFF, i); };
  const sky = c.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, n ? '#26383b' : '#f5c58a'); sky.addColorStop(1, n ? '#43564d' : '#fbe6c4');
  c.fillStyle = sky; c.fillRect(0, 0, G.W, G.H);
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
  // Lab dinosaur friend and its original 260px jump rhythm and silhouette.
  {const dx=G.W*.32,u=((cam+dx)%260+260)%260,p=u>=225?(u-225)/70:u<45?(u+35)/70:-1,jh=p>=0?30*Math.sin(Math.PI*p):0,y=gy-jh,run=now*14,b=jh?0:Math.abs(Math.sin(run))*1.2;c.fillStyle='rgba(60,40,20,.22)';c.beginPath();c.ellipse(dx,gy+3,14-jh/5,3,0,0,7);c.fill();c.save();c.translate(dx,y-b);c.fillStyle='#e8913a';for(let k=0;k<4;k++){c.beginPath();c.moveTo(-14+k*6,-19+k*.5);c.lineTo(-11+k*6,-25+k*.5);c.lineTo(-8+k*6,-19+k*.5);c.fill();}c.strokeStyle='#3fae8e';c.lineWidth=5;c.lineCap='round';for(const[lx,ph]of[[-5,0],[4,Math.PI]]){const sw=jh?.5:Math.sin(run+ph);c.beginPath();c.moveTo(lx,-6);c.lineTo(lx+sw*4,0);c.stroke();}c.fillStyle='#3fae8e';c.beginPath();c.moveTo(-12,-12);c.quadraticCurveTo(-26,-12,-30,-4+Math.sin(run)*2);c.quadraticCurveTo(-22,-6,-10,-6);c.fill();c.beginPath();c.ellipse(-2,-12,13,9,0,0,7);c.fill();c.fillStyle='#f4e7c4';c.beginPath();c.ellipse(1,-9,8,5.5,0,0,7);c.fill();c.fillStyle='#3fae8e';c.beginPath();c.ellipse(11,-24,9,7.5,0,0,7);c.fill();c.beginPath();c.ellipse(16,-21,6,4,0,0,7);c.fill();c.strokeStyle='#3fae8e';c.lineWidth=2.4;c.beginPath();c.moveTo(7,-12);c.lineTo(11,-9+(jh?-3:0));c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(12,-26,2.6,0,7);c.fill();c.fillStyle='#10202a';c.beginPath();c.arc(12.8,-26,1.4,0,7);c.fill();c.strokeStyle='#10202a';c.lineWidth=1;c.beginPath();c.arc(16,-21.5,2.6,.1*Math.PI,.8*Math.PI);c.stroke();c.fillStyle='rgba(255,140,120,.5)';c.beginPath();c.arc(9,-21,1.6,0,7);c.fill();c.restore();}
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
  const sea = top - 28;
  c.fillStyle = p === 'stone' ? (n ? '#26383b' : '#b7d7b0') : p === 'hangang' ? (n ? '#193d57' : '#5aafd0') : (n ? '#123b56' : '#318bc2');
  c.fillRect(0, sea, G.W, 58);
  if (p === 'busan') {
    // 광안대교와 바다는 가장 뒤에 두고, 다리보다 앞에 낮은 해안 건물을 둔다.
    const step = 940, lo = Math.floor((off * .055 - 260) / step), hi = Math.ceil((off * .055 + G.W + 260) / step);
    for (let i = lo; i <= hi; i++) {
      const x = i * step + 470 - off * .055;
      c.strokeStyle = n ? '#98aabd' : '#e9f0ed'; c.lineWidth = 3; c.beginPath();
      c.moveTo(x - 105, sea - 4); c.lineTo(x - 105, sea - 66); c.moveTo(x + 105, sea - 4); c.lineTo(x + 105, sea - 66);
      c.moveTo(x - 260, sea - 14); c.quadraticCurveTo(x - 170, sea - 16, x - 105, sea - 66); c.quadraticCurveTo(x, sea - 20, x + 105, sea - 66); c.quadraticCurveTo(x + 170, sea - 16, x + 260, sea - 14); c.stroke();
      c.fillStyle = n ? '#b7c3cd' : '#d6dde3'; c.fillRect(x - 300, sea - 14, 600, 3);
      for (let k = -8; k <= 8; k++) { c.fillStyle = n ? '#ffd875' : '#fff1bf'; c.fillRect(x + k * 30, sea - 18, 3, 2); }
    }
    // 낮은 건물은 드문 간격으로만 나타나 부산 해안선을 열어 둔다.
    for (let i = Math.floor((off * .19 - 100) / 190); i <= Math.ceil((off * .19 + G.W + 100) / 190); i++) {
      if (hsh(i * 9 + 4) < .42) continue;
      const x = i * 190 + 90 - off * .19, bh = 22 + hsh(i * 13) * 25, bw = 42 + hsh(i * 17) * 22, by = top - 8;
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
    // 강 건너 아파트와 언덕 위 탑을 멀리 배치한다.
    for (const [par, seed, step, minH, maxH, col] of [[.08, 31, 112, 32, 72, n ? '#26374f' : '#a7bdc5'], [.13, 35, 82, 40, 92, n ? '#1d2e47' : '#8ca7b6']]) {
      const i0 = Math.floor((off * par - 100) / step), i1 = Math.ceil((off * par + G.W + 100) / step);
      for (let i = i0; i <= i1; i++) {
        if (hsh(i * 9 + seed) < .2) continue;
        const x = i * step - off * par, bw = 42 + hsh(i * 3 + seed) * 26, bh = minH + hsh(i * 7 + seed) * (maxH - minH);
        c.fillStyle = col; c.fillRect(x, top - 18 - bh, bw, bh);
        c.fillStyle = n ? 'rgba(255,220,140,.65)' : 'rgba(255,255,255,.58)';
        for (let wy = top - 12 - bh; wy < top - 22; wy += 12) for (let wx = x + 6; wx < x + bw - 5; wx += 12) if (hsh(i * 31 + wy + wx) > .5) c.fillRect(wx, wy, 5, 5);
      }
    }
    const hill = 330 - off * .1;
    c.fillStyle = n ? '#283b4a' : '#7eaa82'; c.beginPath(); c.moveTo(hill - 85, top - 17); c.quadraticCurveTo(hill, top - 94, hill + 90, top - 17); c.fill();
    c.fillStyle = n ? '#b9c6d0' : '#e8ece5'; c.fillRect(hill - 2, top - 74, 4, 57); c.beginPath(); c.ellipse(hill, top - 69, 9, 5, 0, 0, 7); c.fill();
    c.fillRect(hill - 1, top - 91, 2, 17);
    if (n) { c.fillStyle = '#ffd978'; c.beginPath(); c.arc(hill, top - 70, 3, 0, 7); c.fill(); }
    const step = 760, lo = Math.floor((off * .15 - 240) / step), hi = Math.ceil((off * .15 + G.W + 240) / step);
    for (let i = lo; i <= hi; i++) {
      const x = i * step + 380 - off * .15;
      c.strokeStyle = n ? '#8799ad' : '#d54d36'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 210, top - 18); c.quadraticCurveTo(x, top - 98, x + 210, top - 18); c.stroke();
      c.strokeStyle = n ? '#ced8dc' : '#edf1ed'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 238, top - 16); c.lineTo(x + 238, top - 16); c.stroke();
      for (let k = -180; k <= 180; k += 40) { const y = top - 18 - 80 * (1 - (k / 210) ** 2); c.strokeStyle = n ? '#778ba0' : '#cc4b35'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + k, y); c.lineTo(x + k, top - 18); c.stroke(); }
      if (n) for (let k = -200; k <= 200; k += 20) { c.fillStyle = '#ffd77c'; c.fillRect(x + k, top - 14, 4, 2); }
      const phase = ((now + i * 8) % 24 + 24) % 24;
      if (phase < 4.5) {
        const tx = x - 215 + phase / 4.5 * 430, cars = 3, carW = 30;
        for (let car = 0; car < cars; car++) {
          const cx = tx + car * (carW + 3);
          c.fillStyle = n ? '#f4d78a' : '#f4f1e5'; rr(cx - carW / 2, top - 29, carW, 10, 3); c.fill();
          c.fillStyle = n ? '#e9a95c' : '#d85a43'; c.fillRect(cx - 9, top - 27, 18, 3);
          c.fillStyle = n ? '#fff1c1' : '#a7cce0'; c.fillRect(cx - 11, top - 24, 5, 3); c.fillRect(cx + 6, top - 24, 5, 3);
        }
      }
    }
    for (let i = Math.floor((off * .25 - 80) / 270); i <= Math.ceil((off * .25 + G.W + 80) / 270); i++) {
      const x = i * 270 + 100 - off * .25 + now * 4 % 270;
      c.fillStyle = n ? '#e7e9df' : '#fff'; c.beginPath(); c.ellipse(x, top + 13, 13, 5, 0, 0, 7); c.fill(); c.strokeStyle = n ? '#ddd6b9' : '#b7c5c4'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 4, top + 12); c.quadraticCurveTo(x + 1, top - 6, x - 6, top + 1); c.stroke();
    }
    for (let i = Math.floor((off * .3 - 50) / 85); i <= Math.ceil((off * .3 + G.W + 50) / 85); i++) { const x = i * 85 - off * .3 + hsh(i * 2) * 38, y = top + 15 + hsh(i * 3) * 11; c.strokeStyle = n ? 'rgba(204,226,231,.5)' : 'rgba(255,255,255,.62)'; c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + 10, y); c.stroke(); }
  }

  c.fillStyle = p === 'stone' ? (n ? '#223c32' : '#50733d') : p === 'hangang' ? (n ? '#244332' : '#8fc06a') : (n ? '#193d50' : '#f1dfb4'); c.fillRect(0, top + 4, G.W, 26);
  const spacing = 72, s0 = Math.floor((off - 120) / spacing), s1 = Math.ceil((off + G.W + 120) / spacing);
  for (let i = s0; i <= s1; i++) {
    const x = i * spacing + hsh(i) * 20 - off;
    if (p === 'stone') { c.fillStyle = n ? '#326042' : '#4f8f3a'; c.beginPath(); c.ellipse(x, top + 5, 5, 19, Math.sin(i) * .2, 0, 7); c.ellipse(x + 6, top + 5, 4, 15, -.4, 0, 7); c.fill(); }
    else if (p === 'busan' && i % 4 === 0) { c.fillStyle = n ? '#493c3b' : '#846f53'; c.fillRect(x, top - 2, 3, 23); c.fillStyle = n ? '#dfaa79' : '#e5a948'; c.beginPath(); c.moveTo(x - 15, top - 2); c.lineTo(x + 17, top - 2); c.lineTo(x + 8, top - 13); c.lineTo(x - 7, top - 13); c.fill(); }
    else if (p === 'hangang' && i % 5 === 0) { c.strokeStyle = n ? '#b5b5a1' : '#53604b'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, top + 8); c.lineTo(x, top - 10); c.lineTo(x + 9, top - 10); c.stroke(); c.fillStyle = n ? '#ffe19a' : '#fff1c3'; rr(x + 6, top - 13, 9, 6, 2); c.fill(); }
    else if (p !== 'stone') tree(x, top + 24);
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
  if (p === 'hangang') for (let i = Math.floor((off - 90) / 380); i <= Math.ceil((off + G.W + 90) / 380); i++) {
    const x = i * 380 + 100 - off; c.fillStyle = n ? '#553f44' : '#d66b67'; c.fillRect(x, top + 12, 34, 13); c.fillStyle = n ? '#c9b98e' : '#f5e4c5'; c.fillRect(x + 6, top + 6, 21, 7); c.fillStyle = n ? '#ffe19a' : '#8ea6a4'; c.fillRect(x + 9, top + 8, 5, 4); c.fillRect(x + 19, top + 8, 5, 4);
    if (i % 2 === 0) { c.fillStyle = n ? '#bd6770' : '#d95950'; c.save(); c.translate(x - 26, top + 23); c.rotate(-.12); c.fillRect(-22, -7, 44, 11); c.restore(); c.fillStyle = n ? '#443e3a' : '#5d6359'; c.beginPath(); c.arc(x - 29, top + 27, 4, 0, 7); c.arc(x - 7, top + 27, 4, 0, 7); c.fill(); }
  }

  const hands = [];
  for (let i = s0; i <= s1; i++) { const x = i * spacing + hsh(i + 8) * 20 - off; if (hsh(i * 3) > .25) { const h = spectator(x, GT - 6, i, now, false, n, undefined, undefined, p); if (n && h) hands.push(h); } }
  c.fillStyle = n ? '#4b5057' : p === 'busan' ? '#d4c39b' : p === 'hangang' ? '#9aa88b' : '#9a8060'; c.fillRect(0, top + 30, G.W, GT - top - 30);
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
