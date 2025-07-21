/**
 * 연결성분 분석 엔진
 * Union-Find 알고리즘을 사용하여 8방향 연결성 기반 픽셀 그룹화
 */

export interface ConnectedComponent {
  id: number;
  pixels: Array<{ x: number; y: number }>;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  area: number;
  color: string;
}

export interface AnalysisResult {
  components: ConnectedComponent[];
  processingTime: number;
  memoryUsage: number;
  totalPixels: number;
}

class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // 경로 압축
    }
    return this.parent[x];
  }

  union(x: number, y: number): void {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX !== rootY) {
      // 랭크 기반 합집합
      if (this.rank[rootX] < this.rank[rootY]) {
        this.parent[rootX] = rootY;
      } else if (this.rank[rootX] > this.rank[rootY]) {
        this.parent[rootY] = rootX;
      } else {
        this.parent[rootY] = rootX;
        this.rank[rootX]++;
      }
    }
  }
}

export class ComponentAnalyzer {
  private width: number = 0;
  private height: number = 0;
  private componentColors: string[] = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  /**
   * 캔버스에서 이진 이미지 데이터 추출
   */
  private extractBinaryData(canvas: HTMLCanvasElement): {
    binaryData: Uint8Array;
    width: number;
    height: number;
  } {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    this.width = canvas.width;
    this.height = canvas.height;

    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    const binaryData = new Uint8Array(this.width * this.height);

    // RGBA에서 이진 데이터로 변환 (알파 채널 기반)
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      const pixelIndex = Math.floor(i / 4);
      binaryData[pixelIndex] = alpha > 0 ? 1 : 0;
    }

    return { binaryData, width: this.width, height: this.height };
  }

  /**
   * 8방향 연결성 검사를 위한 인접 픽셀 좌표 계산
   */
  private getNeighbors(x: number, y: number): Array<{ x: number; y: number }> {
    const neighbors = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  /**
   * 2D 좌표를 1D 인덱스로 변환
   */
  private coordToIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  /**
   * 1D 인덱스를 2D 좌표로 변환
   */
  private indexToCoord(index: number): { x: number; y: number } {
    return {
      x: index % this.width,
      y: Math.floor(index / this.width)
    };
  }

  /**
   * 연결성분 분석 수행
   */
  async analyzeComponents(canvas: HTMLCanvasElement): Promise<AnalysisResult> {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    const { binaryData, width, height } = this.extractBinaryData(canvas);
    const totalPixels = width * height;
    const unionFind = new UnionFind(totalPixels);

    // Union-Find로 연결성분 구성
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentIndex = this.coordToIndex(x, y);
        
        if (binaryData[currentIndex] === 1) {
          const neighbors = this.getNeighbors(x, y);
          
          for (const neighbor of neighbors) {
            const neighborIndex = this.coordToIndex(neighbor.x, neighbor.y);
            if (binaryData[neighborIndex] === 1) {
              unionFind.union(currentIndex, neighborIndex);
            }
          }
        }
      }
    }

    // 연결성분별 픽셀 그룹화
    const componentMap = new Map<number, Array<{ x: number; y: number }>>();
    
    for (let i = 0; i < totalPixels; i++) {
      if (binaryData[i] === 1) {
        const root = unionFind.find(i);
        const coord = this.indexToCoord(i);
        
        if (!componentMap.has(root)) {
          componentMap.set(root, []);
        }
        componentMap.get(root)!.push(coord);
      }
    }

    // ConnectedComponent 객체 생성
    const components: ConnectedComponent[] = [];
    let componentId = 0;

    for (const [root, pixels] of componentMap) {
      if (pixels.length < 5) continue; // 너무 작은 성분 필터링

      // 바운딩 박스 계산
      const minX = Math.min(...pixels.map(p => p.x));
      const maxX = Math.max(...pixels.map(p => p.x));
      const minY = Math.min(...pixels.map(p => p.y));
      const maxY = Math.max(...pixels.map(p => p.y));

      const component: ConnectedComponent = {
        id: componentId,
        pixels,
        boundingBox: {
          minX,
          minY,
          maxX,
          maxY,
          width: maxX - minX + 1,
          height: maxY - minY + 1
        },
        area: pixels.length,
        color: this.componentColors[componentId % this.componentColors.length]
      };

      components.push(component);
      componentId++;
    }

    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      components,
      processingTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      totalPixels: components.reduce((sum, comp) => sum + comp.area, 0)
    };
  }

  /**
   * 연결성분 시각화 (디버깅용)
   */
  visualizeComponents(
    canvas: HTMLCanvasElement, 
    components: ConnectedComponent[]
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 기존 캔버스 내용 유지하면서 경계선 추가
    ctx.save();
    
    components.forEach(component => {
      // 바운딩 박스 그리기
      ctx.strokeStyle = component.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      const { minX, minY, width, height } = component.boundingBox;
      ctx.strokeRect(minX, minY, width, height);
      
      // 컴포넌트 ID 표시
      ctx.fillStyle = component.color;
      ctx.font = '12px Arial';
      ctx.fillText(
        `#${component.id}`,
        minX + 2,
        minY + 15
      );
    });
    
    ctx.restore();
  }
}
