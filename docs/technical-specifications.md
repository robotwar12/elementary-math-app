# 🔧 기술 명세서 - TensorFlow.js 필기 인식 시스템

## 📋 시스템 개요

### 시스템 아키텍처
```
Input Layer (캔버스) → 전처리 → 분할 → 인식 → 출력
     ↓              ↓        ↓      ↓      ↓
DrawingCanvas → Preprocessing → Segmentation → Recognition → UI Display
```

### 핵심 요구사항
- **캔버스 크기**: 200x60px (교과서 답안란 최적화)
- **인식 대상**: 연속된 숫자 '43525' 
- **정확도**: 85-90% (초등학생 필기 기준)
- **응답 시간**: <500ms
- **동작 모드**: 완전 오프라인

## 🎨 DrawingCanvas 컴포넌트

### 인터페이스 명세
```typescript
interface DrawingCanvasProps {
  width: 200;
  height: 60;
  lineWidth: 2 | 3;
  backgroundColor: '#000000';
  strokeColor: '#ffffff';
  onDrawingComplete?: (imageData: ImageData) => void;
  onClear?: () => void;
}

interface DrawingCanvasRef {
  clearCanvas(): void;
  getImageData(): ImageData;
  undo(): void;
  isEmpty(): boolean;
}
```

### 이벤트 처리
```typescript
// 마우스 이벤트
onMouseDown(e: MouseEvent): void
onMouseMove(e: MouseEvent): void  
onMouseUp(e: MouseEvent): void

// 터치 이벤트
onTouchStart(e: TouchEvent): void
onTouchMove(e: TouchEvent): void
onTouchEnd(e: TouchEvent): void

// 좌표 정규화
normalizeCoordinates(clientX: number, clientY: number): Point
```

### 성능 요구사항
- **드로잉 지연**: <16ms (60fps 유지)
- **메모리 사용**: <10MB
- **터치 정확도**: ±2px

## 🖼️ 이미지 전처리 시스템

### ImagePreprocessor 클래스
```typescript
class ImagePreprocessor {
  // 주요 메서드
  extractImageData(canvas: HTMLCanvasElement): ImageData
  convertToGrayscale(imageData: ImageData): Uint8Array
  binarizeImage(grayscale: Uint8Array, threshold: number): Uint8Array
  removeNoise(binary: Uint8Array, width: number, height: number): Uint8Array
  normalizeToMNIST(image: Uint8Array, width: number, height: number): Float32Array
}
```

### 알고리즘 상세

#### 1. 그레이스케일 변환
```typescript
// 공식: Y = 0.299*R + 0.587*G + 0.114*B
function convertToGrayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const grayscale = new Uint8Array(width * height);
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      data[i] * 0.299 +     // R
      data[i + 1] * 0.587 + // G
      data[i + 2] * 0.114   // B
    );
    grayscale[i / 4] = gray;
  }
  
  return grayscale;
}
```

#### 2. 이진화 처리
```typescript
function binarizeImage(grayscale: Uint8Array, threshold: number = 128): Uint8Array {
  return grayscale.map(pixel => pixel > threshold ? 255 : 0);
}
```

#### 3. 노이즈 제거
```typescript
// 가우시안 블러 + 모폴로지 연산
function removeNoise(binary: Uint8Array, width: number, height: number): Uint8Array {
  // 1. 가우시안 블러 적용
  const blurred = applyGaussianBlur(binary, width, height, 1.0);
  
  // 2. 모폴로지 침식 → 팽창
  const eroded = morphologyErode(blurred, width, height, 1);
  const dilated = morphologyDilate(eroded, width, height, 1);
  
  return dilated;
}
```

#### 4. MNIST 정규화
```typescript
function normalizeToMNIST(image: Uint8Array, width: number, height: number): Float32Array {
  // 1. 경계 박스 계산
  const bbox = calculateBoundingBox(image, width, height);
  
  // 2. 크롭 및 리사이즈
  const cropped = cropImage(image, bbox, width, height);
  const resized = resizeImage(cropped, bbox.width, bbox.height, 28, 28);
  
  // 3. 중앙 정렬
  const centered = centerImage(resized, 28, 28);
  
  // 4. 픽셀 값 정규화 (0-1 범위)
  return new Float32Array(centered.map(pixel => pixel / 255.0));
}
```

