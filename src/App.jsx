import { useEffect, useRef, useState } from 'react';
import { createGame } from './game/engine.js';
import './App.css';

const TITLE = '미니 레이스 토너먼트';
const GENDERS = [['m', '남'], ['f', '여']];
const AGES = [['c', '어린이'], ['a', '성인'], ['e', '어르신'], ['r', '로봇']];
const MODES = [['normal', '일반'], ['item', '아이템전']];
const WANTS = [['first', '1등 원함'], ['last', '꼴등 원함']];

// 참가자 구성(인원·이름·색·성별·종류)을 한 줄 문자열로: 최종 결정 뒤 바뀌었는지 비교용
const rosterSig = (v) => v.n + '|' + v.cfg.slice(0, v.n).map((c) => [c.name, c.color, c.gender, c.age].join(',')).join('|');

// 버튼 여러 개 중 하나를 고르는 선택 상자
function Seg({ label, value, options, onChange, disabled, small }) {
  return (
    <div className={'seg' + (small ? ' small' : '')} role="radiogroup" aria-label={label}>
      {options.map(([k, t]) => (
        <button type="button" key={k} role="radio" aria-checked={value === k} className={value === k ? 'on' : ''}
          disabled={disabled} onClick={() => onChange(k)}>{t}</button>
      ))}
    </div>
  );
}

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

// 왼쪽: 참가 인원
function CountPanel({ v, game }) {
  return (
    <section className="panel count-panel" aria-labelledby="count-h">
      <h2 id="count-h" className="eyebrow">참가 인원</h2>
      <div className="count-big" aria-live="polite"><strong>{v.n}</strong><span>명</span></div>
      <div className="count-btns">
        <button type="button" className="sq" aria-label="인원 줄이기" disabled={v.n <= 2} onClick={() => game().setN(v.n - 1)}>−</button>
        <button type="button" className="sq" aria-label="인원 늘리기" disabled={v.n >= 20} onClick={() => game().setN(v.n + 1)}>+</button>
      </div>
      <p className="note">2~20명</p>
    </section>
  );
}

// 오른쪽: 경기 설정(모드·결과산출·맵) + 시작
function RulesPanel({ v, game, onStart, confirmed }) {
  const [place, time] = v.map.split('-');
  return (
    <section className="panel rules-panel" aria-labelledby="rules-h">
      <h2 id="rules-h" className="eyebrow">경기 설정</h2>
      <div className="rules">
        <div className="field">
          <span className="label">모드</span>
          <Seg label="모드" value={v.mode} options={MODES} onChange={(m) => game().setMode(m)} />
        </div>
        <div className="field">
          <span className="label">결과산출</span>
          <Seg label="결과산출" value={v.want} options={WANTS} onChange={(w) => game().setWant(w)} />
        </div>
        <div className="field">
          <span className="label">맵</span>
          <div className="map-pick">
            <Seg label="맵 장소" value={place} options={[['city', '서울 도심'], ['trad', '전통 마을']]} onChange={(p) => game().setMap(p + '-' + time)} />
            <Seg label="시간대" value={time} options={[['day', '☀ 낮'], ['night', '☾ 밤']]} onChange={(t) => game().setMap(place + '-' + t)} />
          </div>
        </div>
      </div>
      <button type="button" className={'start-big' + (confirmed ? '' : ' locked')} onClick={onStart}>
        {confirmed ? '▶ 경기 시작' : '🔒 경기 시작'}
      </button>
    </section>
  );
}

// 참가자 카드 목록 + 최종 결정
function Roster({ v, game, editing, setEditing, confirmed, onConfirm, confirmRef }) {
  const shuffled = v.lanes.some((s, i) => s !== i);
  // 캔버스 강조: 마우스를 올린 카드, 없으면 입력 중(포커스)인 카드
  const focused = useRef(-1);
  const show = (i) => game().setHover(i);
  return (
    <section className="panel roster" aria-labelledby="roster-h">
      <div className="roster-head">
        <h2 id="roster-h" className="eyebrow">참가자 {v.n}명</h2>
        <div className="roster-tools">
          <button type="button" className="ghost" onClick={() => game().shuffleLanes()}>🔀 자리 섞기</button>
          {shuffled && <button type="button" className="ghost" onClick={() => game().resetLanes()}>원래 자리</button>}
        </div>
      </div>
      <div className="cards" onMouseLeave={() => show(focused.current)}>
        {v.cfg.slice(0, v.n).map((c, i) => (
          <div key={i} className={'card' + (editing === i ? ' editing' : '')}
            onMouseEnter={() => show(i)}
            onFocus={() => { focused.current = i; setEditing(i); show(i); }}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { focused.current = -1; show(-1); } }}
            onClick={() => setEditing(i)}>
            <div className="card-top">
              <span className="num">{i + 1}</span>
              <span className="lane" title="출발 레인(위에서부터)">{v.lanes[i] + 1}레인</span>
              {editing === i && <span className="tag">편집 중</span>}
            </div>
            <div className="card-main">
              <input type="color" className="swatch" value={c.color} aria-label={`${i + 1}번 옷 색`} onChange={(e) => game().setCfg(i, { color: e.target.value })} />
              <input className="name" key={`name-${c.age === 'r'}`} defaultValue={c.name} maxLength={c.age === 'r' ? 9 : 6} aria-label={`${i + 1}번 이름`}
                onChange={(e) => game().setCfg(i, { name: e.target.value.trim() || `${i + 1}번` })} />
            </div>
            <Seg small label={`${i + 1}번 종류`} value={c.age} options={AGES} onChange={(a) => game().setCfg(i, { age: a })} />
            {c.age !== 'r' && <Seg small label={`${i + 1}번 성별`} value={c.gender} options={GENDERS} onChange={(g) => game().setCfg(i, { gender: g })} />}
          </div>
        ))}
      </div>
      <div className="roster-foot">
        <p className={'status' + (confirmed ? ' ok' : '')} aria-live="polite">
          {confirmed ? '✓ 참가자 구성이 확정됐습니다. 경기를 시작할 수 있어요.' : '이름과 종류를 확인한 뒤 최종 결정을 눌러 주세요.'}
        </p>
        <button type="button" ref={confirmRef} className={'confirm' + (confirmed ? ' done' : ' pulse')} onClick={onConfirm} disabled={confirmed}>
          {confirmed ? '✓ 결정 완료' : '최종 결정'}
        </button>
      </div>
    </section>
  );
}

