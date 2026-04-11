import { useEffect, useState, useRef } from 'react'
import { Animated, Platform } from 'react-native'
import { supabase } from '../lib/supabase'

// ── Toast state (module-level so any component can trigger it) ────────────────

type ToastListener = (message: string) => void
const listeners: Set<ToastListener> = new Set()

export function showToast(message: string) {
  listeners.forEach((l) => l(message))
}

// ── useToast — call in the root layout to render toasts ──────────────────────

export function useToastState() {
  const [message, setMessage] = useState<string | null>(null)
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const listener: ToastListener = (msg) => {
      setMessage(msg)
      opacity.setValue(0)
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2600),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMessage(null))
    }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  return { message, opacity }
}

// ── useFriendRequests — subscribe to incoming friend requests ─────────────────

export function useFriendRequests(userId: string | undefined) {
  const [friendRequestCount, setFriendRequestCount] = useState(0)

  // Load initial pending count on mount
  useEffect(() => {
    if (!userId) return
    supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .then(({ count }) => {
        if (count != null) setFriendRequestCount(count)
      })
  }, [userId])

  // Subscribe to new INSERT events on friendships where we are the addressee
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`friend-requests-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${userId}`,
        },
        () => {
          showToast('You have a new friend request!')
          setFriendRequestCount((prev) => prev + 1)
        }
      )
      // Also decrement when a pending row is deleted (declined/cancelled) or updated (accepted)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.status === 'accepted') {
            setFriendRequestCount((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${userId}`,
        },
        () => {
          setFriendRequestCount((prev) => Math.max(0, prev - 1))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  function clearBadge() {
    setFriendRequestCount(0)
  }

  return { friendRequestCount, clearBadge }
}
