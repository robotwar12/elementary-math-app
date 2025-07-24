'use client'

import { useEffect, useState } from 'react'

interface PWAUpdatePromptProps {
  onUpdate?: () => void
  onDismiss?: () => void
}

export default function PWAUpdatePrompt({ onUpdate, onDismiss }: PWAUpdatePromptProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 서비스 워커 업데이트 감지
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          // 새로운 서비스 워커가 설치 대기 중인지 확인
          if (registration.waiting) {
            setUpdateAvailable(true)
          }

          // 새로운 서비스 워커가 설치 중인지 감지
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true)
                }
              })
            }
          })
        })

        // 새로운 서비스 워커가 제어권을 가져갈 때
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      }
    }

    checkForUpdates()

    // 주기적으로 업데이트 확인 (30초마다)
    const interval = setInterval(checkForUpdates, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleUpdate = async () => {
    if (!('serviceWorker' in navigator)) return

    setInstalling(true)

    try {
      const registration = await navigator.serviceWorker.ready
      
      if (registration.waiting) {
        // 새로운 서비스 워커에게 skipWaiting 메시지 전송
        registration.waiting.postMessage({ action: 'skipWaiting' })
      }

      onUpdate?.()
      
      // 잠시 후 페이지 새로고침
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('업데이트 실패:', error)
      setInstalling(false)
    }
  }

  const handleDismiss = () => {
    setUpdateAvailable(false)
    onDismiss?.()
  }

  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              새 버전 사용 가능
            </h3>
            <p className="text-sm text-gray-500">
              앱의 새로운 버전이 있습니다. 지금 업데이트하시겠습니까?
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleUpdate}
            disabled={installing}
            className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {installing ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>업데이트 중...</span>
              </span>
            ) : (
              '지금 업데이트'
            )}
          </button>
          
          <button
            onClick={handleDismiss}
            disabled={installing}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  )
}
