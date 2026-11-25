import { BACK, GT, OFF } from "../constants.js";
import { drawPerson } from "./character.js";
import { drawHeli } from "./heli.js";
import { drawRace } from "./race.js";
import { G } from "../state.js";
// 시작 전 미리보기: 배경 위에 트랙 라인·레인 번호·이름표와 서 있는 캐릭터
export function drawPreview() {
  if (!G.pv) {
    const rs = G.racers;
    G.racers = [];
    G.noHeli = true;
    try {
      drawRace();
    } finally {
      G.noHeli = false;
      G.racers = rs;
    }
    G.pv = document.createElement('canvas');
    G.pv.width = G.W;
    G.pv.height = G.H;
    const p = G.pv.getContext('2d');
    p.drawImage(G.cv, 0, 0);
  }
  G.ctx.drawImage(G.pv, 0, 0);
  drawHeli();
  const top = GT,
    bot = GT + G.GD + 20;
  G.ctx.strokeStyle = '#fff';
  G.ctx.lineWidth = 2;
  G.ctx.beginPath();
  G.ctx.moveTo(0, top);
  G.ctx.lineTo(G.W, top);
  G.ctx.moveTo(0, bot);
  G.ctx.lineTo(G.W, bot);
  G.ctx.stroke();
  G.ctx.fillStyle = '#fff';
  G.ctx.fillRect(OFF - 3, top, 6, bot - top);
  // 레인 구분선
  const gap = (G.GD + 20) / G.n;
  G.ctx.strokeStyle = 'rgba(255,255,255,.8)';
  G.ctx.lineWidth = 1;
  G.ctx.setLineDash([6, 6]);
  G.ctx.beginPath();
  for (let k = 1; k < G.n; k++) {
    const y = GT + k * gap;
    G.ctx.moveTo(0, y);
    G.ctx.lineTo(G.W, y);
  }
  G.ctx.stroke();
  G.ctx.setLineDash([]);
  const fs = Math.max(11, Math.min(15, gap - 2));
  // 커스터마이징 카드에 마우스를 올린 캐릭터는 마지막에 따로 그림(focusOne)
  const hr = G.hover >= 0 ? G.racers.find(r => r.i === G.hover) : null;
  for (const r of G.racers.slice().sort((a, b) => a.d - b.d)) {
    if (r === hr) continue;
    const base = GT + 16 + r.d;
    G.ctx.fillStyle = 'rgba(30,43,51,.25)';
    G.ctx.beginPath();
    G.ctx.ellipse(OFF - BACK, base + 4, 13, 4, 0, 0, 7);
    G.ctx.fill();
    drawPerson(OFF - BACK, base, r, {
      run: false
    });
  }
  // 레인 번호는 화면 왼쪽 끝
  G.ctx.font = fs + 'px Jua,sans-serif';
  for (const r of G.racers) {
    const y = GT + 16 + r.d + 4,
      ln = (G.lanes[r.i] ?? r.i) + 1;
    G.ctx.textAlign = 'center';
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.fillText(String(ln), 11, y);
  }
  G.ctx.textAlign = 'center';
  G.ctx.font = '26px Jua,sans-serif';
  G.ctx.lineWidth = 5;
  G.ctx.strokeStyle = '#fff';
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.strokeText('시작을 누르면 출발!', G.W / 2, GT - 60);
  G.ctx.fillText('시작을 누르면 출발!', G.W / 2, GT - 60);
  if (hr) focusOne(hr);
}
// 호버한 캐릭터 강조: 지금까지 그린 화면 전체를 흐리게 덮고, 그 캐릭터만 선명하게 + 흰 외곽선
export function focusOne(r) {
  if (!G.fb) G.fb = [0, 0, 0].map(() => document.createElement('canvas'));
  for (const c of G.fb) if (c.width !== G.W || c.height !== G.H) {
    c.width = G.W;
    c.height = G.H;
  }
  const snap = G.fb[0].getContext('2d'),
    one = G.fb[1].getContext('2d'),
    sil = G.fb[2].getContext('2d');
  snap.clearRect(0, 0, G.W, G.H);
  snap.drawImage(G.cv, 0, 0);
  if ('filter' in G.ctx) {
    G.ctx.filter = 'blur(3px)';
    G.ctx.drawImage(G.fb[0], 0, 0);
    G.ctx.filter = 'none';
  }
  G.ctx.fillStyle = 'rgba(255,255,255,.2)';
  G.ctx.fillRect(0, 0, G.W, G.H);
  const base = GT + 16 + r.d;
  G.ctx.fillStyle = 'rgba(30,43,51,.3)';
  G.ctx.beginPath();
  G.ctx.ellipse(OFF - BACK, base + 4, 14, 4.5, 0, 0, 7);
  G.ctx.fill();
  one.clearRect(0, 0, G.W, G.H);
  const main = G.ctx;
  G.ctx = one;
  try {
    drawPerson(OFF - BACK, base, r, {
      run: false
    });
  } finally {
    G.ctx = main;
  }
  sil.clearRect(0, 0, G.W, G.H);
  sil.globalCompositeOperation = 'source-over';
  sil.drawImage(G.fb[1], 0, 0);
  sil.globalCompositeOperation = 'source-in';
  sil.fillStyle = '#fff';
  sil.fillRect(0, 0, G.W, G.H);
  sil.globalCompositeOperation = 'source-over';
  for (const [dx, dy] of [[-2.5, 0], [2.5, 0], [0, -2.5], [0, 2.5], [-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) G.ctx.drawImage(G.fb[2], dx, dy);
  G.ctx.drawImage(G.fb[1], 0, 0);
}
