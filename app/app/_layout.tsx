import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Initialise the socket connection once at the app root
function SocketProvider() {
  useSocket();
  return null;
}

// Route protection: redirect to /auth when unauthenticated non-guest
function AuthGate() {
  const { session, isGuest, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthScreen = segments[0] === 'auth';
    const isAuthed = !!session || isGuest;

    if (!isAuthed && !inAuthScreen) {
      router.replace('/auth');
    } else if (isAuthed && inAuthScreen) {
      router.replace('/');
    }
  }, [session, isGuest, isLoading, segments]);

  return null;
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#4caf50" />
    </View>
  );
}

function RootLayoutInner() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <SocketProvider />
      <AuthGate />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1b5e20' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Card Game', headerShown: false }} />
        <Stack.Screen name="game" options={{ title: 'Game', headerShown: false }} />
        <Stack.Screen name="results" options={{ title: 'Results', headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
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
  loading: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
