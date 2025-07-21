'use client'

import { useEffect, RefObject, useRef, useState } from 'react'
import { getStroke } from 'perfect-freehand'
import { ComponentAnalyzer, AnalysisResult, ConnectedComponent } from './ComponentAnalyzer'
import { ONNXDigitRecognizer, RecognitionResult, ConnectedComponent as ONNXConnectedComponent } from './ONNXDigitRecognizer'

interface ConnectedCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  onAnalysisComplete: (result: AnalysisResult) => void
  onRecognitionComplete?: (results: RecognitionResult[], processingTime: number) => void
  onClear: () => void
  autoAnalyze?: boolean
  canvasWidth?: number
  canvasHeight?: number
  simplifiedUI?: boolean // 메인 페이지용 간소화된 UI
}

export function ConnectedCanvas({
  canvasRef,
  onAnalysisComplete,
  onRecognitionComplete,
  onClear,
  autoAnalyze = true,
  canvasWidth = 400,
  canvasHeight = 200,
  simplifiedUI = false
}: ConnectedCanvasProps) {
  
  const analyzerRef = useRef<ComponentAnalyzer>(new ComponentAnalyzer())
  const recognizerRef = useRef<ONNXDigitRecognizer>(new ONNXDigitRecognizer())
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [lastAnalysisResult, setLastAnalysisResult] = useState<AnalysisResult | null>(null)

  // ONNX 모델 초기화
  useEffect(() => {
    recognizerRef.current.initialize().catch(error => {
      console.error('ONNX 모델 초기화 실패:', error)
    })
  }, [])

  // ConnectedComponent를 ONNX 형식으로 변환
  const convertToONNXComponents = (components: ConnectedComponent[]): ONNXConnectedComponent[] => {
    return components.map((component) => {
      const pixels = component.pixels.map(pixel => 
        Array.isArray(pixel) ? { x: pixel[0], y: pixel[1] } : { x: pixel.x, y: pixel.y }
      )
      
      if (pixels.length === 0) {
        return {
          id: component.id,
          pixels: [],
          boundingBox: {
            minX: 0, maxX: 0, minY: 0, maxY: 0,
            width: 0, height: 0
          }
        }
      }
      
      const minX = Math.min(...pixels.map(p => p.x))
      const maxX = Math.max(...pixels.map(p => p.x))
      const minY = Math.min(...pixels.map(p => p.y))
      const maxY = Math.max(...pixels.map(p => p.y))
      
      return {
        id: component.id,
        pixels,
        boundingBox: {
          minX, maxX, minY, maxY,
          width: maxX - minX + 1,
          height: maxY - minY + 1
        }
      }
    })
  }

  // ONNX 숫자 인식 실행
  const performRecognition = async (components: ConnectedComponent[]) => {
    if (!onRecognitionComplete || components.length === 0) return
    
    setIsRecognizing(true)
    const recognitionStart = performance.now()
    
    try {
      const onnxComponents = convertToONNXComponents(components)
      const recognitionResults = await recognizerRef.current.recognizeDigits(onnxComponents)
      
      const recognitionTime = performance.now() - recognitionStart
      onRecognitionComplete(recognitionResults, recognitionTime)
      
      console.log(`🤖 ONNX 인식 완료: ${recognitionResults.length}개 숫자, ${recognitionTime.toFixed(2)}ms`)
    } catch (error) {
      console.error('❌ ONNX 인식 실패:', error)
    } finally {
      setIsRecognizing(false)
    }
  }

  // 연결성분 분석 실행 (디바운스 적용)
  const triggerAnalysis = async () => {
    if (!autoAnalyze || isAnalyzing) return

    const canvas = canvasRef.current
    if (!canvas) return

    // 기존 타임아웃 클리어
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current)
    }

    // 300ms 후 분석 실행 (스트로크 완료 대기)
    analysisTimeoutRef.current = setTimeout(async () => {
      try {
        setIsAnalyzing(true)
        console.log('🔍 연결성분 분석 시작...')
        
        const result = await analyzerRef.current.analyzeComponents(canvas)
        setLastAnalysisResult(result)
        onAnalysisComplete(result)
        
        // 시각화 표시
        if (result.components.length > 0) {
          analyzerRef.current.visualizeComponents(canvas, result.components)
        }
        
        console.log(`✅ 분석 완료: ${result.components.length}개 성분, ${result.processingTime.toFixed(2)}ms`)
        
        // ONNX 숫자 인식 실행
        await performRecognition(result.components)
      } catch (error) {
        console.error('❌ 연결성분 분석 실패:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }, 300)
  }

  // 수동 분석 트리거
  const manualAnalyze = async () => {
    const canvas = canvasRef.current
    if (!canvas || isAnalyzing || isRecognizing) return

    try {
      setIsAnalyzing(true)
      const result = await analyzerRef.current.analyzeComponents(canvas)
      setLastAnalysisResult(result)
      onAnalysisComplete(result)
      
      // 시각화 표시
      if (result.components.length > 0) {
        analyzerRef.current.visualizeComponents(canvas, result.components)
      }
      
      // ONNX 숫자 인식 실행
      await performRecognition(result.components)
    } catch (error) {
      console.error('❌ 연결성분 분석 실패:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
      unlockScroll()
    }
  }, [])
  
  // 캔버스 초기 설정
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 투명 배경으로 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 드로잉 스타일 설정 - 인식률 향상을 위한 최적화
    ctx.strokeStyle = '#000000'
    ctx.fillStyle = '#000000'
    ctx.lineWidth = 3  // 2 → 3으로 증가 (연결성 향상)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = 1.0
    
    // 안티앨리어싱 비활성화 (선명한 픽셀 경계)
    ctx.imageSmoothingEnabled = false
  }, [canvasRef])

  // 현재 스트로크 포인트 저장
  const currentStrokePoints = useRef<Array<[number, number, number]>>([])
  const isDrawingRef = useRef(false)
  
  // 모든 스트로크 데이터 보관 (시각화와 분리)
  const allStrokes = useRef<Array<Array<[number, number, number]>>>([])

  // 스크롤 락 함수들
  const lockScroll = () => {
    document.body.classList.add('no-scroll')
    document.documentElement.classList.add('no-scroll')
  }

  const unlockScroll = () => {
    document.body.classList.remove('no-scroll')
    document.documentElement.classList.remove('no-scroll')
  }

  // 시각화 재적용 (캔버스 다시 그리기 후)
  const reapplyVisualization = () => {
    if (lastAnalysisResult && lastAnalysisResult.components.length > 0) {
      const canvas = canvasRef.current
      if (canvas) {
        // 약간의 지연 후 시각화 재적용
        setTimeout(() => {
          analyzerRef.current.visualizeComponents(canvas, lastAnalysisResult.components)
        }, 50)
      }
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

  // 캔버스 다시 그리기 (순수 드로잉 데이터만 사용)
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 완전히 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 저장된 모든 스트로크를 다시 그리기 - 인식률 향상 최적화
    allStrokes.current.forEach(strokePoints => {
      if (strokePoints.length > 0) {
        const stroke = getStroke(strokePoints, {
          size: 4,        // 3 → 4로 증가 (더 두꺼운 스트로크)
          thinning: 0.2,  // 0.5 → 0.2로 감소 (일정한 두께 유지)
          smoothing: 0.3, // 0.5 → 0.3으로 감소 (더 선명한 경계)
          streamline: 0.3, // 0.5 → 0.3으로 감소 (입력 충실도 향상)
          easing: (t) => t,
          start: { taper: 0, easing: (t) => t },
          end: { taper: 0, easing: (t) => t },
        })
        drawStroke(ctx, stroke)
      }
    })
  }

  // Pointer 이벤트 처리
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
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

    currentStrokePoints.current.push([x, y, pressure])

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const pressure = e.pressure || 0.5

      currentStrokePoints.current.push([x, y, pressure])

      // Perfect Freehand로 부드러운 스트로크 생성 - 인식률 향상 최적화
      const stroke = getStroke(currentStrokePoints.current, {
        size: 4,        // 3 → 4로 증가 (더 두꺼운 스트로크)
        thinning: 0.2,  // 0.5 → 0.2로 감소 (일정한 두께 유지)
        smoothing: 0.3, // 0.5 → 0.3으로 감소 (더 선명한 경계)
        streamline: 0.3, // 0.5 → 0.3으로 감소 (입력 충실도 향상)
        easing: (t) => t,
        start: { taper: 0, easing: (t) => t },
        end: { taper: 0, easing: (t) => t },
      })

      // 캔버스 다시 그리기
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
      
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerUp)

      unlockScroll()

      // 최종 스트로크 그리기 및 저장 - 인식률 향상 최적화
      if (currentStrokePoints.current.length > 1) {
        const stroke = getStroke(currentStrokePoints.current, {
          size: 4,        // 3 → 4로 증가 (더 두꺼운 스트로크)
          thinning: 0.2,  // 0.5 → 0.2로 감소 (일정한 두께 유지)
          smoothing: 0.3, // 0.5 → 0.3으로 감소 (더 선명한 경계)
          streamline: 0.3, // 0.5 → 0.3으로 감소 (입력 충실도 향상)
          easing: (t) => t,
          start: { taper: 0, easing: (t) => t },
          end: { taper: 0, easing: (t) => t },
        })

        drawStroke(ctx, stroke)
        
        // 스트로크 데이터 저장 (시각화와 분리)
        allStrokes.current.push([...currentStrokePoints.current])
      }

      // 스트로크 완료 후 연결성분 분석 트리거
      triggerAnalysis()
    }

    canvas.addEventListener('pointermove', handlePointerMove, { passive: false })
    canvas.addEventListener('pointerup', handlePointerUp, { passive: false })
    canvas.addEventListener('pointercancel', handlePointerUp, { passive: false })
    canvas.addEventListener('pointerleave', handlePointerUp, { passive: false })
  }

  // 캔버스 완전 지우기
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 모든 스트로크 데이터 초기화
    allStrokes.current = []
    currentStrokePoints.current = []
    
    setLastAnalysisResult(null)
    onClear()
  }

  return (
    <div className="space-y-4">
      {/* 캔버스 영역 */}
      <div className="border border-gray-300 rounded p-4 bg-gray-50">
        <div className="text-center mb-3">
          <span className="text-sm font-medium text-gray-700">
            연결성분 분석 + ONNX 인식 캔버스 ({canvasWidth}×{canvasHeight}px)
          </span>
          {(isAnalyzing || isRecognizing) && (
            <div className="mt-1">
              <span className="text-xs text-blue-600 animate-pulse">
                {isAnalyzing ? '🔍 분석 중...' : '🤖 인식 중...'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="border-2 border-gray-400 cursor-crosshair bg-white rounded shadow-sm"
            onPointerDown={handlePointerDown}
            style={{ 
              touchAction: 'none',
              backgroundColor: 'white',
            }}
          />
        </div>
      </div>
      
      {/* 컨트롤 버튼 */}
      <div className="flex justify-center gap-3">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
          disabled={isAnalyzing || isRecognizing}
        >
          🗑️ 지우기
        </button>
        
        {!simplifiedUI && (
          <>
            <button
              onClick={manualAnalyze}
              disabled={isAnalyzing || isRecognizing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {isAnalyzing ? '⏳ 분석 중...' : isRecognizing ? '🤖 인식 중...' : '🔍 분석 + 인식'}
            </button>
            
            <button
              onClick={reapplyVisualization}
              disabled={!lastAnalysisResult || isAnalyzing || isRecognizing}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              🎨 시각화 복원
            </button>
          </>
        )}
      </div>
      
      {/* 사용법 안내 */}
      {!simplifiedUI && (
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>💡 숫자를 그려보세요. 스트로크 완료 시 자동으로 연결성분 분석과 ONNX 숫자 인식을 실행합니다.</p>
          <p>🎨 각 연결성분은 서로 다른 색상의 경계선으로 표시됩니다.</p>
          <p>🤖 ONNX 모델을 통해 실시간으로 숫자를 인식하고 신뢰도를 표시합니다.</p>
        </div>
      )}
    </div>
  )
}
