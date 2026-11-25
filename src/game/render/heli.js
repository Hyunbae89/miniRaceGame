// 취재 헬기: 레이스 중에는 카메라가 따라가는 캐릭터를, 시작 전에는 마우스 x좌표를 따라 움직인다.
import { focusR } from "../camera.js";
import { GT, OFF } from "../constants.js";
import { TH } from "./background.js";
import { G } from "../state.js";
// 헬기: 시작 전에는 캔버스 위 마우스 x를 따라감(캔버스 밖으로 나가면 마지막 위치에서 제자리 비행)
export function drawHeli() {
  const f = G.state === 'idle' ? null : focusR(),
    now = performance.now() / 1000,
    panel = (G.n > 10 ? 332 : 172) + 30,
    night = TH().night;
  let tx;
  if (G.state === 'idle') tx = Math.max(50, Math.min(G.W - 50, G.heliMX ?? G.W * .45));else tx = f ? Math.max(110, Math.min(G.W - panel, f.x - G.camX + OFF + 70)) : G.W * .45;
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
  G.ctx.save();
  G.ctx.translate(x, y);
  G.ctx.rotate(.06 + tilt + Math.sin(now * 1.3) * .02);
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
