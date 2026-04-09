import { useEffect, useRef, useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Sound registry ───────────────────────────────────────────────────────────
// All requires are at module level so Metro bundles the assets at build time.
// Each file must exist (even if empty) — missing files cause Metro build errors.

const SOUND_MODULES = {
  card_slide: require('../assets/sounds/card_slide.mp3'),
  card_deal: require('../assets/sounds/card_deal.mp3'),
  card_flip: require('../assets/sounds/card_flip.mp3'),
  card_draw: require('../assets/sounds/card_draw.mp3'),
  power_card: require('../assets/sounds/power_card.mp3'),
  penalty: require('../assets/sounds/penalty.mp3'),
  on_cards: require('../assets/sounds/on_cards.mp3'),
  win: require('../assets/sounds/win.mp3'),
  shuffle: require('../assets/sounds/shuffle.mp3'),
  timeout: require('../assets/sounds/timeout.mp3'),
} as const;

// Volume per sound — set on load, not on every play.
const SOUND_VOLUMES: Record<SoundName, number> = {
  card_deal: 0.6,
  card_slide: 0.7,
  card_flip: 0.8,
  card_draw: 0.6,
  power_card: 0.9,
  penalty: 1.0,
  on_cards: 0.85,
  win: 1.0,
  shuffle: 0.7,
  timeout: 0.75,
};

export type SoundName = keyof typeof SOUND_MODULES;

const MUTE_STORAGE_KEY = 'card_game_muted';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSounds() {
  const soundsRef = useRef<Partial<Record<SoundName, Audio.Sound>>>({});
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);

  // Keep ref in sync so playSound closure always reads current value
  isMutedRef.current = isMuted;

  // ── Load mute preference ────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(MUTE_STORAGE_KEY)
      .then((val) => {
        if (val === 'true') {
          setIsMuted(true);
          isMutedRef.current = true;
        }
      })
      .catch(() => {});
  }, []);

  // ── Preload all sounds on mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch {}

      const names = Object.keys(SOUND_MODULES) as SoundName[];
      for (const name of names) {
        if (cancelled) break;
        try {
          const { sound } = await Audio.Sound.createAsync(SOUND_MODULES[name], {
            shouldPlay: false,
            volume: SOUND_VOLUMES[name],
          });
          if (!cancelled) {
            soundsRef.current[name] = sound;
          } else {
            await sound.unloadAsync().catch(() => {});
          }
        } catch {
          // Sound file is a placeholder or invalid — silently skip
        }
      }
    }

    loadAll();

    return () => {
      cancelled = true;
      const sounds = soundsRef.current;
      soundsRef.current = {};
      Object.values(sounds).forEach((s) => {
        s?.unloadAsync().catch(() => {});
      });
    };
  }, []);

  // ── playSound ───────────────────────────────────────────────────────────────
  // Fire and forget — never blocks, never throws to caller.

  const playSound = useCallback((name: SoundName): void => {
    if (isMutedRef.current) return;
    const sound = soundsRef.current[name];
    if (!sound) return;
    // Rewind and play without awaiting
    sound
      .setPositionAsync(0)
      .then(() => sound.playAsync())
      .catch(() => {});
  }, []);

  // ── toggleMute ──────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      AsyncStorage.setItem(MUTE_STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  return { playSound, isMuted, toggleMute };
}
