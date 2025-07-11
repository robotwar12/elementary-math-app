import { WeightLoader } from '../utils/weights';
import { sigmoid, matrixMult, argMax, addBias } from '../utils/mathUtils';

/**
 * Wosaku 알고리즘 기반 숫자 인식 시스템
 * 참조: https://wosaku.github.io/digits-recognition.html
 */
export class DigitRecognizer {
  private readonly CANVAS_SIZE = 400;
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

    // 이미지 데이터 추출 (Alpha 채널 기반)
    const imageData = ctx.getImageData(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
    const pixels = this.extractAlphaPixels(imageData);
    
    // 연속 픽셀 추적으로 개별 숫자 분리
    const digitArrays = this.segmentDigits(pixels);
    
    // 각 숫자를 신경망으로 인식
    const results: string[] = [];
    for (const digitArray of digitArrays) {
      const prediction = this.recognizeSingleDigit(digitArray);
      results.push(prediction.toString());
    }
    
    return results;
  }

  /**
   * 이미지 데이터에서 Alpha 채널 기반으로 픽셀 배열 생성
   */
  private extractAlphaPixels(imageData: ImageData): number[][] {
    const pixels: number[][] = Array(this.CANVAS_SIZE).fill(null).map(() => 
      Array(this.CANVAS_SIZE).fill(0)
    );

    for (let y = 0; y < this.CANVAS_SIZE; y++) {
      for (let x = 0; x < this.CANVAS_SIZE; x++) {
        const index = (y * this.CANVAS_SIZE + x) * 4;
        const alpha = imageData.data[index + 3];
        pixels[y][x] = alpha > 128 ? 1 : 0; // Alpha 값으로 픽셀 존재 여부 판단
      }
    }

    return pixels;
  }

  /**
   * 연속 픽셀 추적 방식으로 개별 숫자들을 분리
   */
  private segmentDigits(pixels: number[][]): number[][][] {
    const visited: boolean[][] = Array(this.CANVAS_SIZE).fill(null).map(() => 
      Array(this.CANVAS_SIZE).fill(false)
    );
    
    const digitArrays: number[][][] = [];

    for (let y = 0; y < this.CANVAS_SIZE; y++) {
      for (let x = 0; x < this.CANVAS_SIZE; x++) {
        if (pixels[y][x] === 1 && !visited[y][x]) {
          const digitPixels = this.extractConnectedPixels(pixels, visited, x, y);
          if (digitPixels.length > 10) { // 최소 픽셀 수 필터링
            const digitArray = this.createDigitArray(digitPixels);
            digitArrays.push(digitArray);
          }
        }
      }
    }

    return digitArrays;
  }

  /**
   * 연결된 픽셀들을 재귀적으로 추출 (8방향 탐색)
   */
  private extractConnectedPixels(
    pixels: number[][], 
    visited: boolean[][], 
    startX: number, 
    startY: number
  ): Array<{x: number, y: number}> {
    const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
    const connectedPixels: Array<{x: number, y: number}> = [];

    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      
      if (x < 0 || x >= this.CANVAS_SIZE || y < 0 || y >= this.CANVAS_SIZE) continue;
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
   * 픽셀 좌표들을 28x28 배열로 변환 (18픽셀 최대 스케일링 + 중앙 배치)
   */
  private createDigitArray(pixels: Array<{x: number, y: number}>): number[][] {
    // 바운딩 박스 계산
    const minX = Math.min(...pixels.map(p => p.x));
    const maxX = Math.max(...pixels.map(p => p.x));
    const minY = Math.min(...pixels.map(p => p.y));
    const maxY = Math.max(...pixels.map(p => p.y));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    // 18픽셀 최대 스케일링 (종횡비 유지)
    const scale = Math.min(this.MAX_SCALE / width, this.MAX_SCALE / height);
    const scaledWidth = Math.round(width * scale);
    const scaledHeight = Math.round(height * scale);

    // 28x28 배열 생성 및 중앙 배치
    const digitArray: number[][] = Array(this.DIGIT_SIZE).fill(null).map(() => 
      Array(this.DIGIT_SIZE).fill(0)
    );

    const offsetX = Math.floor((this.DIGIT_SIZE - scaledWidth) / 2);
    const offsetY = Math.floor((this.DIGIT_SIZE - scaledHeight) / 2);

    // 픽셀 스케일링 및 배치
    for (const pixel of pixels) {
      const scaledX = Math.floor((pixel.x - minX) * scale) + offsetX;
      const scaledY = Math.floor((pixel.y - minY) * scale) + offsetY;
      
      if (scaledX >= 0 && scaledX < this.DIGIT_SIZE && 
          scaledY >= 0 && scaledY < this.DIGIT_SIZE) {
        digitArray[scaledY][scaledX] = 1;
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
