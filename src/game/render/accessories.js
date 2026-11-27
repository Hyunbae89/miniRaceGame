// 장신구 그리기(모션 실험실에서 모양을 확인한 것). 좌표는 캐릭터 몸 기준이고, 흔들림은 시간·스프링 값만 써서 게임 난수를 쓰지 않음
import { G } from "../state.js";
import { rr, shade } from "../util.js";
function poly(pts) {
  G.ctx.beginPath();
  G.ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) G.ctx.lineTo(p[0], p[1]);
  G.ctx.closePath();
  G.ctx.fill();
}
// 모자: 머리 회전 안에서 그림(머리 중심 (0,-42), 반지름 8.5, 얼굴은 +x). s = 비니 방울 흔들림
export function hat(k, col, s) {
  const c = G.ctx;
  c.save();
  c.translate(0, -2);
  if (k === 'cap') {
    c.fillStyle = col;
    c.beginPath();
    c.arc(0, -44, 9.4, Math.PI, 0);
    c.fill();
    c.fillStyle = shade(col, .25);
    rr(3, -45.5, 10, 2.4, 1.2);
    c.fill();
    c.fillStyle = shade(col, .35);
    c.beginPath();
    c.arc(0, -53.2, 1.2, 0, 7);
    c.fill();
  } else if (k === 'beanie') {
    c.fillStyle = col;
    c.beginPath();
    c.arc(0, -44, 9.6, Math.PI, 0);
    c.fill();
    c.fillStyle = shade(col, .22);
    rr(-9.8, -46, 19.6, 4, 2);
    c.fill();
    c.strokeStyle = shade(col, .22);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, -53);
    c.lineTo(-s * .6, -55.5 + s);
    c.stroke();
    c.fillStyle = '#f4f1ea';
    c.beginPath();
    c.arc(-s * .6, -56 + s, 2.8, 0, 7);
    c.fill();
  } else if (k === 'goggle') {
    // 가죽 비행 모자 위에 놋쇠 테 둥근 고글
    c.fillStyle = col;
    c.beginPath();
    c.arc(0, -43.5, 9.8, Math.PI * .95, Math.PI * 2.02);
    c.fill();
    c.fillStyle = '#3b2f2a';
    rr(-9.4, -50.2, 13, 2.4, 1.1);
    c.fill();
    for (const [x, dk] of [[2.4, 1], [6.9, 0]]) {
      c.fillStyle = dk ? '#8a6d1f' : '#c9a227';
      c.beginPath();
      c.arc(x, -50.6, 2.9, 0, 7);
      c.fill();
      c.fillStyle = dk ? 'rgba(90,150,190,.9)' : 'rgba(130,210,255,.95)';
      c.beginPath();
      c.arc(x, -50.6, 1.9, 0, 7);
      c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.fillRect(6.1, -51.6, .9, .9);
  }
  c.restore();
}
// 신발: 다리 하나(무릎 kx,ky · 발 ex,ey · 발 각도 a). 뒤쪽 다리는 어둡게
export function shoe(k, col, kx, ky, ex, ey, a, back) {
  const c = G.ctx,
    cc = back ? shade(col, .3) : col;
  if (k === 'boot') {
    c.strokeStyle = cc;
    c.lineWidth = 6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(kx + (ex - kx) * .55, ky + (ey - ky) * .55);
    c.lineTo(ex, ey);
    c.stroke();
  }
  c.fillStyle = cc;
  c.beginPath();
  c.ellipse(ex + 1.8, ey - .3, 5.2, 2.5, a, 0, 7);
  c.fill();
  c.save();
  c.translate(ex + 1.8, ey);
  c.rotate(a);
  c.fillStyle = k === 'boot' ? shade(col, .5) : '#f4f1ea';
  c.fillRect(-5, 1, 10.6, 1.4);
  c.restore();
}
// 어르신 지팡이: 앞손(hx,hy)에서 땅(gx,gy)까지. 손잡이 고리는 사람 쪽(-x)
export function cane(k, col, hx, hy, gx, gy) {
  const c = G.ctx,
    dx = gx - hx,
    dy = gy - hy,
    at = u => [hx + dx * u, hy + dy * u];
  c.lineCap = 'round';
  if (k === 'umbrella') {
    c.strokeStyle = '#2b2d42';
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(hx, hy);
    c.lineTo(gx, gy);
    c.stroke();
    c.beginPath();
    c.arc(hx - 1.7, hy, 1.7, 0, Math.PI, true);
    c.stroke();
    const [ax, ay] = at(.3),
      [bx, by] = at(.42),
      [tx, ty] = at(.9),
      n = Math.hypot(dx, dy) || 1,
      px = -dy / n,
      py = dx / n;
    c.fillStyle = col;
    poly([[ax, ay], [bx + px * 2.4, by + py * 2.4], [tx, ty], [bx - px * 2.4, by - py * 2.4]]);
    const [mx, my] = at(.5);
    c.fillStyle = shade(col, .3);
    c.beginPath();
    c.arc(mx, my, 1.2, 0, 7);
    c.fill();
    const [fx, fy] = at(.93);
    c.strokeStyle = '#c9d2d8';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(fx, fy);
    c.lineTo(gx, gy);
    c.stroke();
  } else if (k === 'gold') {
    c.strokeStyle = '#b8860b';
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(hx, hy);
    c.lineTo(gx, gy);
    c.stroke();
    c.strokeStyle = '#ffe07a';
    c.lineWidth = .8;
    c.beginPath();
    c.moveTo(hx + .5, hy);
    c.lineTo(gx + .5, gy);
    c.stroke();
    const [rx, ry] = at(.18);
    c.fillStyle = '#8a6508';
    c.fillRect(rx - 1.8, ry - .6, 3.6, 1.2);
    c.fillStyle = '#f2c94c';
    c.beginPath();
    c.arc(hx, hy - 2.6, 2.4, 0, 7);
    c.fill();
    c.fillStyle = '#fff6c8';
    c.beginPath();
    c.arc(hx - .7, hy - 3.3, .8, 0, 7);
    c.fill();
  } else {
    c.strokeStyle = '#6b4a2f';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(hx, hy);
    c.lineTo(gx, gy);
    c.stroke();
    c.beginPath();
    c.arc(hx - 1.8, hy, 1.8, 0, Math.PI, true);
    c.stroke();
    const [fx, fy] = at(.94);
    c.strokeStyle = '#1e2b33';
    c.lineWidth = 2.7;
    c.beginPath();
    c.moveTo(fx, fy);
    c.lineTo(gx, gy);
    c.stroke();
  }
}

