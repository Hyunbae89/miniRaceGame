# 질주 레이스

횡스크롤 레이싱 게임 (React + Vite).

- 일반 모드 / 아이템전, 캐릭터 커스터마이징(이름·옷 색·성별·나이), 밀치기·잡아당기기
- 1~3등 슬로우 모션, 시상식, 리플레이, GIF/MP4 저장

## 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # dist/ 에 정적 파일 생성
npm run preview  # 빌드 결과 미리보기
```

`dist/` 는 정적 파일이라 어떤 정적 호스팅에도 올릴 수 있습니다.
`dist/index.html` 을 파일로 직접 열면 브라우저가 모듈 스크립트를 막으므로, 반드시 서버나 호스팅을 통해 여세요.

## 구조

```
src/
  App.jsx          UI (컨트롤, 캐릭터 설정, 결과 목록)
  App.css          스타일
  main.jsx         진입점
  game/engine.js   캔버스 게임 엔진 (createGame(canvas, { onChange }))
```

엔진은 React와 분리되어 있고, `createGame` 이 돌려주는 메서드(`start`, `reset`, `setN`, `setMode`, `setCfg`,
`setPick`, `setWant`, `toggleReplay`, `exportGif`, `exportVideo`, `saveReady`, `follow`, `destroy`)로 조작하며,
상태 변화는 `onChange` 콜백으로 받습니다.

## 배포 (GitHub Pages)

저장소 Settings → Pages 에서 Source 를 "GitHub Actions" 로 두고 `main` 에 push 하면
`.github/workflows/deploy.yml` 이 자동으로 빌드·배포합니다.
