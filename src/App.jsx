import { useEffect, useRef, useState } from 'react';
import { createGame } from './game/engine.js';
import './App.css';

const GENDERS = [['m', '남'], ['f', '여']];
const AGES = [['c', '어린이'], ['a', '성인'], ['e', '어르신'], ['r', '로봇']];

function Row({ pos, color, name, right, hl }) {
  return (
    <li className={hl}>
      <span className="pos">{pos}</span>
      <span className="dot" style={{ background: color }} />
      <span>{name}</span>
      <span className="time">{right}</span>
    </li>
  );
}

function Controls({ v, game }) {
  const hidden = !v.canReplay;
  return (
    <div className="bar">
      <div className="stepper" role="group" aria-label="참가 인원">
        <span>참가 인원</span>
        <button className="sq" aria-label="인원 줄이기" disabled={v.locked || v.n <= 2} onClick={() => game().setN(v.n - 1)}>−</button>
        <span className="count" aria-live="polite">{v.n}</span>
        <button className="sq" aria-label="인원 늘리기" disabled={v.locked || v.n >= 20} onClick={() => game().setN(v.n + 1)}>+</button>
      </div>
      <label>모드{' '}
        <select id="mode" value={v.mode} disabled={v.locked} onChange={e => game().setMode(e.target.value)}>
          <option value="normal">일반</option>
          <option value="item">아이템전</option>
        </select>
      </label>
      <label>결과산출{' '}
        <select id="want" aria-label="결과산출 순위" value={v.want} disabled={v.locked} onChange={e => game().setWant(e.target.value)}>
          <option value="first">1등 원함</option>
          <option value="last">꼴등 원함</option>
        </select>
      </label>
      <button className="ghost" disabled={v.locked} onClick={() => game().shuffleLanes()}>🔀 자리 섞기</button>
      <label>맵{' '}
        <select id="map" value={v.map} disabled={v.locked} onChange={e => game().setMap(e.target.value)}>
          <option value="city-day">서울 도심 · 낮</option>
          <option value="city-night">서울 도심 · 밤</option>
          <option value="trad-day">전통 마을 · 낮</option>
          <option value="trad-night">전통 마을 · 밤</option>
        </select>
      </label>
      {v.lanes.some((s, i) => s !== i) && (
        <button className="ghost" disabled={v.locked} onClick={() => game().resetLanes()}>원래 자리</button>
      )}
      <button disabled={v.locked} onClick={() => game().start()}>{v.state === 'idle' ? '시작' : '다시 시작'}</button>
      <button className="ghost" onClick={() => game().reset()}>새로 하기</button>
      {!hidden && <button className="ghost" onClick={() => game().toggleReplay()}>{v.replaying ? '■ 리플레이 종료' : '▶ 리플레이'}</button>}
      {!hidden && <button className="ghost" disabled={v.busy} onClick={() => game().exportVideo()}>MP4 만들기</button>}
      {!hidden && <button className="ghost" disabled={v.busy} onClick={() => game().exportGif()}>GIF 만들기</button>}
      {v.file && <button onClick={() => game().saveReady()}>⬇ {v.file} 저장</button>}
      <button className="ghost" disabled={!v.manual} onClick={() => game().follow()}>자동 카메라</button>
      <span className="hint">{v.msg}</span>
    </div>
  );
}

function Names({ v, game }) {
  return (
    <div className="bar names" aria-label="캐릭터 이름">
      {v.cfg.slice(0, v.n).map((c, i) => (
        <div className="nm" key={i}
          onMouseEnter={() => game().setHover(i)} onMouseLeave={() => game().setHover(-1)}
          onFocus={() => game().setHover(i)} onBlur={() => game().setHover(-1)}>
          <span className="lane" title="출발 레인 (위에서부터)">{v.lanes[i] + 1}레인</span>
          <input type="color" value={c.color} aria-label={`${i + 1}번 옷 색`} onChange={e => game().setCfg(i, { color: e.target.value })} />
          <input className="t" key={`name-${c.age === 'r'}`} defaultValue={c.name} maxLength={c.age === 'r' ? 9 : 6} aria-label={`${i + 1}번 이름`}
            onChange={e => game().setCfg(i, { name: e.target.value.trim() || `${i + 1}번` })} />
          {c.age !== 'r' && (
            <select value={c.gender} aria-label={`${i + 1}번 성별`} onChange={e => game().setCfg(i, { gender: e.target.value })}>
              {GENDERS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          )}
          <select value={c.age} aria-label={`${i + 1}번 나이`} onChange={e => game().setCfg(i, { age: e.target.value })}>
            {AGES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function Result({ r }) {
  return (
    <section id="result" aria-live="polite">
      <h2>최종 순위</h2>
      {r.bet && <p className="sub">{r.bet}</p>}
      <ol>
        {r.rank.map((x, i) => {
          // 1등 원함: 1·2·3위 하이라이트, 꼴등 원함: 꼴찌만
          const hl = r.want === 'last'
            ? (i === r.rank.length - 1 ? 'hl-last' : undefined)
            : (i < 3 ? `hl-${i + 1}` : undefined);
          return <Row key={i} {...x} hl={hl} />;
        })}
      </ol>
    </section>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [v, setV] = useState(null);
  const game = () => gameRef.current;
  // 시작 전(idle)에는 커스터마이징 + 미리보기 캔버스, 시작하면 캔버스만
  const setup = !v || v.state === 'idle';

  useEffect(() => {
    const g = createGame(canvasRef.current, { onChange: setV });
    gameRef.current = g;
    return () => { g.destroy(); gameRef.current = null; };
  }, []);

  return (
    <div className="wrap">
      <h1>질주 레이스</h1>
      {v && <Controls v={v} game={game} />}
      {v && setup && <Names v={v} game={game} />}
      <canvas ref={canvasRef} id="cv" width="960" height="420" aria-label="레이스 화면" />
      {v && v.result && <Result r={v.result} />}
    </div>
  );
}
