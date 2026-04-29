import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { useSocket } from '../hooks/useSocket';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { THEME } from '../utils/theme';

// Initialise the socket connection once at the app root
function SocketProvider() {
  useSocket();
  return null;
}

// Route protection: redirect to /auth when unauthenticated non-guest.
// Guests can always navigate to /auth manually (to sign in or create account).
function AuthGate() {
  const { session, isGuest, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;  // wait until layout is mounted
    if (isLoading) return;  // wait until auth state is known

    const inAuthScreen = segments[0] === 'auth';

    // No session and not a guest — must authenticate
    if (!session && !isGuest && !inAuthScreen) {
      router.replace('/auth');
      return;
    }

    // Fully authenticated (real session) on auth screen — send home
    // Guests are allowed through: they may want to sign in or create account
    if (session && !isGuest && inAuthScreen) {
      router.replace('/');
    }
  }, [mounted, isLoading, session, isGuest, segments]);

  return null;
}

function LoadingScreen() {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#070C14',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <Text style={{
        fontFamily: 'Cormorant_600SemiBold',
        fontSize: 28,
        color: '#C9A84C',
        letterSpacing: 4,
      }}>
        POWERSTACK
      </Text>
      <Text style={{
        color: '#5A6A7E',
        fontSize: 12,
        letterSpacing: 2,
      }}>
        Loading...
      </Text>
    </View>
  );
}

function RootLayoutInner() {
  const { isLoading } = useAuth();
  const [forceShow, setForceShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      console.warn('App loading timeout — forcing to auth screen');
      setForceShow(true);
    }, 10000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading]);

  if (isLoading && !forceShow) return <LoadingScreen />;

  return (
    <>
      <SocketProvider />
      <AuthGate />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: THEME.cardBackground },
          headerTintColor: THEME.gold,
          headerTitleStyle: { fontWeight: '600', color: THEME.textPrimary },
          contentStyle: { backgroundColor: THEME.appBackground },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Powerstack', headerShown: false }} />
        <Stack.Screen name="game" options={{ title: 'Game', headerShown: false }} />
        <Stack.Screen name="results" options={{ title: 'Results', headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
        <Stack.Screen name="challenges" options={{ title: 'Cards', headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cormorant_400Regular: CormorantGaramond_400Regular,
    Cormorant_600SemiBold: CormorantGaramond_600SemiBold,
    Cormorant_400Italic: CormorantGaramond_400Regular_Italic,
  });

  // Render before fonts are loaded — AuthProvider still mounts so auth
  // resolves in the background; fonts will be available by the time
  // LoadingScreen/content actually renders.
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
