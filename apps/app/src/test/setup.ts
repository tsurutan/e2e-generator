import '@testing-library/jest-dom'

// Mock Electron APIs
global.window = global.window || {}
global.window.electronAPI = {
  openExternal: vi.fn(),
  showSaveDialog: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  // Add other electron API mocks as needed
}

// Mock other globals that might be needed for Electron renderer tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
