'use client'

import { useRef, useEffect, RefObject } from 'react'
import { DigitSegmentation } from './DigitSegmentation'

interface CanvasDrawingProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  segmentationRef: RefObject<HTMLDivElement | null>
  isDrawing: boolean
  setIsDrawing: (drawing: boolean) => void
  digitSegmentation: DigitSegmentation | null
  setDigitSegmentation: (ds: DigitSegmentation | null) => void
  onRecognize: () => void
  onClear: () => void
  onUndo: () => void
  isProcessing: boolean
  isModelLoading: boolean
}

export function CanvasDrawing({
  canvasRef,
  segmentationRef,
  isDrawing,
  setIsDrawing,
  digitSegmentation,
  setDigitSegmentation,
  onRecognize,
  onClear,
  onUndo,
  isProcessing,
  isModelLoading
}: CanvasDrawingProps) {
  
  // 캔버스 초기 설정
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 스타일 설정 (개발 계획서 기준: 검은색 배경, 흰색 선)
    ctx.fillStyle = '#000000'  // 검은색 배경
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.strokeStyle = '#FFFFFF'  // 흰색 선
    ctx.lineWidth = 3           // 2-3px 선 굵기
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // 숫자 분할 클래스 초기화
    const segmentation = new DigitSegmentation(canvas)
    setDigitSegmentation(segmentation)
  }, [canvasRef, setDigitSegmentation])

  // 마우스 이벤트 처리
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    // 드로잉 완료 후 자동으로 인식 시작
    setTimeout(() => {
      onRecognize()
    }, 300) // 300ms 디바운싱
  }

  // 터치 이벤트 처리
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return

    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleTouchEnd = () => {
    setIsDrawing(false)
    setTimeout(() => {
      onRecognize()
    }, 300)
  }

  return (
    <div className="space-y-4">
      {/* 캔버스 - 200x60px 고정 크기 */}
      <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-100">
        <div className="text-center mb-2">
          <span className="text-sm text-gray-500">200x60px 드로잉 캔버스 (검은색 배경, 흰색 선)</span>
        </div>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={200}
            height={60}
            className="border border-gray-400 rounded cursor-crosshair"
            style={{ backgroundColor: '#000000' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      </div>
      
      {/* 컨트롤 버튼 */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onClear}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          🗑️ 지우기
        </button>
        <button
          onClick={onUndo}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          ↩️ 실행 취소
        </button>
        <button
          onClick={onRecognize}
          disabled={isProcessing || isModelLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isProcessing ? '⏳ 인식 중...' : '🔍 인식하기'}
        </button>
      </div>
      
      {/* 분할된 숫자 시각화 영역 */}
      <div ref={segmentationRef} className="flex justify-center gap-2 flex-wrap"></div>
    </div>
  )
}
