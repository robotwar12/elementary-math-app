import * as ort from 'onnxruntime-web';

export interface ConnectedComponent {
  id: number;
  pixels: Array<{ x: number; y: number }>;
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

export interface RecognitionResult {
  component: ConnectedComponent;
  predictedDigit: number;
  confidence: number;
  isLowConfidence: boolean;
  normalizedImageDataUrl?: string; // 정규화된 28x28 이미지 시각화용
}

/**
 * 메모리 풀링을 통한 성능 최적화 클래스
 */
class RecognitionMemoryPool {
  private tensorPool: Float32Array[] = [];
  private canvasPool: HTMLCanvasElement[] = [];
  private imageDataCache: Map<string, ImageData> = new Map();
  private maxPoolSize = 10;

  getTensor(): Float32Array {
    return this.tensorPool.pop() || new Float32Array(28 * 28);
  }

  returnTensor(tensor: Float32Array): void {
    if (this.tensorPool.length < this.maxPoolSize) {
      // 텐서 초기화 후 풀에 반환
      tensor.fill(0);
      this.tensorPool.push(tensor);
    }
  }

  getCanvas(): HTMLCanvasElement {
    if (this.canvasPool.length > 0) {
      return this.canvasPool.pop()!;
    }
    
    // 브라우저 환경 체크
    if (typeof document === 'undefined') {
      throw new Error('Canvas API는 브라우저 환경에서만 사용 가능합니다');
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    return canvas;
  }

  returnCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvasPool.length < this.maxPoolSize) {
      // 캔버스 초기화 후 풀에 반환
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 28, 28);
      }
      this.canvasPool.push(canvas);
    }
  }

  getImageData(canvas: HTMLCanvasElement, key: string): ImageData {
    // 캐시된 ImageData 반환 (동일한 크기의 경우)
    if (this.imageDataCache.has(key)) {
      return this.imageDataCache.get(key)!;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    const imageData = ctx.createImageData(28, 28);
    
    // 캐시 크기 제한
    if (this.imageDataCache.size < 50) {
      this.imageDataCache.set(key, imageData);
    }
    
    return imageData;
  }

  clear(): void {
    this.tensorPool = [];
    this.canvasPool = [];
    this.imageDataCache.clear();
  }
}

export class ONNXDigitRecognizer {
  private session: ort.InferenceSession | null = null;
  private isInitialized = false;
  private memoryPool = new RecognitionMemoryPool();
  private lastRecognitionTime = 0;
  private recognitionCache = new Map<string, RecognitionResult>();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // ONNX Runtime Web 최적화 설정
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";
      ort.env.wasm.numThreads = 1; // 단일 스레드로 안정성 확보
      
