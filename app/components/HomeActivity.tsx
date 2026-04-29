import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import { THEME } from '../utils/theme';
import { SERVER_URL } from '../config';

type HomeActivityProps = {
  userId: string | null
  isGuest: boolean
}

type ActivityItem = {
  playerId: string
  username: string
  avatarId: string
  colourHex: string
  action: 'won' | 'playing' | 'streak'
  detail: string
  timeAgo: string
}

type TopPlayer = {
  id: string
  ranked_wins: number
  profiles: {
    username: string
    avatar_id: string
    colour_hex: string
  } | null
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <View style={{ width: 16, height: 0.5, backgroundColor: THEME.gold }} />
      <Text style={{
        color: THEME.gold,
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        {title}
      </Text>
    </View>
  );
}

export default function HomeActivity({ userId, isGuest }: HomeActivityProps) {
  const router = useRouter();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [friendActivity, setFriendActivity] = useState<ActivityItem[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);

  // ── Online count ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/online-count`);
        const data = await response.json() as { count: number };
        setOnlineCount(data.count);
      } catch {
        setOnlineCount(null);
      }
    };

    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Friends activity ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || isGuest) return;

    const fetchFriendActivity = async () => {
      const { data: friendships } = await supabase
        .from('accepted_friends')
        .select('friend_id')
        .eq('user_id', userId);

      if (!friendships?.length) return;

      const friendIds = friendships.map((f: { friend_id: string }) => f.friend_id);

      const { data: stats } = await supabase
        .from('player_stats')
        .select(`
          id,
          games_won,
          current_streak,
          updated_at,
          profiles(username, avatar_id, colour_hex)
        `)
        .in('id', friendIds)
        .order('updated_at', { ascending: false })
        .limit(3);

      if (!stats) return;

      const activity: ActivityItem[] = stats.map((s: {
        id: string;
        games_won: number;
        current_streak: number;
        updated_at: string;
        profiles: { username: string; avatar_id: string; colour_hex: string } | null;
      }) => {
        const profile = s.profiles;
        const hoursAgo = Math.floor((Date.now() - new Date(s.updated_at).getTime()) / 3600000);
        const timeAgo = hoursAgo < 1 ? 'just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;

        return {
          playerId: s.id,
          username: profile?.username ?? 'Unknown',
          avatarId: profile?.avatar_id ?? 'avatar_01',
          colourHex: profile?.colour_hex ?? '#378ADD',
          action: s.current_streak > 3 ? 'streak' : 'won',
          detail: s.current_streak > 3
            ? `On a ${s.current_streak} game winning streak`
            : `${s.games_won} total wins`,
          timeAgo,
        };
      });

      setFriendActivity(activity);
    };

    fetchFriendActivity();
  }, [userId, isGuest]);

  // ── Leaderboard snapshot ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchLeaderboardSnapshot = async () => {
      const { data } = await supabase
        .from('player_stats')
        .select(`
          id,
          ranked_wins,
          profiles(username, avatar_id, colour_hex)
        `)
        .gt('ranked_wins', 0)
        .order('ranked_wins', { ascending: false })
        .limit(3);

      if (data) setTopPlayers(data as TopPlayer[]);
    };

    fetchLeaderboardSnapshot();
  }, []);

  const medals = ['🥇', '🥈', '🥉'];
  const medalColours = ['#C9A84C', '#B4B2A9', '#C07040'];

  return (
    <View style={{
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingTop: 24,
      gap: 32,
    }}>

      {/* ── Online now ── */}
      <View>
        <SectionHeader title="Online now" />
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 12,
        }}>
          <View style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#5DCAA5',
          }} />
          <Text style={{ color: THEME.textMuted, fontSize: 13 }}>
            {onlineCount !== null
              ? `${onlineCount} player${onlineCount !== 1 ? 's' : ''} online right now`
              : 'Connecting...'}
          </Text>
        </View>
      </View>

      {/* ── Friends activity ── */}
      <View>
        <SectionHeader title="Friends activity" />

        {isGuest ? (
          <TouchableOpacity onPress={() => router.push('/auth')}>
            <Text style={{
              color: THEME.gold,
              fontSize: 12,
              textAlign: 'center',
              paddingVertical: 12,
            }}>
              Sign in to see friend activity
            </Text>
          </TouchableOpacity>
        ) : friendActivity.length === 0 ? (
          <Text style={{
            color: THEME.textMuted,
            fontSize: 12,
            textAlign: 'center',
            paddingVertical: 12,
          }}>
            Add friends to see their activity here
          </Text>
        ) : (
          friendActivity.map((item, i) => (
            <View key={item.playerId} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 10,
              borderBottomWidth: i < friendActivity.length - 1 ? 0.5 : 0,
              borderBottomColor: 'rgba(201,168,76,0.08)',
            }}>
              <Avatar avatarId={item.avatarId} size={36} colourHex={item.colourHex} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: item.colourHex, fontSize: 13, fontWeight: '500' }}>
                  {item.username}
                </Text>
                <Text style={{ color: THEME.textMuted, fontSize: 11 }}>
                  {item.detail}
                </Text>
              </View>
              <Text style={{ color: THEME.textMuted, fontSize: 11 }}>
                {item.timeAgo}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* ── Top ranked ── */}
      <View style={{ paddingBottom: 32 }}>
        <SectionHeader title="Top ranked" />

        {topPlayers.length === 0 ? (
          <Text style={{
            color: THEME.textMuted,
            fontSize: 12,
            textAlign: 'center',
            paddingVertical: 12,
          }}>
            No ranked games played yet — be the first!
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {topPlayers.map((player, i) => (
              <View key={player.id} style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                backgroundColor: i === 0 ? 'rgba(201,168,76,0.06)' : 'transparent',
                borderRadius: 4,
                borderWidth: i === 0 ? 0.5 : 0,
                borderColor: 'rgba(201,168,76,0.15)',
              }}>
                <Text style={{ fontSize: 18, width: 24 }}>{medals[i]}</Text>
                <Avatar
                  avatarId={player.profiles?.avatar_id ?? 'avatar_01'}
                  size={32}
                  colourHex={medalColours[i] ?? THEME.gold}
                />
                <Text style={{
                  flex: 1,
                  color: medalColours[i] ?? THEME.gold,
                  fontSize: 13,
                  fontWeight: i === 0 ? '500' : '400',
                }}>
                  {player.profiles?.username ?? 'Unknown'}
                </Text>
                <Text style={{
                  color: medalColours[i] ?? THEME.gold,
                  fontSize: 13,
                }}>
                  {player.ranked_wins}W
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push('/leaderboard')}
          style={{ alignItems: 'center', paddingTop: 12 }}
        >
          <Text style={{
            color: THEME.gold,
            fontSize: 11,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}>
            View full leaderboard →
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
