import { RefObject, useRef, useState, useCallback, useEffect } from 'react'
import { initializeCanvas, redrawAllStrokes } from '../utils/canvasUtils'

export interface UseCanvasDrawingProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  onRecognize: () => void
  realTimeRecognition?: boolean
  isProcessing: boolean
}

export interface UseCanvasDrawingReturn {
  currentStrokePoints: React.MutableRefObject<Array<[number, number, number]>>
  allStrokes: React.MutableRefObject<Array<Array<[number, number, number]>>>
  isDrawing: boolean
  setIsDrawing: (drawing: boolean) => void
  triggerRealTimeRecognition: () => void
  clearAllStrokes: () => void
  redrawCanvas: () => void
}

/**
 * 캔버스 그리기 로직을 관리하는 훅
 */
export function useCanvasDrawing({
  canvasRef,
  onRecognize,
  realTimeRecognition = true,
  isProcessing
}: UseCanvasDrawingProps): UseCanvasDrawingReturn {
  
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentStrokePoints = useRef<Array<[number, number, number]>>([])
  const allStrokes = useRef<Array<Array<[number, number, number]>>>([])
  const [isDrawing, setIsDrawing] = useState(false)

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

  // 모든 스트로크 초기화
  const clearAllStrokes = useCallback(() => {
    allStrokes.current = []
    currentStrokePoints.current = []
    
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [canvasRef])

  // 캔버스 다시 그리기
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    redrawAllStrokes(
      canvas,
      allStrokes.current,
      currentStrokePoints.current,
      isDrawing
    )
  }, [canvasRef, isDrawing])

  // 캔버스 초기 설정
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    initializeCanvas(canvas)
  }, [canvasRef])

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current)
      }
    }
  }, [])

  return {
    currentStrokePoints,
    allStrokes,
    isDrawing,
    setIsDrawing,
    triggerRealTimeRecognition,
    clearAllStrokes,
    redrawCanvas
  }
}