import { RefObject, useCallback } from 'react'
import { getScaledCoordinates, drawInitialPoint, drawLineTo } from '../utils/canvasUtils'

// Palm Rejection 훅의 반환 타입 정의
interface PalmRejectionHook {
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  checkPointerInput: (e: React.PointerEvent) => { isAllowed: boolean; reason: string }
  addActivePointer: (pointerId: number) => void
  removeActivePointer: (pointerId: number) => void
  updateConfig: (config: any) => void
}

export interface UseCanvasEventsProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  currentStrokePoints: React.MutableRefObject<Array<[number, number, number]>>
  allStrokes: React.MutableRefObject<Array<Array<[number, number, number]>>>
  isDrawing: boolean
  setIsDrawing: (drawing: boolean) => void
  triggerRealTimeRecognition: () => void
  palmRejection: boolean
  palmRejectionHook: PalmRejectionHook
}

export interface UseCanvasEventsReturn {
  // Palm Rejection 비활성화 시 이벤트 핸들러
  handleTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void
  handleTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void
  handleTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
  handleMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void
  
  // Palm Rejection 활성화 시 이벤트 핸들러
  handlePalmRejectionPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void
  handlePalmRejectionPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void
  handlePalmRejectionPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void
}

/**
 * 캔버스 이벤트 핸들러들을 관리하는 훅
 */
