'use client';

import { useRef, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Problem, ProblemCardProps } from '../types';
import { StrokeDigitRecognizerWrapper, RecognitionResult } from './StrokeDigitRecognizer';

export default function ProblemCard({ problem, number, onAnswerChange }: ProblemCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const digitRecognizer = useRef<StrokeDigitRecognizerWrapper | null>(null);
  const [recognizedNumber, setRecognizedNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true); // 시작할 때 로딩 상태
  const [isReady, setIsReady] = useState(false);

  // 컴포넌트 마운트 시 인식기 초기화 및 캔버스 크기 설정
  useEffect(() => {
    const initializeRecognizer = async () => {
      const canvas = canvasRef.current;
      if (!canvas || digitRecognizer.current) return;

      // 캔버스 크기를 부모 컨테이너에 맞게 동적 설정
      const container = canvas.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        canvas.width = containerRect.width - 16; // padding 제외
        canvas.height = 80;
        console.log('📐 캔버스 크기 설정:', canvas.width, 'x', canvas.height);
      }

      try {
        setIsModelLoading(true);
        setIsReady(false);
        console.log('🚀 StrokeDigitRecognizer 초기화 시작...');
        
        const recognizer = new StrokeDigitRecognizerWrapper();
        
        // 인식 완료 콜백 함수 정의
        const handleAutoRecognition = (result: RecognitionResult) => {
          console.log(`🎯 [${new Date().toLocaleTimeString()}] 자동 인식 완료 콜백 호출됨:`, result);
          
          if (result.success && result.digits) {
            // flushSync로 즉시 화면에 결과 표시
            console.log(`🎯 [${new Date().toLocaleTimeString()}] UI 업데이트 시작 - setRecognizedNumber("${result.digits}")`);
            flushSync(() => {
              setRecognizedNumber(result.digits);
            });
            console.log(`✅ [${new Date().toLocaleTimeString()}] UI 업데이트 완료 - setRecognizedNumber("${result.digits}")`);
            
            // 부모 컴포넌트에 결과 전달
            console.log(`📤 [${new Date().toLocaleTimeString()}] 부모에게 결과 전달: onAnswerChange(${problem.id}, "${result.digits}")`);
            onAnswerChange(problem.id, result.digits);
          } else {
            console.log(`❌ [${new Date().toLocaleTimeString()}] 인식 실패 - UI 업데이트`);
            flushSync(() => {
              setRecognizedNumber('인식 실패');
            });
          }
        };
        
        await recognizer.initializeRecognizer(canvas, handleAutoRecognition);
        digitRecognizer.current = recognizer;
        
        setIsModelLoading(false);
        setIsReady(true);
        console.log('✅ 인식기 초기화 완료');
      } catch (error) {
        console.error('❌ 인식기 초기화 실패:', error);
        setIsModelLoading(false);
        setIsReady(false);
        setRecognizedNumber('초기화 실패');
      }
    };

    // 약간의 지연을 두어 컨테이너가 완전히 렌더링된 후 초기화
    const timer = setTimeout(initializeRecognizer, 100);
    return () => clearTimeout(timer);
  }, []);

  // AI 인식 함수 - async/await + flushSync로 즉시 UI 업데이트
  const handleRecognize = async (): Promise<RecognitionResult | null> => {
    const startTime = performance.now();
    console.log(`🚀 [${new Date().toLocaleTimeString()}] handleRecognize 시작`);
    
    const recognizer = digitRecognizer.current;
    if (!recognizer || !recognizer.isReady() || !isReady) {
      console.log('⚠️ 인식기가 준비되지 않음');
      return null;
    }

    const strokeCount = recognizer.getStrokeCount();
    if (strokeCount === 0) {
      console.log('⚠️ 스트로크가 없음');
      return null;
    }

    // 즉시 처리 상태 표시 (flushSync로 강제 렌더링)
    const uiStartTime = performance.now();
    console.log(`🎯 [${new Date().toLocaleTimeString()}] UI 업데이트 시작 - setIsProcessing(true)`);
    flushSync(() => {
      setIsProcessing(true);
    });
    console.log(`✅ [${new Date().toLocaleTimeString()}] UI 업데이트 완료 - setIsProcessing(true) (${(performance.now() - uiStartTime).toFixed(2)}ms)`);
    
    try {
      console.log(`🔍 [${new Date().toLocaleTimeString()}] 숫자 인식 시작...`);
      const recognitionStartTime = performance.now();
      const result: RecognitionResult = await recognizer.recognizeDigits();
      const recognitionEndTime = performance.now();
      
      console.log(`🔢 [${new Date().toLocaleTimeString()}] 인식 결과:`, result);
      console.log(`⏱️ 인식 처리 시간: ${(recognitionEndTime - recognitionStartTime).toFixed(2)}ms`);
      
      // React 18 배치 처리를 우회하여 즉시 UI 업데이트
      if (result.success && result.digits) {
        const digits = result.digits;
        
        // flushSync로 즉시 화면에 결과 표시
        const uiUpdateStartTime = performance.now();
        console.log(`🎯 [${new Date().toLocaleTimeString()}] UI 업데이트 시작 - setRecognizedNumber("${digits}")`);
        flushSync(() => {
          setRecognizedNumber(digits);
        });
        const uiUpdateEndTime = performance.now();
        console.log(`✅ [${new Date().toLocaleTimeString()}] UI 업데이트 완료 - setRecognizedNumber("${digits}") (${(uiUpdateEndTime - uiUpdateStartTime).toFixed(2)}ms)`);
        
        // 부모 컴포넌트에 결과 전달
        console.log(`📤 [${new Date().toLocaleTimeString()}] 부모에게 결과 전달: onAnswerChange(${problem.id}, "${digits}")`);
        onAnswerChange(problem.id, digits);
        
        console.log(`🎉 [${new Date().toLocaleTimeString()}] 전체 처리 완료 - 총 시간: ${(performance.now() - startTime).toFixed(2)}ms`);
        return result;
      } else {
        console.log(`❌ [${new Date().toLocaleTimeString()}] 인식 실패 - UI 업데이트 시작`);
        flushSync(() => {
          setRecognizedNumber('인식 실패');
        });
        console.log(`❌ [${new Date().toLocaleTimeString()}] 인식 실패 UI 업데이트 완료`);
        console.log('❌ 인식 실패:', result.error);
        return result;
      }
      
    } catch (error) {
      console.error(`💥 [${new Date().toLocaleTimeString()}] 인식 오류:`, error);
      flushSync(() => {
        setRecognizedNumber('오류');
      });
      return null;
    } finally {
      // 처리 상태 해제도 즉시 반영
      const finalUiStartTime = performance.now();
      console.log(`🏁 [${new Date().toLocaleTimeString()}] 최종 UI 업데이트 시작 - setIsProcessing(false)`);
      flushSync(() => {
        setIsProcessing(false);
      });
      console.log(`🏁 [${new Date().toLocaleTimeString()}] 최종 UI 업데이트 완료 - setIsProcessing(false) (${(performance.now() - finalUiStartTime).toFixed(2)}ms)`);
    }
  };

  // 캔버스 지우기 - flushSync로 즉시 UI 업데이트
  const handleClear = () => {
    const recognizer = digitRecognizer.current;
    if (recognizer) {
      recognizer.clearCanvas();
    } else {
      // 백업으로 직접 캔버스 지우기
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
    
    // 즉시 상태 초기화
    flushSync(() => {
      setRecognizedNumber('');
    });
    onAnswerChange(problem.id, '');
  };

  // 캔버스 드로잉 로직
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 로딩 중이거나 준비되지 않았으면 드로잉 금지
    if (isModelLoading || !isReady) {
      console.log('⚠️ 인식기 로딩 중입니다. 잠시만 기다려주세요.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = async () => {
    if (!isDrawing) return; // 중복 실행 방지
    console.log(`🖱️ [${new Date().toLocaleTimeString()}] stopDrawing 호출됨`);
    setIsDrawing(false);
    
    // 즉시 인식 시작 (지연 없음)
    console.log(`🚀 [${new Date().toLocaleTimeString()}] handleRecognize 호출 시작`);
    await handleRecognize();
    console.log(`🏁 [${new Date().toLocaleTimeString()}] handleRecognize 호출 완료`);
  };

  // 마우스가 캔버스를 벗어날 때는 드로잉만 중단
  const stopDrawingOnly = () => {
    setIsDrawing(false);
  };

  // 터치 이벤트 (모바일 지원)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // 로딩 중이거나 준비되지 않았으면 터치 금지
    if (isModelLoading || !isReady) {
      console.log('⚠️ 인식기 로딩 중입니다. 잠시만 기다려주세요.');
      e.preventDefault();
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleTouchEnd = async (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return; // 중복 실행 방지
    console.log(`👆 [${new Date().toLocaleTimeString()}] handleTouchEnd 호출됨`);
    setIsDrawing(false);
    
    // 즉시 인식 시작 (지연 없음)
    console.log(`🚀 [${new Date().toLocaleTimeString()}] handleRecognize 호출 시작 (터치)`);
    await handleRecognize();
    console.log(`🏁 [${new Date().toLocaleTimeString()}] handleRecognize 호출 완료 (터치)`);
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
          border: `2px dashed ${isModelLoading ? '#d1d5db' : '#93c5fd'}`, 
          borderRadius: '8px', 
          backgroundColor: isModelLoading ? '#f9fafb' : '#f0f9ff',
          padding: '0.5rem',
          position: 'relative'
        }}>
          {isModelLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              zIndex: 10
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #4f46e5',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }}></div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#6b7280',
                textAlign: 'center'
              }}>
                인식기 로딩 중...
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={400}
            height={120}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawingOnly}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              width: '100%', 
              height: '80px', 
              cursor: isModelLoading || !isReady ? 'not-allowed' : 'crosshair',
              backgroundColor: 'white',
              borderRadius: '4px',
              opacity: isModelLoading ? 0.5 : 1,
              display: 'block'
            }}
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
        {isModelLoading ? (
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            <i className="ri-loader-4-line" style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }}></i>
            인식기 로딩 중...
          </div>
        ) : isProcessing ? (
          <div style={{ fontSize: '0.8rem', color: '#4f46e5' }}>
            <i className="ri-loader-4-line" style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }}></i>
            숫자 인식 중...
          </div>
        ) : recognizedNumber ? (
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
            {isReady ? '필기 후 인식 결과가 표시됩니다' : '인식기 준비 중...'}
          </div>
        )}
      </div>
    </div>
  );
}
