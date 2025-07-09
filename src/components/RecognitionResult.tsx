'use client'

interface RecognitionResultProps {
  recognizedText: string
  confidence: number
  processingTime: number
  segmentedDigits: ImageData[]
  segmentationQuality: number
}

export function RecognitionResult({
  recognizedText,
  confidence,
  processingTime,
  segmentedDigits,
  segmentationQuality
}: RecognitionResultProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold text-gray-800 mb-2">인식 결과:</h3>
      <div className="text-2xl font-bold text-blue-600 mb-2">
        {recognizedText || '아직 인식된 숫자가 없습니다'}
      </div>
      
      {/* 성능 정보 */}
      {recognizedText && (
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <span>신뢰도: <strong className="text-green-600">{confidence.toFixed(1)}%</strong></span>
          <span>처리시간: <strong className="text-blue-600">{processingTime}ms</strong></span>
          <span>세그먼트 개수: <strong className="text-purple-600">{segmentedDigits.length}개</strong></span>
          <span>분할 품질: <strong className="text-orange-600">{(segmentationQuality * 100).toFixed(1)}%</strong></span>
        </div>
      )}
      
      {/* 분할된 숫자 시각화 */}
      {segmentedDigits.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">분할된 숫자:</h4>
          <div className="flex justify-center gap-2 flex-wrap">
            {segmentedDigits.map((segment, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 mb-1">{index + 1}</div>
                <div className="w-7 h-7 bg-white border border-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
