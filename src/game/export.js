// 리플레이를 GIF(직접 인코딩)·MP4/WebM으로 만들고 저장 버튼 제공.
import { push } from "./engine.js";
import { podiumEnd, podiumStep } from "./render/podium.js";
import { draw } from "./render/race.js";
import { applyFrame, endReplay, startReplay } from "./replay.js";
import { G } from "./state.js";
export function lzw(px) {
  const clear = 256,
    eoi = 257;
  let size = 9,
    next = 258;
  const dict = new Map(),
    buf = [];
  let cur = 0,
    bits = 0;
  const emit = c => {
    cur |= c << bits;
    bits += size;
    while (bits >= 8) {
      buf.push(cur & 255);
      cur >>= 8;
      bits -= 8;
    }
  };
  const bump = () => {
    if (next > (1 << size) - 1 && size < 12) size++;
  };
  emit(clear);
  let p = px[0];
  for (let i = 1; i < px.length; i++) {
    const c = px[i],
      key = p << 8 | c,
      e = dict.get(key);
    if (e !== undefined) {
      p = e;
      continue;
    }
    emit(p);
    if (next < 4096) {
      bump();
      dict.set(key, next++);
    } else {
      emit(clear);
      dict.clear();
      size = 9;
      next = 258;
    }
    p = c;
  }
  emit(p);
  bump();
  emit(eoi);
  if (bits > 0) buf.push(cur & 255);
  const out = [8];
  for (let i = 0; i < buf.length; i += 255) {
    const m = Math.min(255, buf.length - i);
    out.push(m);
    for (let k = 0; k < m; k++) out.push(buf[i + k]);
  }
  out.push(0);
  return out;
}
export function gifHeader(w, h) {
  const a = [71, 73, 70, 56, 57, 97, w & 255, w >> 8, h & 255, h >> 8, 0xF7, 0, 0];
  for (let i = 0; i < 256; i++) a.push(Math.round((i >> 5 & 7) * 255 / 7), Math.round((i >> 2 & 7) * 255 / 7), Math.round((i & 3) * 255 / 3));
  a.push(0x21, 0xFF, 11, 78, 69, 84, 83, 67, 65, 80, 69, 50, 46, 48, 3, 1, 0, 0, 0);
  return new Uint8Array(a);
}
export function gifFrame(px, w, h, cs) {
  const a = [0x21, 0xF9, 4, 0x04, cs & 255, cs >> 8, 0, 0, 0x2C, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0];
  return new Uint8Array(a.concat(lzw(px)));
}
// 저장 파일 이름: race-replay_연-월-일_시-분-초.확장자(파일을 만든 순간의 현지 시각)
export function fileName(ext) {
  const d = new Date(),
    p = n => String(n).padStart(2, '0');
  return 'race-replay_' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + '-' + p(d.getMinutes()) + '-' + p(d.getSeconds()) + '.' + ext;
}
export function offer(blob, name) {
  G.ready = {
    blob: blob,
    name: name
  };
  G.msg = '파일이 준비됐어요. 저장 버튼을 눌러 주세요.';
  push();
}
export function saveReady() {
  if (!G.ready) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(G.ready.blob);
  a.download = G.ready.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  G.msg = '저장했어요!';
  push();
}
// GIF 저장: 카운트다운(3·2·1)부터 레이스 끝까지 리플레이 프레임을, 이어서 시상식을 결과산출 조명이 끝나고 2초 뒤까지
// 0.1초 간격으로 직접 그려 담는다(폭 400px). 만드는 동안 G.exporting이 켜져 있어 메인 루프는 시간을 진행하지 않음
export async function exportGif() {
  if (G.state !== 'podium' || G.frames.length < 2) return;
  G.ready = null;
  startReplay();
  G.exporting = true;
  push();
  const GW = 400,
    GH = Math.round(G.cv.height * GW / G.W);
  const oc = document.createElement('canvas');
  oc.width = GW;
  oc.height = GH;
  const o = oc.getContext('2d', {
    willReadFrequently: true
  });
  const t0 = Math.min(0, G.frames[0].t),
    dur = G.frames[G.frames.length - 1].t + .3,
    pend = podiumEnd(),
    total = dur - t0 + pend,
    parts = [gifHeader(GW, GH)];
  let k = 0,
    cnt = 0;
  const shot = async done => {
    o.drawImage(G.cv, 0, 0, GW, GH);
    const d = o.getImageData(0, 0, GW, GH).data,
      ix = new Uint8Array(GW * GH);
    for (let i = 0, j = 0; j < ix.length; i += 4, j++) ix[j] = d[i] >> 5 << 5 | d[i + 1] >> 5 << 2 | d[i + 2] >> 6;
    parts.push(gifFrame(ix, GW, GH, 10));
    if (++cnt % 4 === 0) {
      G.msg = 'GIF 만드는 중… ' + Math.round(done / total * 100) + '%';
      push();
      await new Promise(r => setTimeout(r));
    }
  };
  // 1) 카운트다운(음수 시간)부터 레이스 끝까지
  for (let t = t0; t <= dur; t += .1) {
    if (G.state !== 'replay') {
      G.exporting = false;
      return;
    }
    while (k < G.frames.length - 1 && G.frames[k + 1].t <= t) k++;
    applyFrame(G.frames[k]);
    G.rp = t;
    draw();
    await shot(t - t0);
  }
  // 2) 시상식: 결과산출 조명이 끝나고 2초 뒤까지
  endReplay(true);
  for (let pt = 0; pt <= pend; pt += .1) {
    if (G.state !== 'podium') {
      G.exporting = false;
      return;
    }
    G.pt = pt;
    podiumStep(.1);
    draw();
    await shot(dur - t0 + pt);
  }
  parts.push(new Uint8Array([0x3B]));
  G.exporting = false;
  if (G.fin.length) G.msg = G.fin[0].name + '이(가) 우승했습니다!';
  offer(new Blob(parts, {
    type: 'image/gif'
  }), fileName('gif'));
}
export function exportVideo() {
  if (G.state !== 'podium' || G.frames.length < 2) return;
  if (!window.MediaRecorder || !G.cv.captureStream) {
    G.msg = '이 브라우저는 영상 녹화를 지원하지 않아요. GIF로 만들어 보세요.';
    push();
    return;
  }
  const mt = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
  if (!mt) {
    G.msg = '이 브라우저는 영상 녹화를 지원하지 않아요. GIF로 만들어 보세요.';
    push();
    return;
  }
  const ext = mt.indexOf('mp4') >= 0 ? 'mp4' : 'webm',
    chunks = [];
  const mr = new MediaRecorder(G.cv.captureStream(30), {
    mimeType: mt,
    videoBitsPerSecond: 4000000
  });
  mr.ondataavailable = e => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  mr.onstop = () => {
    G.rec = null;
    offer(new Blob(chunks, {
      type: mt.split(';')[0]
    }), fileName(ext));
    if (ext !== 'mp4') G.msg = 'MP4 녹화를 지원하지 않는 브라우저라 WebM으로 만들었어요. 저장 버튼을 눌러 주세요.';
    push();
  };
  G.ready = null;
  G.rec = mr;
  // 카운트다운부터 녹화하고, 리플레이가 끝나도 멈추지 않고 시상식(조명이 끝나고 2초 뒤)까지 이어 감
  G.fullRec = true;
  G.recPod = false;
  mr.start();
  startReplay();
  G.msg = '영상 녹화 중… 카운트다운부터 시상식까지 녹화합니다. 잠시 기다려 주세요.';
  push();
}
