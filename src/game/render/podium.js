import { COLORS } from "../constants.js";
import { drawPerson } from "./character.js";
import { bubble } from "./race.js";
import { G } from "../state.js";
import { R, fitText, ink, rr } from "../util.js";
export function podiumStep(dt) {
  if (G.pt > 2.9) for (let k = 0; k < 3; k++) G.conf.push({
    x: R(0, G.W),
    y: -10,
    vx: R(-40, 40),
    vy: R(90, 170),
    c: COLORS[Math.floor(R(0, 8))],
    a: R(0, 6)
  });
  for (const c of G.conf) {
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.a += dt * 5;
  }
  G.conf = G.conf.filter(c => c.y < G.H + 10);
}
// 조명 세기: t0초부터 0.6초 페이드인 → 4.5초 유지 → 0.6초 페이드아웃 후 전체 컬러로 복귀
export function spotA(t0) {
  const FI = .6,
    HOLD = 4.5;
  return Math.min((G.pt - t0) / FI, (t0 + FI + HOLD + FI - G.pt) / FI);
}
export function spotlight(cx, cy, rad, a) {
  a = Math.max(0, Math.min(1, a));
  if (a <= 0) return;
  const e = 1 - (1 - a) * (1 - a);
  if (!G.sp) G.sp = document.createElement('canvas');
  if (G.sp.width !== G.W || G.sp.height !== G.H) {
    G.sp.width = G.W;
    G.sp.height = G.H;
  }
  const s = G.sp.getContext('2d');
  s.clearRect(0, 0, G.W, G.H);
  s.drawImage(G.cv, 0, 0);
  G.ctx.save();
  G.ctx.globalAlpha = e;
  if ('filter' in G.ctx) {
    G.ctx.filter = 'grayscale(1) brightness(.55)';
    G.ctx.drawImage(G.sp, 0, 0);
    G.ctx.filter = 'none';
  } else {
    G.ctx.fillStyle = 'rgba(0,0,0,.6)';
    G.ctx.fillRect(0, 0, G.W, G.H);
  }
  G.ctx.restore();
  const z = 1 + .25 * e,
    r = rad * (.85 + .15 * e) * z;
  G.ctx.save();
  G.ctx.beginPath();
  G.ctx.arc(cx, cy, r, 0, 7);
  G.ctx.clip();
  G.ctx.translate(cx, cy);
  G.ctx.scale(z, z);
  G.ctx.drawImage(G.sp, -cx, -cy);
  G.ctx.restore();
  G.ctx.save();
  G.ctx.globalAlpha = e;
  G.ctx.strokeStyle = '#fff6c8';
  G.ctx.lineWidth = 4;
  G.ctx.shadowColor = '#ffd166';
  G.ctx.shadowBlur = 18;
  G.ctx.beginPath();
  G.ctx.arc(cx, cy, r, 0, 7);
  G.ctx.stroke();
  G.ctx.restore();
}
// 꼴찌 자리: 왼쪽에 꽂힌 '꼴등' 화살표 표지판이 캐릭터를 가리킴. 2위 시상대와 겹치지 않게 모바일 폭에선 조금 왼쪽
export function lastX() {
  const dx = Math.min(150, G.W * .23);
  return Math.max(70, Math.min(90, G.W / 2 - dx - 84));
}
export function lastSign(lx) {
  const px = lx - 36,
    y0 = 304,
    y1 = 326,
    x0 = px - 22,
    x1 = px + 30;
  G.ctx.strokeStyle = '#6b4a2f';
  G.ctx.lineWidth = 5;
  G.ctx.lineCap = 'butt';
  G.ctx.beginPath();
  G.ctx.moveTo(px, y1);
  G.ctx.lineTo(px, 372);
  G.ctx.stroke();
  G.ctx.lineCap = 'round';
  G.ctx.fillStyle = '#d9b27a';
  G.ctx.strokeStyle = '#6b4a2f';
  G.ctx.lineWidth = 2;
  G.ctx.beginPath();
  G.ctx.moveTo(x0, y0);
  G.ctx.lineTo(x1 - 10, y0);
  G.ctx.lineTo(x1, (y0 + y1) / 2);
  G.ctx.lineTo(x1 - 10, y1);
  G.ctx.lineTo(x0, y1);
  G.ctx.closePath();
  G.ctx.fill();
  G.ctx.stroke();
  G.ctx.fillStyle = '#3b2a1a';
  G.ctx.textAlign = 'center';
  G.ctx.font = '15px Jua,sans-serif';
  G.ctx.fillText('꼴등', (x0 + x1 - 10) / 2, y1 - 6);
}
// 시상식 화면 한 프레임
export function drawPodium() {
  G.podBub = null;
  G.lastBub = null;
  const g = G.ctx.createLinearGradient(0, 0, 0, G.H);
  g.addColorStop(0, '#26325c');
  g.addColorStop(1, '#6f86c9');
  G.ctx.fillStyle = g;
  G.ctx.fillRect(0, 0, G.W, G.H);
  G.ctx.fillStyle = 'rgba(255,255,255,.07)';
  for (const lx of [G.W / 4, G.W / 2, G.W * .75]) {
    const c = G.W / 2,
      q = G.W / 4,
      mid = lx === c;
    G.ctx.beginPath();
    G.ctx.moveTo(lx - 14, 0);
    G.ctx.lineTo(lx + 14, 0);
    G.ctx.lineTo(lx + 120 * (lx - c) / q + (mid ? 70 : 0), 370);
    G.ctx.lineTo(lx - 120 * (c - lx) / q - (mid ? 70 : 0), 370);
    G.ctx.fill();
  }
  G.ctx.fillStyle = '#3b2f3f';
  G.ctx.fillRect(0, 360, G.W, G.H - 360);
  G.ctx.textAlign = 'center';
  G.ctx.fillStyle = '#fff';
  G.ctx.font = '36px Jua,sans-serif';
  G.ctx.fillText('시상식', G.W / 2, 48);
  const dx = Math.min(150, G.W * .23),
    slots = [{
      x: G.W / 2,
      h: 100,
      c: '#f4c430',
      d: 2.2
    }, {
      x: G.W / 2 - dx,
      h: 70,
      c: '#c0c6cc',
      d: 1.4
    }, {
      x: G.W / 2 + dx,
      h: 50,
      c: '#cd7f32',
      d: .6
    }];
  slots.forEach((sl, k) => {
    const r = G.fin[k];
    if (!r || G.n > 1 && r === G.fin[G.n - 1]) return;
    const top = 360 - sl.h;
    G.ctx.fillStyle = sl.c;
    rr(sl.x - 62, top, 124, sl.h + 4, 6);
    G.ctx.fill();
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.font = '20px Jua,sans-serif';
    G.ctx.fillText(k + 1 + '위', sl.x, top + 22);
    fitText(r.name, sl.x, top + 43, 16, 112);
    const a = G.pt - sl.d;
    if (a < 0) return;
    const u = Math.min(1, a / .7);
    let off = -320 * (1 - u) * (1 - u);
    if (a > .7) off -= Math.abs(Math.sin((a - .7) * 9)) * Math.max(0, 1 - (a - .7) * 1.4) * 16;
    drawPerson(sl.x, top + off, r, {
      cheer: a > .7,
      run: false
    });
    if (a > .7) {
      G.ctx.font = '19px Jua,sans-serif';
      const tw = G.ctx.measureText(r.name).width + 16;
      G.ctx.fillStyle = r.color;
      rr(sl.x - tw / 2, top + off - 80, tw, 22, 10);
      G.ctx.fill();
      G.ctx.fillStyle = ink(r.color);
      G.ctx.fillText(r.name, sl.x, top + off - 63);
      if (k === 0) {
        G.ctx.font = '30px sans-serif';
        G.ctx.fillText('🏆', sl.x + 30, top + off - 20);
        G.podBub = {
          x: sl.x,
          y: top + off - 88
        };
      }
    }
  });
  if (G.n > 1 && G.fin[G.n - 1]) {
    const lx = lastX(),
      r = G.fin[G.n - 1],
      u = Math.min(1, Math.max(0, (G.pt - .2) / 1.6)),
      x = -40 + (lx + 40) * u,
      walk = u < 1;
    G.ctx.fillStyle = '#2a3350';
    G.ctx.beginPath();
    G.ctx.moveTo(0, 200);
    G.ctx.lineTo(150, 372);
    G.ctx.lineTo(0, 372);
    G.ctx.fill();
    lastSign(lx);
    const fy = 372;
    if (!walk && r.age !== 'r') {
      G.ctx.fillStyle = 'rgba(79,195,247,.5)';
      G.ctx.beginPath();
      G.ctx.ellipse(x + 6, 374, Math.max(0, Math.min(34, (G.pt - 1.8) * 14)), 6, 0, 0, 7);
      G.ctx.fill();
    }
    drawPerson(x, fy, r, {
      run: walk,
      ph: G.pt * 14,
      cry: true,
      sad: !walk
    });
    // 꼴찌: 이름표 '이름(꼴등)' + 말풍선(조명 효과 위에 그리도록 위치만 기억)
    if (!walk) {
      const lb = r.name;
      G.ctx.textAlign = 'center';
      G.ctx.font = '17px Jua,sans-serif';
      const tw = G.ctx.measureText(lb).width + 16;
      G.ctx.fillStyle = r.color;
      rr(x - tw / 2, fy - 98, tw, 22, 10);
      G.ctx.fill();
      G.ctx.fillStyle = ink(r.color);
      G.ctx.fillText(lb, x, fy - 81);
      G.lastBub = {
        x: x,
        y: fy - 106,
        t: r.age === 'r' ? '삐빅… 패배 감지' : '흑흑…'
      };
    }
  }
  for (const c of G.conf) {
    G.ctx.save();
    G.ctx.translate(c.x, c.y);
    G.ctx.rotate(c.a);
    G.ctx.fillStyle = c.c;
    G.ctx.fillRect(-4, -2, 8, 4);
    G.ctx.restore();
  }
  // 응원 포커스: 1등 원함이면 1위, 꼴등 원함이면 꼴찌에게 컬러 조명, 나머지는 흑백
  if (G.want === 'first' && G.fin[0]) spotlight(G.W / 2, 360 - 100 - 40, 72, spotA(3.4));else if (G.want === 'last' && G.n > 1 && G.fin[G.n - 1]) spotlight(lastX() - 8, 328, 90, spotA(2.4));
  if (G.podBub && G.winLine) bubble(G.podBub.x, G.podBub.y, G.winLine);
  if (G.lastBub) bubble(G.lastBub.x, G.lastBub.y, G.lastBub.t);
}
