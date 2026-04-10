import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY ' +
    'are set in app/.env'
  )
}

// Singleton pattern — only one client ever created
let supabaseInstance: SupabaseClient | null = null

const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance

  const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
      if (Platform.OS === 'web') {
        return Promise.resolve(localStorage.getItem(key))
      }
      return import('expo-secure-store').then(m => m.getItemAsync(key))
    },
    setItem: (key: string, value: string) => {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value)
        return Promise.resolve()
      }
      return import('expo-secure-store').then(m => m.setItemAsync(key, value))
    },
    removeItem: (key: string) => {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key)
        return Promise.resolve()
      }
      return import('expo-secure-store').then(m => m.deleteItemAsync(key))
    },
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web', // true on web, false on native
    },
  })

  return supabaseInstance
}

export const supabase = getSupabaseClient()
