/**
 * 숫자 분할 알고리즘 (Phase 3)
 * 연속된 숫자 '43525'를 개별 숫자로 분할
 */

interface SegmentationResult {
  segments: ImageData[];
  boundingBoxes: BoundingBox[];
  confidence: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProjectionData {
  verticalProjection: number[];
  horizontalProjection: number[];
}

export class DigitSegmentation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private minSegmentWidth = 8; // 최소 숫자 너비
  private maxSegmentWidth = 40; // 최대 숫자 너비
  private minPixelDensity = 0.1; // 최소 픽셀 밀도

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  /**
   * 메인 분할 함수
   */
  async segmentDigits(imageData: ImageData): Promise<SegmentationResult> {
    try {
      // 1. 이미지 전처리
      const processedImage = this.preprocessImage(imageData);
      
      // 2. 투영 히스토그램 계산
      const projections = this.calculateProjections(processedImage);
      
      // 3. 수직 투영 기반 분할
      const verticalSegments = this.verticalProjectionSegmentation(projections.verticalProjection);
      
      // 4. 연결 요소 분석
      const connectedComponents = this.connectedComponentAnalysis(processedImage);
      
      // 5. 분할 결과 결합 및 정제
      const finalSegments = this.combineAndRefineSegments(
        verticalSegments,
        connectedComponents,
        processedImage
      );
      
      // 6. 각 세그먼트를 28x28로 정규화
      const normalizedSegments = await this.normalizeSegments(finalSegments, processedImage);
      
      return {
        segments: normalizedSegments,
        boundingBoxes: finalSegments,
        confidence: this.calculateSegmentationConfidence(finalSegments)
      };
    } catch (error) {
      console.error('숫자 분할 중 오류:', error);
      throw error;
    }
  }

  /**
   * 이미지 전처리
   */
  private preprocessImage(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const processedData = new Uint8ClampedArray(data.length);
    
    // 그레이스케일 변환 및 이진화
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      
      // 그레이스케일 변환
      const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
      
      // 이진화 (임계값 128)
      const binary = gray > 128 ? 255 : 0;
      
      processedData[i] = binary;
      processedData[i + 1] = binary;
      processedData[i + 2] = binary;
      processedData[i + 3] = alpha;
    }
    
