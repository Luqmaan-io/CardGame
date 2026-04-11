// Re-export from avatarData — SVG file imports removed (broke web via transformer)
export { AVATAR_DATA, type AvatarData } from './avatarData'

import { AVATAR_DATA } from './avatarData'

export type AvatarId = string

// AVATAR_LIST for backwards-compat with any existing imports
export const AVATAR_LIST = AVATAR_DATA.map(({ id }) => ({ id }))
