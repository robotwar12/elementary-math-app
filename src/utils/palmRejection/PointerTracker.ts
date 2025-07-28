// 포인터 추적 관리자
// 활성 포인터들을 추적하고 관리하는 기능을 담당

export class PointerTracker {
  private activePenPointers = new Set<number>();

  // 활성 포인터 추가
  addActivePointer(pointerId: number): void {
    this.activePenPointers.add(pointerId);
  }

  // 활성 포인터 제거
  removeActivePointer(pointerId: number): void {
    this.activePenPointers.delete(pointerId);
  }

  // 모든 활성 포인터 제거
  clearActivePointers(): void {
    this.activePenPointers.clear();
  }

  // 활성 포인터 개수 반환
  getActivePointerCount(): number {
    return this.activePenPointers.size;
  }

  // 특정 포인터가 활성 상태인지 확인
  hasActivePointer(pointerId: number): boolean {
    return this.activePenPointers.has(pointerId);
  }

  // 현재 활성 포인터 ID들 반환
  getActivePointerIds(): number[] {
    return Array.from(this.activePenPointers);
  }

  // 다른 펜이 이미 사용중인지 확인
  isOtherPenActive(currentPointerId: number): boolean {
    // 활성 포인터가 있고, 현재 포인터가 그 중에 포함되지 않은 경우
    return this.activePenPointers.size > 0 && !this.activePenPointers.has(currentPointerId);
  }

  // 디버깅용 - 현재 상태를 문자열로 반환
  toString(): string {
    return `PointerTracker: ${this.activePenPointers.size} active pointers [${Array.from(this.activePenPointers).join(', ')}]`;
  }
}