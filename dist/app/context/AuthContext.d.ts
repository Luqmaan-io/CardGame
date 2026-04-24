import { Session, User } from '@supabase/supabase-js';
type Profile = {
    id: string;
    username: string;
    avatarId: string;
    friendCode: string;
    colourHex: string;
    isGuest: boolean;
};
type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isGuest: boolean;
    isLoading: boolean;
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    continueAsGuest: (username: string) => void;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
};
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare const useAuth: () => AuthContextType;
export {};
//# sourceMappingURL=AuthContext.d.ts.map