// 동적 가중치 로더 - 성능 최적화됨
// 원본 가중치는 public/models/ 폴더의 JSON 파일에서 로드

/**
 * 신경망 가중치를 동적으로 로드하는 클래스
 * - 메모리 효율적: 필요시에만 로드
 * - 캐싱: 한 번 로드하면 메모리에 보관
 * - 성능: 컨텍스트 윈도우 문제 해결
 */
export class WeightLoader {
  private static theta1Cache: number[][] | null = null;
  private static theta2Cache: number[][] | null = null;

  /**
   * theta1 가중치 로드 (입력층 -> 은닉층)
   * 크기: 785 x 300 (bias 포함)
   */
  static async loadTheta1(): Promise<number[][]> {
    if (!this.theta1Cache) {
      try {
        const response = await fetch('/models/theta1.json');
        if (!response.ok) {
          throw new Error(`theta1.json 로드 실패: ${response.status}`);
        }
        this.theta1Cache = await response.json();
        console.log('✅ theta1 가중치 로드 완료');
      } catch (error) {
        console.error('❌ theta1 로드 오류:', error);
        throw error;
      }
    }
    return this.theta1Cache!;
  }

  /**
   * theta2 가중치 로드 (은닉층 -> 출력층)
   * 크기: 301 x 10 (bias 포함)
   */
  static async loadTheta2(): Promise<number[][]> {
    if (!this.theta2Cache) {
      try {
        const response = await fetch('/models/theta2.json');
        if (!response.ok) {
          throw new Error(`theta2.json 로드 실패: ${response.status}`);
        }
        this.theta2Cache = await response.json();
        console.log('✅ theta2 가중치 로드 완료');
      } catch (error) {
        console.error('❌ theta2 로드 오류:', error);
        throw error;
      }
    }
    return this.theta2Cache!;
  }

  /**
   * 모든 가중치를 한번에 로드
   */
  static async loadAllWeights(): Promise<{ theta1: number[][], theta2: number[][] }> {
    const [theta1, theta2] = await Promise.all([
      this.loadTheta1(),
      this.loadTheta2()
    ]);
    
    return { theta1, theta2 };
  }

  /**
   * 캐시 초기화 (메모리 절약용)
   */
  static clearCache(): void {
    this.theta1Cache = null;
    this.theta2Cache = null;
    console.log('🗑️ 가중치 캐시 초기화 완료');
  }

  /**
   * 가중치 유효성 검사
   */
  static async validateWeights(): Promise<boolean> {
    try {
      const { theta1, theta2 } = await this.loadAllWeights();
      
      // theta1 검증: 785 x 300
      if (theta1.length !== 785) {
        console.error(`theta1 행 개수 오류: 예상 785, 실제 ${theta1.length}`);
        return false;
      }
      
      for (let i = 0; i < theta1.length; i++) {
        if (theta1[i].length !== 300) {
          console.error(`theta1[${i}] 열 개수 오류: 예상 300, 실제 ${theta1[i].length}`);
          return false;
        }
      }

      // theta2 검증: 301 x 10
      if (theta2.length !== 301) {
        console.error(`theta2 행 개수 오류: 예상 301, 실제 ${theta2.length}`);
        return false;
      }
      
      for (let i = 0; i < theta2.length; i++) {
        if (theta2[i].length !== 10) {
          console.error(`theta2[${i}] 열 개수 오류: 예상 10, 실제 ${theta2[i].length}`);
          return false;
        }
      }

      console.log('✅ 가중치 배열 검증 완료');
      return true;
    } catch (error) {
      console.error('❌ 가중치 검증 실패:', error);
      return false;
    }
  }

  /**
   * 가중치 통계 정보 반환
   */
  static async getWeightsStats() {
    const { theta1, theta2 } = await this.loadAllWeights();
    
    // 스택 오버플로우 방지를 위한 안전한 min/max 계산
    const calculateStats = (matrix: number[][]) => {
      let min = Infinity;
      let max = -Infinity;
      let sum = 0;
      let count = 0;
      
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
          const val = matrix[i][j];
          if (val < min) min = val;
          if (val > max) max = val;
          sum += val;
          count++;
        }
      }
      
      return { min, max, mean: sum / count };
    };
    
    const theta1Stats = calculateStats(theta1);
    const theta2Stats = calculateStats(theta2);
    
    return {
      theta1: {
        rows: theta1.length,
        cols: theta1[0]?.length || 0,
        min: theta1Stats.min,
        max: theta1Stats.max,
        mean: theta1Stats.mean
      },
      theta2: {
        rows: theta2.length,
        cols: theta2[0]?.length || 0,
        min: theta2Stats.min,
        max: theta2Stats.max,
        mean: theta2Stats.mean
      }
    };
  }
}

// 하위 호환성을 위한 레거시 export (기존 코드가 있을 경우)
export const loadTheta1 = () => WeightLoader.loadTheta1();
export const loadTheta2 = () => WeightLoader.loadTheta2();
export const validateWeights = () => WeightLoader.validateWeights();
export const getWeightsStats = () => WeightLoader.getWeightsStats();
