import { G } from "../state.js";
import { rr } from "../util.js";
export function drawVeh(k, t) {
  G.ctx.lineWidth = 2;
  G.ctx.strokeStyle = '#1e2b33';
  G.ctx.fillStyle = '#1e2b33';
  const wob = Math.sin(t * 30) * 2;
  if (k === 'bike') {
    G.ctx.beginPath();
    G.ctx.arc(-11, -6, 6, 0, 7);
    G.ctx.arc(11, -6, 6, 0, 7);
    G.ctx.stroke();
    G.ctx.beginPath();
    G.ctx.moveTo(-11, -6);
    G.ctx.lineTo(-2, -18);
    G.ctx.lineTo(11, -6);
    G.ctx.moveTo(-2, -18);
    G.ctx.lineTo(8, -18);
    G.ctx.lineTo(11, -6);
    G.ctx.stroke();
  } else if (k === 'moto') {
    G.ctx.beginPath();
    G.ctx.arc(-12, -7, 7, 0, 7);
    G.ctx.arc(12, -7, 7, 0, 7);
    G.ctx.fill();
    G.ctx.fillStyle = '#c0392b';
    rr(-12, -20, 24, 11, 4);
    G.ctx.fill();
    G.ctx.fillStyle = '#f4c430';
    G.ctx.fillRect(12, -19, 4, 4);
  } else if (k === 'kick' || k === 'ekick') {
    G.ctx.fillStyle = k === 'ekick' ? '#2e86de' : '#7f8c8d';
    rr(-12, -5, 24, 4, 2);
    G.ctx.fill();
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.beginPath();
    G.ctx.arc(-10, -1, 3, 0, 7);
    G.ctx.arc(10, -1, 3, 0, 7);
    G.ctx.fill();
    G.ctx.beginPath();
    G.ctx.moveTo(9, -5);
    G.ctx.lineTo(8, -30);
    G.ctx.stroke();
    if (k === 'ekick') {
      G.ctx.fillStyle = '#f4c430';
      G.ctx.fillRect(-8, -9, 10, 4);
    }
  } else if (k === 'cart') {
    G.ctx.fillStyle = '#e67e22';
    rr(-16, -13, 32, 9, 4);
    G.ctx.fill();
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.beginPath();
    G.ctx.arc(-11, -3, 4.5, 0, 7);
    G.ctx.arc(11, -3, 4.5, 0, 7);
    G.ctx.fill();
  } else if (k === 'wheel') {
    G.ctx.beginPath();
    G.ctx.arc(-4, -10, 10, 0, 7);
    G.ctx.stroke();
    G.ctx.beginPath();
    G.ctx.arc(13, -3, 3, 0, 7);
    G.ctx.fill();
    G.ctx.fillStyle = '#34495e';
    G.ctx.fillRect(-10, -17, 14, 3);
    G.ctx.fillRect(-11, -31, 3, 15);
  } else if (k === 'jet') {
    G.ctx.fillStyle = '#7f8c8d';
    rr(-15, -38, 8, 17, 3);
    G.ctx.fill();
    G.ctx.fillStyle = '#ff9f1c';
    G.ctx.beginPath();
    G.ctx.moveTo(-14, -21);
    G.ctx.lineTo(-8, -21);
    G.ctx.lineTo(-11, -8 + wob);
    G.ctx.fill();
  }
}
