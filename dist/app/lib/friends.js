"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFriendRequest = sendFriendRequest;
exports.acceptFriendRequest = acceptFriendRequest;
exports.removeFriendship = removeFriendship;
exports.getFriends = getFriends;
exports.getGlobalLeaderboard = getGlobalLeaderboard;
exports.getFriendsLeaderboard = getFriendsLeaderboard;
const supabase_1 = require("./supabase");
// Send a friend request by friend code
async function sendFriendRequest(myUserId, friendCode) {
    const { data: targetProfile, error: lookupError } = await supabase_1.supabase
        .from('profiles')
        .select('id, username')
        .eq('friend_code', friendCode.toUpperCase())
        .single();
    if (lookupError || !targetProfile) {
        return { success: false, error: 'Friend code not found' };
    }
    if (targetProfile.id === myUserId) {
        return { success: false, error: 'You cannot add yourself' };
    }
    const { data: existing } = await supabase_1.supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${myUserId},addressee_id.eq.${targetProfile.id}),` +
        `and(requester_id.eq.${targetProfile.id},addressee_id.eq.${myUserId})`)
        .single();
    if (existing) {
        if (existing.status === 'accepted') {
            return { success: false, error: 'Already friends' };
        }
        return { success: false, error: 'Friend request already sent' };
    }
    const { error } = await supabase_1.supabase
        .from('friendships')
        .insert({
        requester_id: myUserId,
        addressee_id: targetProfile.id,
        status: 'pending',
    });
    if (error) {
        return { success: false, error: 'Failed to send request' };
    }
    return { success: true };
}
// Accept a friend request
async function acceptFriendRequest(friendshipId) {
    const { error } = await supabase_1.supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);
    return !error;
}
// Decline or remove a friendship
async function removeFriendship(friendshipId) {
    const { error } = await supabase_1.supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
    return !error;
}
// Get all friends and pending requests for a user
async function getFriends(userId) {
    const { data: friendships } = await supabase_1.supabase
        .from('friendships')
        .select(`
      id,
      status,
      requester_id,
      addressee_id,
      requester:profiles!friendships_requester_id_fkey(id, username, avatar_id, colour_hex, friend_code),
      addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_id, colour_hex, friend_code)
    `)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (!friendships)
        return { friends: [], pendingReceived: [], pendingSent: [] };
    const friends = [];
    const pendingReceived = [];
    const pendingSent = [];
    for (const f of friendships) {
        const isRequester = f.requester_id === userId;
        const otherProfile = (isRequester ? f.addressee : f.requester);
        if (!otherProfile)
            continue;
        const entry = {
            friendshipId: f.id,
            id: otherProfile.id,
            username: otherProfile.username,
            avatarId: otherProfile.avatar_id,
            colourHex: otherProfile.colour_hex,
            friendCode: otherProfile.friend_code,
            status: f.status,
        };
        if (f.status === 'accepted') {
            friends.push(entry);
        }
        else if (f.status === 'pending') {
            if (isRequester) {
                pendingSent.push({ ...entry, status: 'sent' });
            }
            else {
                pendingReceived.push({ ...entry, status: 'pending' });
            }
        }
    }
    return { friends, pendingReceived, pendingSent };
}
// Global leaderboard
async function getGlobalLeaderboard(limit = 50) {
    const { data } = await supabase_1.supabase
        .from('player_stats')
        .select(`
      id,
      games_won,
      games_played,
      win_rate,
      current_streak,
      longest_streak,
      profiles(username, avatar_id, colour_hex)
    `)
        .order('games_won', { ascending: false })
        .limit(limit);
    if (!data)
        return [];
    return data.map((row, index) => ({
        id: row.id,
        username: row.profiles?.username ?? 'Unknown',
        avatarId: row.profiles?.avatar_id ?? 'avatar_01',
        colourHex: row.profiles?.colour_hex ?? '#378ADD',
        gamesWon: row.games_won,
        gamesPlayed: row.games_played,
        winRate: row.win_rate,
        currentStreak: row.current_streak,
        longestStreak: row.longest_streak,
        rank: index + 1,
    }));
}
// Friends leaderboard — includes the current user
async function getFriendsLeaderboard(userId) {
    const { data: friendships } = await supabase_1.supabase
        .from('accepted_friends')
        .select('friend_id')
        .eq('user_id', userId);
    const friendIds = [userId, ...(friendships ?? []).map((f) => f.friend_id)];
    const { data } = await supabase_1.supabase
        .from('player_stats')
        .select(`
      id,
      games_won,
      games_played,
      win_rate,
      current_streak,
      longest_streak,
      profiles(username, avatar_id, colour_hex)
    `)
        .in('id', friendIds)
        .order('games_won', { ascending: false });
    if (!data)
        return [];
    return data.map((row, index) => ({
        id: row.id,
        username: row.profiles?.username ?? 'Unknown',
        avatarId: row.profiles?.avatar_id ?? 'avatar_01',
        colourHex: row.profiles?.colour_hex ?? '#378ADD',
        gamesWon: row.games_won,
        gamesPlayed: row.games_played,
        winRate: row.win_rate,
        currentStreak: row.current_streak,
        longestStreak: row.longest_streak,
        rank: index + 1,
    }));
}
//# sourceMappingURL=friends.js.map