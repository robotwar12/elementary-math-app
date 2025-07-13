# 기술적 컨텍스트

## 🚀 배포 아키텍처

### GitHub Repository
- **URL**: https://github.com/robotwar12/elementary-math-app
- **브랜치**: master (기본)
- **커밋 해시**: e5a664e
- **크기**: 159.18 MiB (311개 객체)

### Vercel 배포
- **URL**: https://elementary-math-app.vercel.app/
- **플랫폼**: Vercel Edge Network
- **빌드**: Next.js SSG/SSR 하이브리드
- **CDN**: 글로벌 엣지 캐싱

## 🛠️ 기술 스택

### 프론트엔드
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3+
- **Components**: React 18+ (함수형 컴포넌트)

### AI/ML
- **Engine**: TensorFlow.js 4+
- **Model**: Custom ONNX 모델
- **Backend**: WebGL 가속
- **Target**: 숫자 인식 (0-9)

### 개발 도구
- **Package Manager**: npm
- **Bundler**: Next.js/Webpack
- **Linter**: ESLint + TypeScript
- **Formatter**: Prettier
- **Testing**: Jest + Testing Library

## 🔧 CI/CD 파이프라인

### GitHub Actions
```yaml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  - Type Check (TypeScript)
  - Lint (ESLint)
  - Test (Jest)
  - Build (Next.js)
  - Deploy (Vercel)
```

### 자동 배포
1. **GitHub push 감지**
2. **GitHub Actions 트리거**
3. **품질 검사 실행**
4. **Vercel 자동 빌드**
5. **배포 완료 알림**

## 📦 핵심 종속성

### 런타임 종속성
```json
{
  "@tensorflow/tfjs": "^4.x",
  "next": "14.x",
  "react": "18.x",
  "tailwindcss": "^3.x"
}
```

### 개발 종속성
```json
{
  "@types/node": "^20.x",
  "eslint": "^8.x",
  "jest": "^29.x",
  "prettier": "^3.x",
  "typescript": "^5.x"
}
```

## 🎯 성능 최적화

### Next.js 최적화
- **Image Optimization**: next/image 활용
- **Code Splitting**: 자동 번들 분할
- **Tree Shaking**: 사용하지 않는 코드 제거
- **SSG/SSR**: 하이브리드 렌더링

### TensorFlow.js 최적화
- **WebGL Backend**: GPU 가속 활용
- **Model Compression**: 모델 크기 최적화
- **Lazy Loading**: 필요시에만 모델 로드
- **Cache Strategy**: 브라우저 캐싱 활용

## 🔐 보안 및 환경

### 환경변수
```env
NEXT_PUBLIC_APP_URL=https://elementary-math-app.vercel.app
NEXT_PUBLIC_TENSORFLOW_BACKEND=webgl
NEXT_PUBLIC_MODEL_PATH=/models/
NODE_ENV=production
```

### 보안 헤더
- **CSP**: Content Security Policy
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: 클릭재킹 방지
- **X-Content-Type-Options**: MIME 스니핑 방지

## 📊 모니터링 및 분석

### Vercel Analytics
- **Core Web Vitals**: 성능 지표 추적
- **Real User Monitoring**: 실제 사용자 경험
- **Function Metrics**: 서버리스 함수 성능
- **Deployment Analytics**: 배포 성공률

### 성능 메트릭
- **FCP**: First Contentful Paint
- **LCP**: Largest Contentful Paint  
- **FID**: First Input Delay
- **CLS**: Cumulative Layout Shift

## 🧪 테스트 전략

### 단위 테스트
- **Jest**: JavaScript 테스트 프레임워크
- **Testing Library**: React 컴포넌트 테스트
- **Coverage**: 70% 코드 커버리지 목표

### E2E 테스트
- **Playwright**: 브라우저 자동화 (향후 계획)
- **Cypress**: 사용자 시나리오 테스트 (향후 계획)

## 🔄 브랜칭 전략

### Git Flow
- **master**: 프로덕션 브랜치
- **develop**: 개발 브랜치 (향후)
- **feature/***: 기능 브랜치 (향후)
- **hotfix/***: 긴급 수정 (향후)

### 배포 전략
- **Continuous Deployment**: master 브랜치 자동 배포
- **Preview Deployments**: PR별 미리보기 환경
- **Rollback Strategy**: 이전 버전 즉시 복원 가능

## 📱 호환성

### 브라우저 지원
- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅  
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅

### 디바이스 지원
- **Desktop**: 1024px+ ✅
- **Tablet**: 768px-1023px ✅
- **Mobile**: 320px-767px ✅
- **Touch**: 터치 인터페이스 최적화 ✅

## 🔮 확장성 고려사항

### 수평 확장
- **Vercel Functions**: 서버리스 확장
- **Edge Computing**: 글로벌 분산 처리
- **CDN Caching**: 정적 자산 캐싱

### 기능 확장
- **모듈화 설계**: 새 수학 모드 추가 용이
- **플러그인 아키텍처**: 서드파티 통합 가능
- **API 분리**: 백엔드 서비스 독립화 가능

## 📈 성능 벤치마크

### 현재 성능
- **Lighthouse Score**: 95+ (추정)
- **페이지 로드**: < 2초
- **첫 인터랙션**: < 1초
- **TensorFlow 로드**: < 3초

### 최적화 목표
- **Core Web Vitals**: 모든 지표 Green
- **TTI**: Time to Interactive < 3초
- **Bundle Size**: < 1MB 유지
- **Memory Usage**: < 100MB 타겟
