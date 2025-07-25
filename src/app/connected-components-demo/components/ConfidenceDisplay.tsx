import React from 'react';

export interface ConfidenceDisplayProps {
  confidence: number;
  predictedDigit: number;
  isLowConfidence: boolean;
  compact?: boolean;
}

/**
 * Phase 3 최적화: 인식 신뢰도 UI 컴포넌트
 */
export const ConfidenceDisplay: React.FC<ConfidenceDisplayProps> = ({
  confidence,
  predictedDigit,
  isLowConfidence,
  compact = false
}) => {
  // 신뢰도에 따른 색상 결정
  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.9) return '#22c55e'; // 초록색 (매우 높음)
    if (conf >= 0.7) return '#f59e0b'; // 주황색 (보통)
    return '#ef4444'; // 빨간색 (낮음)
  };

  // 신뢰도에 따른 텍스트
  const getConfidenceText = (conf: number): string => {
    if (conf >= 0.9) return '매우 높음';
    if (conf >= 0.7) return '보통';
    return '낮음';
  };

  const confidencePercent = Math.round(confidence * 100);
  const color = getConfidenceColor(confidence);
  const confidenceText = getConfidenceText(confidence);

  if (compact) {
    // 컴팩트 모드: 간단한 표시
    return (
      <span 
        className="inline-flex items-center gap-1 text-sm font-medium"
        style={{ color }}
      >
        <span className="text-lg font-bold">{predictedDigit}</span>
        <span className="text-xs opacity-75">
          {confidencePercent}%
        </span>
      </span>
    );
  }

  // 상세 모드: 전체 정보 표시
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
      {/* 예측된 숫자 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">숫자:</span>
        <span className="text-xl font-bold text-gray-800">{predictedDigit}</span>
      </div>

      {/* 신뢰도 바 */}
      <div className="flex-1 min-w-16">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs text-gray-500">신뢰도:</span>
          <span 
            className="text-xs font-medium"
            style={{ color }}
          >
            {confidencePercent}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${confidencePercent}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>

      {/* 신뢰도 텍스트 */}
      <div className="text-right">
        <div 
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{
            color: color,
            backgroundColor: color + '20', // 20% 투명도
            border: `1px solid ${color}40`
          }}
        >
          {confidenceText}
        </div>
        {isLowConfidence && (
          <div className="text-xs text-red-500 mt-1">
            ⚠️ 재입력 권장
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 여러 결과의 평균 신뢰도 표시
 */
export interface AverageConfidenceDisplayProps {
  averageConfidence: number;
  lowConfidenceCount: number;
  totalCount: number;
  recognizedText: string;
}

export const AverageConfidenceDisplay: React.FC<AverageConfidenceDisplayProps> = ({
  averageConfidence,
  lowConfidenceCount,
  totalCount,
  recognizedText
}) => {
  const confidencePercent = Math.round(averageConfidence * 100);
  const color = averageConfidence >= 0.9 ? '#22c55e' : 
                averageConfidence >= 0.7 ? '#f59e0b' : '#ef4444';

  return (
    <div className="p-3 bg-white border rounded-lg shadow-sm">
      {/* 인식된 텍스트 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-500">인식 결과:</span>
        <span className="text-2xl font-bold text-gray-800 font-mono">
          {recognizedText || '(없음)'}
        </span>
      </div>

      {/* 전체 신뢰도 */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">평균 신뢰도</div>
          <div 
            className="text-lg font-bold"
            style={{ color }}
          >
            {confidencePercent}%
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">인식 개수</div>
          <div className="text-lg font-bold text-gray-800">
            {totalCount}개
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">낮은 신뢰도</div>
          <div className={`text-lg font-bold ${lowConfidenceCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {lowConfidenceCount}개
          </div>
        </div>
      </div>

      {/* 경고 메시지 */}
      {lowConfidenceCount > 0 && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          ⚠️ {lowConfidenceCount}개 숫자의 신뢰도가 낮습니다. 더 명확하게 써보세요.
        </div>
      )}

      {/* 성공 메시지 */}
      {lowConfidenceCount === 0 && totalCount > 0 && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600">
          ✅ 모든 숫자가 높은 신뢰도로 인식되었습니다!
        </div>
      )}
    </div>
  );
};