## ✂️ 숫자 분할 시스템

### DigitSegmenter 클래스
```typescript
class DigitSegmenter {
  // 주요 메서드
  segmentDigits(image: Uint8Array, width: number, height: number): DigitSegment[]
  calculateVerticalProjection(image: Uint8Array, width: number, height: number): number[]
  findSegmentationPoints(projection: number[]): number[]
  extractConnectedComponents(image: Uint8Array, width: number, height: number): Component[]
}

interface DigitSegment {
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: Uint8Array;
  confidence: number;
}
```

### 수직 투영 알고리즘
```typescript
function calculateVerticalProjection(image: Uint8Array, width: number, height: number): number[] {
  const projection = new Array(width).fill(0);
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const index = y * width + x;
      if (image[index] > 0) {
        projection[x]++;
      }
    }
  }
  
  return projection;
}
```

### 분할 점 찾기
```typescript
function findSegmentationPoints(projection: number[]): number[] {
  const points: number[] = [];
  const threshold = Math.max(...projection) * 0.1; // 10% 임계값
  
  for (let i = 1; i < projection.length - 1; i++) {
    if (projection[i] < threshold && 
        projection[i-1] >= threshold && 
        projection[i+1] >= threshold) {
      points.push(i);
    }
  }
  
  return points;
}
```

### 연결 요소 분석
```typescript
function extractConnectedComponents(image: Uint8Array, width: number, height: number): Component[] {
  const visited = new Array(width * height).fill(false);
  const components: Component[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (image[index] > 0 && !visited[index]) {
        const component = floodFill(image, visited, x, y, width, height);
        if (component.size > 50) { // 노이즈 제거
          components.push(component);
        }
      }
    }
  }
  
  return components;
}
```

## 🧠 TensorFlow.js 모델 시스템

### DigitRecognizer 클래스
```typescript
class DigitRecognizer {
  private model: tf.LayersModel;
  
  async loadModel(modelPath: string): Promise<void>
  async predict(imageData: Float32Array): Promise<PredictionResult>
  async predictBatch(images: Float32Array[]): Promise<PredictionResult[]>
  dispose(): void
}

interface PredictionResult {
  digit: number;
  confidence: number;
  probabilities: number[]; // 0-9 각 숫자별 확률
}
```

### 모델 구조
```typescript
// CNN 모델 구조
const model = tf.sequential({
  layers: [
    tf.layers.conv2d({
      inputShape: [28, 28, 1],
      filters: 32,
      kernelSize: 3,
      activation: 'relu'
    }),
    tf.layers.maxPooling2d({ poolSize: [2, 2] }),
    tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu'
    }),
    tf.layers.maxPooling2d({ poolSize: [2, 2] }),
    tf.layers.flatten(),
    tf.layers.dense({
      units: 128,
      activation: 'relu'
    }),
    tf.layers.dropout({ rate: 0.5 }),
    tf.layers.dense({
      units: 10,
      activation: 'softmax'
    })
  ]
});
```

### 예측 처리
```typescript
async function predict(imageData: Float32Array): Promise<PredictionResult> {
  // 1. 텐서 생성
  const tensor = tf.tensor4d(imageData, [1, 28, 28, 1]);
  
  // 2. 모델 예측
  const prediction = this.model.predict(tensor) as tf.Tensor;
  const probabilities = await prediction.data();
  
  // 3. 결과 처리
  const maxIndex = probabilities.indexOf(Math.max(...probabilities));
  const confidence = probabilities[maxIndex];
  
  // 4. 메모리 정리
  tensor.dispose();
  prediction.dispose();
  
  return {
    digit: maxIndex,
    confidence: confidence,
    probabilities: Array.from(probabilities)
  };
}
```

## 🎯 메인 통합 시스템

