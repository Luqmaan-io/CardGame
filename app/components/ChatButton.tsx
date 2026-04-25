import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { THEME } from '../utils/theme';

const CHAT_MESSAGES = [
  { id: 'nice', text: 'Nice move! 👏' },
  { id: 'lucky', text: 'Lucky! 🍀' },
  { id: 'really', text: 'Really?! 😤' },
  { id: 'wellplayed', text: 'Well played 🎩' },
  { id: 'coming', text: "I'm coming for you 👀" },
  { id: 'ouch', text: 'Ouch! 😬' },
  { id: 'letsgo', text: "Let's go! 🔥" },
  { id: 'gg', text: 'GG 🤝' },
  { id: 'noways', text: 'No way! 😂' },
  { id: 'unlucky', text: 'Unlucky 😅' },
];

interface ChatButtonProps {
  onSendMessage: (messageId: string, messageText: string) => void;
}

export function ChatButton({ onSendMessage }: ChatButtonProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(id: string, text: string) {
    setOpen(false);
    onSendMessage(id, text);
  }

  return (
    <>
      <TouchableOpacity style={styles.btn} onPress={() => setOpen(true)}>
        <Text style={styles.btnText}>💬</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Send a message</Text>
          <View style={styles.grid}>
            {CHAT_MESSAGES.map((msg) => (
              <TouchableOpacity
                key={msg.id}
                style={styles.msgBtn}
                onPress={() => handleSelect(msg.id, msg.text)}
              >
                <Text style={styles.msgText}>{msg.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: THEME.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: THEME.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    color: THEME.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  msgBtn: {
    width: '47%',
    backgroundColor: THEME.surfaceBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  msgText: {
    color: THEME.textPrimary,
    fontSize: 13,
    textAlign: 'center',
  },
});
