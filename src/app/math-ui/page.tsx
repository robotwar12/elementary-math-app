'use client'

import { useState, useEffect } from 'react'

export default function ModernMathApp() {
  const [answers, setAnswers] = useState<{[key: number]: string}>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [currentProblem, setCurrentProblem] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  // 세로덧셈 문제들
  const problems = [
    { id: 1, num1: 245, num2: 137, answer: 382 },
    { id: 2, num1: 156, num2: 89, answer: 245 },
    { id: 3, num1: 378, num2: 264, answer: 642 },
    { id: 4, num1: 425, num2: 298, answer: 723 },
    { id: 5, num1: 567, num2: 185, answer: 752 },
    { id: 6, num1: 234, num2: 456, answer: 690 },
    { id: 7, num1: 189, num2: 347, answer: 536 },
    { id: 8, num1: 623, num2: 159, answer: 782 },
  ]

  // 타이머
  useEffect(() => {
    if (!submitted) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [submitted])

  const handleAnswerChange = (problemId: number, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setAnswers(prev => ({
        ...prev,
        [problemId]: value
      }))
    }
  }

  const handleSubmit = () => {
    let correctCount = 0
    problems.forEach(problem => {
      const userAnswer = parseInt(answers[problem.id] || '0')
      if (userAnswer === problem.answer) {
        correctCount++
      }
    })
    setScore(correctCount)
    setSubmitted(true)
    setTimeout(() => setShowResults(true), 500)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setShowResults(false)
    setTimeElapsed(0)
    setCurrentProblem(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const completedProblems = Object.keys(answers).length
  const progress = (completedProblems / problems.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">+</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Addition Practice</h1>
                <p className="text-sm text-gray-600">Master your math skills</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatTime(timeElapsed)}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{completedProblems}/{problems.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Progress</div>
              </div>
            </div>
          </div>
          
          {/* 진행률 바 */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {!submitted ? (
          <>
            {/* 문제 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {problems.map((problem, index) => {
                const isAnswered = answers[problem.id]
                const isActive = index === currentProblem
                
                return (
                  <div 
                    key={problem.id}
                    className={`relative p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                      isActive 
                        ? 'bg-white shadow-xl ring-2 ring-blue-500' 
                        : isAnswered
                        ? 'bg-green-50 shadow-lg border-2 border-green-200'
                        : 'bg-white shadow-lg hover:shadow-xl border border-gray-200'
                    }`}
                    onClick={() => setCurrentProblem(index)}
                  >
                    {/* 문제 번호 배지 */}
                    <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isAnswered ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {problem.id}
                    </div>
                    
                    {/* 세로덧셈 */}
                    <div className="text-center">
                      <div className="font-mono text-2xl space-y-3 mb-6">
                        <div className="text-gray-800">{problem.num1}</div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-blue-500 font-bold">+</span>
                          <span className="text-gray-800">{problem.num2}</span>
                        </div>
                        <div className="border-b-2 border-gray-400 w-20 mx-auto"></div>
                      </div>
                      
                      {/* 답안 입력 */}
                      <input
                        type="text"
                        value={answers[problem.id] || ''}
                        onChange={(e) => handleAnswerChange(problem.id, e.target.value)}
                        className="w-full text-center font-mono text-xl font-bold bg-gray-50 border-2 border-gray-300 rounded-lg py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="답을 입력하세요"
                        maxLength={4}
                      />
                    </div>
                    
                    {/* 체크 표시 */}
                    {isAnswered && (
                      <div className="absolute top-3 left-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* 제출 버튼 */}
            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={completedProblems === 0}
                className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
              >
                답안 제출 ({completedProblems}/{problems.length})
              </button>
            </div>
          </>
        ) : (
          /* 결과 화면 */
          <div className={`transition-all duration-1000 ${showResults ? 'opacity-100' : 'opacity-0'}`}>
            {/* 점수 카드 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl">🎯</span>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-6">잘 했어요!</h2>
              
              <div className="grid grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="text-4xl font-bold text-blue-600">{score}</div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider">정답</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600">{Math.round((score/problems.length)*100)}%</div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider">정확도</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600">{formatTime(timeElapsed)}</div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider">시간</div>
                </div>
              </div>
              
              {/* 성과 메시지 */}
              <div className="mb-6">
                {score === problems.length ? (
                  <div className="text-green-600 font-semibold text-lg">🏆 완벽해요! 대단합니다!</div>
                ) : score >= problems.length * 0.8 ? (
                  <div className="text-blue-600 font-semibold text-lg">🌟 훌륭해요!</div>
                ) : score >= problems.length * 0.6 ? (
                  <div className="text-purple-600 font-semibold text-lg">👍 잘했어요!</div>
                ) : (
                  <div className="text-orange-600 font-semibold text-lg">💪 다시 도전해보세요!</div>
                )}
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  다시 풀기
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-8 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all"
                >
                  메인으로
                </button>
              </div>
            </div>
            
            {/* 상세 결과 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {problems.map((problem) => {
                const userAnswer = parseInt(answers[problem.id] || '0')
                const isCorrect = userAnswer === problem.answer
                
                return (
                  <div 
                    key={problem.id}
                    className={`p-4 rounded-xl border-2 ${
                      isCorrect 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="text-center font-mono">
                      <div className="text-lg font-semibold mb-1">{problem.num1}</div>
                      <div className="text-lg mb-1">+ {problem.num2}</div>
                      <div className="border-b-2 border-gray-400 w-16 mx-auto mb-3"></div>
                      <div className={`text-lg font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {userAnswer || '없음'}
                      </div>
                      {!isCorrect && (
                        <div className="text-sm text-green-600 mt-2">
                          정답: {problem.answer}
                        </div>
                      )}
                      <div className="mt-3">
                        {isCorrect ? (
                          <span className="text-green-600 text-2xl">✓</span>
                        ) : (
                          <span className="text-red-600 text-2xl">✗</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
