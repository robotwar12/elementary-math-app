import React from 'react';
import { RecognitionResult } from '../app/connected-components-demo/components/ONNXDigitRecognizer';

interface RecognitionResultDisplayProps {
  isRecognizing: boolean;
  recognitionText: string;
  recognitionResults: RecognitionResult[];
  averageConfidence: number;
  lowConfidenceCount: number;
  isRestoredAnswer: boolean;
}

/**
 * 인식 결과 표시 컴포넌트
 * ONNX 모델의 인식 결과와 신뢰도 정보를 표시합니다.
 */
export default function RecognitionResultDisplay({
  isRecognizing,
  recognitionText,
  recognitionResults,
  averageConfidence,
  lowConfidenceCount,
  isRestoredAnswer
}: RecognitionResultDisplayProps) {
  return (
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
  );
}