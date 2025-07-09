import * as tf from '@tensorflow/tfjs'

// 경계 박스 계산 함수
export const getBoundingBox = (imageData: ImageData): {x: number, y: number, width: number, height: number} => {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  
  let minX = width, maxX = 0
  let minY = height, maxY = 0
  
  // 비어있지 않은 픽셀 찾기
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      
      // 검은색이 아닌 픽셀 (흰색 선)
      if (r > 10 || g > 10 || b > 10) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }
  
  // 유효한 경계 박스가 없는 경우 기본값 반환
  if (minX >= maxX || minY >= maxY) {
    return { x: 0, y: 0, width: width, height: height }
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  }
}

// 가우시안 블러 필터 적용
export const applyGaussianBlur = (imageData: Float32Array, width: number, height: number): Float32Array => {
  const blurred = new Float32Array(width * height)
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ]
  const kernelSum = 16
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = (y + ky) * width + (x + kx)
          sum += imageData[pixelIndex] * kernel[ky + 1][kx + 1]
        }
      }
      blurred[y * width + x] = sum / kernelSum
    }
  }
  
  return blurred
}

// 이진화 처리
export const binarize = (imageData: Float32Array, threshold: number = 0.5): Float32Array => {
  const binary = new Float32Array(imageData.length)
  for (let i = 0; i < imageData.length; i++) {
    binary[i] = imageData[i] > threshold ? 1.0 : 0.0
  }
  return binary
}

// MNIST 스타일 정규화 (20x20 크기로 맞춘 후 28x28에 중앙 배치)
export const normalizeToMNIST = (croppedData: Float32Array, croppedWidth: number, croppedHeight: number): Float32Array => {
  const mnist = new Float32Array(28 * 28)
  
  // 20x20 영역에 맞추기 위한 스케일 계산
  const targetSize = 20
  const scale = Math.min(targetSize / croppedWidth, targetSize / croppedHeight)
  
  const scaledWidth = Math.round(croppedWidth * scale)
  const scaledHeight = Math.round(croppedHeight * scale)
  
  // 28x28 이미지의 중앙에 배치하기 위한 오프셋 계산
  const offsetX = Math.floor((28 - scaledWidth) / 2)
  const offsetY = Math.floor((28 - scaledHeight) / 2)
  
  // 크롭된 이미지를 스케일링하여 28x28 중앙에 배치
  for (let y = 0; y < scaledHeight; y++) {
    for (let x = 0; x < scaledWidth; x++) {
      const srcX = Math.floor(x / scale)
      const srcY = Math.floor(y / scale)
      
      if (srcX < croppedWidth && srcY < croppedHeight) {
        const srcIndex = srcY * croppedWidth + srcX
        const dstIndex = (y + offsetY) * 28 + (x + offsetX)
        mnist[dstIndex] = croppedData[srcIndex]
      }
    }
  }
  
  return mnist
}

// 캔버스 내용 확인 함수
export const checkCanvasContent = (canvas: HTMLCanvasElement): boolean => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return false

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // 검은색이 아닌 픽셀이 있는지 확인 (흰색 선이 그려졌는지)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // 완전히 검은색(0,0,0)이 아닌 픽셀이 있으면 내용이 있다고 판단
    if (r > 0 || g > 0 || b > 0) {
      return true
    }
  }
  return false
}

// 고급 이미지 전처리 함수
export const preprocessImage = (canvas: HTMLCanvasElement, addDebugLog: (message: string) => void): tf.Tensor => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  addDebugLog('🔍 1단계: 이미지 데이터 추출')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // 그레이스케일 변환
  addDebugLog('🔍 2단계: 그레이스케일 변환')
  const grayscale = new Float32Array(canvas.width * canvas.height)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    // 그레이스케일 변환 (흰색 선을 1, 검은색 배경을 0으로)
    const gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    grayscale[i / 4] = gray
  }

  // 경계 박스 계산 및 크롭핑
  addDebugLog('🔍 3단계: 경계 박스 계산')
  const boundingBox = getBoundingBox(imageData)
  addDebugLog(`📦 경계 박스: ${boundingBox.width}x${boundingBox.height} at (${boundingBox.x}, ${boundingBox.y})`)
  
  // 크롭된 이미지 데이터 추출
  const croppedData = new Float32Array(boundingBox.width * boundingBox.height)
  for (let y = 0; y < boundingBox.height; y++) {
    for (let x = 0; x < boundingBox.width; x++) {
      const srcIndex = (boundingBox.y + y) * canvas.width + (boundingBox.x + x)
      croppedData[y * boundingBox.width + x] = grayscale[srcIndex] || 0
    }
  }

  // 가우시안 블러 적용 (노이즈 제거)
  addDebugLog('🔍 4단계: 가우시안 블러 적용')
  const blurred = applyGaussianBlur(croppedData, boundingBox.width, boundingBox.height)
  
  // 이진화 처리
  addDebugLog('🔍 5단계: 이진화 처리')
  const binary = binarize(blurred, 0.3) // 낮은 임계값으로 더 많은 세부사항 보존
  
  // MNIST 스타일 정규화
  addDebugLog('🔍 6단계: MNIST 스타일 정규화')
  const normalized = normalizeToMNIST(binary, boundingBox.width, boundingBox.height)
  
  addDebugLog('✅ 전처리 파이프라인 완료')
  
  // 텐서로 변환 [1, 28, 28, 1]
  return tf.tensor4d(normalized, [1, 28, 28, 1])
}
