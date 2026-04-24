import { Animated } from 'react-native';
export declare function showToast(message: string): void;
export declare function useToastState(): {
    message: string | null;
    opacity: Animated.Value;
};
export declare function useFriendRequests(userId: string | undefined): {
    friendRequestCount: number;
    clearBadge: () => void;
};
//# sourceMappingURL=useFriendRequests.d.ts.map