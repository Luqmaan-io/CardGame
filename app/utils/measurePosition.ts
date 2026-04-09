import { RefObject } from 'react'
import { View } from 'react-native'

export type ScreenPosition = { x: number; y: number; width: number; height: number }

export function measurePosition(ref: RefObject<View>): Promise<ScreenPosition> {
  return new Promise((resolve, reject) => {
    if (!ref.current) {
      reject(new Error('ref not mounted'))
      return
    }
    ref.current.measureInWindow((x, y, width, height) => {
      resolve({ x, y, width, height })
    })
  })
}

export function centreOf(pos: ScreenPosition): { x: number; y: number } {
  return {
    x: pos.x + pos.width / 2,
    y: pos.y + pos.height / 2,
  }
}
