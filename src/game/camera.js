// 카메라: 자동으로 아직 도착하지 않은 1위를 따라가고, 지도 드래그로 수동 이동.
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
export function seek(e) {
  const b = G.cv.getBoundingClientRect(),
    x = (e.clientX - b.left) * G.W / b.width;
  const f = Math.max(0, Math.min(1, (x - 70) / (G.W - 130)));
  G.mt = Math.max(0, Math.min(TRACK - G.W * .75, f * TRACK - G.W / 2 + OFF));
  G.manual = true;
  push();
}
