# 기술적 컨텍스트 (Tech Context)

## 현재 기술 스택
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Canvas API**: HTML5 Canvas
- **수학 처리**: 기본 JavaScript Math
- **상태 관리**: React useState/useEffect
- **ML/AI**: TensorFlow.js 4.22.0

## 핵심 컴포넌트 구조
```
src/
├── app/
│   ├── page.tsx (메인 페이지)
│   ├── layout.tsx (레이아웃)
│   └── globals.css (글로벌 스타일)
├── components/
│   ├── CanvasDrawing.tsx (캔버스 그리기)
│   ├── DebugPanel.tsx (디버그 패널)
│   ├── DigitSegmentation.ts (숫자 분할)
│   └── RecognitionResult.tsx (결과 표시)
└── utils/
    └── imagePreprocessing.ts (이미지 전처리)
```

## 성능 최적화 전략
- 캔버스 렌더링 최적화 (requestAnimationFrame)
- 이미지 전처리 최적화
- 메모리 사용량 관리
- 컨텍스트 윈도우 관리

## 숫자 인식 알고리즘
- 픽셀 기반 패턴 매칭
- 이미지 전처리 (노이즈 제거, 이진화)
- 영역 분할 및 특징 추출
- 템플릿 매칭 방식

## Cline 최적화 규칙 (2025.7.9)
- 파일 크기 500줄 이하 유지
- 컨텍스트 70% 도달 시 새 작업 시작
- 하나의 요청당 하나의 파일만 수정
- 메모리 뱅크 자동 관리 시스템

## 코딩 규칙
- 변수명과 함수명은 영어
- 주석과 설명은 한국어
- 컴포넌트는 단일 책임 원칙 준수
- 타입 안전성 우선