// 레이스 중·후 조작
function RaceBar({ v, game }) {
  const done = v.canReplay;
  return (
    <div className="race-bar">
      <span className="hint">{v.msg}</span>
      {!v.locked && <button type="button" onClick={() => game().start()}>다시 시작</button>}
      {!v.locked && <button type="button" className="ghost" onClick={() => game().reset()}>새로 하기</button>}
      {done && <button type="button" className="ghost" onClick={() => game().toggleReplay()}>{v.replaying ? '■ 리플레이 종료' : '▶ 리플레이'}</button>}
      {done && <button type="button" className="ghost" disabled={v.busy} onClick={() => game().exportVideo()}>MP4 만들기</button>}
      {done && <button type="button" className="ghost" disabled={v.busy} onClick={() => game().exportGif()}>GIF 만들기</button>}
      {v.file && <button type="button" onClick={() => game().saveReady()}>⬇ {v.file} 저장</button>}
      {v.manual && <button type="button" className="ghost" onClick={() => game().follow()}>자동 카메라</button>}
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

// 최종 결정 전에 시작을 누르면 뜨는 안내 창
function Notice({ onClose, onGo }) {
  const okRef = useRef(null);
  useEffect(() => {
    okRef.current?.focus();
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="notice-h" aria-describedby="notice-p" onClick={(e) => e.stopPropagation()}>
        <h2 id="notice-h">참가자를 먼저 확정해 주세요</h2>
        <p id="notice-p">참가자 목록 오른쪽 아래의 <strong>최종 결정</strong>을 누르면 경기를 시작할 수 있어요.</p>
        <div className="modal-btns">
          <button type="button" className="ghost" onClick={onClose}>닫기</button>
          <button type="button" ref={okRef} onClick={onGo}>최종 결정으로 이동</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const confirmRef = useRef(null);
  const [v, setV] = useState(null);
  const [editing, setEditing] = useState(0);
  const [confirmedSig, setConfirmedSig] = useState(null);
  const [notice, setNotice] = useState(false);
  const game = () => gameRef.current;
  // 시작 전(idle)에는 설정 + 미리보기 캔버스, 시작하면 캔버스와 레이스 조작만
  const setup = !v || v.state === 'idle';
  const confirmed = !!v && confirmedSig === rosterSig(v);

  useEffect(() => {
    const g = createGame(canvasRef.current, { onChange: setV });
    gameRef.current = g;
    return () => { g.destroy(); gameRef.current = null; };
  }, []);
  // 인원이 줄어 편집 중 카드가 사라지면 첫 카드로
  useEffect(() => { if (v && editing >= v.n) setEditing(0); }, [v, editing]);

  const onStart = () => {
    if (!confirmed) { setNotice(true); return; }
    game().setHover(-1);
    game().start();
  };
  const goConfirm = () => {
    setNotice(false);
    confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    confirmRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="wrap">
      <header className="top">
        <h1>{TITLE}</h1>
        <p className="tagline">참가자를 정하고 출발! 1등과 꼴등은 누가 될까요?</p>
      </header>
      {v && setup && (
        <>
          <div className="setup">
            <CountPanel v={v} game={game} />
            <RulesPanel v={v} game={game} onStart={onStart} confirmed={confirmed} />
          </div>
          <Roster v={v} game={game} editing={editing} setEditing={setEditing}
            confirmed={confirmed} onConfirm={() => setConfirmedSig(rosterSig(v))} confirmRef={confirmRef} />
        </>
      )}
      {v && !setup && <RaceBar v={v} game={game} />}
      <div className="stage">
        <canvas ref={canvasRef} id="cv" width="960" height="420" aria-label="레이스 화면" />
        {v && setup && (
          <button type="button" className={'stage-start' + (confirmed ? '' : ' locked')} onClick={onStart}>
            {confirmed ? '▶ 시작' : '🔒 시작'}
          </button>
        )}
      </div>
      {v && v.result && <Result r={v.result} />}
      {notice && <Notice onClose={() => setNotice(false)} onGo={goConfirm} />}
    </div>
  );
}
