# 💻 소스 코드 폴더

이 폴더는 애플리케이션의 모든 소스 코드를 포함합니다.

## 폴더 구조 (Next.js 설치 후)

```
src/
├── app/                 # Next.js 13+ App Router
│   ├── globals.css      # 전역 스타일
│   ├── layout.tsx       # 루트 레이아웃
│   ├── page.tsx         # 홈 페이지
│   ├── loading.tsx      # 로딩 컴포넌트
│   ├── error.tsx        # 에러 페이지
│   ├── not-found.tsx    # 404 페이지
│   └── (routes)/        # 페이지 라우트들
├── components/          # 재사용 가능한 컴포넌트
│   ├── ui/              # 기본 UI 컴포넌트
│   ├── forms/           # 폼 관련 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   └── math/            # 수학 관련 컴포넌트
├── lib/                 # 유틸리티 및 설정
│   ├── utils.ts         # 공통 유틸리티 함수
│   ├── constants.ts     # 상수 정의
│   ├── validations.ts   # 입력값 검증
│   └── db.ts            # 데이터베이스 설정
├── hooks/               # 커스텀 React 훅
├── store/               # 상태 관리 (Zustand)
├── types/               # TypeScript 타입 정의
├── styles/              # 스타일 파일
└── middleware.ts        # Next.js 미들웨어
```

## 코딩 컨벤션

### TypeScript
```typescript
// 컴포넌트는 PascalCase
export default function MathProblem() {
  return <div>수학 문제</div>;
}

// 타입은 PascalCase + Type 접미사
export type MathProblemType = {
  id: string;
  question: string;
  answer: number;
};

// 인터페이스는 PascalCase + Interface 접미사
export interface UserInterface {
  id: string;
  name: string;
  grade: number;
}
```

### 파일 명명
- **컴포넌트**: PascalCase (`MathProblem.tsx`)
- **훅**: camelCase + use 접두사 (`useMathProblem.ts`)
- **유틸리티**: camelCase (`mathUtils.ts`)
- **타입**: camelCase + .types (`math.types.ts`)

### Import 순서
```typescript
// 1. React 및 Next.js
import React from 'react';
import Link from 'next/link';

// 2. 외부 라이브러리
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// 3. 내부 컴포넌트
import { Button } from '@/components/ui/button';
import { MathInput } from '@/components/math/math-input';

// 4. 유틸리티 및 타입
import { calculateScore } from '@/lib/utils';
import type { MathProblemType } from '@/types/math.types';
```

## 컴포넌트 구조

### 기본 템플릿
```typescript
import React from 'react';
import { clsx } from 'clsx';

interface ComponentNameProps {
  className?: string;
  children?: React.ReactNode;
}

export default function ComponentName({ 
  className,
  children,
  ...props 
}: ComponentNameProps) {
  return (
    <div className={clsx('base-styles', className)} {...props}>
      {children}
    </div>
  );
}
```

### Props 검증
```typescript
import { z } from 'zod';

const MathProblemSchema = z.object({
  question: z.string().min(1),
  answer: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

type MathProblemProps = z.infer<typeof MathProblemSchema>;
```

## 상태 관리 (Zustand)

```typescript
import { create } from 'zustand';

interface MathStore {
  currentProblem: MathProblemType | null;
  score: number;
  setCurrentProblem: (problem: MathProblemType) => void;
  incrementScore: () => void;
  resetGame: () => void;
}

export const useMathStore = create<MathStore>((set) => ({
  currentProblem: null,
  score: 0,
  setCurrentProblem: (problem) => set({ currentProblem: problem }),
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  resetGame: () => set({ currentProblem: null, score: 0 }),
}));
```

## 스타일링 (Tailwind CSS)

### 유틸리티 클래스
```typescript
// 좋은 예: 의미있는 클래스 조합
const buttonClass = clsx(
  'px-4 py-2 rounded-lg font-medium transition-colors',
  'bg-blue-500 hover:bg-blue-600 text-white',
  'disabled:opacity-50 disabled:cursor-not-allowed'
);

// 나쁜 예: 너무 많은 클래스
const badClass = 'px-1 py-1 mt-1 mb-1 ml-1 mr-1 text-xs font-bold uppercase tracking-wide';
```

### 커스텀 컴포넌트 변형
```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-blue-500 text-white hover:bg-blue-600',
        outline: 'border border-blue-500 text-blue-500 hover:bg-blue-50',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);
```

## 에러 처리

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="text-center p-8">
      <h2 className="text-xl font-bold text-red-600 mb-4">
        앗! 문제가 발생했어요
      </h2>
      <p className="text-gray-600 mb-4">
        {error.message}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        다시 시도
      </button>
    </div>
  );
}

export function MathGameProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
```

이 폴더는 Next.js 프로젝트 설치 후 실제 소스 코드로 채워질 예정입니다.
