'use client'

import { useState, useRef, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'
import { DigitSegmentation } from '../components/DigitSegmentation'
import { CanvasDrawing } from '../components/CanvasDrawing'
import { DebugPanel, DebugLogs } from '../components/DebugPanel'
import { RecognitionResult } from '../components/RecognitionResult'
import { checkCanvasContent } from '../utils/imagePreprocessing'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const segmentationRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [model, setModel] = useState<tf.LayersModel | null>(null)
  const [recognizedText, setRecognizedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [confidence, setConfidence] = useState<number>(0)
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [debugMode, setDebugMode] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [segmentedDigits, setSegmentedDigits] = useState<ImageData[]>([])
  const [segmentationQuality, setSegmentationQuality] = useState<number>(0)
  const [digitSegmentation, setDigitSegmentation] = useState<DigitSegmentation | null>(null)

  // 디버그 로그 추가 함수
  const addDebugLog = (message: string) => {
    setDebugLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // TensorFlow.js 모델 로드
  useEffect(() => {
    const loadModel = async () => {
      try {
        addDebugLog('TensorFlow.js 모델 로딩 시작...')
        
        // 기본 MNIST 모델 생성 (실제 프로덕션에서는 사전 훈련된 모델을 로드)
        const model = tf.sequential({
          layers: [
            tf.layers.conv2d({
              inputShape: [28, 28, 1],
              kernelSize: 3,
              filters: 32,
              activation: 'relu',
            }),
            tf.layers.maxPooling2d({poolSize: 2}),
            tf.layers.conv2d({
              kernelSize: 3,
              filters: 64,
              activation: 'relu',
            }),
            tf.layers.maxPooling2d({poolSize: 2}),
            tf.layers.flatten(),
            tf.layers.dense({units: 128, activation: 'relu'}),
            tf.layers.dropout({rate: 0.2}),
            tf.layers.dense({units: 10, activation: 'softmax'})
          ]
        })

        // 모델 컴파일
        model.compile({
          optimizer: 'adam',
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy']
        })

        // 임시 가중치 초기화 (실제로는 훈련된 가중치를 로드해야 함)
        const dummyInput = tf.zeros([1, 28, 28, 1])
        model.predict(dummyInput) // 모델 초기화
        dummyInput.dispose()

        setModel(model)
        addDebugLog('MNIST 모델 로딩 완료')
      } catch (error) {
        addDebugLog(`모델 로딩 실패: ${error}`)
        console.error('모델 로딩 실패:', error)
      } finally {
        setIsModelLoading(false)
      }
    }

    loadModel()
  }, [])

  // Phase 3: 연속 숫자 분할 및 인식 함수
  const recognizeDigits = async () => {
    if (!model || !canvasRef.current || !digitSegmentation) return

    setIsProcessing(true)
    const startTime = Date.now()

    try {
      const canvas = canvasRef.current

      // 캔버스에 내용이 있는지 확인
      const hasContent = checkCanvasContent(canvas)
      if (!hasContent) {
        addDebugLog('❌ 캔버스에 내용이 없습니다.')
        setRecognizedText('')
        setConfidence(0)
        setProcessingTime(0)
        setSegmentedDigits([])
        return
      }

      addDebugLog('✅ 캔버스 내용 확인됨')
      addDebugLog('🔄 Phase 3: 숫자 분할 시작...')

      // 1단계: 숫자 분할
      const ctx = canvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      const segmentationResult = await digitSegmentation.segmentDigits(imageData)
      
      addDebugLog(`📊 분할 결과: ${segmentationResult.segments.length}개 세그먼트`)
      addDebugLog(`📈 분할 신뢰도: ${(segmentationResult.confidence * 100).toFixed(1)}%`)
      
      setSegmentedDigits(segmentationResult.segments)
      setSegmentationQuality(segmentationResult.confidence)

      // 경계 박스 시각화
      if (debugMode) {
        digitSegmentation.visualizeSegmentation(segmentationResult.boundingBoxes, canvas)
      }

      // 2단계: 각 세그먼트 인식
      const recognizedDigits: string[] = []
      const confidences: number[] = []

      for (let i = 0; i < segmentationResult.segments.length; i++) {
        const segment = segmentationResult.segments[i]
        addDebugLog(`🔍 세그먼트 ${i + 1} 인식 중...`)
        
        // 세그먼트를 텐서로 변환
        const segmentTensor = tf.tensor4d(
          Array.from(segment.data).map(val => val / 255),
          [1, 28, 28, 1]
        )
        
        // 모델 예측
        const predictions = model.predict(segmentTensor) as tf.Tensor
        const probabilities = await predictions.data()
        
        const maxIndex = probabilities.indexOf(Math.max(...probabilities))
        const confidence = probabilities[maxIndex] * 100
        
        recognizedDigits.push(maxIndex.toString())
        confidences.push(confidence)
        
        addDebugLog(`📝 세그먼트 ${i + 1}: "${maxIndex}" (신뢰도: ${confidence.toFixed(1)}%)`)
        
        // 메모리 정리
        segmentTensor.dispose()
        predictions.dispose()
      }

      // 3단계: 결과 조합
      const finalResult = recognizedDigits.join('')
      const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length

      const endTime = Date.now()
      const processingTimeMs = endTime - startTime

      setRecognizedText(finalResult)
      setConfidence(avgConfidence)
      setProcessingTime(processingTimeMs)

      addDebugLog(`✅ 최종 인식 결과: "${finalResult}" (평균 신뢰도: ${avgConfidence.toFixed(1)}%)`)
      addDebugLog(`⏱️ 총 처리 시간: ${processingTimeMs}ms`)

      // 세그먼트 시각화
      visualizeSegments(segmentationResult.segments)

    } catch (error) {
      addDebugLog(`❌ 인식 에러: ${error}`)
      console.error('인식 에러:', error)
      setRecognizedText('인식 실패')
    } finally {
      setIsProcessing(false)
    }
  }

  // 세그먼트 시각화 함수
  const visualizeSegments = (segments: ImageData[]) => {
    if (!segmentationRef.current) return
    
    const container = segmentationRef.current
    container.innerHTML = ''
    
    segments.forEach((segment, index) => {
      const canvas = document.createElement('canvas')
      canvas.width = 28
      canvas.height = 28
      canvas.style.border = '1px solid #ccc'
      canvas.style.margin = '2px'
      canvas.style.backgroundColor = 'white'
      
      const ctx = canvas.getContext('2d')!
      ctx.putImageData(segment, 0, 0)
      
      const wrapper = document.createElement('div')
      wrapper.style.display = 'inline-block'
      wrapper.style.textAlign = 'center'
      wrapper.style.margin = '5px'
      
      const label = document.createElement('div')
      label.textContent = `${index + 1}`
      label.style.fontSize = '12px'
      label.style.color = '#666'
      
      wrapper.appendChild(canvas)
      wrapper.appendChild(label)
      container.appendChild(wrapper)
    })
  }

  // 캔버스 초기화
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 검은색 배경으로 초기화
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Phase 3 관련 상태 초기화
    setRecognizedText('')
    setConfidence(0)
    setProcessingTime(0)
    setSegmentedDigits([])
    setSegmentationQuality(0)

    // 세그먼트 시각화 초기화
    if (segmentationRef.current) {
      segmentationRef.current.innerHTML = ''
    }

    if (debugMode) {
      addDebugLog('🧹 캔버스 및 Phase 3 상태 초기화 완료')
    }
  }

  // 실행 취소 기능 (단순 구현)
  const undoLastStroke = () => {
    // 현재는 전체 지우기와 동일 (향후 개선 가능)
    clearCanvas()
    if (debugMode) {
      addDebugLog('↩️ 실행 취소 (전체 지우기)')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🧮 TensorFlow.js 기반 필기 인식 시스템
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Phase 3: 숫자 분할 알고리즘 - 연속된 숫자 '43525'를 개별 숫자로 분할
          </p>
          
          {/* 모델 로딩 상태 */}
          {isModelLoading && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <p className="text-yellow-800">🔄 TensorFlow.js 모델 로딩 중...</p>
            </div>
          )}
          
          {/* 필기 인식 섹션 */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              ✏️ 필기 인식 데모
            </h2>
            
            <div className="space-y-4">
              <DebugPanel
                debugMode={debugMode}
                onToggleDebug={() => setDebugMode(!debugMode)}
                debugLogs={debugLogs}
              />
              
              <CanvasDrawing
                canvasRef={canvasRef}
                segmentationRef={segmentationRef}
                isDrawing={isDrawing}
                setIsDrawing={setIsDrawing}
                digitSegmentation={digitSegmentation}
                setDigitSegmentation={setDigitSegmentation}
                onRecognize={recognizeDigits}
                onClear={clearCanvas}
                onUndo={undoLastStroke}
                isProcessing={isProcessing}
                isModelLoading={isModelLoading}
              />
              
              {/* 디버그 정보 */}
              {debugMode && (
                <DebugLogs debugLogs={debugLogs} />
              )}
              
              {/* 인식 결과 */}
              <RecognitionResult
                recognizedText={recognizedText}
                confidence={confidence}
                processingTime={processingTime}
                segmentedDigits={segmentedDigits}
                segmentationQuality={segmentationQuality}
              />
            </div>
          </div>
          
          {/* 구현 현황 */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              🚀 Phase 3 구현 현황
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ 완료된 기능</h3>
                <ul className="text-green-600 text-sm space-y-1">
                  <li>• 수직 투영 기반 숫자 분할</li>
                  <li>• 연결 요소 분석</li>
                  <li>• 지능형 분할 후처리</li>
                  <li>• 겹치는 세그먼트 병합</li>
                  <li>• 큰 세그먼트 재분할</li>
                  <li>• 픽셀 밀도 기반 필터링</li>
                  <li>• 28x28 MNIST 정규화</li>
                  <li>• 분할 품질 신뢰도 계산</li>
                  <li>• 세그먼트 시각화</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🔄 다음 단계</h3>
                <ul className="text-blue-600 text-sm space-y-1">
                  <li>• Phase 4: 훈련된 MNIST 모델 로드</li>
                  <li>• Phase 5: 통합 시스템</li>
                  <li>• Phase 6: 최적화 및 개선</li>
                  <li>• 초등학생 필기 특성 반영</li>
                </ul>
              </div>
            </div>
            
            {/* Phase 3 새로운 기능 설명 */}
            <div className="bg-emerald-50 p-4 rounded-lg mb-8">
              <h3 className="font-semibold text-emerald-800 mb-2">🆕 Phase 3 새로운 기능</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-emerald-700 mb-1">고급 분할 알고리즘</h4>
                  <ul className="text-emerald-600 text-sm space-y-1">
                    <li>• 수직 투영 + 연결 요소 분석</li>
                    <li>• 지능형 세그먼트 후처리</li>
                    <li>• 겹치는/붙어있는 숫자 분할</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-emerald-700 mb-1">품질 보장 시스템</h4>
                  <ul className="text-emerald-600 text-sm space-y-1">
                    <li>• 분할 품질 신뢰도 계산</li>
                    <li>• 실시간 세그먼트 시각화</li>
                    <li>• 적응형 분할 파라미터</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">🛠️ 기술 스택</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Next.js 15</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">TypeScript</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Tailwind CSS</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">TensorFlow.js</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Canvas API</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-2">⚠️ 현재 제한사항</h3>
              <p className="text-orange-700 text-sm">
                고급 숫자 분할 알고리즘이 구현되어 연속된 숫자를 개별 숫자로 정확히 분할할 수 있지만, 
                여전히 무작위 초기화된 모델을 사용하고 있습니다. 
                Phase 4에서 사전 훈련된 MNIST 모델을 로드하면 실제 숫자 인식이 가능해집니다.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            Created with ❤️ using TensorFlow.js & Next.js
          </div>
        </div>
      </div>
    </div>
  )
}
