'use client';

import { useRef } from 'react';
import { ProblemCardProps, StrokeData } from '../types';
import { ConnectedCanvas } from '../app/connected-components-demo/components/ConnectedCanvas';
import { AnalysisResult } from '../app/connected-components-demo/components/ComponentAnalyzer';
import { RecognitionResult, ONNXDigitRecognizer } from '../app/connected-components-demo/components/ONNXDigitRecognizer';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { useProblemState } from '../hooks/useProblemState';
import ProblemDisplay from './ProblemDisplay';
import RecognitionResultDisplay from './RecognitionResultDisplay';

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
  const canvasSize = useResponsiveCanvas();
  const {
    analysisResult,
    recognitionResults,
    recognitionText,
    averageConfidence,
    lowConfidenceCount,
    recognitionTime,
    isRecognizing,
    isRestoredAnswer,
    handleAnalysisComplete,
    handleRecognitionComplete,
    handleClear,
    handleCanvasDataUpdate
  } = useProblemState(
    problem,
    initialAnswer,
    onAnswerChange,
    onCanvasDataChange
  );

  return (
    <div className="problem-card">
      {/* 문제 표시 컴포넌트 */}
      <ProblemDisplay problem={problem} number={number} />

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

      {/* 인식 결과 표시 컴포넌트 */}
      <RecognitionResultDisplay
        isRecognizing={isRecognizing}
        recognitionText={recognitionText}
        recognitionResults={recognitionResults}
        averageConfidence={averageConfidence}
        lowConfidenceCount={lowConfidenceCount}
        isRestoredAnswer={isRestoredAnswer}
      />
    </div>
  );
}
