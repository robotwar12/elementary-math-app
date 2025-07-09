# 🧪 테스트 폴더

이 폴더는 프로젝트의 모든 테스트 파일을 포함합니다.

## 테스트 전략

### 테스트 유형
- **Unit Tests**: 개별 함수 및 컴포넌트 테스트
- **Integration Tests**: 모듈 간 상호작용 테스트
- **E2E Tests**: 전체 사용자 플로우 테스트
- **Performance Tests**: 성능 및 로드 테스트

### 테스트 도구
- **Jest**: JavaScript 테스트 프레임워크
- **React Testing Library**: React 컴포넌트 테스트
- **Playwright**: E2E 테스트
- **MSW**: API 모킹

## 폴더 구조

```
tests/
├── unit/                # 단위 테스트
│   ├── components/      # React 컴포넌트 테스트
│   ├── utils/           # 유틸리티 함수 테스트
│   └── hooks/           # 커스텀 훅 테스트
├── integration/         # 통합 테스트
│   ├── api/             # API 엔드포인트 테스트
│   └── pages/           # 페이지 통합 테스트
├── e2e/                 # End-to-End 테스트
│   ├── user-flows/      # 사용자 플로우 테스트
│   └── critical-paths/  # 주요 기능 테스트
├── performance/         # 성능 테스트
├── fixtures/            # 테스트 데이터
├── mocks/               # 모킹 파일
└── setup/               # 테스트 설정 파일
```

## 테스트 명명 규칙

### 파일명
- 단위 테스트: `[파일명].test.ts` 또는 `[파일명].spec.ts`
- 컴포넌트 테스트: `[컴포넌트명].test.tsx`
- E2E 테스트: `[기능명].e2e.ts`

### 테스트 케이스
```typescript
describe('MathProblem 컴포넌트', () => {
  it('덧셈 문제를 올바르게 렌더링해야 한다', () => {
    // 테스트 로직
  });
  
  it('정답 입력 시 성공 메시지를 표시해야 한다', () => {
    // 테스트 로직
  });
});
```

## 테스트 커버리지 목표

- **Unit Tests**: 90% 이상
- **Integration Tests**: 80% 이상
- **E2E Tests**: 주요 사용자 플로우 100%

## 실행 명령어

```bash
# 모든 테스트 실행
npm test

# 특정 파일 테스트
npm test -- MathProblem.test.tsx

# 커버리지 포함 테스트
npm run test:coverage

# E2E 테스트
npm run test:e2e

# 테스트 감시 모드
npm run test:watch
```

## CI/CD 통합

모든 Pull Request는 다음 테스트를 통과해야 합니다:
- ✅ 단위 테스트
- ✅ 통합 테스트
- ✅ 린팅 검사
- ✅ 타입 체크
- ✅ 주요 E2E 테스트

테스트 실패 시 배포가 차단되며, 커버리지가 기준 이하로 떨어지면 경고가 표시됩니다.
