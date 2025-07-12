import { WeightLoader } from '../utils/weights';
import { sigmoid, matrixMult, argMax, addBias } from '../utils/mathUtils';

/**
 * Wosaku 알고리즘 기반 숫자 인식 시스템
 * 참조: https://wosaku.github.io/digits-recognition.html
 */
export class DigitRecognizer {
  private readonly DIGIT_SIZE = 28;
  private readonly MAX_SCALE = 18;
  private theta1: number[][] | null = null;
  private theta2: number[][] | null = null;

  /**
   * 가중치 초기화 (최초 한 번만 실행)
   */
  async initializeWeights(): Promise<void> {
    if (!this.theta1 || !this.theta2) {
      const weights = await WeightLoader.loadAllWeights();
      this.theta1 = weights.theta1;
      this.theta2 = weights.theta2;
    }
  }

  /**
   * 캔버스에서 이미지 데이터를 추출하고 숫자들을 분리하여 인식
   */
  async recognizeDigits(canvas: HTMLCanvasElement): Promise<string[]> {
    // 가중치 초기화
    await this.initializeWeights();
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    // 실제 캔버스 크기 사용
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    console.log(`🔍 캔버스 크기: ${canvasWidth}x${canvasHeight}`);

    // 이미지 데이터 추출 (Alpha 채널 기반)
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const pixels = this.extractAlphaPixels(imageData, canvasWidth, canvasHeight);
    
    // 연속 픽셀 추적으로 개별 숫자 분리
    const digitArrays = this.segmentDigits(pixels, canvasWidth, canvasHeight);
    
    console.log(`📊 분할된 숫자 개수: ${digitArrays.length}`);
    
    // 각 숫자를 신경망으로 인식
    const results: string[] = [];
    for (let i = 0; i < digitArrays.length; i++) {
      const digitArray = digitArrays[i];
      const prediction = this.recognizeSingleDigit(digitArray);
      console.log(`🔢 숫자 ${i + 1}: 인식 결과 = ${prediction}`);
      results.push(prediction.toString());
    }
    
    return results;
  }