### HandwritingRecognizer 클래스
```typescript
class HandwritingRecognizer {
  private preprocessor: ImagePreprocessor;
  private segmenter: DigitSegmenter;
  private recognizer: DigitRecognizer;
  
  async recognize(canvas: HTMLCanvasElement): Promise<RecognitionResult>
  async recognizeSequence(canvas: HTMLCanvasElement): Promise<SequenceResult>
  dispose(): void
}

interface RecognitionResult {
  success: boolean;
  digits: number[];
  confidence: number;
  processingTime: number;
  intermediateResults: {
    preprocessed: ImageData;
    segments: DigitSegment[];
    predictions: PredictionResult[];
  };
}
```

### 전체 파이프라인
```typescript
async function recognize(canvas: HTMLCanvasElement): Promise<RecognitionResult> {
  const startTime = performance.now();
  
  try {
    // 1. 이미지 전처리
    const imageData = canvas.getContext('2d')!.getImageData(0, 0, 200, 60);
    const preprocessed = this.preprocessor.processImage(imageData);
    
    // 2. 숫자 분할
    const segments = this.segmenter.segmentDigits(
      preprocessed.binary, 
      preprocessed.width, 
      preprocessed.height
    );
    
    // 3. 각 숫자 인식
    const predictions: PredictionResult[] = [];
    for (const segment of segments) {
      const normalized = this.preprocessor.normalizeToMNIST(
        segment.imageData, 
        segment.width, 
        segment.height
      );
      const prediction = await this.recognizer.predict(normalized);
      predictions.push(prediction);
    }
    
    // 4. 결과 조합
    const digits = predictions.map(p => p.digit);
    const confidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    return {
      success: true,
      digits,
      confidence,
      processingTime: performance.now() - startTime,
      intermediateResults: {
        preprocessed: preprocessed.imageData,
        segments,
        predictions
      }
    };
    
  } catch (error) {
    return {
      success: false,
      digits: [],
      confidence: 0,
      processingTime: performance.now() - startTime,
      intermediateResults: null
    };
  }
}
```

## 🎨 UI 컴포넌트

### RecognitionResult 컴포넌트
```typescript
interface RecognitionResultProps {
  result: RecognitionResult;
  showDetails?: boolean;
  onRetry?: () => void;
}

function RecognitionResult({ result, showDetails, onRetry }: RecognitionResultProps) {
  return (
    <div className="recognition-result">
      <div className="result-display">
        <span className="digits">{result.digits.join('')}</span>
        <span className="confidence">{(result.confidence * 100).toFixed(1)}%</span>
      </div>
      
      {showDetails && (
        <div className="details">
          <div>처리 시간: {result.processingTime.toFixed(0)}ms</div>
          <div>개별 숫자: {result.intermediateResults.predictions.map(p => 
            `${p.digit}(${(p.confidence * 100).toFixed(1)}%)`
          ).join(', ')}</div>
        </div>
      )}
      
      {!result.success && (
        <button onClick={onRetry} className="retry-button">
          다시 시도
        </button>
      )}
    </div>
  );
}
```

## 📊 성능 최적화

### 메모리 관리
```typescript
class MemoryManager {
  private tensorCache = new Map<string, tf.Tensor>();
  
  cacheTensor(key: string, tensor: tf.Tensor): void {
    this.disposeTensor(key);
    this.tensorCache.set(key, tensor);
  }
  
  disposeTensor(key: string): void {
    const tensor = this.tensorCache.get(key);
    if (tensor) {
      tensor.dispose();
      this.tensorCache.delete(key);
    }
  }
  
  disposeAll(): void {
    this.tensorCache.forEach(tensor => tensor.dispose());
    this.tensorCache.clear();
  }
}
```

### 웹 워커 활용
```typescript
// worker.ts
self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;
  
  switch (type) {
    case 'preprocess':
      const preprocessed = await preprocessImage(data.imageData);
      self.postMessage({ type: 'preprocessed', result: preprocessed });
      break;
      
    case 'segment':
      const segments = await segmentDigits(data.image);
      self.postMessage({ type: 'segmented', result: segments });
      break;
  }
};
```

