// Wosaku 신경망을 위한 수학 함수들
// 참조: https://wosaku.github.io/digits-recognition.html

/**
 * 시그모이드 활성화 함수 (단일 값용)
 * @param z 입력 값
 * @returns 시그모이드 변환된 값
 */
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * 시그모이드 활성화 함수 (배열용)
 * @param z 입력 배열
 * @returns 시그모이드 변환된 배열
 */
export function sigmoidArray(z: number[]): number[] {
  const g: number[] = [];
  for (let i = 0; i < z.length; i++) {
    g[i] = 1 / (1 + Math.exp(-z[i]));
  }
  return g;
}

/**
 * 벡터/행렬 곱셈 함수
 * @param matrixA 입력 벡터 (1차원 배열)
 * @param matrixB 가중치 행렬 (2차원 배열)
 * @returns 곱셈 결과 벡터
 */
export function matrixMult(matrixA: number[], matrixB: number[][]): number[] {
  const result: number[] = [];
  
  // matrixB의 열 개수만큼 반복
  for (let column = 0; column < matrixB[0].length; column++) {
    let m = 0;
    
    // matrixA의 길이만큼 반복 (내적 계산)
    for (let row = 0; row < matrixA.length; row++) {
      m = m + matrixA[row] * matrixB[row][column];
    }
    
    result[column] = m;
  }
  
  return result;
}

/**
 * 배열의 최대값 인덱스를 찾는 함수
 * @param arr 입력 배열
 * @returns 최대값의 인덱스
 */
export function argMax(arr: number[]): number {
  return arr.indexOf(Math.max(...arr));
}

/**
 * 배열을 정규화하는 함수 (0-1 범위)
 * @param arr 입력 배열
 * @returns 정규화된 배열
 */
export function normalize(arr: number[]): number[] {
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const range = max - min;
  
  if (range === 0) return arr.map(() => 0);
  
  return arr.map(val => (val - min) / range);
}

/**
 * 배열에 bias 값(1)을 맨 앞에 추가하는 함수
 * @param arr 입력 배열
 * @returns bias가 추가된 배열
 */
export function addBias(arr: number[]): number[] {
  return [1, ...arr];
}

/**
 * 2차원 배열의 차원을 확인하는 함수
 * @param matrix 2차원 배열
 * @returns {rows: number, cols: number}
 */
export function getMatrixDimensions(matrix: number[][]): { rows: number; cols: number } {
  return {
    rows: matrix.length,
    cols: matrix[0]?.length || 0
  };
}

/**
 * 배열의 기본 통계를 계산하는 함수
 * @param arr 입력 배열
 * @returns 통계 정보 객체
 */
export function getArrayStats(arr: number[]) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const sum = arr.reduce((acc, val) => acc + val, 0);
  const mean = sum / arr.length;
  
  return { min, max, mean, sum, length: arr.length };
}

/**
 * 소프트맥스 함수 (확률 분포 변환)
 * @param arr 입력 배열
 * @returns 소프트맥스 변환된 배열 (합이 1)
 */
export function softmax(arr: number[]): number[] {
  const maxVal = Math.max(...arr);
  const expArr = arr.map(val => Math.exp(val - maxVal)); // 수치 안정성을 위해 최대값 빼기
  const sumExp = expArr.reduce((sum, val) => sum + val, 0);
  
  return expArr.map(val => val / sumExp);
}

/**
 * 배열을 특정 범위로 클리핑하는 함수
 * @param arr 입력 배열
 * @param min 최소값
 * @param max 최대값
 * @returns 클리핑된 배열
 */
export function clipArray(arr: number[], min: number, max: number): number[] {
  return arr.map(val => Math.max(min, Math.min(max, val)));
}
