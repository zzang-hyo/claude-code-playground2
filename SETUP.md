# 설정 가이드 (SETUP.md)

이 문서는 **사람이 직접 해야 하는** 1회성 설정 단계를 안내합니다. 코드는 이미 다 준비되어 있고, 아래 단계만 따라 하면 됩니다. 전부 무료입니다.

---

## A. Firebase 프로젝트 만들기 (실시간 랭킹보드용)

1. [Firebase 콘솔](https://console.firebase.google.com/)에 구글 계정으로 로그인 후 **프로젝트 추가**를 눌러 새 프로젝트를 만듭니다. (Google Analytics는 꺼도 됩니다.)
2. 프로젝트 개요 화면에서 **웹 아이콘(`</>`)** 을 클릭해 웹 앱을 추가합니다. 앱 닉네임은 아무거나(예: `2048-web`) 입력하고, "Firebase Hosting 설정"은 체크하지 않아도 됩니다.
3. 등록이 끝나면 `firebaseConfig` 객체가 화면에 표시됩니다. 아래처럼 생긴 값입니다:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef123456",
   };
   ```
   이 값들을 복사해두세요.
4. 왼쪽 메뉴에서 **빌드 → Firestore Database**로 이동해 **데이터베이스 만들기**를 클릭합니다. 위치는 가까운 지역(예: `asia-northeast3` 서울)을 선택하고, 처음엔 "테스트 모드"로 시작해도 됩니다(아래 5번에서 규칙을 다시 덮어씁니다).
5. Firestore 화면 상단의 **규칙(Rules)** 탭을 열고, 기존 내용을 지운 뒤 아래 규칙을 붙여넣고 **게시(Publish)** 를 누릅니다.

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /scores/{scoreId} {
         allow read: if true;
         allow create: if request.resource.data.keys().hasOnly(['name', 'score', 'timestamp'])
                       && request.resource.data.name is string
                       && request.resource.data.name.size() <= 20
                       && request.resource.data.score is number
                       && request.resource.data.score >= 0
                       && request.resource.data.score <= 200000;
         allow update, delete: if false;
       }
     }
   }
   ```

   > 로그인 기능이 없는 구조라 누구나 점수를 등록할 수 있습니다. 위 규칙은 "형식이 맞는 점수만 새로 추가 가능, 남의 점수는 수정/삭제 불가"로 제한해 최소한의 안전장치를 둔 것입니다. 나중에 어뷰징이 문제되면 익명 로그인(Anonymous Auth) 추가를 고려할 수 있습니다.

6. **로컬 개발용**: 이 프로젝트 루트의 `.env.example`을 복사해 `.env` 파일을 만들고, 3번에서 복사한 값을 채워 넣습니다.
   ```bash
   cp .env.example .env
   ```
7. **배포용**: GitHub 저장소 → **Settings → Secrets and variables → Actions → Variables 탭 → New repository variable** 에서 아래 6개 변수를 하나씩 등록합니다 (값은 3번에서 복사한 것과 동일).
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

---

## B. GitHub Pages 배포 켜기

1. GitHub 저장소 → **Settings → Pages** 로 이동합니다.
2. **Source**를 "GitHub Actions"로 변경합니다.
3. `main` 브랜치에 코드가 push되면 `.github/workflows/deploy.yml` 워크플로우가 자동으로 실행됩니다. 저장소의 **Actions** 탭에서 진행 상황을 볼 수 있습니다.
4. 배포가 끝나면 `https://<사용자명>.github.io/claude-code-playground2/` 형태의 주소가 생깁니다 (정확한 주소는 Pages 설정 화면 상단에 표시됩니다).

---

## C. 폰에 앱처럼 설치하기 (PWA)

- **안드로이드(Chrome)**: 배포된 주소를 열고 → 우측 상단 메뉴(⋮) → "홈 화면에 추가" 또는 "앱 설치" 배너 → 설치.
- **아이폰(Safari)**: 배포된 주소를 열고 → 하단 공유 아이콘(□↑) → "홈 화면에 추가".
- 설치 후 홈 화면 아이콘을 눌러 실행하면 브라우저 주소창 없이 전체화면으로 열립니다.
- 비행기 모드로 전환해도 게임 화면(보드)은 열리는지 확인해보세요(오프라인 캐시). 단, 실시간 랭킹은 인터넷 연결이 있어야 갱신됩니다.

---

## D. 로컬에서 직접 실행해보기 (선택)

```bash
npm install
npm run dev       # http://localhost:5173 에서 개발 서버 실행
npm test          # 게임 로직 테스트 실행
npm run build     # 배포용 빌드 (dist/ 생성)
npm run preview   # 빌드 결과 미리보기
```

---

## E. 문제 해결

- **랭킹보드에 "실시간 랭킹을 불러올 수 없어요" 메시지가 뜬다** → `.env`(로컬) 또는 GitHub 저장소 Variables(배포)에 Firebase 값이 제대로 들어갔는지 확인하세요.
- **점수 등록이 안 된다** → Firestore 규칙이 정확히 붙여넣기 되었는지, 콘솔에서 "게시(Publish)"까지 눌렀는지 확인하세요.
- **배포된 페이지가 흰 화면만 나온다** → `vite.config.js`의 `base` 값이 실제 저장소 이름과 일치하는지 확인하세요 (저장소 이름을 바꿨다면 `/새-저장소-이름/` 으로 수정 필요).
