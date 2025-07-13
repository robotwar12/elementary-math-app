'use client';

import { useState, useEffect } from 'react';
import { Problem, ProblemResult } from '../types';
import ProblemCard from './ProblemCard';
import ScoreResult from './ScoreResult';
import SettingsPage from './SettingsPage';

export default function MathPractice() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [isGraded, setIsGraded] = useState(false);
  const [results, setResults] = useState<ProblemResult[]>([]);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [firstNumberDigits, setFirstNumberDigits] = useState(2);
  const [secondNumberDigits, setSecondNumberDigits] = useState(2);
  const [totalPagesCount, setTotalPagesCount] = useState(3);
  const problemsPerPage = 6;

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
        answer
      });
    }
    
    setProblems(newProblems);
    setCurrentPage(1);
    setUserAnswers({});
    setIsGraded(false);
    setResults([]);
  };

  const updateUserAnswer = (problemId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [problemId]: answer
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
        isCorrect
      };
    });
    
    setResults(newResults);
    setIsGraded(true);
  };

  const resetProblems = () => {
    generateProblems();
  };

  useEffect(() => {
    generateProblems();
  }, [firstNumberDigits, secondNumberDigits, totalPagesCount]);

  const totalPages = Math.ceil(problems.length / problemsPerPage);
  const startIndex = (currentPage - 1) * problemsPerPage;
  const currentProblems = problems.slice(startIndex, startIndex + problemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 설정 페이지
  if (showSettingsPage) {
    return (
      <SettingsPage
        firstNumberDigits={firstNumberDigits}
        secondNumberDigits={secondNumberDigits}
        totalPagesCount={totalPagesCount}
        onFirstNumberDigitsChange={setFirstNumberDigits}
        onSecondNumberDigitsChange={setSecondNumberDigits}
        onTotalPagesCountChange={setTotalPagesCount}
        onGoBack={() => setShowSettingsPage(false)}
      />
    );
  }

  // 채점 결과 화면
  if (isGraded) {
    return (
      <ScoreResult 
        results={results}
        problems={problems}
        onReset={resetProblems}
      />
    );
  }

  return (
    <div className="container">
      <div className="math-practice">
        <div className="header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1>
                <i className="ri-calculator-line icon"></i>
                덧셈 연습
              </h1>
              <p>필기로 답을 써보며 수학 실력을 키워보세요</p>
            </div>
            <button
              onClick={() => setShowSettingsPage(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="ri-settings-line"></i>
              설정
            </button>
          </div>
        </div>

        <div className="problem-grid">
          {currentProblems.map((problem, index) => (
            <ProblemCard 
              key={problem.id} 
              problem={problem} 
              number={startIndex + index + 1}
              onAnswerChange={updateUserAnswer}
            />
          ))}
        </div>

        <div className="pagination">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            <i className="ri-arrow-left-line"></i>
            이전
          </button>
          
          <span className="page-info">
            {currentPage} / {totalPages}
          </span>
          
          {currentPage === totalPages ? (
            <button
              onClick={gradeAll}
              className="pagination-button"
              style={{ backgroundColor: '#10b981' }}
            >
              <i className="ri-check-line"></i>
              채점하기
            </button>
          ) : (
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              다음
              <i className="ri-arrow-right-line"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
