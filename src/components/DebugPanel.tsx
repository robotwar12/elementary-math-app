'use client'

interface DebugPanelProps {
  debugMode: boolean
  onToggleDebug: () => void
  debugLogs: string[]
}

export function DebugPanel({ debugMode, onToggleDebug, debugLogs }: DebugPanelProps) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-gray-600">
        아래 캔버스에 연속된 숫자 '43525'를 써보세요!
      </p>
      <button
        onClick={onToggleDebug}
        className={`px-3 py-1 rounded text-sm transition-colors ${
          debugMode 
            ? 'bg-orange-500 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        🔧 디버그 모드
      </button>
    </div>
  )
}

interface DebugLogsProps {
  debugLogs: string[]
}

export function DebugLogs({ debugLogs }: DebugLogsProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="font-semibold text-yellow-800 mb-2">🔧 디버그 정보</h3>
      
      <div className="bg-gray-800 text-green-400 p-3 rounded text-sm font-mono h-32 overflow-y-auto">
        {debugLogs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  )
}
