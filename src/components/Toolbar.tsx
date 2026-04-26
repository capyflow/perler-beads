import { useRef } from 'react'
import { useBoardStore } from '../store/boardStore'
import { BEAD_COLORS } from '../utils/colors'
import { TEMPLATES } from '../utils/templates'

export default function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    tool, setTool, undo, redo, clearBoard, gridSize, setGridSize,
    isIroned, exportGrid, importGrid
  } = useBoardStore()

  const handleExportPNG = () => {
    const data = exportGrid()
    const beadSize = 10
    const canvas = document.createElement('canvas')
    canvas.width = gridSize * beadSize
    canvas.height = gridSize * beadSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 透明背景
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const idx = y * gridSize + x
        const colorId = data[idx]
        if (colorId === 0) continue
        const color = BEAD_COLORS.find(c => c.id === colorId)
        if (!color) continue

        ctx.beginPath()
        ctx.arc(x * beadSize + beadSize / 2, y * beadSize + beadSize / 2, beadSize / 2 - 0.5, 0, Math.PI * 2)
        ctx.fillStyle = color.hex
        ctx.fill()
      }
    }

    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `perler-beads-${gridSize}x${gridSize}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  const handleExportJSON = () => {
    const data = exportGrid()
    const grid = []
    for (let y = 0; y < gridSize; y++) {
      const row = []
      for (let x = 0; x < gridSize; x++) {
        row.push(data[y * gridSize + x])
      }
      grid.push(row)
    }
    const blob = new Blob([JSON.stringify({ gridSize, grid })], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `perler-beads-${gridSize}x${gridSize}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.gridSize && data.grid) {
          const flat = new Uint8Array(data.gridSize * data.gridSize)
          for (let y = 0; y < data.gridSize; y++) {
            for (let x = 0; x < data.gridSize; x++) {
              flat[y * data.gridSize + x] = data.grid[y][x]
            }
          }
          importGrid(flat, data.gridSize)
        }
      } catch {
        alert('导入失败：文件格式不正确')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="w-full bg-white border-b border-gray-200 px-3 py-2 flex flex-wrap items-center gap-2">
      {/* 工具切换 */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTool('draw')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tool === 'draw' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ✏️ 放豆
        </button>
        <button
          onClick={() => setTool('erase')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tool === 'erase' ? 'bg-white shadow text-red-600' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🧹 擦除
        </button>
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* 撤销/重做 */}
      <button onClick={undo} className="px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors" title="撤销 (Ctrl+Z)">
        ↩️ 撤销
      </button>
      <button onClick={redo} className="px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors" title="重做 (Ctrl+Shift+Z)">
        ↪️ 重做
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* 清空 */}
      <button onClick={clearBoard} className="px-2 py-1.5 rounded-lg text-sm hover:bg-red-50 text-red-500 transition-colors">
        🗑️ 清空
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* 画布大小 */}
      <label className="flex items-center gap-1.5 text-sm text-gray-600">
        大小:
        <select
          value={gridSize}
          onChange={e => setGridSize(Number(e.target.value))}
          className="border rounded-md px-2 py-1 text-sm bg-white"
        >
          {[10, 15, 20, 25, 30, 40, 50].map(s => (
            <option key={s} value={s}>{s}×{s}</option>
          ))}
        </select>
      </label>

      <div className="w-px h-6 bg-gray-200" />

      {/* 熨烫 */}
      <button
        onClick={() => {
          useBoardStore.getState().resetIron()
          // 触发熨烫动画通过 Board 组件的 animateIron
          // 这里用自定义事件
          window.dispatchEvent(new CustomEvent('perler-iron'))
        }}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isIroned
            ? 'bg-orange-100 text-orange-600'
            : 'bg-gradient-to-r from-orange-400 to-red-400 text-white hover:opacity-90'
        }`}
      >
        🔥 熨烫
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* 导入/导出 */}
      <button onClick={handleExportPNG} className="px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">
        🖼️ 导出PNG
      </button>
      <button onClick={handleExportJSON} className="px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">
        📤 导出JSON
      </button>
      <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">
        📥 导入
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      {/* 预设模板 */}
      <select
        className="border rounded-md px-2 py-1 text-sm bg-white hover:bg-gray-50 cursor-pointer"
        onChange={e => {
          if (e.target.value) {
            const idx = Number(e.target.value)
            const template = TEMPLATES[idx]
            if (template) {
              const flat = new Uint8Array(template.size * template.size)
              for (let y = 0; y < template.size; y++) {
                for (let x = 0; x < template.size; x++) {
                  flat[y * template.size + x] = template.grid[y]?.[x] ?? 0
                }
              }
              importGrid(flat, template.size)
            }
          }
        }}
        defaultValue=""
      >
        <option value="" disabled>📋 预设模板</option>
        {TEMPLATES.map((t, i) => (
          <option key={i} value={i}>{t.name}</option>
        ))}
      </select>

      <div className="flex-1" />

      <span className="text-xs text-gray-400">
        {gridSize}×{gridSize} 画布
      </span>
    </div>
  )
}
