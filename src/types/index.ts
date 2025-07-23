export interface Problem {
  id: number;
  num1: number;
  num2: number;
  operator: string;
  answer: number;
}

export interface ProblemResult {
  id: number;
  userAnswer: string;
  correctAnswer: number;
  isCorrect: boolean;
}

export interface ProblemCardProps {
  problem: Problem;
  number: number;
  onAnswerChange: (problemId: number, answer: string) => void;
  palmRejection?: boolean;
  initialAnswer?: string; // 기존 답안 복원을 위한 prop
  initialCanvasData?: StrokeData[]; // 기존 드로잉 복원을 위한 prop
  onCanvasDataChange?: (problemId: number, strokeData: StrokeData[]) => void; // 드로잉 변경 시 콜백
}

// 캔버스 드로잉 데이터 타입 정의
export interface StrokeData {
  points: Array<[number, number, number]>; // [x, y, pressure]
}

export interface ScoreResultProps {
  results: ProblemResult[];
  problems: Problem[];
  onReset: () => void;
}

export interface SettingsPanelProps {
  showSettings: boolean;
  firstNumberDigits: number;
  secondNumberDigits: number;
  totalPagesCount: number;
  palmRejection: boolean;
  onFirstNumberDigitsChange: (digits: number) => void;
  onSecondNumberDigitsChange: (digits: number) => void;
  onTotalPagesCountChange: (count: number) => void;
  onPalmRejectionChange: (enabled: boolean) => void;
  onToggleSettings: () => void;
}
