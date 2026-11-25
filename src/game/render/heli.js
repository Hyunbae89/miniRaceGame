// 취재 헬기: 레이스 중에는 카메라가 따라가는 캐릭터를, 시작 전에는 마우스 x좌표를 따라 움직인다.
import { focusR } from "../camera.js";
import { GT, OFF } from "../constants.js";
import { TH } from "./background.js";
import { G } from "../state.js";
// 광고 현수막 그림(문구·색이 바뀔 때만 다시 그림): [AD] + 문구, 왼쪽 끝은 접어 박은 단
function adImage() {
  const ad = G.ad;
  if (!ad || !ad.text) return null;
  const key = ad.text + '|' + ad.bg + '|' + ad.fg + '|' + ad.accent;
  if (G.adImg && G.adImg.key === key) return G.adImg;
  const c = document.createElement('canvas'),
    x = c.getContext('2d'),
    font = 'bold 15px Jua,sans-serif';
  x.font = font;
  const w = Math.ceil(x.measureText(ad.text).width) + 52,
    h = 26;
  c.width = w;
  c.height = h;
  x.fillStyle = ad.bg;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = ad.accent;
  x.lineWidth = 2;
  x.strokeRect(1, 1, w - 2, h - 2);
  x.fillStyle = ad.accent;
  x.fillRect(5, 5, 24, h - 10);
  x.fillStyle = '#fff';
  x.font = 'bold 10px sans-serif';
  x.textAlign = 'center';
  x.fillText('AD', 17, h / 2 + 3.5);
  x.fillStyle = ad.fg;
  x.font = font;
  x.textAlign = 'left';
  x.fillText(ad.text, 36, h / 2 + 5.5);
  G.adImg = { key, c, w, h };
  return G.adImg;
}
// 헬기 꼬리(tx, ty)에 줄로 매단 현수막. 6px 세로 조각마다 위아래로 흔들어 펄럭이게(매단 쪽은 덜, 끝으로 갈수록 크게)
function towBanner(tx, ty, now, night) {
  const im = adImage();
  if (!im) return;
  const rx = tx - 24,
    top = ty + 8,
    amp = 5;
  G.ctx.strokeStyle = night ? 'rgba(220,225,230,.8)' : '#4b5863';
  G.ctx.lineWidth = 1.2;
  G.ctx.beginPath();
  G.ctx.moveTo(tx, ty);
  G.ctx.lineTo(rx, top + 1);
  G.ctx.moveTo(tx, ty);
  G.ctx.lineTo(rx, top + im.h - 1);
  G.ctx.stroke();
  G.ctx.save();
  if (night) G.ctx.globalAlpha = .9;
  for (let sx = im.w - 6; sx > -6; sx -= 6) {
    const k = (im.w - sx) / im.w,
      dy = Math.sin(now * 7 - (im.w - sx) * .055) * amp * k;
    G.ctx.drawImage(im.c, Math.max(0, sx), 0, 6 + Math.min(0, sx), im.h, rx - (im.w - Math.max(0, sx)), top + dy, 6 + Math.min(0, sx), im.h);
  }
  G.ctx.restore();
}
// 헬기 x 이동 범위: 현수막이 왼쪽 화면 밖으로 나가지 않도록 최소값을 현수막 길이만큼
function heliMinX() {
  const im = adImage();
  return im ? Math.min(G.W * .55, im.w + 80) : 50;
}
// 헬기: 시작 전에는 캔버스 위 마우스 x를 따라감(캔버스 밖으로 나가면 마지막 위치에서 제자리 비행)
export function drawHeli() {
  const f = G.state === 'idle' ? null : focusR(),
    now = performance.now() / 1000,
    panel = 144 + 30,
    night = TH().night;
  let tx;
  const minX = heliMinX();
  if (G.state === 'idle') tx = Math.max(minX, Math.min(G.W - 50, G.heliMX ?? G.W * .45));else tx = f ? Math.max(minX, Math.min(G.W - panel, f.x - G.camX + OFF + 70)) : G.W * .45;
  if (!G.heli.x) G.heli.x = tx;
  G.heli.x += (tx - G.heli.x) * Math.min(1, G.fdt * (G.state === 'idle' ? 3 : 1.5));
  const x = G.heli.x,
    y = 92 + Math.sin(now * 1.3) * 4,
    tilt = Math.max(-.25, Math.min(.25, (tx - x) * .004));
  G.heli.y = y;
  if (f && (G.state === 'run' || G.state === 'replay' || G.state === 'count')) {
    const px = f.x - G.camX + OFF,
      py = GT + 16 + f.d - (f.h || 0);
    G.ctx.fillStyle = night ? 'rgba(255,240,180,.3)' : 'rgba(255,236,160,.16)';
    G.ctx.beginPath();
    G.ctx.moveTo(x - 4, y + 9);
    G.ctx.lineTo(x + 4, y + 9);
    G.ctx.lineTo(px + 26, py + 6);
    G.ctx.lineTo(px - 26, py + 6);
    G.ctx.closePath();
    G.ctx.fill();
  }
  const rot = .06 + tilt + Math.sin(now * 1.3) * .02;
  // 꼬리 끝(-42, -2)을 화면 좌표로 바꿔 광고 현수막을 매닮
  towBanner(x - 42 * Math.cos(rot) + 2 * Math.sin(rot), y - 42 * Math.sin(rot) - 2 * Math.cos(rot), now, night);
  G.ctx.save();
  G.ctx.translate(x, y);
  G.ctx.rotate(rot);
  G.ctx.strokeStyle = '#4b5863';
  G.ctx.lineWidth = 2;
  G.ctx.beginPath();
  G.ctx.moveTo(-14, 12);
  G.ctx.lineTo(14, 12);
  G.ctx.moveTo(-8, 8);
  G.ctx.lineTo(-9, 12);
  G.ctx.moveTo(8, 8);
  G.ctx.lineTo(9, 12);
  G.ctx.stroke();
  G.ctx.fillStyle = '#f4f6f8';
  G.ctx.beginPath();
  G.ctx.moveTo(-14, -2);
  G.ctx.lineTo(-42, -4);
  G.ctx.lineTo(-42, 1);
  G.ctx.lineTo(-14, 4);
  G.ctx.fill();
  G.ctx.fillStyle = '#e4572e';
  G.ctx.beginPath();
  G.ctx.arc(-42, -2, 4 + Math.sin(now * 40) * .5, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#f4f6f8';
  G.ctx.beginPath();
  G.ctx.ellipse(0, 0, 17, 10, 0, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#1f6fb2';
  G.ctx.fillRect(-15, 1, 30, 3);
  G.ctx.fillStyle = '#8fd3f4';
  G.ctx.beginPath();
  G.ctx.ellipse(9, -2, 7, 6, 0, -Math.PI / 2, Math.PI / 2);
  G.ctx.fill();
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.font = 'bold 6px sans-serif';
  G.ctx.textAlign = 'center';
  G.ctx.fillText('NEWS', -4, -2);
  G.ctx.fillStyle = '#4b5863';
  G.ctx.fillRect(-1.5, -14, 3, 5);
  if (night && now % 1 < .5) {
    G.ctx.fillStyle = '#ff4d4d';
    G.ctx.beginPath();
    G.ctx.arc(0, 10, 2, 0, 7);
    G.ctx.fill();
    G.ctx.beginPath();
    G.ctx.arc(-42, -6, 1.6, 0, 7);
    G.ctx.fill();
  }
  const rw = 26 * Math.abs(Math.cos(now * 30));
  G.ctx.strokeStyle = 'rgba(40,50,60,.75)';
  G.ctx.lineWidth = 2.4;
  G.ctx.beginPath();
  G.ctx.moveTo(-rw, -14);
  G.ctx.lineTo(rw, -14);
  G.ctx.stroke();
  G.ctx.restore();
}
