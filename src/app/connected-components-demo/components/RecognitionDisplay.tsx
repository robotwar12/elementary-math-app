'use client';

import React from 'react';
import { RecognitionResult } from './ONNXDigitRecognizer';
import { ConfidenceDisplay, AverageConfidenceDisplay } from './ConfidenceDisplay';

interface RecognitionDisplayProps {
  results: RecognitionResult[];
  recognizedText: string;
  averageConfidence: number;
  lowConfidenceCount: number;
  processingTime?: number;
  isLoading?: boolean;
}

export const RecognitionDisplay: React.FC<RecognitionDisplayProps> = ({
  results,
  recognizedText,
  averageConfidence,
  lowConfidenceCount,
  processingTime,
  isLoading = false
}) => {
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      {/* 인식된 텍스트 */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          🔤 인식 결과
        </h3>
        
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">숫자 인식 중...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-3xl font-bold text-center py-4 bg-gray-50 rounded-lg">
              {recognizedText || '숫자를 그려보세요'}
            </div>
            
            {/* Phase 3: 개선된 신뢰도 UI */}
            {results.length > 0 && (
              <AverageConfidenceDisplay
                averageConfidence={averageConfidence}
                lowConfidenceCount={lowConfidenceCount}
                totalCount={results.length}
                recognizedText={recognizedText}
              />
            )}
            
            {processingTime && (
              <div className="text-center text-sm text-gray-600 mt-2">
                ⚡ 처리 시간: {processingTime.toFixed(0)}ms
              </div>
            )}
          </div>
        )}
      </div>

      {/* 개별 숫자 인식 결과 */}
      {results.length > 0 && !isLoading && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            🔍 상세 분석 결과
          </h3>
          
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={result.component.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-800">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      숫자: {result.predictedDigit >= 0 ? result.predictedDigit : '?'}
                    </div>
                    <div className="text-sm text-gray-600">
                      위치: ({result.component.boundingBox.minX}, {result.component.boundingBox.minY})
                      크기: {result.component.boundingBox.width}×{result.component.boundingBox.height}
                      픽셀수: {result.component.pixels.length}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* 28x28 정규화된 이미지 시각화 */}
                  {result.normalizedImageDataUrl && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        28x28 정규화
                      </div>
                      <img
                        src={result.normalizedImageDataUrl}
                        alt={`연결성분 ${index} 정규화 이미지`}
                        className="w-12 h-12 border border-gray-300 rounded"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  )}
                  
                  {/* Phase 3: 개선된 신뢰도 UI */}
                  <ConfidenceDisplay
                    confidence={result.confidence}
                    predictedDigit={result.predictedDigit >= 0 ? result.predictedDigit : -1}
                    isLowConfidence={result.isLowConfidence}
                    compact={true}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 성능 정보 */}
      {processingTime && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">⚡ 성능 정보</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              ONNX 추론 시간: {processingTime.toFixed(0)}ms
            </div>
            <div>
              평균 신뢰도: {(averageConfidence * 100).toFixed(1)}%
            </div>
          </div>
          
          {averageConfidence < 0.5 && (
            <div className="mt-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
              💡 팁: 더 명확하게 숫자를 그려보세요. 연결되지 않은 부분이나 겹치는 부분이 있을 수 있습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
