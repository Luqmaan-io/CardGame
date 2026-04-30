import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text } from 'react-native';
import { useEffect } from 'react';
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
// useRootNavigationState guards against "navigate before mounting" errors —
// navigation only fires once the navigator key exists (i.e. Stack is mounted).
function AuthGate() {
  const { session, user, isGuest, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;  // navigator not mounted yet
    if (isLoading) return;              // auth state not resolved yet

    const inAuthScreen = segments[0] === 'auth';
    // A real session requires both a Supabase session token AND a loaded user object,
    // and must not be in guest mode (guest sign-in clears isGuest before we get here).
    const hasRealSession = !!session && !!user && !isGuest;

    // Fully authenticated on /auth — send home
    if (hasRealSession && inAuthScreen) {
      router.replace('/');
      return;
    }

    // No session at all (not guest, not authed) — must sign in
    if (!hasRealSession && !isGuest && !inAuthScreen) {
      router.replace('/auth');
      return;
    }

    // Guest navigating to /auth — allowed through, do nothing
  }, [navigationState?.key, isLoading, session, user, isGuest, segments]);

  return null;
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingTitle}>POWERSTACK</Text>
      <Text style={styles.loadingSubtitle}>Connecting...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cormorant_400Regular: CormorantGaramond_400Regular,
    Cormorant_600SemiBold: CormorantGaramond_600SemiBold,
    Cormorant_400Italic: CormorantGaramond_400Regular_Italic,
  });

  // The Stack must always render so the navigator mounts and AuthGate can navigate.
  // LoadingScreen is layered on top while auth resolves — it does NOT replace the Stack.
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
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
        <LoadingOverlay />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// Overlay rendered on top of the Stack while auth is loading.
// Uses absoluteFillObject so it covers the blank Stack without unmounting it.
function LoadingOverlay() {
  const { isLoading } = useAuth();
  if (!isLoading) return null;
  return <LoadingScreen />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#070C14',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 999,
  },
  loadingTitle: {
    fontFamily: 'Cormorant_600SemiBold',
    fontSize: 28,
    color: '#C9A84C',
    letterSpacing: 4,
  },
  loadingSubtitle: {
    color: '#5A6A7E',
    fontSize: 12,
    letterSpacing: 2,
  },
});