      // 세션 옵션 최적화
      const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: ['wasm'], // WebAssembly 백엔드 명시
        graphOptimizationLevel: 'all'
      };
      
      console.log('🔄 ONNX 모델 로딩 시작: /models/digit_recognition_v2.onnx');
      this.session = await ort.InferenceSession.create('/models/digit_recognition_v2.onnx', sessionOptions);
      this.isInitialized = true;
      
      // 모델 정보 출력
      console.log('🎯 ONNX Runtime Web 모델 로딩 완료!');
      console.log('📋 모델 입력:', this.session.inputNames);
      console.log('📋 모델 출력:', this.session.outputNames);
    } catch (error) {
      console.error('❌ ONNX Runtime Web 모델 로딩 실패:', error);
      throw error;
    }
  }

  /**
   * 연결성분을 28x28 이미지로 정규화 (메모리 풀링 최적화 적용)
   */
  private normalizeComponent(component: ConnectedComponent): { normalized: Float32Array; canvas: HTMLCanvasElement } {
    // 메모리 풀에서 캔버스 재사용
    const canvas = this.memoryPool.getCanvas();
    
    // 1단계: 연결성분을 캔버스에 렌더링 (최적화된 버전)
    this.renderComponentToCanvasOptimized(component, canvas);
    
    // 2단계: 그레이스케일 변환 (ImageData 직접 조작)
    const grayscaleData = this.convertToGrayscaleOptimized(canvas);
    
    // 3단계: 종횡비 유지하면서 20x20 내에서 리사이즈
    const { resizedData, newWidth, newHeight } = this.resizeKeepingAspectRatio(
      grayscaleData, canvas.width, canvas.height, 20
    );
    
    // 4단계: 28x28 패딩 및 중앙 정렬
    const paddedData = this.resizeWithPadding(resizedData, newWidth, newHeight, 28, 28);
    
    // 5단계: MNIST 표준 정규화 (인플레이스 연산)
    const normalized = this.normalizeMNISTOptimized(paddedData);
    
    return { normalized, canvas };
  }

  private renderComponentToCanvasOptimized(component: ConnectedComponent, canvas: HTMLCanvasElement): void {
    const { pixels, boundingBox } = component;
    const { minX, maxX, minY, maxY } = boundingBox;
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    // 캔버스 크기 동적 조정
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // ImageData 직접 조작으로 성능 최적화
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    // 배경을 흰색으로 초기화 (255, 255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = 255; // A
    }
    
    // 픽셀 렌더링 (검은색, 직접 ImageData 조작)
    for (const pixel of pixels) {
      const x = pixel.x - minX;
      const y = pixel.y - minY;
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const index = (y * width + x) * 4;
        data[index] = 0;     // R
        data[index + 1] = 0; // G
        data[index + 2] = 0; // B
        data[index + 3] = 255; // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  private renderComponentToCanvas(component: ConnectedComponent): HTMLCanvasElement {
    // 브라우저 환경 체크
    if (typeof document === 'undefined') {
      throw new Error('Canvas API는 브라우저 환경에서만 사용 가능합니다');
    }
    
    const { pixels, boundingBox } = component;
    const { minX, maxX, minY, maxY } = boundingBox;
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    // 캔버스 생성 및 설정
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // 배경을 흰색으로 설정
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // 픽셀 렌더링 (검은색)
    ctx.fillStyle = '#000000';
    for (const pixel of pixels) {
      ctx.fillRect(pixel.x - minX, pixel.y - minY, 1, 1);
    }
    
    return canvas;
  }

  private convertToGrayscaleOptimized(canvas: HTMLCanvasElement): Float32Array {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const pixelCount = canvas.width * canvas.height;
    
    // 메모리 풀에서 재사용 가능한 배열 가져오기
    const grayscaleData = new Float32Array(pixelCount);
    
    // 32비트 워드 단위로 처리하여 성능 최적화
    let pixelIndex = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 빠른 정수 연산으로 그레이스케일 변환
      const gray = (r * 77 + g * 151 + b * 28) >> 8; // /256 대신 비트시프트
      grayscaleData[pixelIndex++] = (255 - gray) / 255.0; // MNIST 반전
    }
    
    // 조건부 블러링 (작은 컴포넌트만)
    if (pixelCount < 400) { // 20x20 미만인 경우만 블러 적용
      const blurredData = this.gaussianBlurOptimized(grayscaleData, canvas.width, canvas.height);
      
      // 인플레이스 이진화
      for (let i = 0; i < blurredData.length; i++) {
        blurredData[i] = blurredData[i] > 0.2 ? 1.0 : 0.0;
      }
      
      return this.dilateOptimized(blurredData, canvas.width, canvas.height);
    }
    
    // 큰 컴포넌트는 간단한 이진화만 적용
    for (let i = 0; i < grayscaleData.length; i++) {
      grayscaleData[i] = grayscaleData[i] > 0.5 ? 1.0 : 0.0;
    }
    
    return grayscaleData;
  }

  private convertToGrayscale(canvas: HTMLCanvasElement): Float32Array {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const grayscaleData = new Float32Array(canvas.width * canvas.height);
    
    // 그레이스케일 변환 (이진화 없이)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // 그레이스케일 변환 후 정규화 (0: 검은색, 1: 흰색)
      const gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255.0;
      grayscaleData[i / 4] = 1.0 - gray; // MNIST는 검은 배경에 흰 글씨 (반전)
    }
    
    // 가우시안 블러 적용으로 선 두께 증가
    const blurredData = this.gaussianBlur(grayscaleData, canvas.width, canvas.height);
    
    // 블러 후 이진화 적용
    for (let i = 0; i < blurredData.length; i++) {
      blurredData[i] = blurredData[i] > 0.2 ? 1.0 : 0.0; // 더욱 관대한 임계값
    }
    
    // 형태학적 팽창 연산으로 선 두께 더욱 증가
    const dilatedData = this.dilate(blurredData, canvas.width, canvas.height);
    
    return dilatedData;
  }

  private resizeKeepingAspectRatio(data: Float32Array, srcWidth: number, srcHeight: number, 
                                   maxSize: number): { resizedData: Float32Array, newWidth: number, newHeight: number } {
    // 종횡비 계산
    const aspectRatio = srcWidth / srcHeight;
    
    let newWidth: number;
    let newHeight: number;
    
    if (aspectRatio > 1) {
      // 가로가 더 긴 경우
      newWidth = maxSize;
      newHeight = Math.round(maxSize / aspectRatio);
    } else {
      // 세로가 더 긴 경우 (숫자 1 같은 경우)
      newHeight = maxSize;
      newWidth = Math.round(maxSize * aspectRatio);
    }
    
    // 최소 크기 보장
    newWidth = Math.max(1, newWidth);
    newHeight = Math.max(1, newHeight);
    
    // 부드러운 보간을 위해 bilinear 리사이즈 사용 (듬성듬성한 픽셀 문제 해결)
    const resizedData = this.bilinearResize(data, srcWidth, srcHeight, newWidth, newHeight);
    
    return { resizedData, newWidth, newHeight };
  }

  private nearestNeighborResize(data: Float32Array, srcWidth: number, srcHeight: number, 
                               dstWidth: number, dstHeight: number): Float32Array {
    const result = new Float32Array(dstWidth * dstHeight);
    const xRatio = srcWidth / dstWidth;
    const yRatio = srcHeight / dstHeight;
    
    for (let y = 0; y < dstHeight; y++) {
      for (let x = 0; x < dstWidth; x++) {
        const srcX = Math.round(x * xRatio);
        const srcY = Math.round(y * yRatio);
        
        // 경계 체크
        const clampedX = Math.min(srcX, srcWidth - 1);
        const clampedY = Math.min(srcY, srcHeight - 1);
        
        result[y * dstWidth + x] = data[clampedY * srcWidth + clampedX];
      }
    }
    
    return result;
  }

  private bilinearResize(data: Float32Array, srcWidth: number, srcHeight: number, 
                        dstWidth: number, dstHeight: number): Float32Array {
    const result = new Float32Array(dstWidth * dstHeight);
    const xRatio = srcWidth / dstWidth;
    const yRatio = srcHeight / dstHeight;
    
    for (let y = 0; y < dstHeight; y++) {
      for (let x = 0; x < dstWidth; x++) {
        const srcX = x * xRatio;
        const srcY = y * yRatio;
        
        const x1 = Math.floor(srcX);
        const y1 = Math.floor(srcY);
        const x2 = Math.min(x1 + 1, srcWidth - 1);
        const y2 = Math.min(y1 + 1, srcHeight - 1);
        
        const dx = srcX - x1;
        const dy = srcY - y1;
        
        const p1 = data[y1 * srcWidth + x1];
        const p2 = data[y1 * srcWidth + x2];
        const p3 = data[y2 * srcWidth + x1];
        const p4 = data[y2 * srcWidth + x2];
        
        // 이중선형 보간
        const interpolated = p1 * (1 - dx) * (1 - dy) +
                           p2 * dx * (1 - dy) +
                           p3 * (1 - dx) * dy +
                           p4 * dx * dy;
        
        result[y * dstWidth + x] = interpolated;
      }
    }
    
    return result;
  }

  private resizeWithPadding(data: Float32Array, srcWidth: number, srcHeight: number,
                           targetWidth: number, targetHeight: number): Float32Array {
    const result = new Float32Array(targetWidth * targetHeight);
    
    // 중앙 정렬을 위한 오프셋 계산
    const offsetX = Math.floor((targetWidth - srcWidth) / 2);
    const offsetY = Math.floor((targetHeight - srcHeight) / 2);
    
    // 패딩된 배열에 데이터 복사
    for (let y = 0; y < srcHeight; y++) {
      for (let x = 0; x < srcWidth; x++) {
        const targetX = x + offsetX;
        const targetY = y + offsetY;
        
        if (targetX >= 0 && targetX < targetWidth && targetY >= 0 && targetY < targetHeight) {
          result[targetY * targetWidth + targetX] = data[y * srcWidth + x];
        }
      }
    }
    
    return result;
  }

  /**
   * 최적화된 가우시안 블러 (Float32Array 버전)
   */
  private gaussianBlurOptimized(data: Float32Array, width: number, height: number): Float32Array {
    const result = new Float32Array(data.length);
    const kernel = [
      [0.0625, 0.125, 0.0625],
      [0.125,  0.25,  0.125],
      [0.0625, 0.125, 0.0625]
    ];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              sum += data[ny * width + nx] * kernel[ky + 1][kx + 1];
            }
          }
        }
        
        result[y * width + x] = sum;
      }
    }
    
    return result;
  }

  /**
   * 가우시안 블러 적용 (선 두께 증가)
   */
  private gaussianBlur(data: Float32Array, width: number, height: number): Float32Array {
    const result = new Float32Array(data.length);
    const kernel = [
      [0.0625, 0.125, 0.0625],
      [0.125,  0.25,  0.125],
      [0.0625, 0.125, 0.0625]
    ];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              sum += data[ny * width + nx] * kernel[ky + 1][kx + 1];
            }
          }
        }
        
        result[y * width + x] = sum;
      }
    }
    
    return result;
  }

  /**
   * 최적화된 형태학적 팽창 연산 (Float32Array 버전)
   */
  private dilateOptimized(data: Float32Array, width: number, height: number): Float32Array {
    const result = new Float32Array(data.length);
    const structuringElement = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],  [0, 0],  [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxValue = 0;
        
        // 구조 요소 적용
        for (const [dy, dx] of structuringElement) {
          const ny = y + dy;
          const nx = x + dx;
          
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            maxValue = Math.max(maxValue, data[ny * width + nx]);
          }
        }
        
        result[y * width + x] = maxValue;
      }
    }
    
    return result;
  }

  /**
   * 형태학적 팽창 연산 (선 두께 대폭 증가)
   */
  private dilate(data: Float32Array, width: number, height: number): Float32Array {
    const result = new Float32Array(data.length);
    const structuringElement = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],  [0, 0],  [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxValue = 0;
        
        // 구조 요소 적용
        for (const [dy, dx] of structuringElement) {
          const ny = y + dy;
          const nx = x + dx;
          
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            maxValue = Math.max(maxValue, data[ny * width + nx]);
          }
        }
        
        result[y * width + x] = maxValue;
      }
    }
    
    return result;
  }

  /**
   * MNIST 최적화된 정규화 (인플레이스 연산)
   */
  private normalizeMNISTOptimized(data: Float32Array): Float32Array {
    const normalized = new Float32Array(data.length);
    
    // MNIST 표준 정규화: (pixel - 0.1307) / 0.3081 (더 빠른 연산)
    for (let i = 0; i < data.length; i++) {
      normalized[i] = (data[i] - 0.1307) / 0.3081;
    }
    
    return normalized;
  }

  private normalizeMNIST(data: Float32Array): Float32Array {
    const normalized = new Float32Array(data.length);
    
    // MNIST 표준 정규화: (pixel - 0.1307) / 0.3081
    for (let i = 0; i < data.length; i++) {
      normalized[i] = (data[i] - 0.1307) / 0.3081;
    }
    
    return normalized;
  }

  /**
   * 28x28 Float32Array를 base64 이미지로 변환 (시각화용)
   */
  private normalizedToImageDataUrl(normalized: Float32Array): string {
    // 브라우저 환경 체크
    if (typeof document === 'undefined') {
      return 'data:image/png;base64,'; // 서버사이드에서는 빈 이미지 반환
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(28, 28);
    
    for (let i = 0; i < 28 * 28; i++) {
      const pixelValue = Math.round(normalized[i] * 255);
      const pixelIndex = i * 4;
      
      // 기존 JavaScript 모델과 동일: 흰 배경에 검은 글씨
      imageData.data[pixelIndex] = 255 - pixelValue;     // R
      imageData.data[pixelIndex + 1] = 255 - pixelValue; // G
      imageData.data[pixelIndex + 2] = 255 - pixelValue; // B
      imageData.data[pixelIndex + 3] = 255;              // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // 8배 확대해서 보기 쉽게
    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = 224; // 28 * 8
    displayCanvas.height = 224;
    const displayCtx = displayCanvas.getContext('2d')!;
    displayCtx.imageSmoothingEnabled = false; // 픽셀아트 스타일
    displayCtx.drawImage(canvas, 0, 0, 28, 28, 0, 0, 224, 224);
    
    return displayCanvas.toDataURL();
  }

  /**
   * 작은 노이즈 제거 (Phase 3 최적화)
   */
  private removeSmallNoiseComponents(components: ConnectedComponent[]): ConnectedComponent[] {
    if (components.length === 0) return [];
    
    // 1. 최소 픽셀 개수 필터링 (5픽셀 미만 제거)
    const pixelFiltered = components.filter(comp => comp.pixels.length >= 5);
    
    // 2. 크기가 너무 작은 경계상자 제거 (3x3 미만)
    const sizeFiltered = pixelFiltered.filter(comp => {
      const { width, height } = comp.boundingBox;
      return width >= 3 && height >= 3;
    });
    
    // 3. 종횡비가 극단적인 컴포넌트 제거 (1:20 또는 20:1 초과)
    const aspectFiltered = sizeFiltered.filter(comp => {
      const { width, height } = comp.boundingBox;
      const aspectRatio = Math.max(width, height) / Math.min(width, height);
      return aspectRatio <= 20; // 숫자 1도 고려하여 관대하게 설정
    });
    
    console.log(`🧹 노이즈 제거: ${components.length} → ${aspectFiltered.length} 연결성분`);
    return aspectFiltered;
  }

  /**
   * 여러 연결성분에 대한 배치 추론 (Phase 3 최적화 적용)
   */
  async recognizeDigits(components: ConnectedComponent[]): Promise<RecognitionResult[]> {
    if (!this.session) {
      throw new Error('ONNX 모델이 초기화되지 않았습니다');
    }

    if (components.length === 0) {
      return [];
    }

    // Phase 3: 작은 노이즈 제거 적용
    const cleanedComponents = this.removeSmallNoiseComponents(components);
    
    if (cleanedComponents.length === 0) {
      console.log('🧹 모든 연결성분이 노이즈로 판정되어 제거됨');
      return [];
    }

    const startTime = performance.now();
    
    try {
      // 28x28 크기로 정규화된 이미지 배열 생성
      const normalizeStart = performance.now();
      const normalizedData: Array<{ normalized: Float32Array; imageDataUrl: string }> = [];
      
      components.forEach((component, idx) => {
        const { normalized, canvas } = this.normalizeComponent(component);
        const imageDataUrl = this.normalizedToImageDataUrl(normalized);
        
        // 캔버스를 메모리 풀에 반환
        this.memoryPool.returnCanvas(canvas);
        
        normalizedData.push({ normalized, imageDataUrl });
        
        // 모든 컴포넌트의 디버깅 정보 출력
        console.log(`🔍 디버깅 - 연결성분 ${idx}:`);
        console.log(`  픽셀수: ${component.pixels.length}`);
        console.log(`  경계상자:`, component.boundingBox);
        console.log(`  정규화후_비영역픽셀수: ${normalized.filter(x => x > 0).length}`);
        console.log(`  정규화후_평균값: ${normalized.reduce((sum, x) => sum + x, 0) / normalized.length}`);
        console.log(`  최대값: ${Math.max(...normalized)}, 최소값: ${Math.min(...normalized)}`);
        console.log(`  중앙부분_8x8샘플:`);
        console.table(this.get8x8Sample(normalized));
        console.log(`  🖼️ 28x28 시각화 이미지:`, imageDataUrl);
      });
      
      const normalizedImages = normalizedData.map(data => data.normalized);
      const normalizeTime = performance.now() - normalizeStart;

      // 배치 텐서 생성: [batch_size, 1, 28, 28]
      const batchSize = normalizedImages.length;
      const flattenedData = new Float32Array(batchSize * 28 * 28);
      
      // 각 이미지를 플랫 배열에 복사
      for (let i = 0; i < batchSize; i++) {
        const startIdx = i * 28 * 28;
        flattenedData.set(normalizedImages[i], startIdx);
      }
      
      const inputTensor = new ort.Tensor('float32', flattenedData, [batchSize, 1, 28, 28]);

      // ONNX Runtime Web 모델 추론 실행
      const inferenceStart = performance.now();
      const feeds = { input: inputTensor };
      console.log('🚀 ONNX 추론 시작 - 입력 텐서 형태:', inputTensor.dims);
      const results = await this.session!.run(feeds);
      const inferenceTime = performance.now() - inferenceStart;
      
      // 첫 번째 출력 가져오기 (키 이름이 다를 수 있음)
      const outputName = Object.keys(results)[0];
      const outputTensor = results[outputName];
      
      console.log('📤 ONNX 추론 완료:', {
        출력키: outputName,
        출력형태: outputTensor.dims,
        출력타입: outputTensor.type,
        데이터길이: outputTensor.data.length,
        첫번째_5개값: Array.from(outputTensor.data as Float32Array).slice(0, 5)
      });

      // 결과 처리 및 신뢰도 계산 (이미지 데이터 포함)
      const processStart = performance.now();
      const finalResults = this.processResults(
        outputTensor.data as Float32Array, 
        components,
        normalizedData.map(data => data.imageDataUrl)
      );
      const processTime = performance.now() - processStart;
      
      const totalTime = performance.now() - startTime;
      
      // 성능 측정 로그
      console.log(`📊 ONNX 성능 측정:
        - 연결성분 수: ${components.length}
        - 정규화 시간: ${normalizeTime.toFixed(1)}ms
        - 추론 시간: ${inferenceTime.toFixed(1)}ms  
        - 후처리 시간: ${processTime.toFixed(1)}ms
        - 전체 시간: ${totalTime.toFixed(1)}ms
        - 목표(<100ms): ${totalTime < 100 ? '✅ 달성' : '❌ 미달성'}`);

      return finalResults;
    } catch (error) {
      console.error('❌ ONNX Runtime Web 추론 에러:', error);
      return components.map((component, i) => ({
        component,
        predictedDigit: -1,
        confidence: 0,
        isLowConfidence: true,
        normalizedImageDataUrl: undefined
      }));
    }
  }

  /**
   * ONNX 출력 결과 처리
   */
  private processResults(
    outputData: Float32Array, 
    components: ConnectedComponent[], 
    imageDataUrls: string[]
  ): RecognitionResult[] {
    const results: RecognitionResult[] = [];
    const numClasses = 10; // 0-9 숫자
    
    console.log('🔍 결과 처리 시작:', {
      출력데이터길이: outputData.length,
      연결성분수: components.length,
      이미지URL개수: imageDataUrls.length,
      예상클래스수: numClasses
    });
    
    for (let i = 0; i < components.length; i++) {
      const startIdx = i * numClasses;
      const logits = Array.from(outputData.slice(startIdx, startIdx + numClasses));
      
      // 소프트맥스 적용
      const probabilities = this.softmax(logits);
      
      // 최고 확률의 숫자와 신뢰도 추출
      const maxProbIndex = probabilities.indexOf(Math.max(...probabilities));
      const confidence = probabilities[maxProbIndex];
      
      // 모든 결과 디버깅 (문제 해결을 위해)
      console.log(`🎯 연결성분 ${i} 상세 결과:`);
      console.log(`  로짓값:`, logits.map(l => l.toFixed(3)));
      console.log(`  확률분포:`, probabilities.map((p, idx) => `${idx}:${(p*100).toFixed(1)}%`));
      console.log(`  예측숫자: ${maxProbIndex}, 신뢰도: ${(confidence*100).toFixed(1)}%`);
      console.log(`  top3확률:`, probabilities
        .map((p, idx) => ({ idx, prob: p }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 3)
        .map(x => `${x.idx}:${(x.prob*100).toFixed(1)}%`));
      
      // 낮은 신뢰도 판정 (임계값: 0.7)
      const isLowConfidence = confidence < 0.7;
      
      results.push({
        component: components[i],
        predictedDigit: maxProbIndex,
        confidence,
        isLowConfidence,
        normalizedImageDataUrl: imageDataUrls[i]
      });
    }
    
    return results;
  }

  /**
   * 28x28 이미지의 중앙 8x8 샘플 추출 (디버깅용)
   */
  private get8x8Sample(normalized: Float32Array): number[][] {
    const sample: number[][] = [];
    for (let y = 10; y < 18; y++) {
      const row: number[] = [];
      for (let x = 10; x < 18; x++) {
        row.push(Math.round(normalized[y * 28 + x] * 10) / 10); // 소수점 1자리
      }
      sample.push(row);
    }
    return sample;
  }

  /**
   * 소프트맥스 함수
   */
  private softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits);
    const expLogits = logits.map(x => Math.exp(x - maxLogit));
    const sumExp = expLogits.reduce((sum, x) => sum + x, 0);
    return expLogits.map(x => x / sumExp);
  }

  /**
   * 인식된 숫자들을 텍스트로 결합
   */
  static combineResults(results: RecognitionResult[], confidenceThreshold = 0.7): {
    text: string;
    averageConfidence: number;
    lowConfidenceCount: number;
  } {
    const validResults = results.filter(r => r.predictedDigit >= 0 && r.predictedDigit <= 9);
    
    if (validResults.length === 0) {
      return { text: '', averageConfidence: 0, lowConfidenceCount: 0 };
    }

    // 위치 기준으로 재정렬 (왼쪽부터)
    validResults.sort((a, b) => a.component.boundingBox.minX - b.component.boundingBox.minX);
    
    const digits = validResults.map(r => r.predictedDigit.toString());
    const confidences = validResults.map(r => r.confidence);
    const lowConfidenceCount = confidences.filter(c => c < confidenceThreshold).length;
    const averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    return {
      text: digits.join(''),
      averageConfidence,
      lowConfidenceCount
    };
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    if (this.session) {
      // ONNX Runtime Web은 자동으로 리소스를 정리함
      this.session = null;
      this.isInitialized = false;
    }
  }
}
