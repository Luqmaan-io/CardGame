"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FriendsScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const AuthContext_1 = require("../context/AuthContext");
const Avatar_1 = __importDefault(require("../components/Avatar"));
const theme_1 = require("../utils/theme");
const friends_1 = require("../lib/friends");
function FriendsScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { profile, user } = (0, AuthContext_1.useAuth)();
    const [tab, setTab] = (0, react_1.useState)('friends');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [friends, setFriends] = (0, react_1.useState)([]);
    const [pendingReceived, setPendingReceived] = (0, react_1.useState)([]);
    const [pendingSent, setPendingSent] = (0, react_1.useState)([]);
    // Add friend state
    const [addCode, setAddCode] = (0, react_1.useState)('');
    const [addStatus, setAddStatus] = (0, react_1.useState)(null);
    const [addLoading, setAddLoading] = (0, react_1.useState)(false);
    // Copy/share state
    const [codeCopied, setCodeCopied] = (0, react_1.useState)(false);
    const loadFriends = (0, react_1.useCallback)(async () => {
        if (!user)
            return;
        setLoading(true);
        const result = await (0, friends_1.getFriends)(user.id);
        setFriends(result.friends);
        setPendingReceived(result.pendingReceived);
        setPendingSent(result.pendingSent);
        setLoading(false);
    }, [user]);
    (0, react_1.useEffect)(() => {
        loadFriends();
    }, [loadFriends]);
    async function handleSendRequest() {
        if (!user || addCode.length !== 8)
            return;
        setAddLoading(true);
        setAddStatus(null);
        const result = await (0, friends_1.sendFriendRequest)(user.id, addCode);
        if (result.success) {
            setAddStatus({ type: 'success', message: 'Request sent!' });
            setAddCode('');
            loadFriends();
        }
        else {
            setAddStatus({ type: 'error', message: result.error ?? 'Failed to send' });
        }
        setAddLoading(false);
    }
    async function handleAccept(friendshipId) {
        await (0, friends_1.acceptFriendRequest)(friendshipId);
        loadFriends();
    }
    async function handleDecline(friendshipId) {
        await (0, friends_1.removeFriendship)(friendshipId);
        loadFriends();
    }
    async function handleRemove(friendshipId) {
        await (0, friends_1.removeFriendship)(friendshipId);
        loadFriends();
    }
    async function handleShare() {
        if (!profile?.friendCode)
            return;
        try {
            await react_native_1.Share.share({
                message: `Add me on Card Game! My friend code is: ${profile.friendCode}`,
            });
        }
        catch { /* ignore */ }
    }
    async function handleCopyCode() {
        if (!profile?.friendCode)
            return;
        try {
            if (react_native_1.Platform.OS === 'web' && navigator.clipboard) {
                await navigator.clipboard.writeText(profile.friendCode);
            }
        }
        catch { /* ignore */ }
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    }
    const requestBadge = pendingReceived.length;
    // ── Guest guard ──────────────────────────────────────────────────────────────
    if (!user || !profile) {
        return (<react_native_1.SafeAreaView style={styles.safe}>
        <react_native_1.View style={styles.header}>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <react_native_1.Text style={styles.backBtnText}>←</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.Text style={styles.headerTitle}>Friends</react_native_1.Text>
          <react_native_1.View style={styles.backBtn}/>
        </react_native_1.View>
        <react_native_1.View style={styles.guestState}>
          <react_native_1.Text style={styles.guestStateText}>Create an account to add friends</react_native_1.Text>
          <react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/auth')}>
            <react_native_1.Text style={styles.primaryBtnText}>Create account</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.SafeAreaView>);
    }
    return (<react_native_1.SafeAreaView style={styles.safe}>
      {/* Header */}
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <react_native_1.Text style={styles.backBtnText}>←</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.headerTitle}>Friends</react_native_1.Text>
        <react_native_1.View style={styles.backBtn}/>
      </react_native_1.View>

      {/* Tab pills */}
      <react_native_1.View style={styles.tabs}>
        {['friends', 'requests', 'find'].map((t) => (<react_native_1.TouchableOpacity key={t} style={[styles.tabPill, tab === t && styles.tabPillActive]} onPress={() => setTab(t)}>
            <react_native_1.Text style={[styles.tabPillText, tab === t && styles.tabPillTextActive]}>
              {t === 'friends' ? 'Friends' : t === 'requests' ? 'Requests' : 'Find'}
            </react_native_1.Text>
            {t === 'requests' && requestBadge > 0 && (<react_native_1.View style={styles.tabBadge}>
                <react_native_1.Text style={styles.tabBadgeText}>{requestBadge > 9 ? '9+' : requestBadge}</react_native_1.Text>
              </react_native_1.View>)}
          </react_native_1.TouchableOpacity>))}
      </react_native_1.View>

      {/* ── Friends tab ── */}
      {tab === 'friends' && (<react_native_1.ScrollView contentContainerStyle={styles.scroll}>
          {/* Add friend input */}
          <react_native_1.View style={styles.addRow}>
            <react_native_1.TextInput style={styles.codeInput} value={addCode} onChangeText={(t) => { setAddCode(t.toUpperCase().slice(0, 8)); setAddStatus(null); }} placeholder="Friend code (8 chars)" placeholderTextColor="#616161" autoCapitalize="characters" maxLength={8} returnKeyType="send" onSubmitEditing={handleSendRequest}/>
            <react_native_1.TouchableOpacity style={[styles.sendBtn, addCode.length !== 8 && styles.sendBtnDisabled]} onPress={handleSendRequest} disabled={addCode.length !== 8 || addLoading}>
              {addLoading
                ? <react_native_1.ActivityIndicator size="small" color="#fff"/>
                : <react_native_1.Text style={styles.sendBtnText}>Add</react_native_1.Text>}
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          {addStatus && (<react_native_1.Text style={[styles.addStatusText, addStatus.type === 'error' && styles.addStatusError]}>
              {addStatus.message}
            </react_native_1.Text>)}

          <react_native_1.Text style={styles.sectionLabel}>
            {friends.length > 0 ? `${friends.length} friend${friends.length !== 1 ? 's' : ''}` : ''}
          </react_native_1.Text>

          {loading
                ? <react_native_1.ActivityIndicator color="#4caf50" style={{ marginTop: 32 }}/>
                : friends.length === 0
                    ? (<react_native_1.View style={styles.emptyState}>
                  <react_native_1.Text style={styles.emptyStateText}>No friends yet</react_native_1.Text>
                  <react_native_1.Text style={styles.emptyStateHint}>Add someone using their friend code above</react_native_1.Text>
                </react_native_1.View>)
                    : friends.map((f) => (<react_native_1.View key={f.friendshipId} style={styles.friendRow}>
                  <Avatar_1.default avatarId={f.avatarId} size={44} colourHex={f.colourHex}/>
                  <react_native_1.View style={styles.friendInfo}>
                    <react_native_1.Text style={[styles.friendName, { color: f.colourHex }]}>{f.username}</react_native_1.Text>
                    <react_native_1.Text style={styles.friendCode}>{f.friendCode}</react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(f.friendshipId)}>
                    <react_native_1.Text style={styles.removeBtnText}>Remove</react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                </react_native_1.View>))}
        </react_native_1.ScrollView>)}

      {/* ── Requests tab ── */}
      {tab === 'requests' && (<react_native_1.ScrollView contentContainerStyle={styles.scroll}>
          <react_native_1.Text style={styles.sectionLabel}>Received</react_native_1.Text>
          {pendingReceived.length === 0
                ? <react_native_1.Text style={styles.emptyInline}>No pending requests</react_native_1.Text>
                : pendingReceived.map((f) => (<react_native_1.View key={f.friendshipId} style={styles.friendRow}>
                <Avatar_1.default avatarId={f.avatarId} size={44} colourHex={f.colourHex}/>
                <react_native_1.View style={styles.friendInfo}>
                  <react_native_1.Text style={[styles.friendName, { color: f.colourHex }]}>{f.username}</react_native_1.Text>
                  <react_native_1.Text style={styles.friendCode}>{f.friendCode}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={styles.requestBtns}>
                  <react_native_1.TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(f.friendshipId)}>
                    <react_native_1.Text style={styles.acceptBtnText}>Accept</react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                  <react_native_1.TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(f.friendshipId)}>
                    <react_native_1.Text style={styles.declineBtnText}>Decline</react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                </react_native_1.View>
              </react_native_1.View>))}

          <react_native_1.Text style={[styles.sectionLabel, { marginTop: 24 }]}>Sent</react_native_1.Text>
          {pendingSent.length === 0
                ? <react_native_1.Text style={styles.emptyInline}>No sent requests</react_native_1.Text>
                : pendingSent.map((f) => (<react_native_1.View key={f.friendshipId} style={styles.friendRow}>
                <Avatar_1.default avatarId={f.avatarId} size={44} colourHex={f.colourHex}/>
                <react_native_1.View style={styles.friendInfo}>
                  <react_native_1.Text style={[styles.friendName, { color: f.colourHex }]}>{f.username}</react_native_1.Text>
                  <react_native_1.Text style={styles.friendCode}>{f.friendCode}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.TouchableOpacity style={styles.removeBtn} onPress={() => handleDecline(f.friendshipId)}>
                  <react_native_1.Text style={styles.removeBtnText}>Cancel</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>))}
        </react_native_1.ScrollView>)}

      {/* ── Find tab ── */}
      {tab === 'find' && (<react_native_1.View style={styles.findContainer}>
          <react_native_1.Text style={styles.findLabel}>Your friend code</react_native_1.Text>
          <react_native_1.Text style={styles.findCode}>{profile.friendCode || '——————'}</react_native_1.Text>
          <react_native_1.Text style={styles.findHint}>Share this code so others can add you</react_native_1.Text>

          <react_native_1.TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <react_native_1.Text style={styles.shareBtnText}>Share my code</react_native_1.Text>
          </react_native_1.TouchableOpacity>

          <react_native_1.TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
            <react_native_1.Text style={styles.copyBtnText}>{codeCopied ? '✓ Copied!' : 'Copy to clipboard'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>)}
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme_1.THEME.appBackground },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backBtnText: { color: theme_1.THEME.gold, fontSize: 22 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: theme_1.THEME.textPrimary },
    tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
    tabPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20, backgroundColor: theme_1.THEME.cardBackground, borderWidth: 1, borderColor: 'rgba(201,168,76,0.18)', gap: 6 },
    tabPillActive: { backgroundColor: theme_1.THEME.surfaceBackground, borderColor: theme_1.THEME.gold },
    tabPillText: { fontSize: 13, fontWeight: '600', color: theme_1.THEME.textMuted },
    tabPillTextActive: { color: theme_1.THEME.gold },
    tabBadge: { backgroundColor: theme_1.THEME.danger, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, minWidth: 16, alignItems: 'center' },
    tabBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    addRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    codeInput: { flex: 1, backgroundColor: theme_1.THEME.cardBackground, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, color: theme_1.THEME.textPrimary, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', letterSpacing: 2, fontWeight: '600' },
    sendBtn: { backgroundColor: theme_1.THEME.gold, borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled: { backgroundColor: theme_1.THEME.cardBackground, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
    sendBtnText: { color: theme_1.THEME.appBackground, fontWeight: '800', fontSize: 14 },
    addStatusText: { fontSize: 13, fontWeight: '600', color: theme_1.THEME.success, marginBottom: 12, paddingHorizontal: 2 },
    addStatusError: { color: theme_1.THEME.danger },
    sectionLabel: { fontSize: 11, fontWeight: '600', color: theme_1.THEME.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
    friendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme_1.THEME.cardBackground, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
    friendInfo: { flex: 1, gap: 2 },
    friendName: { fontSize: 15, fontWeight: '700' },
    friendCode: { fontSize: 11, color: theme_1.THEME.textMuted, letterSpacing: 1.5, fontWeight: '500' },
    removeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
    removeBtnText: { color: theme_1.THEME.textMuted, fontSize: 12, fontWeight: '600' },
    requestBtns: { flexDirection: 'row', gap: 6 },
    acceptBtn: { backgroundColor: theme_1.THEME.gold, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    acceptBtnText: { color: theme_1.THEME.appBackground, fontSize: 12, fontWeight: '800' },
    declineBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
    declineBtnText: { color: theme_1.THEME.textMuted, fontSize: 12, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyStateText: { color: theme_1.THEME.textMuted, fontSize: 16, fontWeight: '600' },
    emptyStateHint: { color: theme_1.THEME.textMuted, fontSize: 13, textAlign: 'center' },
    emptyInline: { color: theme_1.THEME.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
    findContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
    findLabel: { fontSize: 12, fontWeight: '600', color: theme_1.THEME.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
    findCode: { fontSize: 36, fontWeight: '800', color: theme_1.THEME.gold, letterSpacing: 6 },
    findHint: { fontSize: 13, color: theme_1.THEME.textMuted, textAlign: 'center', marginBottom: 8 },
    shareBtn: { backgroundColor: theme_1.THEME.gold, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, width: '100%', alignItems: 'center' },
    shareBtnText: { color: theme_1.THEME.appBackground, fontWeight: '800', fontSize: 15 },
    copyBtn: { borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
    copyBtnText: { color: theme_1.THEME.gold, fontWeight: '600', fontSize: 14 },
    guestState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
    guestStateText: { color: theme_1.THEME.textSecondary, fontSize: 16, textAlign: 'center' },
    primaryBtn: { backgroundColor: theme_1.THEME.gold, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
    primaryBtnText: { color: theme_1.THEME.appBackground, fontSize: 15, fontWeight: '800' },
});
//# sourceMappingURL=friends.js.map