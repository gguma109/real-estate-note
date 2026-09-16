# 배포 환경

- 운영: `real-estate-note.pages.dev` / Cloudflare Pages `real-estate-note` / Git `main`
- 테스트: `move-out-confirmation.pages.dev` / Cloudflare Pages `dealbook` / Git `staging`

두 환경의 D1 데이터베이스와 양식 변환기 암호화 비밀 키는 별도입니다. 테스트 DB에는 운영 DB의 테이블 구조만 적용했으며 사용자 데이터는 복사하지 않았습니다.

새 기능은 `staging`에 먼저 커밋하고 푸시해 테스트 사이트에서 확인합니다. 문제가 없을 때 기능 변경 커밋만 `main`에 반영하고 푸시합니다. `staging`의 `wrangler.toml`은 테스트 DB를 가리키므로 운영 브랜치에 그대로 병합하거나 체리픽하지 마세요.

`move-out`의 프로덕션 브랜치는 `staging`이고 비운영 브랜치 자동 미리보기 배포는 꺼져 있습니다. 테스트 사이트에서 사용한 메모, 매물, 양식 변환기 설정 및 API 키는 운영 사이트에 나타나지 않습니다.
