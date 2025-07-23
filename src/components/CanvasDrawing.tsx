'use client'

import { useEffect, RefObject, useRef, useState } from 'react'
import { getStroke } from 'perfect-freehand'
import { usePalmRejection } from '../hooks/usePalmRejection'
import { PalmRejectionStatus } from '../utils/palmRejection'

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
  const [palmRejectionStatus, setPalmRejectionStatus] = useState<PalmRejectionStatus | null>(null)

  // Palm Rejection Hook 사용
  const {
    containerRef: palmContainerRef,
    checkPointerInput,
    addActivePointer,
    removeActivePointer,
    clearActivePointers,
    updateConfig
  } = usePalmRejection({
    enabled: palmRejection,
    config: {
      penOnlyMode: palmRejection,
      sensitivity: palmRejectionSensitivity
    },
    onStatusChange: setPalmRejectionStatus
  })

  // containerRef와 palmContainerRef 동기화
  useEffect(() => {
    if (containerRef.current) {
      palmContainerRef.current = containerRef.current
    }
  }, [palmContainerRef])

  // 실시간 인식 함수 (디바운스 적용)
  const triggerRealTimeRecognition = () => {
    if (!realTimeRecognition || isProcessing) return

    // 기존 타임아웃 클리어
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current)
    }

    // 500ms 후 인식 실행
    recognitionTimeoutRef.current = setTimeout(() => {
      console.log('🔄 실시간 인식 시작...')
      onRecognize()
    }, 500)
  }

  // Canvas 컨테이너에 이벤트 리스너 추가 (demo 방식)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Canvas 영역에서만 터치/스크롤 이벤트 차단
    container.addEventListener('touchstart', preventTouch, { passive: false })
    container.addEventListener('touchmove', preventTouch, { passive: false })
    container.addEventListener('touchend', preventTouch, { passive: false })
    container.addEventListener('touchcancel', preventTouch, { passive: false })
    container.addEventListener('wheel', preventWheel, { passive: false })
    container.addEventListener('contextmenu', preventContext)
    container.addEventListener('dragstart', preventDrag)

    return () => {
      // 정리
      container.removeEventListener('touchstart', preventTouch)
      container.removeEventListener('touchmove', preventTouch)
      container.removeEventListener('touchend', preventTouch)
      container.removeEventListener('touchcancel', preventTouch)
      container.removeEventListener('wheel', preventWheel)
      container.removeEventListener('contextmenu', preventContext)
      container.removeEventListener('dragstart', preventDrag)
    }
  }, [])

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

    // 투명 배경으로 초기화 (DigitRecognizer가 Alpha 채널을 사용)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 드로잉 스타일 설정 (실제 답안지 스타일)
    ctx.strokeStyle = '#000000'  // 검은색 선
    ctx.fillStyle = '#000000'    // 검은색 채우기
    ctx.lineWidth = 2            // 얇은 선 (연필 굵기)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = 1.0        // 완전 불투명
  }, [canvasRef])

  // 현재 스트로크 포인트 저장
  const currentStrokePoints = useRef<Array<[number, number, number]>>([])
  const isDrawingRef = useRef(false)

  // Canvas 영역에서만 터치/스크롤 이벤트 차단 (demo 방식 적용)
  const preventTouch = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  const preventWheel = (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  const preventContext = (e: Event) => {
    e.preventDefault()
    return false
  }

  const preventDrag = (e: DragEvent) => {
    e.preventDefault()
    return false
  }

  // 좌표 변환 함수 (표시 크기 → 실제 크기)
  const getScaledCoordinates = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  // Pointer 이벤트 처리 (터치펜, 마우스, 터치 통합) - demo 방식 적용
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    isDrawingRef.current = true
    currentStrokePoints.current = []

    // 좌표 변환 적용
    const scaledCoords = getScaledCoordinates(e.clientX, e.clientY, canvas)
    const pressure = e.pressure || 0.5

    // 첫 포인트 추가
    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])

    // Pointer 이벤트 리스너 추가
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return

      e.preventDefault()
      e.stopPropagation()

      // 좌표 변환 적용
      const scaledCoords = getScaledCoordinates(e.clientX, e.clientY, canvas)
      const pressure = e.pressure || 0.5

      // 포인트 추가
      currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])

      // Perfect Freehand로 부드러운 스트로크 생성 - 압력 감응 브러시
      const dynamicBrushSize = 3 + (pressure * 2) // 압력에 따른 동적 크기
      const stroke = getStroke(currentStrokePoints.current, {
        size: dynamicBrushSize,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t) => t,
        start: {
          taper: 0,
          easing: (t) => t,
        },
        end: {
          taper: 0,
          easing: (t) => t,
        },
      })

      // 캔버스 다시 그리기 (현재 스트로크만)
      redrawCanvas()
      drawStroke(ctx, stroke)
    }

    const handlePointerUp = (e?: PointerEvent) => {
      if (!isDrawingRef.current) return

      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      isDrawingRef.current = false
      
      // 이벤트 리스너 제거
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerUp)

      // 최종 스트로크 그리기 - 압력 감응 브러시
      if (currentStrokePoints.current.length > 1) {
        const finalPressure = currentStrokePoints.current[currentStrokePoints.current.length - 1][2]
        const dynamicBrushSize = 3 + (finalPressure * 2)
        const stroke = getStroke(currentStrokePoints.current, {
          size: dynamicBrushSize,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
          easing: (t) => t,
          start: {
            taper: 0,
            easing: (t) => t,
          },
          end: {
            taper: 0,
            easing: (t) => t,
          },
        })

        drawStroke(ctx, stroke)
      }

      // 드로잉 완료 후 실시간 인식 트리거
      triggerRealTimeRecognition()
    }

    // 이벤트 리스너 등록 (passive: false로 preventDefault 활성화)
    canvas.addEventListener('pointermove', handlePointerMove, { passive: false })
    canvas.addEventListener('pointerup', handlePointerUp, { passive: false })
    canvas.addEventListener('pointercancel', handlePointerUp, { passive: false })
    canvas.addEventListener('pointerleave', handlePointerUp, { passive: false })
  }

  // Perfect Freehand 스트로크를 캔버스에 그리기
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: number[][]) => {
    if (!stroke.length) return

    ctx.fillStyle = '#000000'
    ctx.beginPath()

    if (stroke.length === 1) {
      // 단일 점인 경우
      const [x, y] = stroke[0]
      ctx.arc(x, y, 1, 0, 2 * Math.PI)
    } else {
      // 다중 점인 경우 폴리곤으로 그리기
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

    // 현재 이미지 데이터 백업
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // 캔버스 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 이미지 데이터 복원 (기존 스트로크 유지)
    ctx.putImageData(imageData, 0, 0)
  }

  return (
    <div className="space-y-4">
      {/* 캔버스 - 200x100px (실제 답안영역 크기) */}
      <div className="border border-gray-300 rounded p-2 bg-gray-50 drawing-area">
        <div className="text-center mb-2">
          <span className="text-xs text-gray-600">
            답안 작성란 (200×100px)
          </span>
        </div>
        <div 
          className="flex justify-center canvas-container"
          ref={containerRef}
          style={{
            touchAction: 'none',           // Canvas 영역에서만 터치 액션 제한
            userSelect: 'none',            // 텍스트 선택 방지
            WebkitUserSelect: 'none',      // Safari 호환성
            WebkitTouchCallout: 'none',    // iOS 호환성
            maxWidth: '100%',              // 모바일 호환성
            overflow: 'hidden'
          }}
        >
          <canvas
            ref={canvasRef}
            width={200}
            height={100}
            className="border border-gray-400 cursor-crosshair bg-white canvas-responsive"
            onPointerDown={handlePointerDown}
            style={{ 
              backgroundColor: 'transparent',  // 투명 배경
              cursor: 'crosshair',
              maxWidth: '100%',               // 모바일에서 화면에 맞춤
              height: 'auto'                  // 비율 유지
            }}
          />
        </div>
      </div>
      
      {/* 컨트롤 버튼 */}
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
      
      {/* 사용법 안내 */}
      <div className="text-center text-xs text-gray-500">
        <p>💡 작은 답안란에 연속된 숫자를 써주세요</p>
        <p>📝 스타일러스 펜 압력 감응으로 더 정확한 인식!</p>
        <p>✨ 부드러운 필기감으로 자연스럽게 써보세요</p>
      </div>
    </div>
  )
}
