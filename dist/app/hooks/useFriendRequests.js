"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showToast = showToast;
exports.useToastState = useToastState;
exports.useFriendRequests = useFriendRequests;
const react_1 = require("react");
const react_native_1 = require("react-native");
const supabase_1 = require("../lib/supabase");
const listeners = new Set();
function showToast(message) {
    listeners.forEach((l) => l(message));
}
// ── useToast — call in the root layout to render toasts ──────────────────────
function useToastState() {
    const [message, setMessage] = (0, react_1.useState)(null);
    const opacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    (0, react_1.useEffect)(() => {
        const listener = (msg) => {
            setMessage(msg);
            opacity.setValue(0);
            react_native_1.Animated.sequence([
                react_native_1.Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                react_native_1.Animated.delay(2600),
                react_native_1.Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start(() => setMessage(null));
        };
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    }, []);
    return { message, opacity };
}
// ── useFriendRequests — subscribe to incoming friend requests ─────────────────
function useFriendRequests(userId) {
    const [friendRequestCount, setFriendRequestCount] = (0, react_1.useState)(0);
    // Load initial pending count on mount
    (0, react_1.useEffect)(() => {
        if (!userId)
            return;
        supabase_1.supabase
            .from('friendships')
            .select('id', { count: 'exact', head: true })
            .eq('addressee_id', userId)
            .eq('status', 'pending')
            .then(({ count }) => {
            if (count != null)
                setFriendRequestCount(count);
        });
    }, [userId]);
    // Subscribe to new INSERT events on friendships where we are the addressee
    (0, react_1.useEffect)(() => {
        if (!userId)
            return;
        const channel = supabase_1.supabase
            .channel(`friend-requests-${userId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'friendships',
            filter: `addressee_id=eq.${userId}`,
        }, () => {
            showToast('You have a new friend request!');
            setFriendRequestCount((prev) => prev + 1);
        })
            // Also decrement when a pending row is deleted (declined/cancelled) or updated (accepted)
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'friendships',
            filter: `addressee_id=eq.${userId}`,
        }, (payload) => {
            if (payload.new.status === 'accepted') {
                setFriendRequestCount((prev) => Math.max(0, prev - 1));
            }
        })
            .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'friendships',
            filter: `addressee_id=eq.${userId}`,
        }, () => {
            setFriendRequestCount((prev) => Math.max(0, prev - 1));
        })
            .subscribe();
        return () => { supabase_1.supabase.removeChannel(channel); };
    }, [userId]);
    function clearBadge() {
        setFriendRequestCount(0);
    }
    return { friendRequestCount, clearBadge };
}
//# sourceMappingURL=useFriendRequests.js.map