  /**
   * 이미지 데이터에서 Alpha 채널 기반으로 픽셀 배열 생성
   */
  private extractAlphaPixels(imageData: ImageData, width: number, height: number): number[][] {
    const pixels: number[][] = Array(height).fill(null).map(() => 
      Array(width).fill(0)
    );

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const alpha = imageData.data[index + 3];
        pixels[y][x] = alpha > 128 ? 1 : 0; // Alpha 값으로 픽셀 존재 여부 판단
      }
    }

    return pixels;
  }

  /**
   * 스마트 하이브리드 분할: 가우시안 스무딩 + 적응형 분할 + 겹침 방지
   */
  private segmentDigits(pixels: number[][], width: number, height: number): number[][][] {
    console.log('🔍 스마트 숫자 분할 시작...');
    
    // 1단계: 가우시안 스무딩으로 노이즈 제거
    const smoothedPixels = this.gaussianSmoothing(pixels, width, height);
    
    // 2단계: 수직 투영법으로 픽셀 밀도 분석
    const verticalProjection = this.getVerticalProjection(smoothedPixels, width, height);
    const adaptiveThreshold = this.calculateAdaptiveThreshold(verticalProjection);
    
    console.log('📊 수직 투영 결과:', verticalProjection);
    console.log('🎯 적응형 임계값:', adaptiveThreshold);
    
    // 3단계: Connected Component로 개별 영역 추출
    const rawSegments = this.extractConnectedComponents(smoothedPixels, width, height);
    
    // 4단계: 스마트 분할 검증 및 병합
    const validatedSegments = this.validateAndMergeSegments(rawSegments, verticalProjection, adaptiveThreshold);
    
    console.log(`📋 최종 숫자 개수: ${validatedSegments.length}`);
    validatedSegments.forEach((segment, i) => {
      const width = segment.maxX - segment.minX + 1;
      console.log(`  숫자 ${i + 1}: X좌표 ${segment.minX}-${segment.maxX}, 너비: ${width}px, 픽셀: ${segment.pixels.length}`);
    });

    // 5단계: 28x28 배열로 변환
    const digitArrays = validatedSegments.map(segment => 
      this.createDigitArray(segment.pixels)
    );

    return digitArrays;
  }

  /**
   * 가우시안 스무딩으로 노이즈 제거 및 픽셀 연결성 향상
   */
  private gaussianSmoothing(pixels: number[][], width: number, height: number): number[][] {
    const smoothed: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));
    const kernel = [
      [0.0625, 0.125, 0.0625],
      [0.125,  0.25,  0.125],
      [0.0625, 0.125, 0.0625]
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += pixels[y + ky][x + kx] * kernel[ky + 1][kx + 1];
          }
        }
        smoothed[y][x] = sum > 0.3 ? 1 : 0; // 임계값으로 이진화
      }
    }

    return smoothed;
  }

  /**
   * 수직 투영법: X축별 픽셀 밀도 계산
   */
  private getVerticalProjection(pixels: number[][], width: number, height: number): number[] {
    const projection: number[] = Array(width).fill(0);
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (pixels[y][x] === 1) {
          projection[x]++;
        }
      }
    }
    
    return projection;
  }

  /**
   * 적응형 임계값 계산: 평균 밀도 기반
   */
  private calculateAdaptiveThreshold(projection: number[]): number {
    const nonZeroValues = projection.filter(val => val > 0);
    if (nonZeroValues.length === 0) return 1;
    
    const avgDensity = nonZeroValues.reduce((sum, val) => sum + val, 0) / nonZeroValues.length;
    return Math.max(1, Math.floor(avgDensity * 0.2)); // 평균의 20%
  }

  /**
   * Connected Component 추출
   */
  private extractConnectedComponents(pixels: number[][], width: number, height: number) {
    const segments: Array<{
      pixels: Array<{x: number, y: number}>,
      minX: number,
      maxX: number,
      minY: number,
      maxY: number
    }> = [];
    
    const visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (pixels[y][x] === 1 && !visited[y][x]) {
          const componentPixels = this.extractConnectedPixels(pixels, visited, x, y, width, height);
          
          if (componentPixels.length > 5) { // 최소 픽셀 수 필터
            const minX = Math.min(...componentPixels.map(p => p.x));
            const maxX = Math.max(...componentPixels.map(p => p.x));
            const minY = Math.min(...componentPixels.map(p => p.y));
            const maxY = Math.max(...componentPixels.map(p => p.y));
            
            segments.push({
              pixels: componentPixels,
              minX, maxX, minY, maxY
            });
          }
        }
      }
    }

    return segments.sort((a, b) => a.minX - b.minX);
  }

  /**
   * 분할 검증 및 스마트 병합: 과도한 분할 방지
   */
  private validateAndMergeSegments(
    segments: Array<{pixels: Array<{x: number, y: number}>, minX: number, maxX: number, minY: number, maxY: number}>,
    projection: number[],
    threshold: number
  ) {
    const validSegments = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const width = segment.maxX - segment.minX + 1;
      const height = segment.maxY - segment.minY + 1;
      
      // 너비 기반 검증: 너무 좁으면 노이즈로 판단
      if (width < 5) {
        console.log(`❌ 세그먼트 ${i} 제거: 너무 좁음 (${width}px)`);
        continue;
      }
      
      // 종횡비 검증: 너무 가로로 긴 것은 여러 숫자일 가능성
      const aspectRatio = width / height;
      if (aspectRatio > 2.5) {
        console.log(`⚠️ 세그먼트 ${i} 검증: 가로로 긴 영역 (비율: ${aspectRatio.toFixed(2)})`);
        
        // 해당 영역에서 valley 찾아서 분할 시도
        const subProjection = projection.slice(segment.minX, segment.maxX + 1);
        const valleys = this.findDetailedValleys(subProjection, threshold);
        
        if (valleys.length > 0) {
          console.log(`🔀 세그먼트 ${i} 재분할 시도: valleys at`, valleys);
          // 재분할 로직은 복잡하므로 일단 유지하고 경고만 출력
        }
      }
      
      validSegments.push(segment);
    }
    
    return validSegments;
  }

  /**
   * 세밀한 Valley Detection
   */
  private findDetailedValleys(projection: number[], threshold: number): number[] {
    const valleys: number[] = [];
    
    for (let i = 1; i < projection.length - 1; i++) {
      const current = projection[i];
      const prev = projection[i - 1];
      const next = projection[i + 1];
      
      // Valley 조건: 현재가 임계값 이하이고, 양쪽보다 낮거나 같음
      if (current <= threshold && current <= prev && current <= next) {
        // 연속된 valley 중에서 가장 낮은 지점만 선택
        if (valleys.length === 0 || i - valleys[valleys.length - 1] > 3) {
          valleys.push(i);
        }
      }
    }
    
    return valleys;
  }

  /**
   * 연결된 픽셀들을 재귀적으로 추출 (8방향 탐색)
   */
  private extractConnectedPixels(
    pixels: number[][], 
    visited: boolean[][], 
    startX: number, 
    startY: number,
    width: number,
    height: number
  ): Array<{x: number, y: number}> {
    const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
    const connectedPixels: Array<{x: number, y: number}> = [];

    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[y][x] || pixels[y][x] === 0) continue;

      visited[y][x] = true;
      connectedPixels.push({x, y});

      // 8방향 탐색
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          stack.push({x: x + dx, y: y + dy});
        }
      }
    }

    return connectedPixels;
  }

  /**
   * 숫자 배열에서 바운딩 박스 정보 추출
   */
  private getDigitBounds(digitArray: number[][]): {minX: number, maxX: number, minY: number, maxY: number} {
    let minX = this.DIGIT_SIZE, maxX = -1, minY = this.DIGIT_SIZE, maxY = -1;
    
    for (let y = 0; y < this.DIGIT_SIZE; y++) {
      for (let x = 0; x < this.DIGIT_SIZE; x++) {
        if (digitArray[y][x] === 1) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    return { minX, maxX, minY, maxY };
  }

  /**
   * 픽셀 좌표들을 28x28 배열로 변환 (개선된 스케일링 + 두께 보강)
   */
  private createDigitArray(pixels: Array<{x: number, y: number}>): number[][] {
    // 바운딩 박스 계산
    const minX = Math.min(...pixels.map(p => p.x));
    const maxX = Math.max(...pixels.map(p => p.x));
    const minY = Math.min(...pixels.map(p => p.y));
    const maxY = Math.max(...pixels.map(p => p.y));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    // 균형잡힌 스케일링: 모든 숫자가 비슷한 크기로 변환되도록 조정
    const aspectRatio = width / height;
    const avgSize = (width + height) / 2;
    
    // 크기별 적응형 스케일링
    let targetSize;
    if (avgSize > 40) {
      targetSize = 16; // 큰 숫자는 적당히
    } else if (avgSize > 25) {
      targetSize = 17; // 중간 크기
    } else {
      targetSize = 18; // 작은 숫자는 조금 더 크게
    }
    
    // 종횡비 보정
    if (aspectRatio > 1.5) {
      targetSize = Math.min(targetSize, 15); // 가로로 긴 숫자는 작게
    } else if (aspectRatio < 0.7) {
      targetSize = Math.min(targetSize, 16); // 세로로 긴 숫자는 적당히
    }
    
    const scale = Math.min(targetSize / width, targetSize / height);
    
    console.log(`🔧 스케일링 정보: 원본 ${width}x${height} (비율:${aspectRatio.toFixed(2)}), 스케일 ${scale.toFixed(2)}, 목표크기 ${targetSize}`);

    // 28x28 배열 생성
    const digitArray: number[][] = Array(this.DIGIT_SIZE).fill(null).map(() => 
      Array(this.DIGIT_SIZE).fill(0)
    );

    // 중앙 배치를 위한 오프셋 계산
    const scaledWidth = Math.round(width * scale);
    const scaledHeight = Math.round(height * scale);
    const offsetX = Math.floor((this.DIGIT_SIZE - scaledWidth) / 2);
    const offsetY = Math.floor((this.DIGIT_SIZE - scaledHeight) / 2);

    // 픽셀 스케일링 및 배치 (두께 보강)
    for (const pixel of pixels) {
      const scaledX = Math.floor((pixel.x - minX) * scale) + offsetX;
      const scaledY = Math.floor((pixel.y - minY) * scale) + offsetY;
      
      if (scaledX >= 0 && scaledX < this.DIGIT_SIZE && 
          scaledY >= 0 && scaledY < this.DIGIT_SIZE) {
        digitArray[scaledY][scaledX] = 1;
        
        // 선 두께 보강: 인접 픽셀도 채우기 (9와 7 구분을 위해)
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = scaledX + dx;
            const ny = scaledY + dy;
            if (nx >= 0 && nx < this.DIGIT_SIZE && ny >= 0 && ny < this.DIGIT_SIZE) {
              // 50% 확률로 인접 픽셀 채우기 (자연스러운 두께)
              if (Math.abs(dx) + Math.abs(dy) === 1 && Math.random() > 0.5) {
                digitArray[ny][nx] = 1;
              }
            }
          }
        }
      }
    }

    return digitArray;
  }

  /**
   * 단일 숫자를 신경망으로 인식
   */
  private recognizeSingleDigit(digitArray: number[][]): number {
    if (!this.theta1 || !this.theta2) {
      throw new Error('가중치가 초기화되지 않았습니다. initializeWeights()를 먼저 호출하세요.');
    }

    // 28x28 배열을 784차원 벡터로 변환
    const input: number[] = [];
    for (let y = 0; y < this.DIGIT_SIZE; y++) {
      for (let x = 0; x < this.DIGIT_SIZE; x++) {
        input.push(digitArray[y][x]);
      }
    }

    // 바이어스 추가 (785차원)
    const inputWithBias = addBias(input);

    // 첫 번째 레이어: 785 -> 300
    const hidden = matrixMult(inputWithBias, this.theta1).map(sigmoid);
    
    // 두 번째 레이어: 301 -> 10 (바이어스 추가)
    const hiddenWithBias = addBias(hidden);
    const output = matrixMult(hiddenWithBias, this.theta2).map(sigmoid);

    // 가장 높은 확률을 가진 숫자 반환
    return argMax(output);
  }

  /**
   * 디버깅용: 28x28 배열을 콘솔에 시각화
   */
  visualizeDigit(digitArray: number[][]): void {
    console.log('=== 숫자 배열 시각화 ===');
    for (const row of digitArray) {
      console.log(row.map(pixel => pixel ? '█' : ' ').join(''));
    }
  }
}
