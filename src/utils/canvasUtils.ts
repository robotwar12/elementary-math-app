import { getStroke } from 'perfect-freehand'

/**
 * 캔버스 좌표 변환 함수
 */
export const getScaledCoordinates = (
  clientX: number, 
  clientY: number, 
  canvas: HTMLCanvasElement
) => {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  }
}

/**
 * Perfect Freehand 스트로크를 캔버스에 그리기
 */
export const drawStroke = (ctx: CanvasRenderingContext2D, stroke: number[][]) => {
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

/**
 * 캔버스 초기 설정
 */
export const initializeCanvas = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#000000'
  ctx.fillStyle = '#000000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 1.0
}

/**
 * 모든 스트로크를 캔버스에 다시 그리기
 */
export const redrawAllStrokes = (
  canvas: HTMLCanvasElement,
  allStrokes: Array<Array<[number, number, number]>>,
  currentStrokePoints: Array<[number, number, number]>,
  isDrawing: boolean
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 캔버스 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const fixedBrushSize = 4
  
  // 완료된 모든 스트로크 그리기
  allStrokes.forEach(strokePoints => {
    if (strokePoints.length > 0) {
      const stroke = getStroke(strokePoints, {
        size: fixedBrushSize,
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.5,
      })
      drawStroke(ctx, stroke)
    }
  })

  // 현재 그리고 있는 스트로크 그리기
  if (isDrawing && currentStrokePoints.length > 0) {
    const currentStroke = getStroke(currentStrokePoints, {
      size: fixedBrushSize,
      thinning: 0,
      smoothing: 0.5,
      streamline: 0.5,
    })
    drawStroke(ctx, currentStroke)
  }
}

/**
 * 그리기 시작 시 초기 점 그리기
 */
export const drawInitialPoint = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) => {
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(x, y, 2, 0, 2 * Math.PI)
  ctx.fill()
}

/**
 * 이전 점에서 현재 점까지 선 그리기
 */
export const drawLineTo = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) => {
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()
}