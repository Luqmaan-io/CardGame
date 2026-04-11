import React from 'react'
import { View, Text, Platform } from 'react-native'
import { AVATAR_DATA } from '../assets/avatars/avatarData'

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
  const avatar = AVATAR_DATA.find(a => a.id === avatarId) ?? AVATAR_DATA[0]!
  const ringWidth = showRing ? 3 : 0
  const innerSize = size - ringWidth * 2

  if (Platform.OS === 'web') {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        border: showRing ? `${ringWidth}px solid ${colourHex}` : 'none',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
      } as React.CSSProperties}>
        <svg
          width={innerSize}
          height={innerSize}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="100" cy="100" r="100" fill={avatar.bgColour} />
          <g dangerouslySetInnerHTML={{ __html: avatar.svg }} />
        </svg>
      </div>
    )
  }

  // Native fallback — coloured circle with initial letter
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: showRing ? ringWidth : 0,
      borderColor: showRing ? colourHex : 'transparent',
      backgroundColor: avatar.bgColour,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{
        color: '#ffffff',
        fontSize: size * 0.35,
        fontWeight: '500',
      }}>
        {avatar.label[0]}
      </Text>
    </View>
  )
}
