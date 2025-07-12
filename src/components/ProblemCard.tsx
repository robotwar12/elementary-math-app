'use client';

import { useRef, useEffect, useState } from 'react';
import { Problem, ProblemCardProps } from '../types';

export default function ProblemCard({ problem, number, onAnswerChange }: ProblemCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [recognizedNumber, setRecognizedNumber] = useState<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);

        // 캔버스 크기 설정
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect && context) {
      setIsDrawing(true);
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      context.lineTo(x, y);
      context.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // 간단한 모의 숫자 인식 (실제로는 AI 모델을 사용)
    setTimeout(() => {
      const mockRecognition = Math.floor(Math.random() * 1000);
      const recognizedAnswer = mockRecognition.toString();
      setRecognizedNumber(recognizedAnswer);
      
      // 부모 컴포넌트로 답안 전달
      onAnswerChange(problem.id, recognizedAnswer);
    }, 500);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      setRecognizedNumber('');
      onAnswerChange(problem.id, '');
    }
  };

  // 터치 이벤트 처리
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect && context && e.touches[0]) {
      setIsDrawing(true);
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !context) return;

    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect && e.touches[0]) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      context.lineTo(x, y);
      context.stroke();
    }
  };

  const stopDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  return (
    <div className="problem-card">
      {/* 문제 번호 */}
      <div style={{ 
        position: 'absolute', 
        top: '-10px', 
        right: '-10px', 
        width: '30px', 
        height: '30px', 
        backgroundColor: '#4f46e5', 
        color: 'white', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '14px', 
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        {number}
      </div>

      {/* 세로셈 표시 */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        marginBottom: '1rem' 
      }}>
        <div style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          fontFamily: 'monospace',
          minWidth: '120px',
          position: 'relative'
        }}>
          {/* 첫 번째 숫자 - 오른쪽 정렬 */}
          <div style={{ 
            textAlign: 'right', 
            marginBottom: '0.5rem',
            lineHeight: '1.2'
          }}>
            {problem.num1}
          </div>
          
          {/* 두 번째 숫자와 연산자 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '0.5rem',
            lineHeight: '1.2'
          }}>
            <span style={{ 
              color: '#4f46e5', 
              marginRight: '1rem',
              minWidth: '20px',
              textAlign: 'left'
            }}>
              {problem.operator}
            </span>
            <span style={{ 
              flex: 1, 
              textAlign: 'right' 
            }}>
              {problem.num2}
            </span>
          </div>
          
          {/* 구분선 */}
          <div style={{ 
            borderBottom: '3px solid #374151', 
            width: '100%', 
            marginBottom: '0.5rem' 
          }}></div>
        </div>
      </div>

      {/* 필기 입력 영역 */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '500' }}>
            <i className="ri-pencil-line" style={{ marginRight: '0.5rem', color: '#4f46e5' }}></i>
            답을 써주세요
          </span>
          <button
            onClick={clearCanvas}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}
          >
            <i className="ri-eraser-line" style={{ marginRight: '0.25rem' }}></i>
            지우기
          </button>
        </div>

        <div style={{ 
          border: '2px dashed #93c5fd', 
          borderRadius: '8px', 
          backgroundColor: '#f0f9ff',
          padding: '0.5rem'
        }}>
          <canvas
            ref={canvasRef}
            style={{ 
              width: '100%', 
              height: '80px', 
              cursor: 'crosshair',
              backgroundColor: 'white',
              borderRadius: '4px'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawingTouch}
            onTouchMove={drawTouch}
            onTouchEnd={stopDrawingTouch}
          />
        </div>
      </div>

      {/* 인식된 숫자 표시 */}
      <div style={{ 
        padding: '0.5rem', 
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        textAlign: 'center',
        minHeight: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {recognizedNumber ? (
          <>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              인식된 답
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#374151' }}>
              {recognizedNumber}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            필기 후 인식 결과가 표시됩니다
          </div>
        )}
      </div>
    </div>
  );
}
