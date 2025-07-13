'use client'

import { useEffect, RefObject, useRef } from 'react'
import { getStroke } from 'perfect-freehand'

interface CanvasDrawingProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  onRecognize: () => void
  onClear: () => void
  isProcessing: boolean
  isModelLoading: boolean
  realTimeRecognition?: boolean
}

export function CanvasDrawing({
  canvasRef,
  onRecognize,
  onClear,
  isProcessing,
  isModelLoading,
  realTimeRecognition = true
}: CanvasDrawingProps) {
  
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // 컴포넌트 언마운트 시 타임아웃 정리 및 스크롤 락 해제
  useEffect(() => {
    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current)
      }
      // 컴포넌트 언마운트 시 스크롤 락 해제
      unlockScroll()
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

  // 스크롤 락 함수들
  const lockScroll = () => {
    document.body.classList.add('no-scroll')
    document.documentElement.classList.add('no-scroll')
  }

  const unlockScroll = () => {
    document.body.classList.remove('no-scroll')
    document.documentElement.classList.remove('no-scroll')
  }

  // Pointer 이벤트 처리 (터치펜, 마우스, 터치 통합)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 필기 시작 시 스크롤 락
    lockScroll()
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    isDrawingRef.current = true
    currentStrokePoints.current = []

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pressure = e.pressure || 0.5

    // 첫 포인트 추가
    currentStrokePoints.current.push([x, y, pressure])

    // Pointer 이벤트 리스너 추가
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const pressure = e.pressure || 0.5

      // 포인트 추가
      currentStrokePoints.current.push([x, y, pressure])

      // Perfect Freehand로 부드러운 스트로크 생성
      const stroke = getStroke(currentStrokePoints.current, {
        size: 3,
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

      // 필기 종료 시 스크롤 락 해제
      unlockScroll()

      // 최종 스트로크 그리기
      if (currentStrokePoints.current.length > 1) {
        const stroke = getStroke(currentStrokePoints.current, {
          size: 3,
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
        <div className="flex justify-center canvas-container">
          <canvas
            ref={canvasRef}
            width={200}
            height={100}
            className="border border-gray-400 cursor-crosshair bg-white"
            onPointerDown={handlePointerDown}
            style={{ 
              touchAction: 'none',  // 터치 스크롤 방지
              backgroundColor: 'transparent',  // 투명 배경
              cursor: 'crosshair'
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
