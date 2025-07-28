'use client';

import ProblemCard from './ProblemCard';
import ScoreResult from './ScoreResult';
import SettingsPage from './SettingsPage';
import { usePalmRejection } from '../providers/PalmRejectionProvider';
import useMathProblems from '../hooks/useMathProblems';
import useAppSettings from '../hooks/useAppSettings';
import usePagination from '../hooks/usePagination';

export default function MathPractice() {
  const { palmRejection, setPalmRejection, isTabletMode } = usePalmRejection();
  
  const {
    firstNumberDigits,
    secondNumberDigits,
    totalPagesCount,
    showSettingsPage,
    setFirstNumberDigits,
    setSecondNumberDigits,
    setTotalPagesCount,
    openSettings,
    closeSettings
  } = useAppSettings();

  const problemsPerPage = 6;

  const {
    problems,
    userAnswers,
    canvasData,
    results,
    isGraded,
    updateUserAnswer,
    updateCanvasData,
    gradeAll,
    resetProblems
  } = useMathProblems({
    firstNumberDigits,
    secondNumberDigits,
    totalPagesCount,
    problemsPerPage
  });

  const {
    currentPage,
    totalPages,
    currentProblems,
    startIndex,
    nextPage,
    prevPage
  } = usePagination({ problems, problemsPerPage });

  // 토글 버튼 이벤트 핸들러
  const handleTogglePalmRejection = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPalmRejection(!palmRejection);
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
        onGoBack={closeSettings}
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
              onClick={openSettings}
              onTouchStart={e => {
                e.stopPropagation();
                console.log('✅ 설정 버튼 터치 시작');
              }}
              onTouchEnd={e => {
                e.stopPropagation();
                console.log('✅ 설정 버튼 터치 종료 - 설정 페이지 열기');
                openSettings();
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
                touchAction: 'manipulation',
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
