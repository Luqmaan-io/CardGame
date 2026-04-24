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
exports.default = ProfileScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const AuthContext_1 = require("../context/AuthContext");
const supabase_1 = require("../lib/supabase");
const Avatar_1 = __importDefault(require("../components/Avatar"));
const AvatarPickerModal_1 = __importDefault(require("../components/AvatarPickerModal"));
const theme_1 = require("../utils/theme");
// ─── Helpers ─────────────────────────────────────────────────────────────────
function getSummaryMessage(stats) {
    const winRatePct = Math.round(stats.win_rate * 100);
    if (stats.current_streak > 3)
        return `🔥 On a ${stats.current_streak} game winning streak`;
    if (winRatePct > 60 && stats.games_played >= 5)
        return `⚡ ${winRatePct}% win rate — dominant`;
    if (stats.games_played === 0)
        return 'Play your first game to build your stats';
    if (stats.games_won === 0)
        return `${stats.games_played} games played — keep going`;
    return `${stats.games_won} wins from ${stats.games_played} games`;
}
function getPlacementColour(placement) {
    if (placement === 1)
        return theme_1.THEME.gold;
    if (placement === 2)
        return '#C0C0C0';
    if (placement === 3)
        return '#CD7F32';
    return theme_1.THEME.textMuted;
}
function StatCard({ label, value, colourHex, isShame = false, }) {
    const isEmpty = value === 0 || value === '—';
    const display = isEmpty ? '—' : value;
    const valueColor = isEmpty
        ? theme_1.THEME.textMuted
        : isShame && !isEmpty
            ? theme_1.THEME.danger
            : colourHex;
    return (<react_native_1.View style={styles.statCard}>
      <react_native_1.Text style={[styles.statValue, { color: valueColor }]}>{display}</react_native_1.Text>
      <react_native_1.Text style={styles.statLabel}>{label}</react_native_1.Text>
    </react_native_1.View>);
}
// ─── Screen ───────────────────────────────────────────────────────────────────
function ProfileScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { profile, isGuest, signOut, updateProfile, user } = (0, AuthContext_1.useAuth)();
    const [stats, setStats] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [editingUsername, setEditingUsername] = (0, react_1.useState)(false);
    const [newUsername, setNewUsername] = (0, react_1.useState)('');
    const [copied, setCopied] = (0, react_1.useState)(false);
    const [pickerVisible, setPickerVisible] = (0, react_1.useState)(false);
    const [showAccountSettings, setShowAccountSettings] = (0, react_1.useState)(false);
    const [showChangeEmail, setShowChangeEmail] = (0, react_1.useState)(false);
    const [showChangePassword, setShowChangePassword] = (0, react_1.useState)(false);
    const [emailInput, setEmailInput] = (0, react_1.useState)('');
    const [passwordInput, setPasswordInput] = (0, react_1.useState)('');
    const [confirmPasswordInput, setConfirmPasswordInput] = (0, react_1.useState)('');
    const [accountMessage, setAccountMessage] = (0, react_1.useState)(null);
    const [nemesisAvatar, setNemesisAvatar] = (0, react_1.useState)(null);
    const [victimAvatar, setVictimAvatar] = (0, react_1.useState)(null);
    // ── Load stats ──────────────────────────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        if (!profile || isGuest) {
            setIsLoading(false);
            return;
        }
        supabase_1.supabase
            .from('player_stats')
            .select('*')
            .eq('id', profile.id)
            .single()
            .then(({ data }) => {
            if (data)
                setStats(data);
            setIsLoading(false);
        });
    }, [profile?.id, isGuest]);
    (0, react_1.useEffect)(() => {
        const id = stats?.nemesis_id;
        if (!id)
            return;
        supabase_1.supabase
            .from('profiles')
            .select('avatar_id, colour_hex')
            .eq('id', id)
            .single()
            .then(({ data }) => {
            if (data)
                setNemesisAvatar({ avatarId: data.avatar_id, colourHex: data.colour_hex });
        });
    }, [stats?.nemesis_id]);
    (0, react_1.useEffect)(() => {
        const id = stats?.victim_id;
        if (!id)
            return;
        supabase_1.supabase
            .from('profiles')
            .select('avatar_id, colour_hex')
            .eq('id', id)
            .single()
            .then(({ data }) => {
            if (data)
                setVictimAvatar({ avatarId: data.avatar_id, colourHex: data.colour_hex });
        });
    }, [stats?.victim_id]);
    // ── Handlers ────────────────────────────────────────────────────────────────
    async function handleCopyFriendCode() {
        if (!profile?.friendCode)
            return;
        try {
            if (react_native_1.Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(profile.friendCode);
            }
        }
        catch (_) { /* clipboard unavailable */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    async function handleSaveUsername() {
        if (!newUsername.trim())
            return;
        try {
            await updateProfile({ username: newUsername.trim() });
            setEditingUsername(false);
        }
        catch { /* ignore */ }
    }
    async function handleAvatarSelect(avatarId) {
        try {
            await updateProfile({ avatarId });
        }
        catch { /* ignore */ }
    }
    async function handleSignOut() {
        await signOut();
        router.replace('/auth');
    }
    async function handleShareProfile() {
        if (!profile || !stats)
            return;
        const winRatePct = Math.round(stats.win_rate * 100);
        const lines = [
            `🃏 ${profile.username} on Powerstack`,
            `📊 ${stats.games_won} wins from ${stats.games_played} games`,
            `🏆 Win rate: ${winRatePct}%`,
            stats.current_streak > 2 ? `🔥 ${stats.current_streak} game winning streak` : '',
            '',
            `Add me: ${profile.friendCode}`,
            `Play at: https://playpowerstack.vercel.app`,
        ].filter((l) => l !== undefined && (l.length > 0 || l === '')).join('\n');
        try {
            await react_native_1.Share.share({ message: lines });
        }
        catch { /* ignore */ }
    }
    async function handleChangeEmail() {
        if (!emailInput.trim())
            return;
        try {
            const { error } = await supabase_1.supabase.auth.updateUser({ email: emailInput.trim() });
            if (error)
                throw error;
            setAccountMessage({ text: 'Check your new email to confirm the change.', isError: false });
            setEmailInput('');
            setShowChangeEmail(false);
        }
        catch (err) {
            setAccountMessage({ text: err.message, isError: true });
        }
        setTimeout(() => setAccountMessage(null), 4000);
    }
    async function handleChangePassword() {
        if (!passwordInput.trim())
            return;
        if (passwordInput !== confirmPasswordInput) {
            setAccountMessage({ text: 'Passwords do not match.', isError: true });
            setTimeout(() => setAccountMessage(null), 3000);
            return;
        }
        try {
            const { error } = await supabase_1.supabase.auth.updateUser({ password: passwordInput });
            if (error)
                throw error;
            setAccountMessage({ text: 'Password updated.', isError: false });
            setPasswordInput('');
            setConfirmPasswordInput('');
            setShowChangePassword(false);
        }
        catch (err) {
            setAccountMessage({ text: err.message, isError: true });
        }
        setTimeout(() => setAccountMessage(null), 4000);
    }
    function handleDeleteAccount() {
        setAccountMessage({
            text: 'To delete your account, contact support at support@playpowerstack.com',
            isError: false,
        });
        setTimeout(() => setAccountMessage(null), 6000);
    }
    // ── Guest view ──────────────────────────────────────────────────────────────
    if (isGuest || !profile) {
        return (<react_native_1.SafeAreaView style={styles.safe}>
        <react_native_1.View style={styles.header}>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <react_native_1.Text style={styles.backBtnText}>← Back</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
        <react_native_1.View style={styles.guestContainer}>
          <react_native_1.View style={{ position: 'relative' }}>
            <Avatar_1.default avatarId={profile?.avatarId ?? 'avatar_01'} size={88} colourHex={profile?.colourHex ?? '#378ADD'}/>
            <react_native_1.View style={styles.lockBadge}>
              <react_native_1.Text style={styles.lockText}>🔒</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
          <react_native_1.Text style={styles.guestUsername}>{profile?.username ?? 'Guest'}</react_native_1.Text>
          <react_native_1.View style={styles.guestCard}>
            <react_native_1.Text style={styles.guestCardTitle}>Playing as guest</react_native_1.Text>
            <react_native_1.Text style={styles.guestCardBody}>
              Create an account to save your stats, track wins, build streaks, and add friends.
            </react_native_1.Text>
            <react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/auth')}>
              <react_native_1.Text style={styles.primaryBtnText}>Create account</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.SafeAreaView>);
    }
    const colourHex = profile.colourHex;
    const winRateDisplay = stats ? `${Math.round(stats.win_rate * 100)}%` : '—';
    const recentResults = stats?.recent_results ?? [];
    if (isLoading) {
        return (<react_native_1.SafeAreaView style={styles.safe}>
        <react_native_1.View style={styles.header}>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <react_native_1.Text style={styles.backBtnText}>← Back</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
        <react_native_1.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <react_native_1.Text style={{ color: theme_1.THEME.textMuted, fontSize: 15 }}>Loading...</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.SafeAreaView>);
    }
    const statRows = [
        [
            { label: 'Games played', value: stats?.games_played ?? 0 },
            { label: 'Games won', value: stats?.games_won ?? 0 },
        ],
        [
            { label: 'Win rate', value: stats ? winRateDisplay : '—' },
            { label: 'Current streak', value: stats?.current_streak ?? 0 },
        ],
        [
            { label: 'Longest streak', value: stats?.longest_streak ?? 0 },
            { label: 'Fastest win', value: stats?.fastest_win_turns != null ? `${stats.fastest_win_turns} turns` : '—' },
        ],
        [
            { label: 'Most cards held', value: stats?.most_cards_held ?? 0 },
            { label: 'Biggest pickup', value: stats?.biggest_pickup ?? 0 },
        ],
        [
            { label: 'Black jacks received', value: stats?.times_picked_up_black_jack ?? 0, isShame: true },
            { label: 'Black jacks countered', value: stats?.times_countered_black_jack ?? 0 },
        ],
        [
            { label: '2s stacked on others', value: stats?.times_stacked_two ?? 0 },
            { label: '2s stacked on you', value: stats?.times_victim_of_two ?? 0, isShame: true },
        ],
        [
            { label: 'Correct on cards', value: stats?.times_correct_on_cards ?? 0 },
            { label: 'False on cards', value: stats?.times_false_on_cards ?? 0, isShame: true },
        ],
        [
            { label: 'Times kicked', value: stats?.times_kicked_timeout ?? 0, isShame: true },
            { label: 'Longest game', value: stats?.longest_game_turns ? `${stats.longest_game_turns} turns` : '—' },
        ],
    ];
    return (<react_native_1.SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <react_native_1.Text style={styles.backBtnText}>← Back</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <react_native_1.ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Section 1: Identity ────────────────────────────────────────────── */}
        <react_native_1.View style={styles.identitySection}>
          {/* Avatar with edit badge */}
          <react_native_1.TouchableOpacity onPress={() => setPickerVisible(true)} style={{ position: 'relative' }}>
            <Avatar_1.default avatarId={profile.avatarId} size={96} colourHex={colourHex}/>
            <react_native_1.View style={[styles.editBadge, { backgroundColor: theme_1.THEME.gold }]}>
              <react_native_1.Text style={styles.editBadgeText}>✎</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.TouchableOpacity>

          {/* Username — inline edit */}
          {editingUsername ? (<react_native_1.View style={styles.usernameEditRow}>
              <react_native_1.TextInput style={styles.usernameInput} value={newUsername} onChangeText={setNewUsername} autoFocus maxLength={20} returnKeyType="done" onSubmitEditing={handleSaveUsername}/>
              <react_native_1.TouchableOpacity onPress={handleSaveUsername} style={styles.saveBtn}>
                <react_native_1.Text style={styles.saveBtnText}>Save</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity onPress={() => setEditingUsername(false)} style={styles.cancelBtn}>
                <react_native_1.Text style={styles.cancelBtnText}>Cancel</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>) : (<react_native_1.TouchableOpacity onPress={() => { setNewUsername(profile.username); setEditingUsername(true); }} style={{ alignItems: 'center', gap: 2 }}>
              <react_native_1.Text style={styles.username}>{profile.username}</react_native_1.Text>
              <react_native_1.Text style={{ color: theme_1.THEME.textMuted, fontSize: 12 }}>tap to edit</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}

          {/* Friend code */}
          {profile.friendCode ? (<react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <react_native_1.Text style={{ color: theme_1.THEME.textSecondary, fontSize: 13 }}>
                Code: {profile.friendCode}
              </react_native_1.Text>
              <react_native_1.TouchableOpacity onPress={handleCopyFriendCode}>
                <react_native_1.Text style={{ color: theme_1.THEME.gold, fontSize: 12, fontWeight: '600' }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>) : null}
        </react_native_1.View>

        {/* ── Section 2: Summary banner ──────────────────────────────────────── */}
        {stats && (<react_native_1.View style={styles.summaryBanner}>
            <react_native_1.Text style={styles.summaryText}>{getSummaryMessage(stats)}</react_native_1.Text>
          </react_native_1.View>)}
        {!stats && (<react_native_1.View style={styles.summaryBanner}>
            <react_native_1.Text style={styles.summaryText}>No stats yet — play your first game!</react_native_1.Text>
          </react_native_1.View>)}

        {/* ── Section 3: Stats grid ──────────────────────────────────────────── */}
        <react_native_1.Text style={styles.sectionTitle}>Stats</react_native_1.Text>
        <react_native_1.View style={styles.statsGrid}>
          {statRows.map((row, rowIdx) => (<react_native_1.View key={rowIdx} style={styles.statsRow}>
              {row.map((stat) => (<StatCard key={stat.label} label={stat.label} value={stat.value} colourHex={colourHex} isShame={stat.isShame}/>))}
            </react_native_1.View>))}
        </react_native_1.View>

        {/* ── Section 4: Recent form ─────────────────────────────────────────── */}
        <react_native_1.Text style={styles.sectionTitle}>Recent form</react_native_1.Text>
        <react_native_1.View style={styles.recentFormRow}>
          {recentResults.length === 0 ? (<react_native_1.Text style={{ color: theme_1.THEME.textMuted, fontSize: 12 }}>No games yet</react_native_1.Text>) : (recentResults.map((placement, i) => (<react_native_1.View key={i} style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: getPlacementColour(placement),
            }}/>)))}
        </react_native_1.View>

        {/* ── Rivals ────────────────────────────────────────────────────────── */}
        <react_native_1.Text style={styles.sectionTitle}>Rivals</react_native_1.Text>
        <react_native_1.View style={styles.rivalsSection}>
          {stats?.nemesis_username ? (<react_native_1.View style={styles.rivalCard}>
              <Avatar_1.default avatarId={nemesisAvatar?.avatarId ?? stats.nemesis_avatar_id ?? 'avatar_01'} size={40} colourHex={nemesisAvatar?.colourHex ?? '#ef5350'}/>
              <react_native_1.View style={styles.rivalInfo}>
                <react_native_1.Text style={styles.rivalRole}>Your nemesis</react_native_1.Text>
                <react_native_1.Text style={[styles.rivalName, { color: '#ef5350' }]}>{stats.nemesis_username}</react_native_1.Text>
                <react_native_1.Text style={styles.rivalCount}>Beat you {stats.nemesis_loss_count}x</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>) : (<react_native_1.View style={styles.rivalCardEmpty}>
              <react_native_1.Text style={styles.rivalEmptyText}>No nemesis yet...</react_native_1.Text>
            </react_native_1.View>)}

          {stats?.victim_username ? (<react_native_1.View style={[styles.rivalCard, styles.rivalCardGreen]}>
              <Avatar_1.default avatarId={victimAvatar?.avatarId ?? stats.victim_avatar_id ?? 'avatar_01'} size={40} colourHex={victimAvatar?.colourHex ?? '#4caf50'}/>
              <react_native_1.View style={styles.rivalInfo}>
                <react_native_1.Text style={[styles.rivalRole, { color: theme_1.THEME.success }]}>Your victim</react_native_1.Text>
                <react_native_1.Text style={[styles.rivalName, { color: '#4caf50' }]}>{stats.victim_username}</react_native_1.Text>
                <react_native_1.Text style={styles.rivalCount}>You've beaten them {stats.victim_win_count}x</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>) : (<react_native_1.View style={[styles.rivalCardEmpty, styles.rivalCardEmptyGreen]}>
              <react_native_1.Text style={[styles.rivalEmptyText, { fontStyle: 'italic' }]}>No victim yet...</react_native_1.Text>
            </react_native_1.View>)}
        </react_native_1.View>

        {/* ── Section 5: Account settings ───────────────────────────────────── */}
        <react_native_1.TouchableOpacity onPress={() => setShowAccountSettings(!showAccountSettings)} style={styles.accountSettingsToggle}>
          <react_native_1.Text style={{ color: theme_1.THEME.textPrimary, fontSize: 15 }}>Account settings</react_native_1.Text>
          <react_native_1.Text style={{ color: theme_1.THEME.textMuted, fontSize: 13 }}>{showAccountSettings ? '▲' : '▼'}</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {showAccountSettings && (<react_native_1.View style={styles.accountSettingsContent}>
            {accountMessage && (<react_native_1.View style={[styles.accountMsg, accountMessage.isError && styles.accountMsgError]}>
                <react_native_1.Text style={{ color: accountMessage.isError ? theme_1.THEME.danger : theme_1.THEME.success, fontSize: 13 }}>
                  {accountMessage.text}
                </react_native_1.Text>
              </react_native_1.View>)}

            {/* Change email */}
            {!showChangeEmail ? (<react_native_1.TouchableOpacity onPress={() => { setShowChangeEmail(true); setShowChangePassword(false); }}>
                <react_native_1.Text style={styles.accountSettingsItem}>Change email</react_native_1.Text>
              </react_native_1.TouchableOpacity>) : (<react_native_1.View style={styles.accountInputGroup}>
                <react_native_1.TextInput style={styles.accountInput} value={emailInput} onChangeText={setEmailInput} placeholder="New email address" placeholderTextColor={theme_1.THEME.textMuted} autoCapitalize="none" keyboardType="email-address" autoFocus/>
                <react_native_1.View style={{ flexDirection: 'row', gap: 8 }}>
                  <react_native_1.TouchableOpacity onPress={handleChangeEmail} style={styles.accountActionBtn}>
                    <react_native_1.Text style={styles.accountActionBtnText}>Update</react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                  <react_native_1.TouchableOpacity onPress={() => setShowChangeEmail(false)} style={styles.accountCancelBtn}>
                    <react_native_1.Text style={styles.accountCancelBtnText}>Cancel</react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                </react_native_1.View>
              </react_native_1.View>)}

            {/* Change password */}
            {!showChangePassword ? (<react_native_1.TouchableOpacity onPress={() => { setShowChangePassword(true); setShowChangeEmail(false); }}>
                <react_native_1.Text style={styles.accountSettingsItem}>Change password</react_native_1.Text>
              </react_native_1.TouchableOpacity>) : (<react_native_1.View style={styles.accountInputGroup}>
                <react_native_1.TextInput style={styles.accountInput} value={passwordInput} onChangeText={setPasswordInput} placeholder="New password" placeholderTextColor={theme_1.THEME.textMuted} secureTextEntry autoFocus/>
                <react_native_1.TextInput style={styles.accountInput} value={confirmPasswordInput} onChangeText={setConfirmPasswordInput} placeholder="Confirm new password" placeholderTextColor={theme_1.THEME.textMuted} secureTextEntry/>
                <react_native_1.View style={{ flexDirection: 'row', gap: 8 }}>
                  <react_native_1.TouchableOpacity onPress={handleChangePassword} style={styles.accountActionBtn}>
                    <react_native_1.Text style={styles.accountActionBtnText}>Update</react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                  <react_native_1.TouchableOpacity onPress={() => setShowChangePassword(false)} style={styles.accountCancelBtn}>
                    <react_native_1.Text style={styles.accountCancelBtnText}>Cancel</react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                </react_native_1.View>
              </react_native_1.View>)}

            {/* Delete account */}
            <react_native_1.TouchableOpacity onPress={handleDeleteAccount}>
              <react_native_1.Text style={[styles.accountSettingsItem, { color: theme_1.THEME.danger }]}>Delete account</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>)}

        {/* ── Section 6: Share profile ───────────────────────────────────────── */}
        <react_native_1.TouchableOpacity style={styles.shareBtn} onPress={handleShareProfile}>
          <react_native_1.Text style={styles.shareBtnText}>Share my stats</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {/* ── Section 7: Sign out ────────────────────────────────────────────── */}
        <react_native_1.TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <react_native_1.Text style={styles.signOutBtnText}>Sign out</react_native_1.Text>
        </react_native_1.TouchableOpacity>

      </react_native_1.ScrollView>

      <AvatarPickerModal_1.default visible={pickerVisible} currentAvatarId={profile.avatarId} colourHex={colourHex} onSelect={handleAvatarSelect} onClose={() => setPickerVisible(false)}/>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme_1.THEME.appBackground },
    // ── Header ───────────────────────────────────────────────────────────────
    header: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 },
    backBtn: { padding: 12 },
    backBtnText: { color: theme_1.THEME.gold, fontSize: 15 },
    scroll: { paddingHorizontal: 20, paddingBottom: 56 },
    // ── Identity ─────────────────────────────────────────────────────────────
    identitySection: { alignItems: 'center', gap: 12, paddingVertical: 20 },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme_1.THEME.appBackground,
    },
    editBadgeText: { color: theme_1.THEME.appBackground, fontSize: 12, fontWeight: '700' },
    username: { fontSize: 22, fontWeight: '700', color: theme_1.THEME.textPrimary },
    usernameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    usernameInput: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 18,
        color: theme_1.THEME.textPrimary,
        borderBottomWidth: 1,
        borderBottomColor: theme_1.THEME.gold,
        minWidth: 140,
    },
    saveBtn: { backgroundColor: theme_1.THEME.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    saveBtnText: { color: theme_1.THEME.appBackground, fontWeight: '700', fontSize: 14 },
    cancelBtn: { paddingHorizontal: 8, paddingVertical: 8 },
    cancelBtnText: { color: theme_1.THEME.textMuted, fontSize: 14 },
    // ── Summary banner ────────────────────────────────────────────────────────
    summaryBanner: {
        backgroundColor: 'rgba(201,168,76,0.1)',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: theme_1.THEME.gold,
        padding: 12,
        marginBottom: 24,
        alignItems: 'center',
    },
    summaryText: { color: theme_1.THEME.gold, fontSize: 14, textAlign: 'center', fontWeight: '500' },
    // ── Section titles ────────────────────────────────────────────────────────
    sectionTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: theme_1.THEME.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 4,
    },
    // ── Stats grid ────────────────────────────────────────────────────────────
    statsGrid: { gap: 10, marginBottom: 28 },
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
        flex: 1,
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 12,
        padding: 14,
        borderWidth: 0.5,
        borderColor: 'rgba(201,168,76,0.15)',
        minHeight: 72,
        justifyContent: 'space-between',
    },
    statValue: { fontSize: 24, fontWeight: '500' },
    statLabel: { fontSize: 11, color: theme_1.THEME.textMuted, marginTop: 4 },
    // ── Recent form ───────────────────────────────────────────────────────────
    recentFormRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 28,
    },
    // ── Rivals ────────────────────────────────────────────────────────────────
    rivalsSection: { gap: 10, marginBottom: 28 },
    rivalCard: {
        backgroundColor: 'rgba(226,75,74,0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(226,75,74,0.25)',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    rivalCardGreen: { backgroundColor: 'rgba(93,202,165,0.08)', borderColor: 'rgba(93,202,165,0.25)' },
    rivalCardEmpty: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.15)',
        padding: 16,
        alignItems: 'center',
    },
    rivalCardEmptyGreen: { borderColor: 'rgba(93,202,165,0.15)' },
    rivalInfo: { gap: 2, flex: 1 },
    rivalRole: { fontSize: 11, fontWeight: '600', color: theme_1.THEME.danger, textTransform: 'uppercase', letterSpacing: 1 },
    rivalName: { fontSize: 18, fontWeight: '700' },
    rivalCount: { fontSize: 12, color: theme_1.THEME.textMuted },
    rivalEmptyText: { color: theme_1.THEME.textMuted, fontSize: 14 },
    // ── Account settings ──────────────────────────────────────────────────────
    accountSettingsToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(201,168,76,0.15)',
        marginBottom: 0,
    },
    accountSettingsContent: {
        gap: 12,
        paddingBottom: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(201,168,76,0.15)',
        marginBottom: 16,
    },
    accountSettingsItem: { color: theme_1.THEME.textSecondary, fontSize: 14, paddingVertical: 4 },
    accountInputGroup: { gap: 8 },
    accountInput: {
        backgroundColor: theme_1.THEME.surfaceBackground,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: theme_1.THEME.textPrimary,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.2)',
    },
    accountActionBtn: {
        backgroundColor: theme_1.THEME.gold,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    accountActionBtnText: { color: theme_1.THEME.appBackground, fontWeight: '700', fontSize: 13 },
    accountCancelBtn: { paddingHorizontal: 8, paddingVertical: 8 },
    accountCancelBtnText: { color: theme_1.THEME.textMuted, fontSize: 13 },
    accountMsg: {
        backgroundColor: 'rgba(93,202,165,0.1)',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(93,202,165,0.25)',
    },
    accountMsgError: {
        backgroundColor: 'rgba(226,75,74,0.1)',
        borderColor: 'rgba(226,75,74,0.25)',
    },
    // ── Share profile ─────────────────────────────────────────────────────────
    shareBtn: {
        margin: 0,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme_1.THEME.gold,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    shareBtnText: { color: theme_1.THEME.gold, fontSize: 15, fontWeight: '600' },
    // ── Sign out ──────────────────────────────────────────────────────────────
    signOutBtn: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(226,75,74,0.3)',
        marginBottom: 8,
    },
    signOutBtnText: { color: theme_1.THEME.danger, fontSize: 15, fontWeight: '600' },
    // ── Guest view ────────────────────────────────────────────────────────────
    guestContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, gap: 16 },
    lockBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 12,
        padding: 2,
        borderWidth: 2,
        borderColor: theme_1.THEME.appBackground,
    },
    lockText: { fontSize: 14 },
    guestUsername: { fontSize: 22, fontWeight: '700', color: theme_1.THEME.textPrimary },
    guestCard: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.3)',
        padding: 24,
        gap: 12,
        width: '100%',
        marginTop: 16,
    },
    guestCardTitle: { fontSize: 18, fontWeight: '700', color: theme_1.THEME.textPrimary },
    guestCardBody: { fontSize: 14, color: theme_1.THEME.textSecondary, lineHeight: 20 },
    primaryBtn: { backgroundColor: theme_1.THEME.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    primaryBtnText: { color: theme_1.THEME.appBackground, fontSize: 15, fontWeight: '700' },
});
//# sourceMappingURL=profile.js.map