'use client'

import { AnalysisResult, ConnectedComponent } from './ComponentAnalyzer'

interface ResultDisplayProps {
  result: AnalysisResult | null
  isAnalyzing: boolean
}

export function ResultDisplay({ result, isAnalyzing }: ResultDisplayProps) {
  
  if (isAnalyzing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <h3 className="text-lg font-semibold text-blue-800">분석 진행 중...</h3>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          연결성분을 분석하고 있습니다. 잠시만 기다려주세요.
        </p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">분석 결과</h3>
        <p className="text-gray-500 text-sm">
          캔버스에 그림을 그려보세요. 자동으로 연결성분 분석이 시작됩니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 성능 메트릭 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-3">⚡ 성능 메트릭</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {result.processingTime.toFixed(1)}
            </div>
            <div className="text-xs text-green-600">처리 시간 (ms)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {result.components.length}
            </div>
            <div className="text-xs text-green-600">연결성분 개수</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {result.totalPixels}
            </div>
            <div className="text-xs text-green-600">총 픽셀 수</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {(result.memoryUsage / 1024).toFixed(1)}
            </div>
            <div className="text-xs text-green-600">메모리 (KB)</div>
          </div>
        </div>
      </div>

      {/* 연결성분 상세 정보 */}
      {result.components.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🎨 연결성분 세부 정보 ({result.components.length}개)
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {result.components.map((component) => (
              <ComponentCard key={component.id} component={component} />
            ))}
          </div>

          {/* 분석 요약 */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2">📊 분석 요약</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">평균 크기:</span>
                <span className="ml-2 font-medium">
                  {(result.totalPixels / result.components.length).toFixed(0)} 픽셀
                </span>
              </div>
              <div>
                <span className="text-gray-600">최대 성분:</span>
                <span className="ml-2 font-medium">
                  #{Math.max(...result.components.map(c => c.area))} 픽셀
                </span>
              </div>
              <div>
                <span className="text-gray-600">최소 성분:</span>
                <span className="ml-2 font-medium">
                  #{Math.min(...result.components.map(c => c.area))} 픽셀
                </span>
              </div>
              <div>
                <span className="text-gray-600">처리 속도:</span>
                <span className="ml-2 font-medium">
                  {(result.totalPixels / result.processingTime * 1000).toFixed(0)} 픽셀/초
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 연결성분 없음</h3>
          <p className="text-yellow-700 text-sm">
            분석 결과 유효한 연결성분이 발견되지 않았습니다. 더 큰 영역에 그림을 그려보세요.
          </p>
          <div className="mt-2 text-xs text-yellow-600">
            💡 팁: 최소 5픽셀 이상의 크기가 있어야 연결성분으로 인식됩니다.
          </div>
        </div>
      )}
    </div>
  )
}

// 개별 연결성분 카드 컴포넌트
function ComponentCard({ component }: { component: ConnectedComponent }) {
  const { boundingBox } = component
  
  return (
    <div className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border-2"
            style={{ borderColor: component.color, backgroundColor: component.color + '20' }}
          />
          <span className="font-medium text-gray-800">
            성분 #{component.id}
          </span>
        </div>
        <span className="text-sm text-gray-600">
          {component.area} 픽셀
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
        <div>
          <span className="text-gray-500">위치:</span>
          <span className="ml-1">
            ({boundingBox.minX}, {boundingBox.minY})
          </span>
        </div>
        <div>
          <span className="text-gray-500">크기:</span>
          <span className="ml-1">
            {boundingBox.width}×{boundingBox.height}
          </span>
        </div>
        <div>
          <span className="text-gray-500">밀도:</span>
          <span className="ml-1">
            {((component.area / (boundingBox.width * boundingBox.height)) * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">비율:</span>
          <span className="ml-1">
            {(boundingBox.width / boundingBox.height).toFixed(2)}
          </span>
        </div>
      </div>

      {/* 간단한 모양 분류 */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">예상 형태: </span>
        <span className="text-xs font-medium text-gray-700">
          {classifyShape(component)}
        </span>
      </div>
    </div>
  )
}

// 간단한 모양 분류 함수
function classifyShape(component: ConnectedComponent): string {
  const { boundingBox, area } = component
  const { width, height } = boundingBox
  const aspectRatio = width / height
  const density = area / (width * height)
  
  // 밀도 기반 분류
  if (density > 0.8) {
    if (aspectRatio > 1.5) return "수평선"
    if (aspectRatio < 0.67) return "수직선"
    return "채워진 형태"
  }
  
  if (density > 0.5) {
    if (aspectRatio > 2) return "긴 수평 모양"
    if (aspectRatio < 0.5) return "긴 수직 모양"
    return "중간 밀도 형태"
  }
  
  // 비율 기반 분류
  if (aspectRatio > 2) return "가로로 긴 형태"
  if (aspectRatio < 0.5) return "세로로 긴 형태"
  if (Math.abs(aspectRatio - 1) < 0.2) return "정사각형 형태"
  
  return "일반 형태"
}
