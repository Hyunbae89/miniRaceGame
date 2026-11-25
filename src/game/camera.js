import { OFF, TRACK } from "./constants.js";
import { push } from "./engine.js";
import { G } from "./state.js";
// 카메라·헬기가 따라가는 캐릭터: 아직 도착하지 않은 선두. 모두 도착했으면 마지막 도착자
export function focusR() {
  let f = null;
  for (const r of G.racers) if (!r.fin && (!f || r.x > f.x)) f = r;
  return f || G.fin[G.fin.length - 1] || null;
}
export function updateCam(dt) {
  if (G.manual) {
    G.camX += (G.mt - G.camX) * Math.min(1, dt * 10);
    return;
  }
  const f = focusR(),
    lead = f ? Math.min(f.x, TRACK) : 0;
  const t = Math.max(0, Math.min(lead - G.W * .58, TRACK - G.W * .75));
  G.camX += (t - G.camX) * Math.min(1, dt * 6);
}
// 지도(화면 위쪽 막대)를 누르거나 끌면 그 비율 위치로 이동
export function seek(e) {
  const b = G.cv.getBoundingClientRect(),
    x = (e.clientX - b.left) * G.W / b.width;
  const f = Math.max(0, Math.min(1, (x - 70) / (G.W - 130)));
  G.mt = Math.max(0, Math.min(TRACK - G.W * .75, f * TRACK - G.W / 2 + OFF));
  G.manual = true;
  push();
}
// 레이스 중 캔버스 직접 조작: 누르면 그 지점을 화면 가운데로, 누른 채 끌면 잡아끌듯 이동, 떼면 자동 카메라로 복귀
const camMax = () => TRACK - G.W * .75;
const toCanvasX = (e) => { const b = G.cv.getBoundingClientRect(); return (e.clientX - b.left) * G.W / b.width; };
export function camDown(e) {
  const x = toCanvasX(e),
    wx = G.camX + x - OFF;
  G.mt = Math.max(0, Math.min(camMax(), wx + OFF - G.W / 2));
  G.grabX = x;
  G.manual = true;
  push();
}
export function camMove(e) {
  const x = toCanvasX(e);
  G.mt = Math.max(0, Math.min(camMax(), G.mt - (x - G.grabX)));
  G.grabX = x;
}
export function camUp() {
  if (!G.manual) return;
  G.manual = false;
  push();
}
