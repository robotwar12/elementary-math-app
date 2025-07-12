'use client';

import { ScoreResultProps } from '../types';

export default function ScoreResult({ results, problems, onReset }: ScoreResultProps) {
  const correctCount = results.filter(result => result.isCorrect).length;
  const totalCount = results.length;
  const score = Math.round((correctCount / totalCount) * 100);

  return (
    <div className="container">
      <div className="math-practice">
        <div className="header">
          <h1>
            <i className="ri-trophy-line icon"></i>
            채점 결과
          </h1>
          <p>수고하셨습니다! 결과를 확인해보세요</p>
        </div>

        <div style={{ 
          textAlign: 'center', 
          margin: '2rem 0', 
          padding: '2rem',
          backgroundColor: score >= 80 ? '#f0fdf4' : score >= 60 ? '#fef3c7' : '#fef2f2',
          border: `3px solid ${score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}`,
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {score >= 80 ? '🎉' : score >= 60 ? '😊' : '😅'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {score}점
          </div>
          <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>
            {correctCount}/{totalCount} 문제 정답
          </div>
          <div style={{ fontSize: '1rem', color: '#6b7280', marginTop: '1rem' }}>
            {score >= 80 ? '우수한 성적입니다!' : score >= 60 ? '잘했어요!' : '더 열심히 연습해보세요!'}
          </div>
        </div>

        <div className="problem-grid">
          {results.map((result, index) => {
            const problem = problems.find(p => p.id === result.id);
            if (!problem) return null;

            return (
              <div key={result.id} style={{
                padding: '1.5rem',
                backgroundColor: result.isCorrect ? '#f0fdf4' : '#fef2f2',
                border: `2px solid ${result.isCorrect ? '#10b981' : '#ef4444'}`,
                borderRadius: '8px',
                position: 'relative'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '30px', 
                  height: '30px', 
                  backgroundColor: result.isCorrect ? '#10b981' : '#ef4444', 
                  color: 'white', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {result.id}
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', fontFamily: 'monospace' }}>
                    <div style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
                      {problem.num1}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#4f46e5', marginRight: '1rem', minWidth: '20px' }}>
                        {problem.operator}
                      </span>
                      <span style={{ flex: 1, textAlign: 'right' }}>
                        {problem.num2}
                      </span>
                    </div>
                    <div style={{ borderBottom: '3px solid #374151', width: '100%', marginBottom: '0.5rem' }}></div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    내 답: <span style={{ fontWeight: 'bold', color: result.isCorrect ? '#10b981' : '#ef4444' }}>
                      {result.userAnswer || '미응답'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1rem', color: '#6b7280' }}>
                    정답: <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                      {result.correctAnswer}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '1.2rem' }}>
                    {result.isCorrect ? '✅ 정답' : '❌ 오답'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={onReset}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            <i className="ri-refresh-line" style={{ marginRight: '0.5rem' }}></i>
            다시 시작
          </button>
        </div>
      </div>
    </div>
  );
}
