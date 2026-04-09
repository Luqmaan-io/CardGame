import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

interface HowToPlayModalProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Power card table data ────────────────────────────────────────────────────

const POWER_CARDS = [
  {
    rank: 'A',
    suits: null,
    name: 'Suit changer',
    rule: 'Declare any suit — the next player must match it.',
    rankColour: '#7F77DD',
  },
  {
    rank: '2',
    suits: null,
    name: 'Pick up 2',
    rule: 'Next player draws 2 cards or plays another 2 to pass it on.',
    rankColour: '#E24B4A',
  },
  {
    rank: '8',
    suits: null,
    name: 'Miss a turn',
    rule: 'Next player skips their go.',
    rankColour: '#EF9F27',
  },
  {
    rank: 'J',
    suits: '♠ ♣',
    name: 'Pick up 7',
    rule: 'Next player draws 7 cards — counter with a red Jack.',
    rankColour: '#212121',
  },
  {
    rank: 'J',
    suits: '♥ ♦',
    name: 'Red Jack',
    rule: 'Cancels a black Jack penalty.',
    rankColour: '#E24B4A',
  },
  {
    rank: 'Q',
    suits: null,
    name: 'Cover card',
    rule: 'Must be followed immediately by another card of the same suit.',
    rankColour: '#1D9E75',
  },
  {
    rank: 'K',
    suits: null,
    name: 'Reverse',
    rule: 'Reverses the direction of play.',
    rankColour: '#378ADD',
  },
];

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: string }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
}

// ─── Power card row ───────────────────────────────────────────────────────────

function PowerCardRow({
  rank,
  suits,
  name,
  rule,
  rankColour,
}: (typeof POWER_CARDS)[0]) {
  return (
    <View style={styles.powerRow}>
      <View style={styles.powerRankBox}>
        <Text style={[styles.powerRank, { color: rankColour }]}>{rank}</Text>
        {suits ? <Text style={[styles.powerSuits, { color: rankColour }]}>{suits}</Text> : null}
      </View>
      <View style={styles.powerInfo}>
        <Text style={styles.powerName}>{name}</Text>
        <Text style={styles.powerRule}>{rule}</Text>
      </View>
    </View>
  );
}

// ─── HowToPlayModal ───────────────────────────────────────────────────────────

export function HowToPlayModal({ visible, onClose }: HowToPlayModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>How to Play</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1 — The basics */}
          <SectionHeading>The basics</SectionHeading>
          <Text style={styles.body}>
            Get rid of all your cards before anyone else. Players take turns placing cards on the
            pile — cards must match the <Text style={styles.bold}>suit</Text> or{' '}
            <Text style={styles.bold}>rank</Text> of the top card.
          </Text>
          <Text style={styles.body}>
            You can play multiple cards in one turn as long as they form a run going{' '}
            <Text style={styles.bold}>up or down</Text> in number, switching suits by matching rank.
          </Text>
          <View style={styles.exampleBox}>
            <Text style={styles.exampleText}>
              3♦ → 4♦ → 4♠ → 5♠ is a valid combo
            </Text>
          </View>

          {/* Section 2 — Power cards */}
          <SectionHeading>Power cards</SectionHeading>
          {POWER_CARDS.map((pc, i) => (
            <PowerCardRow key={i} {...pc} />
          ))}

          {/* Section 3 — Finishing */}
          <SectionHeading>Finishing</SectionHeading>
          <Text style={styles.body}>
            First player to empty their hand wins. You{' '}
            <Text style={styles.bold}>cannot finish on a power card</Text> — if your last card is a
            power card you must draw one more.
          </Text>
          <Text style={styles.body}>
            Use <Text style={styles.highlight}>"I'm on cards!"</Text> to let others know you could
            win next turn — but only press it if you actually can, or you'll draw 2 as a penalty!
          </Text>

          {/* Section 4 — Timer */}
          <SectionHeading>Timer</SectionHeading>
          <Text style={styles.body}>
            Each player has <Text style={styles.bold}>30 seconds</Text> per turn. Run out of time 3
            turns in a row and you'll be removed from the game.
          </Text>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT = '#378ADD';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#212121',
    flex: 1,
    textAlign: 'center',
    marginLeft: 44, // balance the close button
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#616161',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: ACCENT,
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
    marginBottom: 10,
  },
  bold: {
    fontWeight: '700',
    color: '#212121',
  },
  highlight: {
    fontWeight: '700',
    color: ACCENT,
  },
  exampleBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  exampleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    letterSpacing: 0.5,
  },
  // Power card rows
  powerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 14,
  },
  powerRankBox: {
    width: 40,
    alignItems: 'center',
    gap: 2,
  },
  powerRank: {
    fontSize: 22,
    fontWeight: '900',
  },
  powerSuits: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  powerInfo: {
    flex: 1,
    gap: 3,
  },
  powerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  powerRule: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
