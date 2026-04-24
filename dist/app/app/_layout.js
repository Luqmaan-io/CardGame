"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootLayout;
const expo_router_1 = require("expo-router");
const react_native_gesture_handler_1 = require("react-native-gesture-handler");
const react_native_1 = require("react-native");
const react_1 = require("react");
const useSocket_1 = require("../hooks/useSocket");
const AuthContext_1 = require("../context/AuthContext");
const theme_1 = require("../utils/theme");
// Initialise the socket connection once at the app root
function SocketProvider() {
    (0, useSocket_1.useSocket)();
    return null;
}
// Route protection: redirect to /auth when unauthenticated non-guest
function AuthGate() {
    const { session, isGuest, isLoading } = (0, AuthContext_1.useAuth)();
    const segments = (0, expo_router_1.useSegments)();
    const router = (0, expo_router_1.useRouter)();
    const [mounted, setMounted] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setMounted(true);
    }, []);
    (0, react_1.useEffect)(() => {
        if (!mounted)
            return; // wait until layout is mounted
        if (isLoading)
            return; // wait until auth state is known
        const inAuthScreen = segments[0] === 'auth';
        const isAuthed = !!session || isGuest;
        if (!isAuthed && !inAuthScreen) {
            router.replace('/auth');
        }
        else if (isAuthed && inAuthScreen) {
            router.replace('/');
        }
    }, [mounted, isLoading, session, isGuest, segments]);
    return null;
}
function LoadingScreen() {
    return (<react_native_1.View style={styles.loading}>
      <react_native_1.ActivityIndicator size="large" color={theme_1.THEME.gold}/>
    </react_native_1.View>);
}
function RootLayoutInner() {
    const { isLoading } = (0, AuthContext_1.useAuth)();
    if (isLoading)
        return <LoadingScreen />;
    return (<>
      <SocketProvider />
      <AuthGate />
      <expo_router_1.Stack screenOptions={{
            headerStyle: { backgroundColor: theme_1.THEME.cardBackground },
            headerTintColor: theme_1.THEME.gold,
            headerTitleStyle: { fontWeight: '600', color: theme_1.THEME.textPrimary },
            contentStyle: { backgroundColor: theme_1.THEME.appBackground },
        }}>
        <expo_router_1.Stack.Screen name="index" options={{ title: 'Card Game', headerShown: false }}/>
        <expo_router_1.Stack.Screen name="game" options={{ title: 'Game', headerShown: false }}/>
        <expo_router_1.Stack.Screen name="results" options={{ title: 'Results', headerShown: false }}/>
        <expo_router_1.Stack.Screen name="auth" options={{ headerShown: false }}/>
        <expo_router_1.Stack.Screen name="profile" options={{ title: 'Profile', headerShown: false }}/>
      </expo_router_1.Stack>
    </>);
}
function RootLayout() {
    return (<react_native_gesture_handler_1.GestureHandlerRootView style={styles.root}>
      <AuthContext_1.AuthProvider>
        <RootLayoutInner />
      </AuthContext_1.AuthProvider>
    </react_native_gesture_handler_1.GestureHandlerRootView>);
}
const styles = react_native_1.StyleSheet.create({
    root: { flex: 1 },
    loading: {
        flex: 1,
        backgroundColor: theme_1.THEME.appBackground,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
//# sourceMappingURL=_layout.js.map