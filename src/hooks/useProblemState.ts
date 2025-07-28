import { useState, useEffect } from 'react';
import { Problem, StrokeData } from '../types';
import { AnalysisResult } from '../app/connected-components-demo/components/ComponentAnalyzer';
import { RecognitionResult, ONNXDigitRecognizer } from '../app/connected-components-demo/components/ONNXDigitRecognizer';

export interface ProblemState {
  analysisResult: AnalysisResult | null;
  recognitionResults: RecognitionResult[];
  recognitionText: string;
  averageConfidence: number;
  lowConfidenceCount: number;
  recognitionTime: number;
  isRecognizing: boolean;
  isRestoredAnswer: boolean;
}

export interface ProblemStateActions {
  handleAnalysisComplete: (result: AnalysisResult) => void;
  handleRecognitionComplete: (results: RecognitionResult[], processingTime: number) => void;
  handleClear: () => void;
  handleCanvasDataUpdate: (strokeData: StrokeData[]) => void;
}

/**
 * 문제 상태 관리 훅
 * 문제 관련 모든 상태와 핸들러를 통합 관리합니다.
 */
export function useProblemState(
  problem: Problem,
  initialAnswer: string,
  onAnswerChange: (problemId: number, answer: string) => void,
  onCanvasDataChange?: (problemId: number, strokeData: StrokeData[]) => void
): ProblemState & ProblemStateActions {
  // 상태 정의
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [recognitionResults, setRecognitionResults] = useState<RecognitionResult[]>([]);
  const [recognitionText, setRecognitionText] = useState<string>(initialAnswer);
  const [averageConfidence, setAverageConfidence] = useState<number>(0);
  const [lowConfidenceCount, setLowConfidenceCount] = useState<number>(0);
  const [recognitionTime, setRecognitionTime] = useState<number>(0);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [isRestoredAnswer, setIsRestoredAnswer] = useState<boolean>(!!initialAnswer);

  // 기존 답안 복원 처리
  useEffect(() => {
    console.log(`🔍 문제 ${problem.id} 복원 확인: initialAnswer="${initialAnswer}", currentText="${recognitionText}"`);
    
    if (initialAnswer && initialAnswer !== recognitionText) {
      setRecognitionText(initialAnswer);
      setIsRestoredAnswer(true);
      console.log(`✅ 문제 ${problem.id} 답안 복원: ${initialAnswer}`);
    } else if (!initialAnswer && recognitionText && !isRestoredAnswer) {
      // 새로 그린 답안인 경우
      console.log(`📝 문제 ${problem.id} 새 답안: ${recognitionText}`);
    }
  }, [initialAnswer, problem.id]);

  // 핸들러 정의
  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
  };

  const handleRecognitionComplete = (results: RecognitionResult[], processingTime: number) => {
    setRecognitionResults(results);
    setRecognitionTime(processingTime);
    
    // 텍스트 및 신뢰도 정보 계산
    const combined = ONNXDigitRecognizer.combineResults(results);
    setRecognitionText(combined.text);
    setAverageConfidence(combined.averageConfidence);
    setLowConfidenceCount(combined.lowConfidenceCount);
    setIsRecognizing(false);
    setIsRestoredAnswer(false); // 새로 인식된 답안은 복원된 것이 아님
    
    // 부모 컴포넌트에 결과 전달
    onAnswerChange(problem.id, combined.text);
  };

  const handleClear = () => {
    setAnalysisResult(null);
    setRecognitionResults([]);
    setRecognitionText('');
    setAverageConfidence(0);
    setLowConfidenceCount(0);
    setRecognitionTime(0);
    setIsRestoredAnswer(false);
    onAnswerChange(problem.id, '');
    // 캔버스 데이터도 클리어
    handleCanvasDataUpdate([]);
  };

  const handleCanvasDataUpdate = (strokeData: StrokeData[]) => {
    if (onCanvasDataChange) {
      onCanvasDataChange(problem.id, strokeData);
    }
  };

  // 상태와 액션을 모두 반환
  return {
    // 상태
    analysisResult,
    recognitionResults,
    recognitionText,
    averageConfidence,
    lowConfidenceCount,
    recognitionTime,
    isRecognizing,
    isRestoredAnswer,
    // 액션
    handleAnalysisComplete,
    handleRecognitionComplete,
    handleClear,
    handleCanvasDataUpdate,
  };
}