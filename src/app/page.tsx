'use client'

import { useState, useRef } from 'react'
import { CanvasDrawing } from '../components/CanvasDrawing'
import { DigitRecognizer } from '../components/DigitRecognizer'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [recognizedText, setRecognizedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [digitRecognizer] = useState(() => new DigitRecognizer())

  // 숫자 인식 함수
  const recognizeDigits = async () => {
    if (!canvasRef.current) return

    setIsProcessing(true)
    setIsModelLoading(true)
    setErrorMessage('')
    const startTime = Date.now()

    try {
      const canvas = canvasRef.current
      
      // 캔버스에 내용이 있는지 간단 체크
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.')
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const hasContent = Array.from(imageData.data).some((value, index) => 
        index % 4 === 3 && value > 0 // Alpha 채널이 0보다 큰 픽셀이 있는지 확인
      )

      if (!hasContent) {
        setRecognizedText('')
        setErrorMessage('캔버스에 숫자를 그려주세요.')
        return
      }

      // Wosaku 알고리즘으로 숫자 인식
      console.log('🔄 Wosaku 숫자 인식 시작...')
      const results = await digitRecognizer.recognizeDigits(canvas)
      
      const endTime = Date.now()
      const processingTimeMs = endTime - startTime

      setRecognizedText(results.join(''))
      setProcessingTime(processingTimeMs)
      
      console.log(`✅ 인식 완료: "${results.join('')}" (${processingTimeMs}ms)`)

    } catch (error) {
      console.error('❌ 인식 에러:', error)
      setErrorMessage(error instanceof Error ? error.message : '인식 중 오류가 발생했습니다.')
      setRecognizedText('인식 실패')
    } finally {
      setIsProcessing(false)
      setIsModelLoading(false)
    }
  }

  // 캔버스 초기화
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 투명 배경으로 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 상태 초기화
    setRecognizedText('')
    setProcessingTime(0)
    setErrorMessage('')
    
    console.log('🧹 캔버스 초기화 완료')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🧮 Elementary Math App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Wosaku 알고리즘 기반 손글씨 숫자 인식 시스템
          </p>
          
          {/* 가중치 로딩 테스트 섹션 */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              ✏️ 손글씨 숫자 인식 테스트
            </h2>
            
            <div className="space-y-6">
              {/* 에러 메시지 표시 */}
              {errorMessage && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                  <p className="text-red-800">❌ {errorMessage}</p>
                </div>
              )}

              {/* 캔버스 드로잉 컴포넌트 */}
              <CanvasDrawing
                canvasRef={canvasRef}
                onRecognize={recognizeDigits}
                onClear={clearCanvas}
                isProcessing={isProcessing}
                isModelLoading={isModelLoading}
              />
              
              {/* 인식 결과 표시 */}
              {recognizedText && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    🎯 인식 결과
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {recognizedText}
                    </div>
                    <div className="text-sm text-green-700">
                      처리 시간: {processingTime}ms
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 시스템 정보 */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              🚀 시스템 구성
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🧠 인식 엔진</h3>
                <ul className="text-blue-600 text-sm space-y-1">
                  <li>• Wosaku 신경망 알고리즘</li>
                  <li>• 785×300×10 구조</li>
                  <li>• 동적 가중치 로딩</li>
                  <li>• MNIST 호환 처리</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">⚡ 성능 최적화</h3>
                <ul className="text-green-600 text-sm space-y-1">
                  <li>• 컨텍스트 윈도우 99.9% 절약</li>
                  <li>• 캐싱 시스템</li>
                  <li>• Multi-Stage Segmentation</li>
                  <li>• 실시간 처리</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">🛠️ 기술 스택</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Next.js 15</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">TypeScript</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Tailwind CSS</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Wosaku Algorithm</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Canvas API</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">WeightLoader</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <h3 className="font-semibold text-emerald-800 mb-2">📋 테스트 방법</h3>
              <ol className="text-emerald-700 text-sm space-y-1">
                <li>1. 위 캔버스에 숫자를 그려보세요 (예: 4325)</li>
                <li>2. "숫자 인식" 버튼을 클릭하세요</li>
                <li>3. 가중치 로딩 → 분할 → 인식 과정을 확인하세요</li>
                <li>4. 브라우저 개발자도구에서 상세 로그를 확인하세요</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            Created with ❤️ using Wosaku Algorithm & Next.js
          </div>
        </div>
      </div>
    </div>
  )
}
