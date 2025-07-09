# 🧮 초등학교 수학 학습 애플리케이션

Claude와 Cline을 활용하여 개발하는 인터랙티브 초등학교 수학 학습 플랫폼입니다.

## 🎯 프로젝트 목표

- **맞춤형 학습**: 학생 수준에 맞는 수학 문제 제공
- **게임화**: 재미있는 게임 요소로 학습 동기 부여
- **진도 추적**: 학습 진행 상황 모니터링
- **AI 튜터**: Claude를 활용한 개인화된 학습 지원

## 📁 프로젝트 구조

```
elementary-math-app/
├── docs/                 # 프로젝트 문서
├── design/              # 디자인 파일, 목업
├── src/                 # 소스 코드 (Next.js)
├── tests/               # 테스트 파일
├── scripts/             # 빌드/배포 스크립트
├── .vscode/             # VSCode 설정
└── README.md            # 프로젝트 설명
```

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태관리**: Zustand
- **애니메이션**: Framer Motion

### Backend
- **API**: Next.js API Routes
- **데이터베이스**: PostgreSQL (Supabase)
- **인증**: NextAuth.js
- **AI**: Anthropic Claude API

### 개발 도구
- **에디터**: VSCode + Cline
- **패키지 매니저**: npm
- **린팅**: ESLint + Prettier
- **테스팅**: Jest + Testing Library
- **배포**: Vercel

## 🚀 개발 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local 파일에 필요한 환경변수 설정
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 브라우저에서 확인
http://localhost:3000

## 📋 개발 일정

### Phase 1: 기초 설정 (1주)
- [x] 프로젝트 구조 설정
- [ ] Next.js 프로젝트 초기화
- [ ] 기본 UI 컴포넌트 구성
- [ ] 데이터베이스 스키마 설계

### Phase 2: 핵심 기능 (2-3주)
- [ ] 사용자 인증 시스템
- [ ] 수학 문제 생성 엔진
- [ ] 학습 진도 추적
- [ ] 기본 게임 인터페이스

### Phase 3: 고급 기능 (2주)
- [ ] AI 튜터 시스템
- [ ] 개인화 알고리즘
- [ ] 리포트 시스템
- [ ] 성과 분석

### Phase 4: 배포 및 최적화 (1주)
- [ ] 성능 최적화
- [ ] 테스트 코드 작성
- [ ] 배포 설정
- [ ] 모니터링 구성

## 🎮 주요 기능

### 학습자 기능
- 📊 **맞춤형 문제**: 개인 수준에 맞는 수학 문제
- 🎯 **진도 관리**: 학습 진행 상황 시각화
- 🏆 **성취 시스템**: 배지 및 포인트 시스템
- 🤖 **AI 도우미**: 학습 중 실시간 도움말

### 교육자 기능
- 📈 **학습 분석**: 학생별 성과 리포트
- 📝 **커리큘럼 관리**: 학습 계획 수립
- 👥 **클래스 관리**: 학급별 진도 관리
- 📊 **통계 대시보드**: 전체 현황 모니터링

## 👥 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/새기능`)
3. 변경사항을 커밋합니다 (`git commit -am '새기능 추가'`)
4. 브랜치에 푸시합니다 (`git push origin feature/새기능`)
5. Pull Request를 생성합니다

## 📞 연락처

- **개발자**: 김정민
- **이메일**: [이메일 주소]
- **프로젝트 링크**: [GitHub 저장소]

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**Created with ❤️ using Claude & Cline**