    return new ImageData(processedData, width, height);
  }

  /**
   * 투영 히스토그램 계산
   */
  private calculateProjections(imageData: ImageData): ProjectionData {
    const { width, height, data } = imageData;
    const verticalProjection = new Array(width).fill(0);
    const horizontalProjection = new Array(height).fill(0);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixel = data[idx]; // R 값 (그레이스케일이므로 R=G=B)
        
        if (pixel === 0) { // 검은색 픽셀 (글자)
          verticalProjection[x]++;
          horizontalProjection[y]++;
        }
      }
    }
    
    return { verticalProjection, horizontalProjection };
  }

  /**
   * 수직 투영 기반 분할
   */
  private verticalProjectionSegmentation(verticalProjection: number[]): BoundingBox[] {
    const segments: BoundingBox[] = [];
    let start = -1;
    let inSegment = false;
    
    for (let x = 0; x < verticalProjection.length; x++) {
      const pixelCount = verticalProjection[x];
      
      if (pixelCount > 0 && !inSegment) {
        // 세그먼트 시작
        start = x;
        inSegment = true;
      } else if (pixelCount === 0 && inSegment) {
        // 세그먼트 종료
        const width = x - start;
        if (width >= this.minSegmentWidth && width <= this.maxSegmentWidth) {
          segments.push({
            x: start,
            y: 0,
            width,
            height: 60 // 캔버스 높이
          });
        }
        inSegment = false;
      }
    }
    
    // 마지막 세그먼트 처리
    if (inSegment && start >= 0) {
      const width = verticalProjection.length - start;
      if (width >= this.minSegmentWidth && width <= this.maxSegmentWidth) {
        segments.push({
          x: start,
          y: 0,
          width,
          height: 60
        });
      }
    }
    
    return segments;
  }

  /**
   * 연결 요소 분석
   */
  private connectedComponentAnalysis(imageData: ImageData): BoundingBox[] {
    const { width, height, data } = imageData;
    const visited = new Array(width * height).fill(false);
    const components: BoundingBox[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        if (!visited[idx] && this.isBlackPixel(data, idx)) {
          const component = this.floodFill(data, width, height, x, y, visited);
          
          if (component.width >= this.minSegmentWidth && 
              component.width <= this.maxSegmentWidth &&
              this.calculatePixelDensity(component, data, width) >= this.minPixelDensity) {
            components.push(component);
          }
        }
      }
    }
    
    return components;
  }

  /**
   * 플러드 필 알고리즘
   */
  private floodFill(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    startX: number,
    startY: number,
    visited: boolean[]
  ): BoundingBox {
    const stack = [{ x: startX, y: startY }];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || !this.isBlackPixel(data, idx)) {
        continue;
      }
      
      visited[idx] = true;
      
      // 경계 박스 업데이트
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      // 4방향 탐색
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * 검은색 픽셀 확인
   */
  private isBlackPixel(data: Uint8ClampedArray, pixelIndex: number): boolean {
    return data[pixelIndex * 4] === 0; // R 값이 0인 경우
  }

  /**
   * 픽셀 밀도 계산
   */
  private calculatePixelDensity(box: BoundingBox, data: Uint8ClampedArray, width: number): number {
    let blackPixels = 0;
    const totalPixels = box.width * box.height;
    
    for (let y = box.y; y < box.y + box.height; y++) {
      for (let x = box.x; x < box.x + box.width; x++) {
        const idx = y * width + x;
        if (this.isBlackPixel(data, idx)) {
          blackPixels++;
        }
      }
    }
    
    return blackPixels / totalPixels;
  }

  /**
   * 분할 결과 결합 및 정제
   */
  private combineAndRefineSegments(
    verticalSegments: BoundingBox[],
    connectedComponents: BoundingBox[],
    imageData: ImageData
  ): BoundingBox[] {
    // 수직 투영과 연결 요소 분석 결과를 결합
    const allSegments = [...verticalSegments, ...connectedComponents];
    
    // 중복 제거 및 정렬
    const uniqueSegments = this.removeDuplicateSegments(allSegments);
    uniqueSegments.sort((a, b) => a.x - b.x);
    
    // 겹치는 세그먼트 병합
    const mergedSegments = this.mergeOverlappingSegments(uniqueSegments);
    
    // 너무 큰 세그먼트 재분할
    const finalSegments = this.subdivideOversizedSegments(mergedSegments, imageData);
    
    return finalSegments;
  }

  /**
   * 중복 세그먼트 제거
   */
  private removeDuplicateSegments(segments: BoundingBox[]): BoundingBox[] {
    const unique: BoundingBox[] = [];
    const threshold = 5; // 중복 판정 임계값
    
    for (const segment of segments) {
      const isDuplicate = unique.some(existing => 
        Math.abs(existing.x - segment.x) < threshold &&
        Math.abs(existing.width - segment.width) < threshold
      );
      
      if (!isDuplicate) {
        unique.push(segment);
      }
    }
    
    return unique;
  }

  /**
   * 겹치는 세그먼트 병합
   */
  private mergeOverlappingSegments(segments: BoundingBox[]): BoundingBox[] {
    const merged: BoundingBox[] = [];
    
    for (const segment of segments) {
      let wasMerged = false;
      
      for (let i = 0; i < merged.length; i++) {
        const existing = merged[i];
        
        if (this.isOverlapping(segment, existing)) {
          // 병합
          merged[i] = {
            x: Math.min(segment.x, existing.x),
            y: Math.min(segment.y, existing.y),
            width: Math.max(segment.x + segment.width, existing.x + existing.width) - 
                   Math.min(segment.x, existing.x),
            height: Math.max(segment.y + segment.height, existing.y + existing.height) - 
                    Math.min(segment.y, existing.y)
          };
          wasMerged = true;
          break;
        }
      }
      
      if (!wasMerged) {
        merged.push(segment);
      }
    }
    
    return merged;
  }

  /**
   * 겹침 확인
   */
  private isOverlapping(a: BoundingBox, b: BoundingBox): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  /**
   * 큰 세그먼트 재분할
   */
  private subdivideOversizedSegments(segments: BoundingBox[], imageData: ImageData): BoundingBox[] {
    const refined: BoundingBox[] = [];
    
    for (const segment of segments) {
      if (segment.width > this.maxSegmentWidth * 1.5) {
        // 큰 세그먼트를 재분할
        const subSegments = this.subdivideSegment(segment, imageData);
        refined.push(...subSegments);
      } else {
        refined.push(segment);
      }
    }
    
    return refined;
  }

  /**
   * 세그먼트 재분할
   */
  private subdivideSegment(segment: BoundingBox, imageData: ImageData): BoundingBox[] {
    const { width, data } = imageData;
    const subSegments: BoundingBox[] = [];
    
    // 세그먼트 내부의 수직 투영 계산
    const localProjection = new Array(segment.width).fill(0);
    
    for (let y = segment.y; y < segment.y + segment.height; y++) {
      for (let x = segment.x; x < segment.x + segment.width; x++) {
        const idx = y * width + x;
        if (this.isBlackPixel(data, idx)) {
          localProjection[x - segment.x]++;
        }
      }
    }
    
    // 지역 최소값을 찾아 분할점 결정
    const splitPoints = this.findSplitPoints(localProjection);
    
    let lastSplit = 0;
    for (const splitPoint of splitPoints) {
      const width = splitPoint - lastSplit;
      if (width >= this.minSegmentWidth) {
        subSegments.push({
          x: segment.x + lastSplit,
          y: segment.y,
          width,
          height: segment.height
        });
      }
      lastSplit = splitPoint;
    }
    
    // 마지막 세그먼트
    if (lastSplit < segment.width) {
      const width = segment.width - lastSplit;
      if (width >= this.minSegmentWidth) {
        subSegments.push({
          x: segment.x + lastSplit,
          y: segment.y,
          width,
          height: segment.height
        });
      }
    }
    
    return subSegments.length > 0 ? subSegments : [segment];
  }

  /**
   * 분할점 찾기
   */
  private findSplitPoints(projection: number[]): number[] {
    const splitPoints: number[] = [];
    const threshold = Math.max(1, Math.min(...projection.filter(p => p > 0)));
    
    for (let i = 1; i < projection.length - 1; i++) {
      if (projection[i] <= threshold && 
          projection[i] < projection[i - 1] && 
          projection[i] < projection[i + 1]) {
        splitPoints.push(i);
      }
    }
    
    return splitPoints;
  }

  /**
   * 세그먼트들을 28x28로 정규화
   */
  private async normalizeSegments(segments: BoundingBox[], imageData: ImageData): Promise<ImageData[]> {
    const normalized: ImageData[] = [];
    
    for (const segment of segments) {
      const normalizedSegment = await this.normalizeSegmentTo28x28(segment, imageData);
      normalized.push(normalizedSegment);
    }
    
    return normalized;
  }

  /**
   * 단일 세그먼트를 28x28로 정규화
   */
  private async normalizeSegmentTo28x28(segment: BoundingBox, imageData: ImageData): Promise<ImageData> {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    
    // 배경을 흰색으로 설정
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, 28, 28);
    
    // 세그먼트 이미지 추출
    const segmentImageData = this.extractSegmentImage(segment, imageData);
    
    // 임시 캔버스에 그리기
    const segmentCanvas = document.createElement('canvas');
    const segmentCtx = segmentCanvas.getContext('2d')!;
    segmentCanvas.width = segment.width;
    segmentCanvas.height = segment.height;
    segmentCtx.putImageData(segmentImageData, 0, 0);
    
    // 종횡비 유지하며 스케일링
    const scale = Math.min(24 / segment.width, 24 / segment.height);
    const scaledWidth = segment.width * scale;
    const scaledHeight = segment.height * scale;
    
    // 중앙 정렬
    const offsetX = (28 - scaledWidth) / 2;
    const offsetY = (28 - scaledHeight) / 2;
    
    tempCtx.drawImage(segmentCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
    
    return tempCtx.getImageData(0, 0, 28, 28);
  }

  /**
   * 세그먼트 이미지 추출
   */
  private extractSegmentImage(segment: BoundingBox, imageData: ImageData): ImageData {
    const { width, data } = imageData;
    const segmentData = new Uint8ClampedArray(segment.width * segment.height * 4);
    
    for (let y = 0; y < segment.height; y++) {
      for (let x = 0; x < segment.width; x++) {
        const sourceIdx = ((segment.y + y) * width + (segment.x + x)) * 4;
        const targetIdx = (y * segment.width + x) * 4;
        
        segmentData[targetIdx] = data[sourceIdx];
        segmentData[targetIdx + 1] = data[sourceIdx + 1];
        segmentData[targetIdx + 2] = data[sourceIdx + 2];
        segmentData[targetIdx + 3] = data[sourceIdx + 3];
      }
    }
    
    return new ImageData(segmentData, segment.width, segment.height);
  }

  /**
   * 분할 신뢰도 계산
   */
  private calculateSegmentationConfidence(segments: BoundingBox[]): number {
    if (segments.length === 0) return 0;
    
    // 기대 숫자 개수 (43525 = 5개)
    const expectedCount = 5;
    const countScore = Math.max(0, 1 - Math.abs(segments.length - expectedCount) / expectedCount);
    
    // 세그먼트 크기 일관성
    const avgWidth = segments.reduce((sum, s) => sum + s.width, 0) / segments.length;
    const widthVariance = segments.reduce((sum, s) => sum + Math.pow(s.width - avgWidth, 2), 0) / segments.length;
    const consistencyScore = Math.max(0, 1 - widthVariance / (avgWidth * avgWidth));
    
    // 전체 신뢰도
    return (countScore * 0.6 + consistencyScore * 0.4);
  }

  /**
   * 디버깅용 시각화
   */
  visualizeSegmentation(segments: BoundingBox[], canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!;
    
    // 세그먼트 경계 그리기
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    
    segments.forEach((segment, index) => {
      ctx.strokeRect(segment.x, segment.y, segment.width, segment.height);
      
      // 세그먼트 번호 표시
      ctx.fillStyle = 'red';
      ctx.font = '12px Arial';
      ctx.fillText(index.toString(), segment.x + 2, segment.y + 15);
    });
  }
}