export function useCanvasEvents({
  canvasRef,
  currentStrokePoints,
  allStrokes,
  isDrawing,
  setIsDrawing,
  triggerRealTimeRecognition,
  palmRejection,
  palmRejectionHook
}: UseCanvasEventsProps): UseCanvasEventsReturn {

  const { checkPointerInput, addActivePointer, removeActivePointer } = palmRejectionHook

  // 공통 그리기 시작 로직
  const startDrawing = useCallback((x: number, y: number, canvas: HTMLCanvasElement) => {
    setIsDrawing(true)
    currentStrokePoints.current = []

    const scaledCoords = getScaledCoordinates(x, y, canvas)
    const pressure = 0.5
    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])

    const ctx = canvas.getContext('2d')
    if (ctx) {
      drawInitialPoint(ctx, scaledCoords.x, scaledCoords.y)
    }
  }, [setIsDrawing, currentStrokePoints])

  // 공통 그리기 진행 로직
  const continueDrawing = useCallback((x: number, y: number, canvas: HTMLCanvasElement) => {
    if (!isDrawing) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaledCoords = getScaledCoordinates(x, y, canvas)
    const pressure = 0.5
    
    if (currentStrokePoints.current.length > 0) {
      const lastPoint = currentStrokePoints.current[currentStrokePoints.current.length - 1]
      drawLineTo(ctx, lastPoint[0], lastPoint[1], scaledCoords.x, scaledCoords.y)
    }

    currentStrokePoints.current.push([scaledCoords.x, scaledCoords.y, pressure])
  }, [isDrawing, currentStrokePoints])

  // 공통 그리기 완료 로직
  const endDrawing = useCallback(() => {
    if (!isDrawing) return

    setIsDrawing(false)

    if (currentStrokePoints.current.length > 0) {
      allStrokes.current.push([...currentStrokePoints.current])
      console.log(`✅ 스트로크 완료 (총 ${allStrokes.current.length}개 스트로크)`)
    }

    currentStrokePoints.current = []
    triggerRealTimeRecognition()
  }, [isDrawing, setIsDrawing, currentStrokePoints, allStrokes, triggerRealTimeRecognition])

  // 터치 이벤트 핸들러 (Palm Rejection 비활성화 시)
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    console.log('🔍 [DEBUG] handleTouchStart 호출됨, touches:', e.touches.length, 'palmRejection:', palmRejection)
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) {
      console.log('🚫 [DEBUG] canvas 없음')
      return
    }
    
    // Palm Rejection OFF 상태에서는 멀티터치 제한을 완화
    if (palmRejection && e.touches.length !== 1) {
      console.log('🚫 [DEBUG] Palm Rejection ON - 멀티터치 감지로 차단, touches:', e.touches.length)
      return
    }
    
    // Palm Rejection OFF 상태에서는 첫 번째 터치만 사용하되 차단하지 않음
    if (!palmRejection && e.touches.length === 0) {
      console.log('🚫 [DEBUG] 터치 포인트 없음')
      return
    }

    const touch = e.touches[0]
    startDrawing(touch.clientX, touch.clientY, canvas)
    console.log('✏️ 터치 그리기 시작 (Palm Rejection:', palmRejection ? 'ON' : 'OFF', ')')
  }, [canvasRef, startDrawing, palmRejection])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    console.log('🔍 [DEBUG] handleTouchMove 호출됨, isDrawing:', isDrawing, 'touches:', e.touches.length, 'palmRejection:', palmRejection)
    if (!isDrawing) {
      console.log('🚫 [DEBUG] isDrawing이 false라서 리턴')
      return
    }
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) {
      console.log('🚫 [DEBUG] canvas 없음 in touchMove')
      return
    }
    
    // Palm Rejection ON 상태에서만 엄격한 멀티터치 차단
    if (palmRejection && e.touches.length !== 1) {
      console.log('🚫 [DEBUG] Palm Rejection ON - 멀티터치로 인한 그리기 중단, touches:', e.touches.length)
      return
    }
    
    // Palm Rejection OFF 상태에서는 터치가 있는 한 계속 진행
    if (!palmRejection && e.touches.length === 0) {
      console.log('🚫 [DEBUG] 터치 포인트 없어서 그리기 중단')
      return
    }

    const touch = e.touches[0]
    continueDrawing(touch.clientX, touch.clientY, canvas)
  }, [isDrawing, canvasRef, continueDrawing, palmRejection])

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    console.log('🔍 [DEBUG] handleTouchEnd 호출됨, isDrawing:', isDrawing, 'palmRejection:', palmRejection)
    if (!isDrawing) {
      console.log('🚫 [DEBUG] isDrawing이 false라서 touchEnd 리턴')
      return
    }
    e.preventDefault()

    endDrawing()
    console.log('✅ 터치 그리기 완료 (Palm Rejection:', palmRejection ? 'ON' : 'OFF', ')')
  }, [isDrawing, endDrawing, palmRejection])

  // 마우스 이벤트 핸들러 (Palm Rejection 비활성화 시)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    startDrawing(e.clientX, e.clientY, canvas)
    console.log('✏️ 마우스 그리기 시작 (Palm Rejection 비활성화)')
  }, [canvasRef, startDrawing])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    continueDrawing(e.clientX, e.clientY, canvas)
  }, [isDrawing, canvasRef, continueDrawing])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    endDrawing()
    console.log('✅ 마우스 그리기 완료')
  }, [isDrawing, endDrawing])

  // Palm Rejection 활성화 시 포인터 이벤트 핸들러
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

    startDrawing(e.clientX, e.clientY, canvas)
  }, [checkPointerInput, addActivePointer, canvasRef, startDrawing])

  const handlePalmRejectionPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    e.preventDefault()
    e.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return

    continueDrawing(e.clientX, e.clientY, canvas)
  }, [isDrawing, canvasRef, continueDrawing])

  const handlePalmRejectionPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    e.preventDefault()
    e.stopPropagation()

    removeActivePointer(e.pointerId)
    endDrawing()
    console.log('✅ 펜 그리기 완료')
  }, [isDrawing, removeActivePointer, endDrawing])

  return {
    // Palm Rejection 비활성화 시 핸들러
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // Palm Rejection 활성화 시 핸들러
    handlePalmRejectionPointerDown,
    handlePalmRejectionPointerMove,
    handlePalmRejectionPointerUp
  }
}