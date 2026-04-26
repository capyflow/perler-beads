// 拼豆色号定义（模拟真实 Perler Beads 常用色）
export interface BeadColor {
  id: number
  name: string
  hex: string
}

export const BEAD_COLORS: BeadColor[] = [
  { id: 0, name: '白色', hex: '#FFFFFF' },
  { id: 1, name: '黑色', hex: '#1A1A1A' },
  { id: 2, name: '红色', hex: '#E53935' },
  { id: 3, name: '深蓝', hex: '#1E3A8A' },
  { id: 4, name: '天蓝', hex: '#42A5F5' },
  { id: 5, name: '绿色', hex: '#4CAF50' },
  { id: 6, name: '黄色', hex: '#FFEB3B' },
  { id: 7, name: '橙色', hex: '#FF9800' },
  { id: 8, name: '紫色', hex: '#9C27B0' },
  { id: 9, name: '粉色', hex: '#E91E63' },
  { id: 10, name: '棕色', hex: '#8D6E63' },
  { id: 11, name: '浅灰', hex: '#BDBDBD' },
  { id: 12, name: '深灰', hex: '#757575' },
  { id: 13, name: '米白', hex: '#F5F5DC' },
  { id: 14, name: '浅粉', hex: '#F8BBD0' },
  { id: 15, name: '浅蓝', hex: '#BBDEFB' },
  { id: 16, name: '浅绿', hex: '#C8E6C9' },
  { id: 17, name: '浅紫', hex: '#E1BEE7' },
  { id: 18, name: '浅黄', hex: '#FFF9C4' },
  { id: 19, name: '酒红', hex: '#880E4F' },
  { id: 20, name: '青色', hex: '#00ACC1' },
  { id: 21, name: '金色', hex: '#FFB300' },
  { id: 22, name: '银色', hex: '#CFD8DC' },
  { id: 23, name: '橄榄绿', hex: '#689F38' },
  { id: 24, name: '藏青', hex: '#283593' },
  { id: 25, name: '珊瑚', hex: '#FF7043' },
]

export function getColorById(id: number): BeadColor {
  return BEAD_COLORS.find(c => c.id === id) ?? BEAD_COLORS[0]
}