// ---- 로봇 부품(robot.js의 좌표: 몸통 -34~-13, 머리 -53~-38) ----
// 안테나: 머리 꼭대기 (0,-53)에서. sw = 스프링 안테나 끝 흔들림
export function antenna(k, col, sw, now, joint) {
  const c = G.ctx;
  c.strokeStyle = joint;
  c.lineWidth = 1.3;
  if (k === 'spring') {
    c.beginPath();
    c.moveTo(0, -53);
    for (let i = 1; i <= 8; i++) {
      const u = i / 8;
      c.lineTo(sw * u * u + (i < 8 ? i % 2 ? 1.3 : -1.3 : 0), -53 - 10 * u);
    }
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.arc(sw, -64, 2.1, 0, 7);
    c.fill();
  } else {
    c.beginPath();
    c.moveTo(0, -53);
    c.lineTo(0, -56.5);
    c.stroke();
    c.save();
    c.translate(0, -58);
    c.rotate(-.5 + .3 * Math.sin(now * 1.4));
    c.fillStyle = '#dfe6ea';
    c.beginPath();
    c.ellipse(0, 0, 5.5, 2, 0, Math.PI, 0);
    c.fill();
    c.strokeStyle = joint;
    c.lineWidth = .7;
    c.stroke();
    c.lineWidth = .8;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -4);
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.arc(0, -4.3, 1, 0, 7);
    c.fill();
    c.restore();
  }
}
// 등 장착물: 몸통 뒤. 제트팩은 달릴 때 불꽃, 코어 탱크는 눈 색 액체가 출렁이고 기포가 올라감
export function backUnit(k, r, sp, run, now, joint) {
  const c = G.ctx;
  if (k === 'jet') {
    if (run) {
      const fl = 3.5 + 2 * Math.sin(now * 40);
      for (const x of [-14.2, -10.8]) {
        c.fillStyle = '#ffb02e';
        poly([[x - 1.6, -18.5], [x + 1.6, -18.5], [x, -18.5 + fl]]);
        c.fillStyle = '#fff3c4';
        poly([[x - .7, -18.5], [x + .7, -18.5], [x, -18.5 + fl * .5]]);
      }
    }
    c.fillStyle = joint;
    rr(-16.5, -33, 4.6, 15, 2.2);
    c.fill();
    rr(-13, -33, 4.6, 15, 2.2);
    c.fill();
    c.fillStyle = shade(joint, .35);
    c.fillRect(-16.5, -19.6, 8.1, 1.6);
  } else if (k === 'tank') {
    const x = -19,
      y = -38,
      tw = 10,
      top = y + 3,
      bot = y + 18,
      lvl = bot - (bot - top) * .68,
      tilt = Math.max(-3, Math.min(3, sp * 5)) + (run ? .7 * Math.sin(now * 9) : 0);
    c.strokeStyle = joint;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x + tw - 1, bot - 2);
    c.quadraticCurveTo(x + tw + 3, bot + 2, -6, -19);
    c.stroke();
    c.save();
    rr(x, top, tw, bot - top, 2);
    c.clip();
    c.fillStyle = 'rgba(210,240,230,.28)';
    c.fillRect(x, top, tw, bot - top);
    c.fillStyle = r.eye;
    c.beginPath();
    c.moveTo(x, lvl + tilt);
    c.lineTo(x + tw, lvl - tilt);
    c.lineTo(x + tw, bot);
    c.lineTo(x, bot);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)';
    for (let i = 0; i < 4; i++) {
      const u = (now * .6 + i * .27) % 1;
      c.beginPath();
      c.arc(x + 2 + i * 3.7 % 6, bot - 1 + (lvl + 2 - bot) * u, .6 + .4 * u, 0, 7);
      c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.fillRect(x + 1.5, top + 1, 1.2, bot - top - 2);
    c.restore();
    c.fillStyle = joint;
    rr(x - .8, y, tw + 1.6, 3.4, 1.2);
    c.fill();
    rr(x - .8, bot - .4, tw + 1.6, 3.4, 1.2);
    c.fill();
    c.fillStyle = r.eye;
    c.fillRect(x + tw / 2 - 1.5, y + .8, 3, 1.2);
  }
}
// 경고 띠: 목에 두른 줄무늬 띠 + 앞에 매달려 흔들리는 삼각 푯말
export function hazard(col, sp, spd) {
  const c = G.ctx,
    a = Math.max(-.9, Math.min(.9, sp * .5 - .25 * spd));
  c.lineWidth = 3;
  c.strokeStyle = col;
  c.beginPath();
  c.ellipse(0, -35.5, 7, 2, 0, 0, 7);
  c.stroke();
  c.setLineDash([1.6, 1.6]);
  c.strokeStyle = '#1e2b33';
  c.stroke();
  c.setLineDash([]);
  c.save();
  c.translate(5, -34.6);
  c.rotate(a);
  c.fillStyle = '#1e2b33';
  poly([[0, 1.6], [4.4, 9.4], [-4.4, 9.4]]);
  c.fillStyle = col;
  poly([[0, 2.9], [3.3, 8.6], [-3.3, 8.6]]);
  c.fillStyle = '#1e2b33';
  c.fillRect(-.35, 4.6, .7, 2.3);
  c.fillRect(-.35, 7.3, .7, .7);
  c.restore();
}
// 로봇 발: 다리 끝(ex,ey). 발가락 = 앞 2 + 뒤 1(발을 들면 오므림), 역관절 = 발바닥 판 + 발톱 + 뒤꿈치 받침
export function robotFoot(k, ex, ey, curl, col, plate) {
  const c = G.ctx,
    claw = '#dfe6ea';
  if (k === 'toe') {
    for (const [dx, cc] of [[6, shade(col, .25)], [8.5, col], [-5, col]]) {
      const tx = ex + dx * (1 - .3 * curl),
        ty = ey + 1.8 + 1.5 * curl,
        s = Math.sign(dx);
      c.strokeStyle = cc;
      c.lineWidth = 2.3;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(ex, ey - .6);
      c.lineTo(ex + dx * .55, ey - .4 - .8 * curl);
      c.lineTo(tx, ty);
      c.stroke();
      c.fillStyle = claw;
      poly([[tx - .2 * s, ty - 1.1], [tx + 2.2 * s, ty + .3], [tx - .2 * s, ty + .6]]);
    }
    c.fillStyle = plate;
    c.beginPath();
    c.arc(ex, ey - 1.2, 2.5, 0, 7);
    c.fill();
  } else {
    c.save();
    c.translate(ex, ey);
    c.rotate(curl * .35);
    c.fillStyle = col;
    rr(-3, -.4, 10.5, 2.6, 1.2);
    c.fill();
    c.fillStyle = plate;
    rr(-1.4, -2.2, 6, 2.2, 1);
    c.fill();
    c.fillStyle = claw;
    poly([[7, -.2], [9.2, 1.3], [7, 2.2]]);
    c.fillStyle = col;
    poly([[-2.8, .2], [-4.6, 2.2], [-2, 2.2]]);
    c.fillStyle = plate;
    c.beginPath();
    c.arc(0, -1.6, 2.1, 0, 7);
    c.fill();
    c.restore();
  }
}
