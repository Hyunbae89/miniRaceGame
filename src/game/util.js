// 공통 도구: 난수, 섞기, 보간, 색 계산, 그리기 보조(둥근 사각형·글자 맞춤).
import { G } from "./state.js";
// a 이상 b 미만의 무작위 실수
export function R(a, b) {
  return a + Math.random() * (b - a);
}
// 배열을 제자리에서 무작위로 섞음(Fisher–Yates)
export function shuffle(a) {
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}
// 천천히 시작해 천천히 끝나는 곡선(0~1 → 0~1)
export const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export function lerp(a, b, w) {
  return a + (b - a) * w;
}
export function shade(hex, f) {
  const v = parseInt(hex.slice(1), 16),
    ch = s => Math.round((v >> s & 255) * (1 - f));
  return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')';
}
// 정수 i로 0~1 사이의 고정된 값을 만듦(배경 건물·시민 배치가 매 프레임 같도록)
export function hsh(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
export function ink(c) {
  const v = parseInt(c.slice(1), 16);
  return (v >> 16) * .299 + (v >> 8 & 255) * .587 + (v & 255) * .114 > 150 ? '#1e2b33' : '#fff';
}
export function rr(x, y, w, h, r) {
  G.ctx.beginPath();
  G.ctx.moveTo(x + r, y);
  G.ctx.arcTo(x + w, y, x + w, y + h, r);
  G.ctx.arcTo(x + w, y + h, x, y + h, r);
  G.ctx.arcTo(x, y + h, x, y, r);
  G.ctx.arcTo(x, y, x + w, y, r);
  G.ctx.closePath();
}
// 폭에 맞게 글자 크기를 줄여 가운데 정렬로 씀
export function fitText(t, x, y, size, maxW) {
  G.ctx.textAlign = 'center';
  G.ctx.font = size + 'px Jua,sans-serif';
  const w = G.ctx.measureText(t).width;
  if (w > maxW) G.ctx.font = Math.max(10, Math.floor(size * maxW / w)) + 'px Jua,sans-serif';
  G.ctx.fillText(t, x, y);
}
