# 나는 누구? — 라이어 게임 웹앱

## 프로젝트 개요
친구들끼리 즐기는 "사람을 맞추는 라이어 게임" 웹앱.
제시어가 외부 단어가 아니라 **참여한 사람 중 한 명**인 것이 핵심.
웹앱(PWA) 형태로 모바일/데스크탑 모두 지원.

---

## 게임 룰

### 게임 준비
- 방장이 방 생성 → 링크 공유
- 참여자들 닉네임 입력 후 입장 (최소 4명 / 최대 10명)
- 방장이 시작 버튼 누르면 게임 시작
- 참여자 중 1명이 라이어로 랜덤 배정
- 제시어(타겟 인물)는 라이어 제외 전원에게 공개

### 힌트 라운드
- 순서대로 돌아가며 1인당 **5글자 이내** 한 마디 입력
- 내 차례에만 입력 가능, 제한시간 **30초**
- 시간 초과 시 자동으로 **기권 처리** 후 다음 사람으로 넘어감
- 이름 직접 언급 금지 (앱이 강제 — 입력 시 실시간 감지)
- 내 차례가 아닐 때는 **리액션 버튼**만 가능 (👀 😮 😂 🤔)
- 한 바퀴 끝나면 **리액션 집계 공개** 후 투표로 넘어감

### 라이어 화면 vs 시민 화면 (힌트 라운드)
- 시민: 상단에 제시어(초록) 표시 + 입력창 활성화
- 라이어: 상단에 "???"(핑크) 표시 + 입력창 활성화 (제시어 모름)
- 대기 중: 입력창 없음 + 리액션만 가능 + "XXX님이 입력 중" 표시

### 1차 투표
- 라이어라고 생각하는 사람에게 투표, 제한시간 **30초**
- 최다 득표자가 해명 기회 획득
- 동률이면 **20초 재투표**, 1명이 나올 때까지 반복

### 해명
- 지목된 사람만 **60초** 텍스트 입력으로 해명
- 나머지는 리액션 버튼만 가능

### 확정 투표
- 해명을 듣고 **죽이자 vs 살리자** 투표, 제한시간 **30초**
- **죽이자 우세 →** 지목된 사람이 라이어인지 확인
  - 라이어가 맞으면 → **제시어 맞힐 기회 부여 (30초)**
    - 맞히면 → 라이어 승
    - 틀리면 → 시민 승
  - 라이어가 아닌 사람이 죽으면 → **라이어 승** (제시어 공개)
- **살리자 우세 →** 다음 라운드 진행

### 종료 조건
- 최대 **2라운드**, 2라운드 안에 못 잡으면 라이어 승

### 타이머 정리
| 구간 | 시간 |
|------|------|
| 힌트 입력 (내 차례) | 30초 |
| 1차 투표 | 30초 |
| 동률 재투표 | 20초 |
| 해명 발언 | 60초 |
| 확정 투표 | 30초 |
| 제시어 맞히기 | 30초 |

> 모든 타이머는 서버(Socket.io)에서 관리. 클라이언트 타이머 금지.

---

## 화면 목록 (10개)

| # | 화면 | 설명 |
|---|------|------|
| ① | 홈 | 방 만들기 / 방 참여하기 |
| ② | 대기실 | 참여자 목록, 방 코드 공유, 방장 시작 버튼 |
| ③ | 역할 공개 | 라이어: 핑크 "???" / 시민: 초록 제시어 표시 |
| ④-A | 힌트 라운드 (시민 차례) | 제시어 보임 + 입력창 활성화 |
| ④-B | 힌트 라운드 (라이어 차례) | "???" + 입력창 활성화 |
| ④-C | 힌트 라운드 (대기) | 입력창 없음 + 리액션만 가능 |
| ⑤ | 리액션 집계 | 라운드 끝나고 힌트별 리액션 수 공개 |
| ⑥ | 1차 투표 | 인물 선택, 실시간 투표 현황 바 표시 |
| ⑦ | 해명 | 지목된 사람 텍스트 입력, 나머지 리액션 |
| ⑧ | 확정 투표 | 죽이자 vs 살리자, 실시간 투표 현황 |
| ⑨ | 제시어 맞히기 | 라이어 단독 텍스트 입력 |
| ⑩ | 결과 | 승패 + 라이어 공개 + 제시어 공개 + 다시하기 |

