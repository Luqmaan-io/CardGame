import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useSocket } from '../hooks/useSocket';

// Initialise the socket connection once at the app root
function SocketProvider() {
  useSocket();
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SocketProvider />
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
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
