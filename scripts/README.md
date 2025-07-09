# 🔧 스크립트 폴더

이 폴더는 빌드, 배포, 개발 관련 스크립트들을 포함합니다.

## 스크립트 유형

### 개발 스크립트
- `setup.sh` - 프로젝트 초기 설정
- `dev.sh` - 개발 서버 실행
- `clean.sh` - 빌드 캐시 정리

### 빌드 스크립트  
- `build.sh` - 프로덕션 빌드
- `build-docker.sh` - Docker 이미지 빌드
- `optimize.sh` - 번들 최적화

### 배포 스크립트
- `deploy-staging.sh` - 스테이징 환경 배포
- `deploy-production.sh` - 프로덕션 환경 배포
- `rollback.sh` - 이전 버전으로 롤백

### 유틸리티 스크립트
- `backup-db.sh` - 데이터베이스 백업
- `migrate-db.sh` - 데이터베이스 마이그레이션
- `seed-data.sh` - 샘플 데이터 생성

## 스크립트 작성 가이드

### 기본 템플릿
```bash
#!/bin/bash

# 스크립트 설명
# 사용법: ./script-name.sh [options]

set -e  # 에러 발생 시 스크립트 종료

# 색상 정의
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 메인 로직
main() {
    log_info "스크립트 시작"
    # 실제 작업 수행
    log_info "스크립트 완료"
}

# 스크립트 실행
main "$@"
```

### 네이밍 컨벤션
- 모든 스크립트는 `.sh` 확장자 사용
- 케밥 케이스 사용: `deploy-production.sh`
- 용도를 명확히 표현: `backup-db.sh`, `clean-cache.sh`

## 실행 권한 설정

```bash
# 모든 스크립트에 실행 권한 부여
chmod +x scripts/*.sh

# 특정 스크립트만 실행 권한 부여
chmod +x scripts/setup.sh
```

## 환경 변수

스크립트에서 사용할 환경 변수들:

```bash
# 개발 환경
NODE_ENV=development
API_URL=http://localhost:3000
DB_URL=postgresql://localhost:5432/mathapp_dev

# 프로덕션 환경
NODE_ENV=production
API_URL=https://mathapp.com
DB_URL=postgresql://prod-server:5432/mathapp_prod
```

## 안전 가이드라인

### 보안 고려사항
- 🔐 API 키나 비밀번호를 스크립트에 하드코딩하지 않기
- 🛡️ 환경 변수 또는 설정 파일 사용
- 📝 실행 전 확인 메시지 표시

### 에러 처리
- ✅ `set -e` 사용으로 에러 발생 시 스크립트 종료
- 📋 의미있는 에러 메시지 제공
- 🔄 롤백 기능 구현

### 로깅
- 📊 실행 로그 기록
- 📅 타임스탬프 포함
- 🎨 색상 코딩으로 가독성 향상

## package.json 연동

스크립트들은 npm scripts와 연동하여 사용:

```json
{
  "scripts": {
    "setup": "./scripts/setup.sh",
    "build:docker": "./scripts/build-docker.sh", 
    "deploy:staging": "./scripts/deploy-staging.sh",
    "deploy:prod": "./scripts/deploy-production.sh"
  }
}
```

모든 스크립트는 프로젝트 루트에서 실행되며, 상대 경로를 사용해야 합니다.
