'use client';

import { useRef, useState, useEffect } from 'react';
import { Problem, ProblemCardProps, StrokeData } from '../types';
import { ConnectedCanvas } from '../app/connected-components-demo/components/ConnectedCanvas';
import { AnalysisResult } from '../app/connected-components-demo/components/ComponentAnalyzer';
import { RecognitionResult, ONNXDigitRecognizer } from '../app/connected-components-demo/components/ONNXDigitRecognizer';

export default function ProblemCardV2({ 
  problem, 
  number, 
  onAnswerChange, 
  onCanvasDataChange, 
  palmRejection = true, 
  initialAnswer = '', 
  initialCanvasData = [] 
}: ProblemCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [recognitionResults, setRecognitionResults] = useState<RecognitionResult[]>([]);
  const [recognitionText, setRecognitionText] = useState<string>(initialAnswer);
  const [averageConfidence, setAverageConfidence] = useState<number>(0);
  const [lowConfidenceCount, setLowConfidenceCount] = useState<number>(0);
  const [recognitionTime, setRecognitionTime] = useState<number>(0);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 120 });
  const [isRestoredAnswer, setIsRestoredAnswer] = useState<boolean>(!!initialAnswer);

  // 화면 크기에 따른 캔버스 크기 계산 (실제 크기와 표시 크기 일치)
  const calculateCanvasSize = () => {
    if (typeof window === 'undefined') return { width: 400, height: 120 };
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    if (screenWidth <= 400) {
      // 모바일: 여백 40px 고려하여 최대 350px, 최소 280px
      const width = Math.max(Math.min(screenWidth - 40, 350), 280);
      // 비율 유지: 400:120 = 10:3
      const height = Math.round(width * 0.3);
      return { width, height };
    } else if (screenWidth >= 768 && screenWidth <= 1024) {
      // 태블릿: 6문제 한 화면에 맞춰 작은 캔버스
      const containerWidth = (screenWidth - 60) / 3; // 3열 그리드, 여백 고려
      const width = Math.min(containerWidth - 20, 320); // 카드 패딩 고려
      const height = Math.min(80, Math.round(width * 0.25)); // 더 납작한 비율
      return { width, height };
    } else if (screenWidth <= 768) {
      // 작은 태블릿
      const width = 360;
      const height = Math.round(width * 0.3); // 108px
      return { width, height };
    }
    // 데스크톱: 기존 크기 유지
    return { width: 400, height: 120 };
  };

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize(calculateCanvasSize());
    };

    // 초기 크기 설정
    handleResize();

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
  
  // 캔버스 데이터 복원 상태 로깅
  useEffect(() => {
    console.log(`🎨 문제 ${problem.id} 캔버스 데이터: ${initialCanvasData.length}개 스트로크`);
  }, [initialCanvasData.length, problem.id]);

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

  const handleCanvasDataUpdate = (strokeData: StrokeData[]) => {
    if (onCanvasDataChange) {
      onCanvasDataChange(problem.id, strokeData);
    }
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
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 10
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

      {/* ONNX 통합 캔버스 영역 */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '0.5rem' 
        }}>
          <span style={{ 
            fontSize: '0.9rem', 
            color: '#6b7280', 
            fontWeight: '500' 
          }}>
            <i className="ri-magic-line" style={{ 
              marginRight: '0.5rem', 
              color: '#4f46e5' 
            }}></i>
            ONNX 인식 답안
          </span>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#9ca3af' 
          }}>
            {recognitionTime > 0 && `${recognitionTime.toFixed(0)}ms`}
          </div>
        </div>

        <div style={{ 
          border: '2px dashed #93c5fd', 
          borderRadius: '8px', 
          backgroundColor: '#f0f9ff',
          overflow: 'hidden',
          maxWidth: '100%'
        }}>
          <ConnectedCanvas
            canvasRef={canvasRef}
            onAnalysisComplete={handleAnalysisComplete}
            onRecognitionComplete={handleRecognitionComplete}
            onClear={handleClear}
            onCanvasDataChange={handleCanvasDataUpdate}
            autoAnalyze={true}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            simplifiedUI={true}
            palmRejection={palmRejection}
            initialCanvasData={initialCanvasData}
          />
        </div>
      </div>

      {/* 인식 결과 표시 */}
      <div style={{ 
        padding: '0.75rem', 
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        textAlign: 'center',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {isRecognizing ? (
          <div style={{ fontSize: '0.8rem', color: '#4f46e5' }}>
            <i className="ri-loader-4-line" style={{ 
              marginRight: '0.5rem', 
              animation: 'spin 1s linear infinite' 
            }}></i>
            ONNX 모델 인식 중...
          </div>
        ) : recognitionText ? (
          <>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#6b7280', 
              marginBottom: '0.25rem' 
            }}>
              {isRestoredAnswer ? '복원된 답안' : '인식된 답'}
              {isRestoredAnswer && (
                <span style={{ 
                  color: '#10b981', 
                  marginLeft: '0.5rem',
                  fontSize: '0.7rem'
                }}>
                  ✅ 복원됨
                </span>
              )}
              {lowConfidenceCount > 0 && !isRestoredAnswer && (
                <span style={{ 
                  color: '#f59e0b', 
                  marginLeft: '0.5rem',
                  fontSize: '0.7rem'
                }}>
                  ({lowConfidenceCount}개 낮은 신뢰도)
                </span>
              )}
            </div>
            <div style={{ 
              fontSize: '1.4rem', 
              fontWeight: 'bold', 
              color: averageConfidence > 0.8 ? '#059669' : 
                     averageConfidence > 0.6 ? '#d97706' : '#dc2626',
              marginBottom: '0.25rem'
            }}>
              {recognitionText}
            </div>
            <div style={{ 
              fontSize: '0.7rem', 
              color: '#9ca3af' 
            }}>
              평균 신뢰도: {(averageConfidence * 100).toFixed(1)}% | 
              성분 {recognitionResults.length}개
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            숫자를 그려주세요. 연결성분 분석 후 ONNX 모델이 실시간으로 인식합니다.
          </div>
        )}
      </div>

    </div>
  );
}
