// 공유 상태: 게임 한 판(createGame 한 번)의 모든 가변 상태를 담는 객체.
// 모든 모듈이 G.x로 읽고 쓴다. createGame이 시작할 때 비우고 다시 채운다.
export const G = {};
