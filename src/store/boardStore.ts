import { create } from 'zustand'

// 网格数据：0 = 空，>0 = 颜色ID
export type GridData = Uint8Array

export interface BoardState {
  // 画布配置
  gridSize: number
  gridData: GridData
  selectedColor: number

  // 视图状态
  zoom: number
  offsetX: number
  offsetY: number

  // 工具状态
  tool: 'draw' | 'erase'
  isDrawing: boolean

  // 熨烫状态
  isIroned: boolean

  // 历史记录（用于撤销/重做）
  history: GridData[]
  historyIndex: number
}

const HISTORY_LIMIT = 50

function createEmptyGrid(size: number): GridData {
  return new Uint8Array(size * size)
}

function cloneGrid(grid: GridData): GridData {
  const clone = new Uint8Array(grid.length)
  clone.set(grid)
  return clone
}

// 尝试从 localStorage 恢复
function loadFromStorage(): Partial<BoardState> | null {
  try {
    const saved = localStorage.getItem('perler-beads-state')
    if (!saved) return null
    const data = JSON.parse(saved)
    if (data.gridSize && data.gridData) {
      return {
        gridSize: data.gridSize,
        gridData: new Uint8Array(data.gridData),
        selectedColor: data.selectedColor ?? 2,
        zoom: data.zoom ?? 1,
        offsetX: data.offsetX ?? 0,
        offsetY: data.offsetY ?? 0,
        tool: data.tool ?? 'draw',
        isIroned: false, // 不恢复熨烫状态
        history: [],
        historyIndex: -1,
      }
    }
  } catch {
    // ignore
  }
  return null
}

function saveToStorage(state: BoardState) {
  try {
    localStorage.setItem('perler-beads-state', JSON.stringify({
      gridSize: state.gridSize,
      gridData: Array.from(state.gridData),
      selectedColor: state.selectedColor,
      zoom: state.zoom,
      tool: state.tool,
    }))
  } catch {
    // ignore
  }
}

const saved = loadFromStorage()
const initialSize = saved?.gridSize ?? 20

export const useBoardStore = create<BoardState & {
  setGridSize: (size: number) => void
  setSelectedColor: (color: number) => void
  setTool: (tool: 'draw' | 'erase') => void
  putBead: (x: number, y: number) => void
  eraseBead: (x: number, y: number) => void
  undo: () => void
  redo: () => void
  clearBoard: () => void
  setView: (zoom: number, offsetX: number, offsetY: number) => void
  setIsDrawing: (isDrawing: boolean) => void
  iron: () => void
  resetIron: () => void
  exportGrid: () => GridData
  importGrid: (data: GridData, size: number) => void
}>((set, get) => ({
  gridSize: initialSize,
  gridData: saved?.gridData ?? createEmptyGrid(initialSize),
  selectedColor: saved?.selectedColor ?? 2,
  zoom: saved?.zoom ?? 1,
  offsetX: saved?.offsetX ?? 0,
  offsetY: saved?.offsetY ?? 0,
  tool: saved?.tool ?? 'draw',
  isIroned: false,
  isDrawing: false,
  history: [],
  historyIndex: -1,

  setGridSize: (size: number) => set({
    gridSize: size,
    gridData: createEmptyGrid(size),
    isIroned: false,
    history: [],
    historyIndex: -1,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  }),

  setSelectedColor: (color: number) => set({ selectedColor: color, tool: 'draw' }),

  setTool: (tool: 'draw' | 'erase') => set({ tool, isIroned: false }),

  putBead: (x: number, y: number) => {
    const { gridSize, gridData, selectedColor, history, historyIndex } = get()
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return
    const idx = y * gridSize + x
    if (gridData[idx] === selectedColor) return

    // 保存历史记录
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(cloneGrid(gridData))
    if (newHistory.length > HISTORY_LIMIT) newHistory.shift()

    const newGrid = cloneGrid(gridData)
    newGrid[idx] = selectedColor

    set({
      gridData: newGrid,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isIroned: false,
    })
    saveToStorage(get())
  },

  eraseBead: (x: number, y: number) => {
    const { gridSize, gridData, history, historyIndex } = get()
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return
    const idx = y * gridSize + x
    if (gridData[idx] === 0) return

    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(cloneGrid(gridData))
    if (newHistory.length > HISTORY_LIMIT) newHistory.shift()

    const newGrid = cloneGrid(gridData)
    newGrid[idx] = 0

    set({
      gridData: newGrid,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isIroned: false,
    })
    saveToStorage(get())
  },

  undo: () => {
    const { history, historyIndex, gridData } = get()
    if (historyIndex < 0) return
    const prevGrid = history[historyIndex]
    const newHistory = [...history]
    newHistory.push(cloneGrid(gridData))
    set({
      gridData: prevGrid,
      history: newHistory,
      historyIndex: historyIndex + 1,
    })
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    const nextGrid = history[historyIndex + 1]
    const newHistory = history.slice(0, historyIndex + 1)
    set({
      gridData: nextGrid,
      history: newHistory,
      historyIndex: historyIndex,
    })
  },

  clearBoard: () => {
    const { gridSize, gridData, history, historyIndex } = get()
    const newHistory = [...history.slice(0, historyIndex + 1), cloneGrid(gridData)]
    if (newHistory.length > HISTORY_LIMIT) newHistory.shift()
    set({
      gridData: createEmptyGrid(gridSize),
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isIroned: false,
    })
    saveToStorage(get())
  },

  setView: (zoom: number, offsetX: number, offsetY: number) => set({ zoom, offsetX, offsetY }),

  setIsDrawing: (isDrawing: boolean) => set({ isDrawing }),

  iron: () => set({ isIroned: true }),

  resetIron: () => set({ isIroned: false }),

  exportGrid: () => cloneGrid(get().gridData),

  importGrid: (data: GridData, size: number) => set({
    gridSize: size,
    gridData: cloneGrid(data),
    history: [],
    historyIndex: -1,
    isIroned: false,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  }),
}))
