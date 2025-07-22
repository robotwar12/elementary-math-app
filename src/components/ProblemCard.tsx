'use client';

import { useRef, useState, useEffect } from 'react';
import { Problem, ProblemCardProps } from '../types';
import { ConnectedCanvas } from '../app/connected-components-demo/components/ConnectedCanvas';
import { AnalysisResult } from '../app/connected-components-demo/components/ComponentAnalyzer';
import { RecognitionResult, ONNXDigitRecognizer } from '../app/connected-components-demo/components/ONNXDigitRecognizer';

export default function ProblemCardV2({ problem, number, onAnswerChange }: ProblemCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [recognitionResults, setRecognitionResults] = useState<RecognitionResult[]>([]);
  const [recognitionText, setRecognitionText] = useState<string>('');
  const [averageConfidence, setAverageConfidence] = useState<number>(0);
  const [lowConfidenceCount, setLowConfidenceCount] = useState<number>(0);
  const [recognitionTime, setRecognitionTime] = useState<number>(0);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

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
    onAnswerChange(problem.id, '');
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
          overflow: 'hidden'
        }}>
          <ConnectedCanvas
            canvasRef={canvasRef}
            onAnalysisComplete={handleAnalysisComplete}
            onRecognitionComplete={handleRecognitionComplete}
            onClear={handleClear}
            autoAnalyze={true}
            canvasWidth={400}
            canvasHeight={120}
            simplifiedUI={true}
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
              인식된 답
              {lowConfidenceCount > 0 && (
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
