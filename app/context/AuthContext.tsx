import { createContext, useContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Profile = {
  id: string
  username: string
  avatarId: string
  friendCode: string
  colourHex: string
  isGuest: boolean
  cardBackId: string
  cardFaceId: string
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  isGuest: boolean
  isLoading: boolean
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  continueAsGuest: (username: string) => void
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Safety timeout — if Supabase takes more than 15 seconds,
    // force the app to continue as unauthenticated
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('Auth timeout — continuing as unauthenticated')
        setIsLoading(false)
      }
    }, 15000)

    // Get initial session — real session always takes priority over guest localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      clearTimeout(safetyTimeout)

      if (session?.user) {
        // Real session found — clear any stale guest data and proceed as authed user
        setIsGuest(false)
        if (Platform.OS === 'web') {
          localStorage.removeItem('guest_profile')
        }
        setSession(session)
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        // No real session — only now check for a stored guest session
        if (Platform.OS === 'web') {
          const stored = localStorage.getItem('guest_profile')
          if (stored) {
            try {
              const guestProfile = JSON.parse(stored)
              setIsGuest(true)
              setProfile(guestProfile)
            } catch {}
          }
        }
        setIsLoading(false)
      }
    }).catch((err) => {
      console.error('Session check failed:', err)
      if (mounted) {
        clearTimeout(safetyTimeout)
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Clear guest state FIRST so AuthGate sees the correct state atomically
          setIsGuest(false)
          if (Platform.OS === 'web') {
            localStorage.removeItem('guest_profile')
          }
          setSession(session)
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setIsGuest(false)
          setSession(null)
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setSession(session)
          setUser(session.user)
        } else if (!session) {
          setSession(null)
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string, attempt = 1): Promise<void> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        // If profile doesn't exist yet — trigger was slow, retry
        if (error.code === 'PGRST116' && attempt < 3) {
          console.log(`Profile not found, retrying... (attempt ${attempt})`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          return fetchProfile(userId, attempt + 1)
        }
        console.warn('Profile fetch error:', error)
        setIsLoading(false)
        return
      }

      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          avatarId: data.avatar_id,
          friendCode: data.friend_code,
          colourHex: data.colour_hex,
          isGuest: data.is_guest,
          cardBackId: data.card_back_id ?? 'back_00',
          cardFaceId: data.card_face_id ?? 'face_00',
        })
      }
    } catch (err: unknown) {
      const e = err as { name?: string }
      if (e?.name === 'AbortError' && attempt < 3) {
        console.log(`Profile fetch timed out, retrying... (attempt ${attempt})`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return fetchProfile(userId, attempt + 1)
      }
      console.warn('Profile fetch failed after retries:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
    if (error) throw error
    // Eagerly clear guest state so the UI updates before onAuthStateChange fires
    if (data?.session) {
      setIsGuest(false)
      if (Platform.OS === 'web') {
        localStorage.removeItem('guest_profile')
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Eagerly clear guest state so the UI updates before onAuthStateChange fires
    if (data?.session) {
      setIsGuest(false)
      if (Platform.OS === 'web') {
        localStorage.removeItem('guest_profile')
      }
    }
  }

  const signOut = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('guest_profile')
    }
    setIsGuest(false)
    setProfile(null)
    await supabase.auth.signOut()
  }

  const continueAsGuest = (username: string) => {
    const guestProfile = {
      id: `guest_${Date.now()}`,
      username,
      avatarId: 'avatar_01',
      friendCode: '',
      colourHex: '#378ADD',
      isGuest: true,
      cardBackId: 'back_00',
      cardFaceId: 'face_00',
    }

    if (Platform.OS === 'web') {
      localStorage.setItem('guest_profile', JSON.stringify(guestProfile))
    }

    setIsGuest(true)
    setProfile(guestProfile)
    setIsLoading(false)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({
        username: updates.username,
        avatar_id: updates.avatarId,
        colour_hex: updates.colourHex,
        card_back_id: updates.cardBackId,
        card_face_id: updates.cardFaceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    if (error) throw error
    setProfile(prev => prev ? { ...prev, ...updates } : null)
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile, isGuest, isLoading,
      signUp, signIn, signOut, continueAsGuest, updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
