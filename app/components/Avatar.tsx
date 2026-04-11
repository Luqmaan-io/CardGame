import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AVATARS, AvatarId } from '../assets/avatars'

type AvatarProps = {
  avatarId: string
  size?: number
  colourHex?: string
  showRing?: boolean
}

export default function Avatar({
  avatarId,
  size = 48,
  colourHex = '#378ADD',
  showRing = true,
}: AvatarProps) {
  const SvgAvatar = AVATARS[avatarId as AvatarId] ?? AVATARS['avatar_01']

  const ringWidth = showRing ? 3 : 0
  const innerSize = size - ringWidth * 2

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: showRing ? colourHex : 'transparent',
          borderWidth: ringWidth,
        },
      ]}
    >
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          overflow: 'hidden',
        }}
      >
        <SvgAvatar width={innerSize} height={innerSize} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
