import { BEAD_COLORS } from '../utils/colors'
import { useBoardStore } from '../store/boardStore'

export default function Palette() {
  const { selectedColor, setSelectedColor } = useBoardStore()

  return (
    <div className="w-full bg-white border-t border-gray-200 p-2">
      <div className="flex flex-wrap gap-1.5 justify-center">
        {BEAD_COLORS.map(color => (
          <button
            key={color.id}
            onClick={() => setSelectedColor(color.id)}
            className={`
              w-8 h-8 rounded-full border-2 transition-all hover:scale-110
              ${selectedColor === color.id
                ? 'border-blue-500 shadow-lg scale-110 ring-2 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  )
}
