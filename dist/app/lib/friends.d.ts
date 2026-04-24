export type FriendProfile = {
    id: string;
    username: string;
    avatarId: string;
    colourHex: string;
    friendCode: string;
    status: 'pending' | 'accepted' | 'sent';
};
export type LeaderboardEntry = {
    id: string;
    username: string;
    avatarId: string;
    colourHex: string;
    gamesWon: number;
    gamesPlayed: number;
    winRate: number;
    currentStreak: number;
    longestStreak: number;
    rank?: number;
};
export declare function sendFriendRequest(myUserId: string, friendCode: string): Promise<{
    success: boolean;
    error?: string;
}>;
export declare function acceptFriendRequest(friendshipId: string): Promise<boolean>;
export declare function removeFriendship(friendshipId: string): Promise<boolean>;
export declare function getFriends(userId: string): Promise<{
    friends: (FriendProfile & {
        friendshipId: string;
    })[];
    pendingReceived: (FriendProfile & {
        friendshipId: string;
    })[];
    pendingSent: (FriendProfile & {
        friendshipId: string;
    })[];
}>;
export declare function getGlobalLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
export declare function getFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]>;
//# sourceMappingURL=friends.d.ts.map