## 🔍 디버깅 및 모니터링

### 성능 모니터링
```typescript
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  
  startTimer(name: string): string {
    const id = `${name}-${Date.now()}`;
    this.metrics.push({
      id,
      name,
      startTime: performance.now(),
      endTime: null
    });
    return id;
  }
  
  endTimer(id: string): number {
    const metric = this.metrics.find(m => m.id === id);
    if (metric) {
      metric.endTime = performance.now();
      return metric.endTime - metric.startTime;
    }
    return 0;
  }
  
  getAverageTime(name: string): number {
    const completed = this.metrics.filter(m => m.name === name && m.endTime);
    if (completed.length === 0) return 0;
    
    const total = completed.reduce((sum, m) => sum + (m.endTime! - m.startTime), 0);
    return total / completed.length;
  }
}
```

### 에러 처리
```typescript
class ErrorHandler {
  static handleRecognitionError(error: Error): RecognitionResult {
    console.error('Recognition failed:', error);
    
    // 에러 타입별 처리
    if (error.name === 'ModelLoadError') {
      return {
        success: false,
        digits: [],
        confidence: 0,
        processingTime: 0,
        error: '모델 로드 실패. 페이지를 새로고침해주세요.'
      };
    }
    
    if (error.name === 'MemoryError') {
      return {
        success: false,
        digits: [],
        confidence: 0,
        processingTime: 0,
        error: '메모리 부족. 캔버스를 지우고 다시 시도해주세요.'
      };
    }
    
    return {
      success: false,
      digits: [],
      confidence: 0,
      processingTime: 0,
      error: '인식 실패. 다시 시도해주세요.'
    };
  }
}
```

## 🧪 테스트 명세

### 단위 테스트
```typescript
describe('ImagePreprocessor', () => {
  it('should convert image to grayscale correctly', () => {
    const mockImageData = createMockImageData(100, 100);
    const result = preprocessor.convertToGrayscale(mockImageData);
    expect(result.length).toBe(10000);
    expect(result[0]).toBeGreaterThanOrEqual(0);
    expect(result[0]).toBeLessThanOrEqual(255);
  });
  
  it('should normalize image to MNIST format', () => {
    const mockImage = new Uint8Array(100 * 100);
    const result = preprocessor.normalizeToMNIST(mockImage, 100, 100);
    expect(result.length).toBe(28 * 28);
    expect(result[0]).toBeGreaterThanOrEqual(0);
    expect(result[0]).toBeLessThanOrEqual(1);
  });
});
```

### 통합 테스트
```typescript
describe('HandwritingRecognizer Integration', () => {
  it('should recognize single digit correctly', async () => {
    const canvas = createMockCanvas('5');
    const result = await recognizer.recognize(canvas);
    
    expect(result.success).toBe(true);
    expect(result.digits).toEqual([5]);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.processingTime).toBeLessThan(500);
  });
  
  it('should recognize sequence "43525" correctly', async () => {
    const canvas = createMockCanvas('43525');
    const result = await recognizer.recognize(canvas);
    
    expect(result.success).toBe(true);
    expect(result.digits).toEqual([4, 3, 5, 2, 5]);
    expect(result.confidence).toBeGreaterThan(0.85);
  });
});
```

## 📈 배포 및 운영

### 빌드 최적화
```typescript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      '@tensorflow/tfjs$': '@tensorflow/tfjs/dist/tf.min.js'
    }
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        tensorflow: {
          test: /[\\/]node_modules[\\/]@tensorflow[\\/]/,
          name: 'tensorflow',
          chunks: 'all',
          priority: 10
        }
      }
    }
  }
};
```

### 성능 모니터링 지표
- **First Contentful Paint**: <1.5초
- **Largest Contentful Paint**: <2.5초
- **Time to Interactive**: <3.5초
- **인식 응답 시간**: <500ms
- **메모리 사용량**: <100MB

---

**Version**: 1.0.0  
**Updated**: 2025.01.09  
**Status**: TensorFlow.js 기반 아키텍처 완료
