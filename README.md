# 🧮 Elementary Math App

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**AI-powered handwriting recognition system for elementary math learning**

An interactive elementary math learning platform with real-time handwriting recognition using TensorFlow.js and advanced digit segmentation algorithms.

## 🎯 프로젝트 목표

- **✏️ 실시간 필기 인식**: TensorFlow.js를 활용한 손글씨 숫자 인식
- **🔢 연속 숫자 인식**: '43525' 같은 연속된 숫자 완벽 인식
- **⚡ 빠른 응답**: 200-500ms 내 실시간 인식 결과 제공
- **📱 반응형 캔버스**: 다양한 화면 크기에서 자연스러운 필기 경험
- **🎮 게임화**: 필기 인식을 활용한 재미있는 수학 게임
- **📊 학습 추적**: 필기 패턴 분석 및 학습 진도 모니터링

## 📁 프로젝트 구조

```
elementary-math-app/
├── docs/                 # 프로젝트 문서
├── design/              # 디자인 파일, 목업
├── src/                 # 소스 코드 (Next.js)
│   ├── components/
│   │   ├── canvas/      # 캔버스 관련 컴포넌트
│   │   │   ├── DrawingCanvas.tsx
│   │   │   ├── RecognitionResult.tsx
│   │   │   └── CanvasTools.tsx
│   │   ├── recognition/ # 필기 인식 관련 컴포넌트
│   │   │   ├── HandwritingRecognizer.tsx
│   │   │   └── MathCanvas.tsx
│   │   └── ui/          # 기본 UI 컴포넌트
│   ├── utils/
│   │   ├── imagePreprocessing.ts # 이미지 전처리
│   │   ├── digitSegmentation.ts  # 숫자 분할
│   │   ├── digitRecognition.ts   # 숫자 인식
│   │   └── handwritingRecognizer.ts # 필기 인식 메인
│   └── hooks/
│       └── useHandwriting.ts # 필기 인식 커스텀 훅
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

### 필기 인식 기술
- **ML 엔진**: TensorFlow.js + MNIST 모델 (오프라인 필기 인식)
- **Canvas API**: HTML5 Canvas 2D API
- **이미지 처리**: Canvas 이미지 전처리 및 정규화
- **성능**: 85-90% 인식 정확도, <500ms 응답 시간
- **오프라인 동작**: 인터넷 연결 없이 완전 동작

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

## � 필기 인식 빠른 시작

### 1. 필기 인식 데모 실행
```bash
npm run dev
# 브라우저에서 http://localhost:3000/demo 접속
```

### 2. 필기 인식 테스트
1. 캔버스에 숫자 '43525' 작성
2. 실시간 인식 결과 확인
3. 인식 정확도 및 응답 시간 모니터링

### 3. 개발 환경 설정
```bash
# TensorFlow.js 의존성 확인
npm list @tensorflow/tfjs

# Canvas API 지원 브라우저 확인 (Chrome 권장)
# 개발자 도구 > Console에서 확인:
# console.log(!!document.createElement('canvas').getContext('2d'));
```

## �📋 개발 일정

### Phase 1: 기본 캔버스 구현 (1-2일)
- [x] 프로젝트 구조 설정
- [ ] DrawingCanvas 컴포넌트 (200x60px)
- [ ] 기본 드로잉 기능 구현
- [ ] 캔버스 지우기 및 초기화
- [ ] 터치/마우스 입력 지원

### Phase 2: 이미지 전처리 시스템 (2-3일)
- [ ] 이미지 노이즈 제거 및 이진화
- [ ] 28x28 픽셀로 정규화
- [ ] 이미지 중앙 정렬 및 패딩
- [ ] 전처리 파이프라인 최적화

### Phase 3: 숫자 분할 알고리즘 (3-4일)
- [ ] 수직 투영 기반 숫자 분할
- [ ] 연결 요소 분석으로 겹치는 숫자 처리
- [ ] 분할된 숫자 이미지 정규화
- [ ] 분할 결과 시각화

### Phase 4: TensorFlow.js 모델 구현 (2-3일)
- [ ] MNIST 모델 로드 및 초기화
- [ ] 단일 숫자 예측 기능
- [ ] 신뢰도 기반 결과 필터링
- [ ] 메모리 관리 및 텐서 정리

### Phase 5: 통합 시스템 (2일)
- [ ] 전체 파이프라인 연결
- [ ] 연속 숫자 인식 ('43525')
- [ ] 실시간 인식 결과 표시
- [ ] 오류 처리 및 사용자 피드백

### Phase 6: 최적화 및 개선 (3-4일)
- [ ] 인식 정확도 향상 (85-90% 목표)
- [ ] 응답 시간 최적화 (<500ms 목표)
- [ ] 초등학생 필기 스타일 특화
- [ ] 성능 모니터링 및 디버깅

### Phase 3: 수학 학습 기능 연결 (2주)
- [ ] 인식된 숫자로 수학 문제 생성
- [ ] 답안 검증 시스템
- [ ] 기본 게임 인터페이스
- [ ] 학습 진도 추적

### Phase 4: 고급 기능 및 배포 (1-2주)
- [ ] AI 튜터 시스템 (Claude API)
- [ ] 성능 최적화 및 메모리 관리
- [ ] 테스트 코드 작성
- [ ] 배포 설정 및 모니터링

## 🎮 주요 기능

### 🔥 핵심 필기 인식 기능
- ✏️ **실시간 필기 인식**: 캔버스에 쓴 숫자를 즉시 인식
- 🔢 **연속 숫자 인식**: '43525' 같은 연속된 숫자 완벽 인식
- ⚡ **빠른 응답**: 200-500ms 내 인식 결과 제공
- 🎨 **자연스러운 필기**: 다양한 필기 스타일 지원
- � **반응형 캔버스**: 터치 및 마우스 입력 지원

### 🎯 성능 목표
- **인식 정확도**: 85-90% (초등학생 필기 기준)
- **응답 시간**: <500ms
- **메모리 사용량**: <100MB
- **첫 로딩 시간**: 2-3초
- **캔버스 크기**: 200x60px (교과서 답안란 크기)

### 학습자 기능
- 📊 **필기 기반 문제풀이**: 손글씨로 답안 작성
- 🎯 **진도 관리**: 필기 패턴 분석 및 학습 진행 상황 시각화
- 🏆 **성취 시스템**: 필기 정확도 기반 배지 및 포인트
- 🤖 **AI 도우미**: 필기 인식 결과 기반 학습 지원

### 교육자 기능
- 📈 **필기 분석**: 학생별 필기 패턴 및 성과 리포트
- 📝 **커리큘럼 관리**: 필기 인식 기반 학습 계획 수립
- 👥 **클래스 관리**: 학급별 필기 학습 진도 관리
- 📊 **통계 대시보드**: 전체 필기 인식 현황 모니터링

## 🤝 Contributing

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## � Issues

Found a bug or have a feature request? Please open an issue [here](https://github.com/[username]/elementary-math-app/issues).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TensorFlow.js](https://www.tensorflow.org/js) for machine learning capabilities
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for beautiful styling
- MNIST dataset for digit recognition training

## 📊 Project Status

![GitHub issues](https://img.shields.io/github/issues/[username]/elementary-math-app)
![GitHub forks](https://img.shields.io/github/forks/[username]/elementary-math-app)
![GitHub stars](https://img.shields.io/github/stars/[username]/elementary-math-app)
![GitHub license](https://img.shields.io/github/license/[username]/elementary-math-app)

---

**Made with ❤️ for elementary education**
