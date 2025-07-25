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
  const allStrokes = useRef<Array<Array<[number, number, number]>>>([])
  const [isDrawing, setIsDrawing] = useState(false)

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
    checkPointerInput,
    addActivePointer,
    removeActivePointer,
    updateConfig
  } = palmRejectionHook

  // containerRef와 palmContainerRef 동기화 (Palm Rejection 활성화 시에만)
  useEffect(() => {
    if (palmRejection && containerRef.current) {
      palmContainerRef.current = containerRef.current
    }
  }, [palmRejection, palmContainerRef])

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

  // 모든 스트로크를 다시 그리기
  const redrawAllStrokes = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const fixedBrushSize = 4
    
    // 완료된 모든 스트로크 그리기
    allStrokes.current.forEach(strokePoints => {
      if (strokePoints.length > 0) {
        const stroke = getStroke(strokePoints, {
          size: fixedBrushSize,
          thinning: 0,
          smoothing: 0.5,
          streamline: 0.5,
        })
        drawStroke(ctx, stroke)
      }
    })

    // 현재 그리고 있는 스트로크 그리기
    if (isDrawing && currentStrokePoints.current.length > 0) {
      const currentStroke = getStroke(currentStrokePoints.current, {
        size: fixedBrushSize,
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.5,
      })
      drawStroke(ctx, currentStroke)
    }
  }

  // 터치 이벤트 핸들러 (Palm Rejection 비활성화 시)
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas || e.touches.length !== 1) return

    setIsDrawing(true)
    currentStrokePoints.current = []

    const touch = e.touches[0]
    const scaledCoords = getScaledCoordinates(touch.clientX, touch.clientY, canvas)
    const pressure = 0.5
    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(scaledCoords.x, scaledCoords.y, 2, 0, 2 * Math.PI)
      ctx.fill()
    }
    console.log('✏️ 터치 그리기 시작 (Palm Rejection 비활성화)')
  }, [canvasRef])

  // 터치 이벤트 핸들러 (Palm Rejection 비활성화 시)
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas || e.touches.length !== 1) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const touch = e.touches[0]
    const scaledCoords = getScaledCoordinates(touch.clientX, touch.clientY, canvas)
    const pressure = 0.5
    
    if (currentStrokePoints.current.length > 0) {
      const lastPoint = currentStrokePoints.current[currentStrokePoints.current.length - 1]
      
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(lastPoint[0], lastPoint[1])
      ctx.lineTo(scaledCoords.x, scaledCoords.y)
      ctx.stroke()
    }

    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])
  }, [isDrawing, canvasRef])

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    setIsDrawing(false)

    if (currentStrokePoints.current.length > 0) {
      allStrokes.current.push([...currentStrokePoints.current])
      console.log(`✅ 터치 스트로크 완료 (총 ${allStrokes.current.length}개 스트로크)`)
    }

    currentStrokePoints.current = []
    triggerRealTimeRecognition()
    console.log('✅ 터치 그리기 완료')
  }, [isDrawing, triggerRealTimeRecognition])

  // 마우스 이벤트 핸들러 (Palm Rejection 비활성화 시)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    currentStrokePoints.current = []

    const scaledCoords = getScaledCoordinates(e.clientX, e.clientY, canvas)
    const pressure = 0.5
    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(scaledCoords.x, scaledCoords.y, 2, 0, 2 * Math.PI)
      ctx.fill()
    }
    console.log('✏️ 마우스 그리기 시작 (Palm Rejection 비활성화)')
  }, [canvasRef])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaledCoords = getScaledCoordinates(e.clientX, e.clientY, canvas)
    const pressure = 0.5
    
    if (currentStrokePoints.current.length > 0) {
      const lastPoint = currentStrokePoints.current[currentStrokePoints.current.length - 1]
      
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(lastPoint[0], lastPoint[1])
      ctx.lineTo(scaledCoords.x, scaledCoords.y)
      ctx.stroke()
    }

    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])
  }, [isDrawing, canvasRef])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    setIsDrawing(false)

    if (currentStrokePoints.current.length > 0) {
      allStrokes.current.push([...currentStrokePoints.current])
      console.log(`✅ 마우스 스트로크 완료 (총 ${allStrokes.current.length}개 스트로크)`)
    }

    currentStrokePoints.current = []
    triggerRealTimeRecognition()
    console.log('✅ 마우스 그리기 완료')
  }, [isDrawing, triggerRealTimeRecognition])

  // Palm Rejection 활성화 시 핸들러
  const handlePalmRejectionPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rejectionStatus = checkPointerInput(e)
    if (!rejectionStatus.isAllowed) {
      console.log(`🚫 Palm Rejection: ${rejectionStatus.reason}`)
      return
    }
    
    console.log(`✏️ 펜 그리기 시작: ${rejectionStatus.reason}`)
    addActivePointer(e.pointerId)

    setIsDrawing(true)
    currentStrokePoints.current = []

    const scaledCoords = getScaledCoordinates(e.clientX, e.clientY, canvas)
    const pressure = 0.5
    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(scaledCoords.x, scaledCoords.y, 2, 0, 2 * Math.PI)
      ctx.fill()
    }
  }, [checkPointerInput, addActivePointer, canvasRef])

  const handlePalmRejectionPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    e.preventDefault()
    e.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaledCoords = getScaledCoordinates(e.clientX, e.clientY, canvas)
    const pressure = 0.5
    
    if (currentStrokePoints.current.length > 0) {
      const lastPoint = currentStrokePoints.current[currentStrokePoints.current.length - 1]
      
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(lastPoint[0], lastPoint[1])
      ctx.lineTo(scaledCoords.x, scaledCoords.y)
      ctx.stroke()
    }

    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])
  }, [isDrawing, canvasRef])

  const handlePalmRejectionPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    e.preventDefault()
    e.stopPropagation()

    removeActivePointer(e.pointerId)
    setIsDrawing(false)

    if (currentStrokePoints.current.length > 0) {
      allStrokes.current.push([...currentStrokePoints.current])
      console.log(`✅ 스트로크 완료 (총 ${allStrokes.current.length}개 스트로크)`)
    }

    currentStrokePoints.current = []
    triggerRealTimeRecognition()
    console.log('✅ 펜 그리기 완료')
  }, [isDrawing, removeActivePointer, triggerRealTimeRecognition])

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
          onClick={() => {
            // 모든 스트로크 초기화
            allStrokes.current = []
            currentStrokePoints.current = []
            onClear()
          }}
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
