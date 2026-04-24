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
exports.default = LeaderboardScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const AuthContext_1 = require("../context/AuthContext");
const Avatar_1 = __importDefault(require("../components/Avatar"));
const theme_1 = require("../utils/theme");
const friends_1 = require("../lib/friends");
const RANK_COLOURS = {
    1: '#EF9F27',
    2: '#B4B2A9',
    3: '#C07040',
};
function PodiumIcon({ rank }) {
    const colour = RANK_COLOURS[rank] ?? '#616161';
    if (rank === 1) {
        return (<react_native_1.View style={[podStyles.wrap, { borderColor: colour }]}>
        <react_native_1.Text style={[podStyles.text, { color: colour }]}>★</react_native_1.Text>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={[podStyles.wrap, { borderColor: colour }]}>
      <react_native_1.Text style={[podStyles.text, { color: colour }]}>{rank}</react_native_1.Text>
    </react_native_1.View>);
}
const podStyles = react_native_1.StyleSheet.create({
    wrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 12,
        fontWeight: '800',
    },
});
// Skeleton placeholder row
function SkeletonRow() {
    return (<react_native_1.View style={styles.row}>
      <react_native_1.View style={styles.skeletonRank}/>
      <react_native_1.View style={styles.skeletonAvatar}/>
      <react_native_1.View style={styles.skeletonInfo}>
        <react_native_1.View style={styles.skeletonLine}/>
        <react_native_1.View style={[styles.skeletonLine, { width: '50%' }]}/>
      </react_native_1.View>
    </react_native_1.View>);
}
function LeaderboardRow({ entry, isMe, }) {
    const rank = entry.rank ?? 0;
    const rankColour = RANK_COLOURS[rank] ?? (isMe ? entry.colourHex : '#616161');
    const isTop3 = rank <= 3;
    const winRatePct = Math.round(entry.winRate * 100);
    const hasStreak = entry.currentStreak > 3;
    return (<react_native_1.View style={[
            styles.row,
            isTop3 && styles.rowTop3,
            isMe && { backgroundColor: entry.colourHex + '18', borderColor: entry.colourHex + '44' },
        ]}>
      {isTop3
            ? <PodiumIcon rank={rank}/>
            : (<react_native_1.Text style={[styles.rankNum, { color: rankColour }]}>
            {rank}
          </react_native_1.Text>)}

      <Avatar_1.default avatarId={entry.avatarId} size={44} colourHex={isTop3 ? (RANK_COLOURS[rank] ?? entry.colourHex) : entry.colourHex} showRing/>

      <react_native_1.View style={styles.entryInfo}>
        <react_native_1.View style={styles.nameRow}>
          <react_native_1.Text style={[styles.entryName, { color: isMe ? entry.colourHex : '#ffffff' }]} numberOfLines={1}>
            {entry.username}
            {isMe ? ' (you)' : ''}
          </react_native_1.Text>
          {hasStreak && (<react_native_1.View style={styles.streakBadge}>
              <react_native_1.Text style={styles.streakText}>🔥 {entry.currentStreak}</react_native_1.Text>
            </react_native_1.View>)}
        </react_native_1.View>
        <react_native_1.Text style={styles.entryMeta}>
          {winRatePct}% win rate · {entry.gamesPlayed} games
        </react_native_1.Text>
      </react_native_1.View>

      <react_native_1.View style={styles.winsCol}>
        <react_native_1.Text style={[styles.winsNum, { color: isTop3 ? (RANK_COLOURS[rank] ?? '#ffffff') : '#ffffff' }]}>
          {entry.gamesWon}
        </react_native_1.Text>
        <react_native_1.Text style={styles.winsLabel}>wins</react_native_1.Text>
      </react_native_1.View>
    </react_native_1.View>);
}
function LeaderboardScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { user, profile } = (0, AuthContext_1.useAuth)();
    const [tab, setTab] = (0, react_1.useState)('global');
    const [globalData, setGlobalData] = (0, react_1.useState)([]);
    const [friendsData, setFriendsData] = (0, react_1.useState)([]);
    const [loadingGlobal, setLoadingGlobal] = (0, react_1.useState)(true);
    const [loadingFriends, setLoadingFriends] = (0, react_1.useState)(false);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const loadGlobal = (0, react_1.useCallback)(async () => {
        setLoadingGlobal(true);
        const data = await (0, friends_1.getGlobalLeaderboard)(50);
        setGlobalData(data);
        setLoadingGlobal(false);
    }, []);
    const loadFriends = (0, react_1.useCallback)(async () => {
        if (!user)
            return;
        setLoadingFriends(true);
        const data = await (0, friends_1.getFriendsLeaderboard)(user.id);
        setFriendsData(data);
        setLoadingFriends(false);
    }, [user]);
    (0, react_1.useEffect)(() => { loadGlobal(); }, [loadGlobal]);
    (0, react_1.useEffect)(() => {
        if (tab === 'friends')
            loadFriends();
    }, [tab, loadFriends]);
    async function handleRefresh() {
        setRefreshing(true);
        if (tab === 'global')
            await loadGlobal();
        else
            await loadFriends();
        setRefreshing(false);
    }
    const currentData = tab === 'global' ? globalData : friendsData;
    const isLoading = tab === 'global' ? loadingGlobal : loadingFriends;
    return (<react_native_1.SafeAreaView style={styles.safe}>
      {/* Header */}
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <react_native_1.Text style={styles.backBtnText}>←</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.headerTitle}>Leaderboard</react_native_1.Text>
        <react_native_1.View style={styles.backBtn}/>
      </react_native_1.View>

      {/* Tab pills */}
      <react_native_1.View style={styles.tabs}>
        {['global', 'friends'].map((t) => (<react_native_1.TouchableOpacity key={t} style={[styles.tabPill, tab === t && styles.tabPillActive]} onPress={() => setTab(t)}>
            <react_native_1.Text style={[styles.tabPillText, tab === t && styles.tabPillTextActive]}>
              {t === 'global' ? '🌍 Global' : '👥 Friends'}
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>))}
      </react_native_1.View>

      {isLoading ? (<react_native_1.View style={styles.listContent}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i}/>)}
        </react_native_1.View>) : currentData.length === 0 ? (<react_native_1.View style={styles.emptyState}>
          {tab === 'friends' ? (<>
              <react_native_1.Text style={styles.emptyText}>Add friends to see how you compare!</react_native_1.Text>
              <react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/friends')}>
                <react_native_1.Text style={styles.primaryBtnText}>Go to Friends</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </>) : (<react_native_1.Text style={styles.emptyText}>No data yet — play some games!</react_native_1.Text>)}
        </react_native_1.View>) : (<react_native_1.FlatList data={currentData} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContent} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4caf50"/>} renderItem={({ item }) => (<LeaderboardRow entry={item} isMe={item.id === user?.id}/>)}/>)}
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme_1.THEME.appBackground },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backBtnText: { color: theme_1.THEME.gold, fontSize: 22 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: theme_1.THEME.textPrimary },
    tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
    tabPill: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: theme_1.THEME.cardBackground, borderWidth: 1, borderColor: 'rgba(201,168,76,0.18)', alignItems: 'center' },
    tabPillActive: { backgroundColor: theme_1.THEME.surfaceBackground, borderColor: theme_1.THEME.gold },
    tabPillText: { fontSize: 13, fontWeight: '600', color: theme_1.THEME.textMuted },
    tabPillTextActive: { color: theme_1.THEME.gold },
    listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme_1.THEME.cardBackground, borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
    rowTop3: { borderWidth: 1.5 },
    rankNum: { width: 28, fontSize: 15, fontWeight: '700', textAlign: 'center', color: theme_1.THEME.textMuted },
    entryInfo: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    entryName: { fontSize: 15, fontWeight: '700', flex: 1 },
    entryMeta: { fontSize: 11, color: theme_1.THEME.textMuted },
    streakBadge: { backgroundColor: 'rgba(239,159,39,0.15)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    streakText: { fontSize: 11, color: theme_1.THEME.warning, fontWeight: '700' },
    winsCol: { alignItems: 'center', minWidth: 40 },
    winsNum: { fontSize: 20, fontWeight: '800' },
    winsLabel: { fontSize: 10, color: theme_1.THEME.textMuted, fontWeight: '600' },
    skeletonRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme_1.THEME.surfaceBackground },
    skeletonAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme_1.THEME.surfaceBackground },
    skeletonInfo: { flex: 1, gap: 6 },
    skeletonLine: { height: 12, width: '75%', borderRadius: 6, backgroundColor: theme_1.THEME.surfaceBackground },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
    emptyText: { color: theme_1.THEME.textMuted, fontSize: 15, textAlign: 'center' },
    primaryBtn: { backgroundColor: theme_1.THEME.gold, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
    primaryBtnText: { color: theme_1.THEME.appBackground, fontSize: 15, fontWeight: '800' },
});
//# sourceMappingURL=leaderboard.js.map