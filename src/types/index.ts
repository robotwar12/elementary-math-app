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
