import { useEffect, useRef, useState } from 'react';
import { createGame } from './game/engine.js';
import './App.css';

const GENDERS = [['m', '남'], ['f', '여']];
const AGES = [['c', '어린이'], ['a', '성인'], ['e', '어르신']];

function Row({ pos, color, name, right }) {
  return (
    <li>
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
        <button className="sq" aria-label="인원 늘리기" disabled={v.locked || v.n >= 8} onClick={() => game().setN(v.n + 1)}>+</button>
      </div>
      <label>모드{' '}
        <select id="mode" value={v.mode} disabled={v.locked} onChange={e => game().setMode(e.target.value)}>
          <option value="normal">일반</option>
          <option value="item">아이템전</option>
        </select>
      </label>
      <label>응원{' '}
        <select id="pick" aria-label="응원할 캐릭터" value={v.pick} disabled={v.locked} onChange={e => game().setPick(Number(e.target.value))}>
          <option value={-1}>응원 안 함</option>
          {v.cfg.slice(0, v.n).map((c, i) => <option key={i} value={i}>{c.name}</option>)}
        </select>{' '}
        <select id="want" aria-label="원하는 순위" value={v.want} disabled={v.locked} onChange={e => game().setWant(e.target.value)}>
          <option value="first">1등 원함</option>
          <option value="last">꼴등 원함</option>
        </select>
      </label>
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
        <div className="nm" key={i}>
          <input type="color" value={c.color} aria-label={`${i + 1}번 옷 색`} onChange={e => game().setCfg(i, { color: e.target.value })} />
          <input className="t" defaultValue={c.name} maxLength={6} aria-label={`${i + 1}번 이름`}
            onChange={e => game().setCfg(i, { name: e.target.value.trim() || `${i + 1}번` })} />
          <select value={c.gender} aria-label={`${i + 1}번 성별`} onChange={e => game().setCfg(i, { gender: e.target.value })}>
            {GENDERS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
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
        {r.rank.length
          ? r.rank.map((x, i) => <Row key={i} {...x} />)
          : <li>완주한 캐릭터가 없습니다.</li>}
      </ol>
      {r.outs.length > 0 && (
        <>
          <p className="sub">탈락</p>
          <ul>{r.outs.map((x, i) => <Row key={i} pos="–" {...x} />)}</ul>
        </>
      )}
    </section>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [v, setV] = useState(null);
  const game = () => gameRef.current;

  useEffect(() => {
    const g = createGame(canvasRef.current, { onChange: setV });
    gameRef.current = g;
    return () => { g.destroy(); gameRef.current = null; };
  }, []);

  return (
    <div className="wrap">
      <h1>질주 레이스</h1>
      {v && <Controls v={v} game={game} />}
      {v && <Names v={v} game={game} />}
      <canvas ref={canvasRef} id="cv" width="960" height="420" aria-label="레이스 화면" />
      {v && v.result && <Result r={v.result} />}
    </div>
  );
}
