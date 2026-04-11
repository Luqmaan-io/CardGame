import Avatar01 from './avatar_01.svg'
import Avatar02 from './avatar_02.svg'
import Avatar03 from './avatar_03.svg'
import Avatar04 from './avatar_04.svg'
import Avatar05 from './avatar_05.svg'
import Avatar06 from './avatar_06.svg'
import Avatar07 from './avatar_07.svg'
import Avatar08 from './avatar_08.svg'
import Avatar09 from './avatar_09.svg'
import Avatar10 from './avatar_10.svg'
import Avatar11 from './avatar_11.svg'
import Avatar12 from './avatar_12.svg'
import Avatar13 from './avatar_13.svg'
import Avatar14 from './avatar_14.svg'
import Avatar15 from './avatar_15.svg'
import Avatar16 from './avatar_16.svg'

export const AVATARS = {
  avatar_01: Avatar01,
  avatar_02: Avatar02,
  avatar_03: Avatar03,
  avatar_04: Avatar04,
  avatar_05: Avatar05,
  avatar_06: Avatar06,
  avatar_07: Avatar07,
  avatar_08: Avatar08,
  avatar_09: Avatar09,
  avatar_10: Avatar10,
  avatar_11: Avatar11,
  avatar_12: Avatar12,
  avatar_13: Avatar13,
  avatar_14: Avatar14,
  avatar_15: Avatar15,
  avatar_16: Avatar16,
}

export type AvatarId = keyof typeof AVATARS

export const AVATAR_LIST = Object.entries(AVATARS).map(([id, Component]) => ({
  id: id as AvatarId,
  Component,
}))
