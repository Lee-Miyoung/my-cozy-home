# 채피움 가족 현장앨범 — Realtime Database 연결 안내

## 현재 상태

- Firebase 웹 설정은 `assets/firebase-config.js`에 반영했습니다.
- **기존 `assets/app.js`의 IndexedDB 개인 기록은 유지**합니다.
- 별도 가족 앨범은 `family.html` / `assets/family.js`이며 현재 **Firebase Realtime Database**를 사용합니다.
- **보안 규칙은 아직 Firebase 콘솔에 게시되지 않았고, 실제 가족 3명으로 접속 테스트도 하지 않았습니다.**
- 본인·언니·동생의 정확한 이메일이나 UID는 GitHub 공개 저장소에 저장하지 않습니다.
- **이 기능은 아직 엄마 집 전체 프로젝트를 동기화하지 않습니다.** 가족 사진·메모만 별도 공유합니다.

## 1. Firebase Realtime Database > 규칙

현재 잠금 규칙을 유지한 채, 먼저 `database.rules.json` 내용을 검토하고 권한 테스트를 진행합니다.

검증한 후 **Realtime Database > 규칙**에 적용하고 **게시**합니다. Firestore 규칙(`firestore.rules`)을 이 화면에 붙여넣지 않습니다.

규칙의 동작:
- `familyAccess/{uid}`를 해당 UID의 로그인 사용자만 읽을 수 있습니다.
- `familyAccess`는 어떤 클라이언트도 수정할 수 없습니다. **Firebase 콘솔에서 관리자만 등록·삭제합니다.**
- `familyAlbum/entries`의 사진과 현장 기록은 `owner` 또는 `contributor` UID만 읽고 작성할 수 있습니다.
- 본인 사진 기록만 수정·삭제할 수 있으며 관리자는 전체 삭제가 가능합니다.
- 기타 모든 경로는 기본 차단합니다.

## 2. 가족 로그인 UID 등록

1. Firebase Authentication → Google 로그인 제공업체가 활성화되어 있고 `lee-miyoung.github.io`가 승인된 도메인인지 확인합니다.
2. 사이트 `https://lee-miyoung.github.io/my-cozy-home/family.html`에서 **관리자 본인**의 구글 계정으로 로그인합니다.
3. 등록되지 않은 계정이라면 화면에 표시되는 **내 UID**를 확인합니다.
4. Firebase Authentication → 사용자 목록에서 UID가 일치하는지도 확인합니다.
5. Realtime Database → 데이터에서 루트에 `familyAccess` 노드를 만들고, 관리자 UID를 키로 사용하여 값 `owner`를 입력합니다.
6. 같은 방식으로 언니, 동생이 각각 로그인하여 본인 UID를 확인하고, 관리자에게 알려줍니다.
7. 관리자는 `familyAccess`에 해당 UID를 추가하고 값을 각각 `contributor`로 설정합니다.
8. 가족이 다시 로그인하거나 새로고침하면 앨범에 접근할 수 있습니다.

데이터 구조 예시 (**예시 UID를 실제 UID로 바꿔야 합니다**):

```json
{
  "familyAccess": {
    "관리자_UID": "owner",
    "언니_UID": "contributor",
    "동생_UID": "contributor"
  }
}
```

⚠️ 위 내용을 **규칙**에 넣는 것이 아닙니다. `Realtime Database → 데이터` 탭에 등록하는 별도 접근 권한 데이터입니다.

## 3. 사진 비용과 한계

현재 Spark 무료 요금제를 유지하기 위해 **Cloud Storage는 사용하지 않습니다**. 사진은 브라우저에서 가로·세로 최대 900px, JPEG 품질 0.58로 압축한 후 Realtime Database에 데이터 URL 형태로 저장합니다.

- 한 기록당 사진 **최대 3장**, JPG/PNG/WebP만 허용합니다.
- 원본은 휴대폰 또는 별도 개인 백업에 보관합니다.
- HEIC는 현재 JPG 변환 후 올려야 합니다.
- 사진이 데이터베이스 용량과 월 다운로드 양을 차지합니다. 가족이 사진을 자주 열면 사용량이 빠르게 늘어날 수 있습니다.
- Spark 무료 사용량 초과 시 서비스가 제한될 수 있으며, 대량 사진 보관이나 장기 보관에는 적절하지 않을 수 있습니다.
- 향후 Cloud Storage로 전환하려면 별도 요금제와 보안 규칙을 재검토해야 합니다.

## 4. 보안 및 사용 전 확인

- **보안 규칙을 검증하고 게시하기 전에는 실제 집 주소·계약서·개인 사진을 올리지 마세요.**
- 사진 업로드, 가족 3명 읽기/쓰기, 외부 계정 거부, 다른 UID로 데이터 변경 거부, 권한 제거 후 접속 차단을 각각 실제 계정으로 확인해야 합니다.
- 현재 `family.html`은 공개 GitHub Pages 주소로 열리지만 가족 기록은 데이터베이스 접근 권한 규칙으로 보호합니다.
- 접근 허용 목록에는 이메일 대신 Firebase Authentication의 UID를 사용합니다. **로그인 가능한 계정과 가족 프로젝트에 실제로 접근 가능한 계정은 구분됩니다.**
- Firebase 브라우저 API 키와 웹 앱 설정은 공개되어도 정상입니다. 서비스 계정의 비공개 키는 저장소에 절대 넣으면 안 됩니다.
- `firestore.rules` 및 `storage.rules`는 앞서 검토했던 **다른 방식의 초안**이며 이 Realtime Database 버전에는 적용하지 않습니다.