---

## 디자인 컨셉
- **몽글몽글한 느낌** — 캐치마인드 스타일
- 둥근 버블, 밝고 채도 높은 컬러, 통통 튀는 애니메이션
- 역할별 컬러 구분:
  - 시민: 초록(#E1F5EE / #085041)
  - 라이어: 핑크(#FBEAF0 / #72243E)
  - 투표: 빨강
  - 해명: 앰버
  - 공통 UI: 퍼플(#EEEDFE / #3C3489)
- 모바일 퍼스트, PWA (홈화면 추가 가능)
- 채팅 없음 — 힌트/리액션/투표/해명으로만 소통

---

## 기술 스택

| 영역 | 선택 |
|------|------|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript |
| PWA | next-pwa |
| 실시간 통신 | Socket.io |
| 백엔드 | Node.js + Express + Socket.io |
| 상태 저장 | Redis (Railway 내부 인스턴스) |
| Redis 클라이언트 | ioredis |
| 모노레포 | Turborepo |
| 배포 | Vercel (프론트) + Railway (백엔드 + Redis) |

---

## 폴더 구조

```
liar-game/
├── apps/
│   ├── web/                        # Next.js 프론트엔드
│   │   ├── app/
│   │   │   ├── page.tsx            # 홈 (방 만들기 / 참여)
│   │   │   └── room/
│   │   │       └── [roomId]/
│   │   │           └── page.tsx    # 게임 메인
│   │   ├── components/
│   │   │   ├── screens/            # 10개 화면 컴포넌트
│   │   │   │   ├── Lobby.tsx
│   │   │   │   ├── WaitingRoom.tsx
│   │   │   │   ├── RoleReveal.tsx
│   │   │   │   ├── HintRound.tsx
│   │   │   │   ├── ReactionSummary.tsx
│   │   │   │   ├── Vote.tsx
│   │   │   │   ├── Defense.tsx
│   │   │   │   ├── FinalVote.tsx
│   │   │   │   ├── GuessingWord.tsx
│   │   │   │   └── Result.tsx
│   │   │   └── ui/                 # 공통 컴포넌트
│   │   │       ├── Timer.tsx
│   │   │       ├── Avatar.tsx
│   │   │       ├── ReactionBar.tsx
│   │   │       └── BubbleButton.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts        # Socket.io 연결 훅
│   │   │   └── useTimer.ts         # 타이머 표시 훅 (서버 시간 기준)
│   │   ├── types/
│   │   │   └── game.ts             # 게임 타입 정의
│   │   └── public/
│   │       └── manifest.json       # PWA 설정
│   │
│   └── server/                     # Node.js 백엔드
│       ├── src/
│       │   ├── index.ts            # 서버 진입점
│       │   ├── socket/
│       │   │   ├── index.ts        # Socket.io 이벤트 등록
│       │   │   ├── room.ts         # 방 생성/참여/대기 이벤트
│       │   │   └── game.ts         # 게임 진행 이벤트
│       │   ├── game/
│       │   │   ├── GameManager.ts  # 게임 상태 관리
│       │   │   ├── RoomManager.ts  # 방 관리
│       │   │   └── TimerManager.ts # 서버 타이머 관리
│       │   └── redis/
│       │       └── client.ts       # Redis 연결
│       └── Dockerfile
├── packages/
│   └── shared/
│       └── types/
│           └── index.ts            # 프론트/백엔드 공유 타입
├── turbo.json
└── package.json
```

---

## Redis 데이터 구조

```typescript
// 방 상태 (TTL: 2시간)
room:{roomId} → {
  roomId: string,
  hostId: string,
  players: [
    { id: string, nickname: string, isReady: boolean }
  ],
  status: 'waiting' | 'playing' | 'finished',
  game: {
    liarId: string,
    keyword: string,         // 제시어 (타겟 인물 nickname)
    round: number,           // 현재 라운드 (1 or 2)
    phase: 'hint' | 'reactionSummary' | 'vote' | 'defense' | 'finalVote' | 'guessing' | 'result',
    turnOrder: string[],     // 힌트 순서 (player id 배열)
    currentTurnIndex: number,
    hints: [
      { playerId: string, text: string | null, reactions: { '👀': number, '😮': number, '😂': number, '🤔': number } }
    ],
    votes: { [voterId: string]: string },     // 1차 투표
    finalVotes: { [voterId: string]: 'kill' | 'save' },
    accusedId: string | null,  // 해명 대상
  }
}
```

---

## Socket.io 이벤트 목록

### 클라이언트 → 서버
```
create-room       { nickname }
join-room         { roomId, nickname }
start-game        { roomId }
submit-hint       { roomId, text }         // 빈 문자열이면 기권
submit-reaction   { roomId, emoji }
submit-vote       { roomId, targetId }
submit-defense    { roomId, text }
submit-final-vote { roomId, vote: 'kill' | 'save' }
submit-guess      { roomId, guess }
```

### 서버 → 클라이언트
```
room-updated      { players, status }
game-started      { role: 'liar' | 'citizen', keyword?: string, turnOrder }
turn-changed      { currentPlayerId, timeLeft }
hint-submitted    { playerId, text }       // 기권이면 text: null
reaction-updated  { playerId, reactions }
round-ended       { hints, reactions }     // 리액션 집계
vote-updated      { votes }
defense-started   { accusedId }
final-vote-updated { finalVotes }
guess-result      { correct: boolean }
game-over         { winner: 'liar' | 'citizen', liarId, keyword }
timer-tick        { timeLeft }
```

---

## 개발 순서

### Phase 1. 기반 세팅
1. Turborepo 모노레포 초기화
2. Next.js 14 + TypeScript + Tailwind 세팅
3. Node.js + Express + Socket.io 서버 세팅
4. 공유 타입 패키지 세팅
5. Railway Redis 연결 (로컬은 Docker로 Redis 띄우기)
6. 프론트-서버 Socket.io 연결 확인

### Phase 2. 방 시스템
7. 방 생성 / 방 참여 / 대기실
8. 링크 공유 기능
9. 방장 시작 버튼 + 인원 제한 (4~10명)

### Phase 3. 핵심 게임 로직
10. 라이어 랜덤 배정 + 역할 공개 화면
11. 힌트 라운드 (순서 관리 + 서버 타이머)
12. 기권 처리 (30초 초과 시 자동)
13. 이름 직접 언급 감지 + 차단
14. 리액션 실시간 처리 + 집계 화면

### Phase 4. 투표 & 판정
15. 1차 투표 + 동률 재투표
16. 해명 화면
17. 확정 투표 (죽이자/살리자)
18. 제시어 맞히기 + 결과 화면
19. 2라운드 로직

### Phase 5. 마무리
20. PWA 설정 (manifest.json, 홈화면 추가)
21. 모바일 UI 최적화
22. Railway 배포 (백엔드 + Redis)
23. Vercel 배포 (프론트)

---

## 주요 구현 주의사항

- **타이머는 반드시 서버에서 관리** — 클라이언트 타이머 사용 금지. `timer-tick` 이벤트로 클라이언트에 브로드캐스트.
- **이름 언급 감지** — 힌트 입력 시 참여자 닉네임 포함 여부 실시간 체크, 포함되면 제출 차단.
- **5글자 제한** — 클라이언트 maxlength + 서버 검증 이중 처리.
- **방 TTL** — Redis에 2시간 TTL 설정, 게임 종료 시 즉시 삭제.
- **재연결 처리** — 소켓 끊김 시 roomId + nickname으로 재연결 가능하게 처리.
- **모바일 퍼스트** — 모든 화면 375px 기준으로 설계.
