'use client'

import { useEffect, RefObject, useRef } from 'react'

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

  // 마우스 드로잉 이벤트
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    
    // 마우스 이벤트 리스너 추가
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    const handleMouseUp = () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseUp)
      
      // 드로잉 완료 후 실시간 인식 트리거
      triggerRealTimeRecognition()
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
  }

  // 터치 이벤트 처리 (모바일 지원)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    
    // 터치 완료 후 실시간 인식 트리거
    triggerRealTimeRecognition()
  }

  return (
    <div className="space-y-4">
      {/* 캔버스 - 200x100px (실제 답안영역 크기) */}
      <div className="border border-gray-300 rounded p-2 bg-gray-50">
        <div className="text-center mb-2">
          <span className="text-xs text-gray-600">
            답안 작성란 (200×100px)
          </span>
        </div>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={200}
            height={100}
            className="border border-gray-400 cursor-crosshair bg-white"
            onMouseDown={startDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              touchAction: 'none',  // 터치 스크롤 방지
              backgroundColor: 'transparent'  // 투명 배경
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
        <p>📝 실제 시험지처럼 얇은 선으로 작게 써도 인식됩니다</p>
      </div>
    </div>
  )
}
