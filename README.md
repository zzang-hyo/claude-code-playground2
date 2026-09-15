# 2048

방향키(또는 모바일에서 스와이프)로 타일을 밀어 합치는 2048 퍼즐 게임입니다. 점수판, 최고점수 기록, 게임오버 시 이름 등록, 그리고 Firebase 기반 **실시간 랭킹보드**를 포함합니다. PWA로 만들어져 있어 폰 홈 화면에 앱처럼 추가할 수 있습니다.

## 빠른 시작

```bash
npm install
cp .env.example .env   # Firebase 설정값을 채워야 랭킹보드가 동작합니다 (SETUP.md 참고)
npm run dev
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 로컬 개발 서버 실행 |
| `npm test` | 게임 로직(`src/game/engine.js`) 유닛 테스트 실행 |
| `npm run build` | 배포용 정적 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run generate-icons` | PWA 아이콘 재생성 (`public/icons/`) |

## 프로젝트 구조

```
src/
├── game/engine.js        # 순수 2048 로직 (그리드, 이동/합치기, 승패 판정)
├── ui/                    # 보드 렌더링, 입력(키보드+터치), 점수바, 게임오버 모달
├── firebase/              # Firebase 초기화 + 랭킹 읽기/쓰기
└── leaderboard/           # 실시간 랭킹 화면
```

## 처음 설정하기 (Firebase + GitHub Pages 배포)

**[SETUP.md](./SETUP.md)** 에 Firebase 프로젝트 생성부터 GitHub Pages 배포, 폰에 앱으로 설치하는 방법까지 단계별로 정리되어 있습니다.
