import '@testing-library/jest-dom'

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: jest.fn(() => Promise.resolve({
    predict: jest.fn(() => ({
      dataSync: jest.fn(() => [0.9, 0.1, 0.05, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01])
    }))
  })),
  browser: {
    fromPixels: jest.fn(() => ({
      resizeNearestNeighbor: jest.fn(() => ({
        cast: jest.fn(() => ({
          div: jest.fn(() => ({
            expandDims: jest.fn()
          }))
        }))
      }))
    }))
  },
  dispose: jest.fn()
}))

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4)
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4)
  })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
