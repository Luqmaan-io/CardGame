import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import type { Suit } from '../../engine/types';

interface SuitPickerProps {
  visible: boolean;
  onSelect: (suit: Suit) => void;
}

const SUITS: { suit: Suit; symbol: string; color: string }[] = [
  { suit: 'hearts', symbol: '♥', color: '#c62828' },
  { suit: 'diamonds', symbol: '♦', color: '#c62828' },
  { suit: 'clubs', symbol: '♣', color: '#212121' },
  { suit: 'spades', symbol: '♠', color: '#212121' },
];

export function SuitPicker({ visible, onSelect }: SuitPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Choose a suit</Text>
          <View style={styles.grid}>
            {SUITS.map(({ suit, symbol, color }) => (
              <TouchableOpacity
                key={suit}
                style={styles.button}
                onPress={() => onSelect(suit)}
                activeOpacity={0.7}
              >
                <Text style={[styles.symbol, { color }]}>{symbol}</Text>
                <Text style={styles.label}>{suit}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#fafafa',
    borderRadius: 20,
    padding: 24,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#212121',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  button: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  symbol: {
    fontSize: 40,
    lineHeight: 48,
  },
  label: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
});
