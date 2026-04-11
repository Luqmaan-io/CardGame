import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native'
import { AVATAR_LIST } from '../assets/avatars'
import Avatar from './Avatar'

type AvatarPickerProps = {
  visible: boolean
  currentAvatarId: string
  colourHex: string
  onSelect: (avatarId: string) => void
  onClose: () => void
}

export default function AvatarPickerModal({
  visible,
  currentAvatarId,
  colourHex,
  onSelect,
  onClose,
}: AvatarPickerProps) {
  function handleSelect(avatarId: string) {
    onSelect(avatarId)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose your avatar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {AVATAR_LIST.map(({ id }) => {
              const isSelected = id === currentAvatarId
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => handleSelect(id)}
                  style={styles.cell}
                  activeOpacity={0.75}
                >
                  <View style={styles.avatarWrapper}>
                    <Avatar
                      avatarId={id}
                      size={72}
                      colourHex={colourHex}
                      showRing={isSelected}
                    />
                    {isSelected && (
                      <View style={[styles.checkBadge, { backgroundColor: colourHex }]}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    )}
                    {!isSelected && (
                      <View style={styles.unselectedRing} />
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  cell: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1e1e1e',
  },
  checkText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  unselectedRing: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
})
