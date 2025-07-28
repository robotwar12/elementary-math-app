'use client'

import { useEffect, RefObject, useRef } from 'react'
import { usePalmRejection } from '../hooks/usePalmRejection'
import { useCanvasDrawing } from '../hooks/useCanvasDrawing'
import { useCanvasEvents } from '../hooks/useCanvasEvents'

interface CanvasDrawingProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  onRecognize: () => void
  onClear: () => void
  isProcessing: boolean
  isModelLoading: boolean
  realTimeRecognition?: boolean
  palmRejection?: boolean
  palmRejectionSensitivity?: 'low' | 'medium' | 'high'
}

export function CanvasDrawing({
  canvasRef,
  onRecognize,
  onClear,
  isProcessing,
  isModelLoading,
  realTimeRecognition = true,
  palmRejection = true,
  palmRejectionSensitivity = 'medium'
}: CanvasDrawingProps) {
  
  const containerRef = useRef<HTMLDivElement>(null)

  // Palm Rejection Hook 사용 (활성화된 경우에만)
  const palmRejectionHook = usePalmRejection({
    enabled: palmRejection,
    config: {
      penOnlyMode: palmRejection,
      sensitivity: palmRejectionSensitivity
    }
  })

  const {
    containerRef: palmContainerRef,
    updateConfig
  } = palmRejectionHook

  // 그리기 로직 훅 사용
  const drawingHook = useCanvasDrawing({
    canvasRef,
    onRecognize,
    realTimeRecognition,
    isProcessing
  })

  const {
    currentStrokePoints,
    allStrokes,
    isDrawing,
    setIsDrawing,
    triggerRealTimeRecognition,
    clearAllStrokes
  } = drawingHook

  // 이벤트 핸들러 훅 사용
  const eventHandlers = useCanvasEvents({
    canvasRef,
    currentStrokePoints,
    allStrokes,
    isDrawing,
    setIsDrawing,
    triggerRealTimeRecognition,
    palmRejection,
    palmRejectionHook
  })

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handlePalmRejectionPointerDown,
    handlePalmRejectionPointerMove,
    handlePalmRejectionPointerUp
  } = eventHandlers

  // containerRef와 palmContainerRef 동기화 (Palm Rejection 활성화 시에만)
  useEffect(() => {
    if (palmRejection && containerRef.current) {
      palmContainerRef.current = containerRef.current
    }
  }, [palmRejection, palmContainerRef])

  // Palm Rejection 설정 업데이트
  useEffect(() => {
    updateConfig({
      penOnlyMode: palmRejection,
      sensitivity: palmRejectionSensitivity
    })
  }, [palmRejection, palmRejectionSensitivity, updateConfig])

  // 지우기 핸들러
  const handleClear = () => {
    clearAllStrokes()
    onClear()
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded p-2 bg-gray-50 drawing-area">
        <div className="text-center mb-2">
          <span className="text-xs text-gray-600">
            답안 작성란 (200×100px)
            {palmRejection && <span className="text-blue-600 ml-2">✋ Palm Rejection</span>}
          </span>
        </div>
        <div 
          className="flex justify-center canvas-container"
          ref={containerRef}
          style={{
            touchAction: palmRejection ? 'none' : 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            maxWidth: '100%',
            overflow: 'hidden'
          }}
        >
          <canvas
            ref={canvasRef}
            width={200}
            height={100}
            className="border border-gray-400 cursor-crosshair bg-white canvas-responsive"
            {...(palmRejection ? {
              // Palm Rejection 활성화 시: Pointer 이벤트 사용
              onPointerDown: handlePalmRejectionPointerDown,
              onPointerMove: handlePalmRejectionPointerMove,
              onPointerUp: handlePalmRejectionPointerUp,
              onPointerLeave: handlePalmRejectionPointerUp
            } : {
              // Palm Rejection 비활성화 시: 터치/마우스 이벤트 직접 사용
              onTouchStart: handleTouchStart,
              onTouchMove: handleTouchMove,
              onTouchEnd: handleTouchEnd,
              onMouseDown: handleMouseDown,
              onMouseMove: handleMouseMove,
              onMouseUp: handleMouseUp,
              onMouseLeave: handleMouseUp
            })}
            style={{ 
              backgroundColor: 'transparent',
              cursor: 'crosshair',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <button
          onClick={handleClear}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          disabled={isProcessing}
        >
          🗑️ 지우기
        </button>
        <button
          onClick={onRecognize}
          disabled={isProcessing || isModelLoading}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
        >
          {isProcessing ? '⏳ 인식 중...' : isModelLoading ? '🔄 로딩 중...' : '🔍 숫자 인식'}
        </button>
      </div>
      
      <div className="text-center text-xs text-gray-500">
        <p>💡 작은 답안란에 연속된 숫자를 써주세요</p>
        <p>📝 스타일러스 펜 압력 감응으로 더 정확한 인식!</p>
        <p>✨ 부드러운 필기감으로 자연스럽게 써보세요</p>
        {palmRejection && (
          <p className="text-blue-600">🖐️ Palm Rejection으로 손바닥 터치가 차단됩니다</p>
        )}
      </div>
    </div>
  )
}
