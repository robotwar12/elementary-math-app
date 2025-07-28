'use client';

import { useState, useEffect } from 'react';
import { Problem, ProblemResult, StrokeData } from '../types';

interface UseMathProblemsProps {
  firstNumberDigits: number;
  secondNumberDigits: number;
  totalPagesCount: number;
  problemsPerPage: number;
}

interface UseMathProblemsReturn {
  problems: Problem[];
  userAnswers: { [key: number]: string };
  canvasData: { [key: number]: StrokeData[] };
  results: ProblemResult[];
  isGraded: boolean;
  updateUserAnswer: (problemId: number, answer: string) => void;
  updateCanvasData: (problemId: number, strokeData: StrokeData[]) => void;
  gradeAll: () => void;
  resetProblems: () => void;
  generateProblems: () => void;
}

export default function useMathProblems({
  firstNumberDigits,
  secondNumberDigits,
  totalPagesCount,
  problemsPerPage
}: UseMathProblemsProps): UseMathProblemsReturn {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [canvasData, setCanvasData] = useState<{ [key: number]: StrokeData[] }>({});
  const [results, setResults] = useState<ProblemResult[]>([]);
  const [isGraded, setIsGraded] = useState(false);

  const generateNumberByDigits = (digits: number) => {
    if (digits === 1) {
      return Math.floor(Math.random() * 9) + 1; // 1~9
    }
    const min = Math.pow(10, digits - 1); // 10, 100, 1000, 10000
    const max = Math.pow(10, digits) - 1; // 99, 999, 9999, 99999
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateProblems = () => {
    const newProblems: Problem[] = [];
    const totalProblems = totalPagesCount * problemsPerPage;

    for (let i = 0; i < totalProblems; i++) {
      const num1 = generateNumberByDigits(firstNumberDigits);
      const num2 = generateNumberByDigits(secondNumberDigits);
      const answer = num1 + num2;

      newProblems.push({
        id: i + 1,
        num1,
        num2,
        operator: '+',
        answer,
      });
    }

    setProblems(newProblems);
    setUserAnswers({});
    setCanvasData({});
    setIsGraded(false);
    setResults([]);
  };

  const updateUserAnswer = (problemId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [problemId]: answer,
    }));
  };

  const updateCanvasData = (problemId: number, strokeData: StrokeData[]) => {
    console.log(
      `💾 문제 ${problemId} 캔버스 데이터 업데이트: ${strokeData.length}개 스트로크`
    );
    setCanvasData(prev => ({
      ...prev,
      [problemId]: strokeData,
    }));
  };

  const gradeAll = () => {
    const newResults: ProblemResult[] = problems.map(problem => {
      const userAnswer = userAnswers[problem.id] || '';
      const isCorrect = parseInt(userAnswer) === problem.answer;

      return {
        id: problem.id,
        userAnswer,
        correctAnswer: problem.answer,
        isCorrect,
      };
    });

    setResults(newResults);
    setIsGraded(true);
  };

  const resetProblems = () => {
    generateProblems();
  };

  // 설정 변경 시 문제 재생성
  useEffect(() => {
    generateProblems();
  }, [firstNumberDigits, secondNumberDigits, totalPagesCount]);

  return {
    problems,
    userAnswers,
    canvasData,
    results,
    isGraded,
    updateUserAnswer,
    updateCanvasData,
    gradeAll,
    resetProblems,
    generateProblems
  };
}