import { useEffect, useRef, useCallback, useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { getColorById } from '../utils/colors'

const BEAD_RADIUS = 12
const GRID_LINE_COLOR = '#E0E0E0'
const BEAD_HIGHLIGHT = 'rgba(255,255,255,0.35)'
const BEAD_SHADOW = 'rgba(0,0,0,0.12)'

export default function Board() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    gridSize, gridData, selectedColor, zoom, offsetX, offsetY,
    tool, isIroned, putBead, eraseBead, setView, setIsDrawing, iron, resetIron
  } = useBoardStore()

  const [ironProgress, setIronProgress] = useState(0)
  const isIroningRef = useRef(false)
  const [hoverGrid, setHoverGrid] = useState<{ x: number; y: number } | null>(null)

  // 熨烫动画
  const animateIron = useCallback(() => {
    isIroningRef.current = true
    setIronProgress(0)
    const start = performance.now()
    const duration = 1500

    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      setIronProgress(progress)
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        isIroningRef.current = false
        iron()
      }
    }
    requestAnimationFrame(step)
  }, [iron])

  // 坐标转换：屏幕 -> 网格
  const screenToGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: -1, y: -1 }
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left - offsetX) / (BEAD_RADIUS * 2 * zoom)
    const y = (clientY - rect.top - offsetY) / (BEAD_RADIUS * 2 * zoom)
    return { x: Math.floor(x), y: Math.floor(y) }
  }, [offsetX, offsetY, zoom])

  // 绘制网格和珠子
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const beadSize = BEAD_RADIUS * 2
    const gridW = gridSize * beadSize * zoom
    const gridH = gridSize * beadSize * zoom

    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(zoom, zoom)

    // 绘制网格线
    ctx.strokeStyle = GRID_LINE_COLOR
    ctx.lineWidth = 0.5
    ctx.beginPath()
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * beadSize
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, gridH)
      ctx.moveTo(0, pos)
      ctx.lineTo(gridW, pos)
    }
    ctx.stroke()

    // 绘制珠子
    const ironFactor = isIroningRef.current ? ironProgress : (isIroned ? 1 : 0)

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const idx = y * gridSize + x
        const colorId = gridData[idx]
        if (colorId === 0) continue

        const cx = x * beadSize + BEAD_RADIUS
        const cy = y * beadSize + BEAD_RADIUS
        const color = getColorById(colorId)

        // 熨烫效果：融化后变平，边缘融合
        const radius = BEAD_RADIUS * (1 - ironFactor * 0.25)

        ctx.save()

        // 阴影
        ctx.beginPath()
        ctx.arc(cx + 1.5, cy + 1.5, radius, 0, Math.PI * 2)
        ctx.fillStyle = BEAD_SHADOW
        ctx.fill()

        // 珠子主体
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fillStyle = color.hex
        ctx.fill()

        // 高光
        ctx.beginPath()
        ctx.arc(cx - 2.5, cy - 2.5, radius * 0.45, 0, Math.PI * 2)
        ctx.fillStyle = BEAD_HIGHLIGHT
        ctx.fill()

        // 熨烫融化效果：绘制融合边框
        if (ironFactor > 0) {
          ctx.beginPath()
          ctx.arc(cx, cy, radius + ironFactor * 2, 0, Math.PI * 2)
          ctx.strokeStyle = color.hex + '60'
          ctx.lineWidth = ironFactor * 3
          ctx.stroke()
        }

        ctx.restore()
      }
    }

    // 绘制预览（鼠标悬停位置）
    if (hoverGrid && hoverGrid.x >= 0 && hoverGrid.x < gridSize && hoverGrid.y >= 0 && hoverGrid.y < gridSize) {
      const cx = hoverGrid.x * beadSize + BEAD_RADIUS
      const cy = hoverGrid.y * beadSize + BEAD_RADIUS
      
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, BEAD_RADIUS * 0.9, 0, Math.PI * 2)
      
      if (tool === 'erase') {
        // 擦除模式：显示红色半透明覆盖
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'
      } else {
        // 放置模式：显示当前选中颜色的半透明预览
        const previewColor = getColorById(selectedColor)
        ctx.fillStyle = previewColor.hex + '80'
      }
      ctx.fill()
      ctx.strokeStyle = tool === 'erase' ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()
    }

    ctx.restore()
  }, [gridSize, gridData, zoom, offsetX, offsetY, ironProgress, isIroned, hoverGrid, selectedColor, tool])

  // 重绘
  useEffect(() => {
    draw()
  }, [draw])

  // 监听窗口大小变化
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      const ctx = canvas.getContext('2d')
      ctx?.scale(window.devicePixelRatio, window.devicePixelRatio)
      draw()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draw])

  // 鼠标事件
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDrawing(true)
      const { x, y } = screenToGrid(e.clientX, e.clientY)
      if (tool === 'erase') {
        eraseBead(x, y)
      } else {
        putBead(x, y)
      }
    }
  }, [tool, putBead, eraseBead, setIsDrawing, screenToGrid])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = screenToGrid(e.clientX, e.clientY)
    setHoverGrid({ x, y })
    
    if (e.buttons === 1) {
      if (tool === 'erase') {
        eraseBead(x, y)
      } else {
        putBead(x, y)
      }
    }
  }, [tool, putBead, eraseBead, screenToGrid])

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
  }, [setIsDrawing])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.3, Math.min(5, zoom * delta))

    // 以鼠标位置为中心缩放
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const newOffsetX = mx - (mx - offsetX) * (newZoom / zoom)
    const newOffsetY = my - (my - offsetY) * (newZoom / zoom)

    setView(newZoom, newOffsetX, newOffsetY)
  }, [zoom, offsetX, offsetY, setView])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          useBoardStore.getState().redo()
        } else {
          useBoardStore.getState().undo()
        }
      }
      if (e.key === 'e') {
        useBoardStore.getState().setTool('erase')
      }
      if (e.key === 'd') {
        useBoardStore.getState().setTool('draw')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 监听熨烫事件
  useEffect(() => {
    const handler = () => animateIron()
    window.addEventListener('perler-iron', handler)
    return () => window.removeEventListener('perler-iron', handler)
  }, [animateIron])

  // 右键擦除
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const { x, y } = screenToGrid(e.clientX, e.clientY)
    eraseBead(x, y)
  }, [eraseBead, screenToGrid])

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-100 overflow-hidden relative cursor-crosshair select-none"
      onDoubleClick={() => {
        if (isIroned) resetIron()
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
      {/* 熨烫进度条 */}
      {isIroningRef.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="bg-white rounded-full px-6 py-3 text-lg font-bold shadow-lg">
            🔥 熨烫中 {Math.round(ironProgress * 100)}%
          </div>
        </div>
      )}
      {/* 提示 */}
      <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-gray-500 select-none pointer-events-none">
        左键放豆 | 右键擦除 | 滚轮缩放 | Ctrl+Z 撤销 | I 熨烫
      </div>
    </div>
  )
}
