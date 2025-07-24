'use client';

import { useState, useEffect, useRef } from 'react';
import { Problem, ProblemResult, StrokeData } from '../types';
import ProblemCard from './ProblemCard';
import ScoreResult from './ScoreResult';
import SettingsPage from './SettingsPage';

export default function MathPractice() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [canvasData, setCanvasData] = useState<{ [key: number]: StrokeData[] }>(
    {}
  );
  const [isGraded, setIsGraded] = useState(false);
  const [results, setResults] = useState<ProblemResult[]>([]);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [firstNumberDigits, setFirstNumberDigits] = useState(2);
  const [secondNumberDigits, setSecondNumberDigits] = useState(2);
  const [totalPagesCount, setTotalPagesCount] = useState(3);
  const [palmRejection, setPalmRejection] = useState(true); // 기본값: ON
  const [isTabletMode, setIsTabletMode] = useState(false);
  const problemsPerPage = 6;

  const palmRejectionRef = useRef(palmRejection);
  useEffect(() => {
    palmRejectionRef.current = palmRejection;
  }, [palmRejection]);

  // 클라이언트사이드에서만 태블릿 모드 확인
  useEffect(() => {
    const checkTabletMode = () => {
      setIsTabletMode(
        window.innerWidth >= 768 && window.innerWidth <= 1440
      );
    };

    checkTabletMode();
    window.addEventListener('resize', checkTabletMode);
    
    return () => {
      window.removeEventListener('resize', checkTabletMode);
    };
  }, []);

  // 토글 버튼 이벤트 핸들러
  const handleTogglePalmRejection = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent synthetic mouse events after touch
    setPalmRejection(prev => !prev);
  };

  // 전역 Palm Rejection 이벤트 리스너 관리
  useEffect(() => {
    const preventGlobalTouch = (e: TouchEvent) => {
      if (!palmRejectionRef.current) return;

      const target = e.target as Element;
      if (target.closest('[data-palm-toggle-container]')) return;

      const isAllowedElement = target.closest('button, input, select, textarea, a, label, [role="button"], .touch-allowed');
      if (isAllowedElement) return;
      
      const isCanvasArea = target.closest('canvas, .canvas-container, .drawing-area');
      if (isCanvasArea) {
        if (e.touches.length > 1) {
          console.log('🚫 Palm Rejection: 캔버스 위 멀티터치 차단');
          e.preventDefault();
        }
        return;
      }

      console.log('🚫 Palm Rejection: 빈 영역 터치/스크롤 차단');
      e.preventDefault();
    };

    const preventDefaultIfActive = (e: Event) => {
      if (palmRejectionRef.current) {
        const target = e.target as Element;
        if (target.closest('input, textarea')) return;
        e.preventDefault();
      }
    };

    console.log('🖐️ 전역 Palm Rejection 이벤트 리스너 설정');
    document.addEventListener('touchmove', preventGlobalTouch, { passive: false, capture: true });
    document.addEventListener('contextmenu', preventDefaultIfActive, { capture: true });
    document.addEventListener('dragstart', preventDefaultIfActive, { capture: true });
    document.addEventListener('selectstart', preventDefaultIfActive, { capture: true });

    return () => {
      console.log('🖐️ 전역 Palm Rejection 이벤트 리스너 해제');
      document.removeEventListener('touchmove', preventGlobalTouch, { capture: true });
      document.removeEventListener('contextmenu', preventDefaultIfActive, { capture: true });
      document.removeEventListener('dragstart', preventDefaultIfActive, { capture: true });
      document.removeEventListener('selectstart', preventDefaultIfActive, { capture: true });
    };
  }, []); // 마운트/언마운트 시에만 실행

  // palmRejection 상태에 따라 body 클래스 토글
  useEffect(() => {
    if (palmRejection) {
      console.log('🖐️ Palm Rejection 활성화: body 클래스 추가');
      document.body.classList.add('palm-rejection-active');
      document.documentElement.classList.add('palm-rejection-active');
    } else {
      console.log('🖐️ Palm Rejection 비활성화: body 클래스 제거');
      document.body.classList.remove('palm-rejection-active');
      document.documentElement.classList.remove('palm-rejection-active');
    }
  }, [palmRejection]);

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
    setCurrentPage(1);
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

  useEffect(() => {
    generateProblems();
  }, [firstNumberDigits, secondNumberDigits, totalPagesCount]);

  const totalPages = Math.ceil(problems.length / problemsPerPage);
  const startIndex = (currentPage - 1) * problemsPerPage;
  const currentProblems = problems.slice(
    startIndex,
    startIndex + problemsPerPage
  );

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
        palmRejection={palmRejection}
        onFirstNumberDigitsChange={setFirstNumberDigits}
        onSecondNumberDigitsChange={setSecondNumberDigits}
        onTotalPagesCountChange={setTotalPagesCount}
        onPalmRejectionChange={setPalmRejection}
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
    <div
      className='container'
      style={{
        // 태블릿에서 고정 높이 보장
        height: isTabletMode ? '100vh' : 'auto'
      }}
    >
      {/* 🖐️ Palm Rejection 토글 버튼 - 최상단 */}
      <div
        data-palm-toggle-container='true'
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          border: '1px solid #e5e7eb',
        }}
      >
        <button
          data-palm-toggle='true'
          onClick={handleTogglePalmRejection}
          onTouchEnd={handleTogglePalmRejection}
          className='touch-allowed'
          style={{
            padding: '12px 16px',
            backgroundColor: palmRejection ? '#ef4444' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            touchAction: 'manipulation',
            minWidth: '140px',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          {palmRejection ? (
            <>
              <i className='ri-hand-line'></i>
              Palm ON
            </>
          ) : (
            <>
              <i className='ri-hand-line' style={{ opacity: 0.6 }}></i>
              Palm OFF
            </>
          )}
        </button>
      </div>

      <div className='math-practice'>
        <div className='header'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h1>
                <i className='ri-calculator-line icon'></i>
                덧셈 연습
                {palmRejection && (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: '#4f46e5',
                      marginLeft: '0.5rem',
                      backgroundColor: '#e0e7ff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    🖐️ Palm Rejection ON
                  </span>
                )}
              </h1>
              <p>
                필기로 답을 써보며 수학 실력을 키워보세요
                {palmRejection && (
                  <span
                    style={{
                      color: '#6366f1',
                      fontSize: '0.9rem',
                      marginLeft: '0.5rem',
                    }}
                  >
                    - 전체 화면 터치 보호 활성화됨
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowSettingsPage(true)}
              onTouchStart={e => {
                e.stopPropagation();
                console.log('✅ 설정 버튼 터치 시작');
              }}
              onTouchEnd={e => {
                e.stopPropagation();
                console.log('✅ 설정 버튼 터치 종료 - 설정 페이지 열기');
                setShowSettingsPage(true);
              }}
              className='touch-allowed'
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
                gap: '0.5rem',
                touchAction: 'manipulation', // 터치 지연 제거
              }}
            >
              <i className='ri-settings-line'></i>
              설정
            </button>
          </div>
        </div>

        <div className='problem-grid'>
          {currentProblems.map((problem, index) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              number={startIndex + index + 1}
              onAnswerChange={updateUserAnswer}
              onCanvasDataChange={updateCanvasData}
              palmRejection={palmRejection}
              initialAnswer={userAnswers[problem.id] || ''}
              initialCanvasData={canvasData[problem.id] || []}
            />
          ))}
        </div>

        <div className='pagination'>
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className='pagination-button touch-allowed'
          >
            <i className='ri-arrow-left-line'></i>
            이전
          </button>

          <span className='page-info'>
            {currentPage} / {totalPages}
          </span>

          {currentPage === totalPages ? (
            <button
              onClick={gradeAll}
              className='pagination-button touch-allowed'
              style={{ backgroundColor: '#10b981' }}
            >
              <i className='ri-check-line'></i>
              채점하기
            </button>
          ) : (
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className='pagination-button touch-allowed'
            >
              다음
              <i className='ri-arrow-right-line'></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
