import Board from './components/Board'
import Palette from './components/Palette'
import Toolbar from './components/Toolbar'

export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* 工具栏 */}
      <Toolbar />

      {/* 画布区域 */}
      <Board />

      {/* 调色板 */}
      <Palette />
    </div>
  )
}
