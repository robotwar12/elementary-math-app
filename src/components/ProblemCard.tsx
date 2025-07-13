'use client';

import { useRef, useState } from 'react';
import { Problem, ProblemCardProps } from '../types';
import { DigitRecognizer } from './DigitRecognizer';

export default function ProblemCard({ problem, number, onAnswerChange }: ProblemCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const digitRecognizer = useRef<DigitRecognizer>(new DigitRecognizer());
  const [recognizedNumber, setRecognizedNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // AI 인식 함수
  const handleRecognize = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    
    try {
      // 모델 초기화 (최초 한 번)
      setIsModelLoading(true);
      await digitRecognizer.current.initializeWeights();
      setIsModelLoading(false);

      // 숫자 인식 실행
      const recognizedDigits = await digitRecognizer.current.recognizeDigits(canvas);
      const result = recognizedDigits.join('');
      
      console.log('🔢 인식 결과:', result);
      setRecognizedNumber(result);
      
      // 부모 컴포넌트로 답안 전달
      onAnswerChange(problem.id, result);
      
    } catch (error) {
      console.error('❌ 인식 오류:', error);
      setRecognizedNumber('오류');
    } finally {
      setIsProcessing(false);
    }
  };

  // 캔버스 지우기
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setRecognizedNumber('');
    onAnswerChange(problem.id, '');
  };

  // 캔버스 드로잉 로직
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // 드로잉 스타일 설정
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // 드로잉 완료 후 500ms 후 자동 인식
    setTimeout(() => {
      handleRecognize();
    }, 500);
  };

  // 터치 이벤트 (모바일 지원)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
    // 터치 완료 후 자동 인식
    setTimeout(() => {
      handleRecognize();
    }, 500);
  };

  return (
    <div className="problem-card">
      {/* 문제 번호 */}
      <div style={{ 
        position: 'absolute', 
        top: '-10px', 
        left: '-10px', 
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
            onClick={handleClear}
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
            width={200}
            height={80}
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
