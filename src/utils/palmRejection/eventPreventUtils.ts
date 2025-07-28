// 이벤트 방지 유틸리티 함수들
// 터치, 드래그, 컨텍스트 메뉴 등 원치 않는 이벤트를 차단

export const preventTouchEvents = {
  touchstart: (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  touchmove: (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  touchend: (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  touchcancel: (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  wheel: (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  contextmenu: (e: Event) => {
    e.preventDefault();
    return false;
  },
  dragstart: (e: DragEvent) => {
    e.preventDefault();
    return false;
  }
};

// 특정 이벤트 타입에 대한 개별 방지 함수들
export const preventTouchStart = preventTouchEvents.touchstart;
export const preventTouchMove = preventTouchEvents.touchmove;
export const preventTouchEnd = preventTouchEvents.touchend;
export const preventTouchCancel = preventTouchEvents.touchcancel;
export const preventWheel = preventTouchEvents.wheel;
export const preventContextMenu = preventTouchEvents.contextmenu;
export const preventDragStart = preventTouchEvents.dragstart;