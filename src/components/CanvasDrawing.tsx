'use client'

import { useEffect, RefObject, useRef, useState, useCallback } from 'react'
import { getStroke } from 'perfect-freehand'
import { usePalmRejection } from '../hooks/usePalmRejection'

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
  
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentStrokePoints = useRef<Array<[number, number, number]>>([])
  const [isDrawing, setIsDrawing] = useState(false)

  // Palm Rejection Hook 사용
  const {
    containerRef: palmContainerRef,
    checkPointerInput,
    addActivePointer,
    removeActivePointer,
    updateConfig
  } = usePalmRejection({
    enabled: palmRejection,
    config: {
      penOnlyMode: palmRejection,
      sensitivity: palmRejectionSensitivity
    }
  })

  // containerRef와 palmContainerRef 동기화
  useEffect(() => {
    if (containerRef.current) {
      palmContainerRef.current = containerRef.current
    }
  }, [palmContainerRef])

  // 실시간 인식 함수 (디바운스 적용)
  const triggerRealTimeRecognition = useCallback(() => {
    if (!realTimeRecognition || isProcessing) return

    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current)
    }

    recognitionTimeoutRef.current = setTimeout(() => {
      console.log('🔄 실시간 인식 시작...')
      onRecognize()
    }, 500)
  }, [realTimeRecognition, isProcessing, onRecognize])

  // Palm Rejection 설정 업데이트
  useEffect(() => {
    updateConfig({
      penOnlyMode: palmRejection,
      sensitivity: palmRejectionSensitivity
    })
  }, [palmRejection, palmRejectionSensitivity, updateConfig])

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current)
      }
    }
  }, [])
  
  // 캔버스 초기 설정
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000000'
    ctx.fillStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = 1.0
  }, [canvasRef])

  // 좌표 변환 함수
  const getScaledCoordinates = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  // Perfect Freehand 스트로크를 캔버스에 그리기
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: number[][]) => {
    if (!stroke.length) return

    ctx.fillStyle = '#000000'
    ctx.beginPath()

    if (stroke.length === 1) {
      const [x, y] = stroke[0]
      ctx.arc(x, y, 1, 0, 2 * Math.PI)
    } else {
      ctx.moveTo(stroke[0][0], stroke[0][1])
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0], stroke[i][1])
      }
      ctx.closePath()
    }
    ctx.fill()
  }

  // 캔버스 다시 그리기 (기존 스트로크는 유지)
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.putImageData(imageData, 0, 0)
  }

  // Pointer 이벤트 핸들러
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rejectionStatus = checkPointerInput(e)
    if (!rejectionStatus.isAllowed) {
      console.log(`🚫 Palm Rejection: ${rejectionStatus.reason}`)
      return
    }

    addActivePointer(e.pointerId)
    setIsDrawing(true)
    currentStrokePoints.current = []

    const scaledCoords = getScaledCoordinates(e.clientX, e.clientY, canvas)
    const pressure = e.pressure || 0.5
    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])
    
    console.log(`✏️ 펜 그리기 시작: ${rejectionStatus.reason}`)
  }, [checkPointerInput, addActivePointer, canvasRef])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    e.preventDefault()
    e.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaledCoords = getScaledCoordinates(e.clientX, e.clientY, canvas)
    const pressure = e.pressure || 0.5
    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])

    const dynamicBrushSize = 3 + (pressure * 2)
    const stroke = getStroke(currentStrokePoints.current, {
      size: dynamicBrushSize,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    })

    redrawCanvas()
    drawStroke(ctx, stroke)
  }, [isDrawing, canvasRef])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    e.preventDefault()
    e.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    removeActivePointer(e.pointerId)
    setIsDrawing(false)

    if (currentStrokePoints.current.length > 1) {
      const finalPressure = currentStrokePoints.current[currentStrokePoints.current.length - 1][2]
      const dynamicBrushSize = 3 + (finalPressure * 2)
      const stroke = getStroke(currentStrokePoints.current, {
        size: dynamicBrushSize,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      })
      drawStroke(ctx, stroke)
    }

    triggerRealTimeRecognition()
    console.log('✅ 펜 그리기 완료')
  }, [isDrawing, removeActivePointer, triggerRealTimeRecognition, canvasRef])

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
            touchAction: 'none',
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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
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
          onClick={onClear}
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
