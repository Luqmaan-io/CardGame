"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = void 0;
exports.AuthProvider = AuthProvider;
const react_1 = require("react");
const react_native_1 = require("react-native");
const supabase_1 = require("../lib/supabase");
const AuthContext = (0, react_1.createContext)(null);
function AuthProvider({ children }) {
    const [session, setSession] = (0, react_1.useState)(null);
    const [user, setUser] = (0, react_1.useState)(null);
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [isGuest, setIsGuest] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Get initial session
        supabase_1.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setSession(session);
                setUser(session.user);
                fetchProfile(session.user.id);
            }
            else {
                // Check for stored guest session on web
                if (react_native_1.Platform.OS === 'web') {
                    const stored = localStorage.getItem('guest_profile');
                    if (stored) {
                        try {
                            const guestProfile = JSON.parse(stored);
                            setIsGuest(true);
                            setProfile(guestProfile);
                        }
                        catch { }
                    }
                }
                setIsLoading(false);
            }
        });
        // Listen for auth changes
        const { data: { subscription } } = supabase_1.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event, !!session);
            setSession(session);
            setUser(session?.user ?? null);
            if (event === 'SIGNED_IN' && session?.user) {
                // Clear guest state if they just signed in
                setIsGuest(false);
                await fetchProfile(session.user.id);
            }
            else if (event === 'SIGNED_OUT') {
                setProfile(null);
                setIsGuest(false);
                setIsLoading(false);
            }
            else if (!session) {
                setProfile(null);
                setIsLoading(false);
            }
        });
        return () => subscription.unsubscribe();
    }, []);
    const fetchProfile = async (userId) => {
        const { data } = await supabase_1.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (data) {
            setProfile({
                id: data.id,
                username: data.username,
                avatarId: data.avatar_id,
                friendCode: data.friend_code,
                colourHex: data.colour_hex,
                isGuest: data.is_guest,
            });
        }
        setIsLoading(false);
    };
    const signUp = async (email, password, username) => {
        const { error } = await supabase_1.supabase.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });
        if (error)
            throw error;
    };
    const signIn = async (email, password) => {
        const { error } = await supabase_1.supabase.auth.signInWithPassword({ email, password });
        if (error)
            throw error;
    };
    const signOut = async () => {
        if (react_native_1.Platform.OS === 'web') {
            localStorage.removeItem('guest_profile');
        }
        setIsGuest(false);
        setProfile(null);
        await supabase_1.supabase.auth.signOut();
    };
    const continueAsGuest = (username) => {
        const guestProfile = {
            id: `guest_${Date.now()}`,
            username,
            avatarId: 'avatar_01',
            friendCode: '',
            colourHex: '#378ADD',
            isGuest: true,
        };
        if (react_native_1.Platform.OS === 'web') {
            localStorage.setItem('guest_profile', JSON.stringify(guestProfile));
        }
        setIsGuest(true);
        setProfile(guestProfile);
        setIsLoading(false);
    };
    const updateProfile = async (updates) => {
        if (!user)
            return;
        const { error } = await supabase_1.supabase
            .from('profiles')
            .update({
            username: updates.username,
            avatar_id: updates.avatarId,
            colour_hex: updates.colourHex,
            updated_at: new Date().toISOString(),
        })
            .eq('id', user.id);
        if (error)
            throw error;
        setProfile(prev => prev ? { ...prev, ...updates } : null);
    };
    return (<AuthContext.Provider value={{
            session, user, profile, isGuest, isLoading,
            signUp, signIn, signOut, continueAsGuest, updateProfile
        }}>
      {children}
    </AuthContext.Provider>);
}
const useAuth = () => {
    const ctx = (0, react_1.useContext)(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
exports.useAuth = useAuth;
//# sourceMappingURL=AuthContext.js.map