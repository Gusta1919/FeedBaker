import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";
import { useAuth } from "@/context/AuthContext";
import { getUserStats, getUserVoteInsights } from "@/lib/api/polls";
import type { UserStats, VoteInsights } from "@/lib/types";
import { originalityFromSimilarity } from "@/lib/utils";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function MyStatsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [insights, setInsights] = useState<VoteInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [s, i] = await Promise.all([
      getUserStats(user.id),
      getUserVoteInsights(user.id),
    ]);
    setStats(s);
    setInsights(i);
  }, [user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  if (loading || !stats || !insights) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Theme.brand} />
      </View>
    );
  }

  const originality = originalityFromSimilarity(insights.overallSimilarity);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Theme.brand} />}
    >
      <Text style={styles.title}>My stats</Text>
      <Text style={styles.subtitle}>Your scrolling activity and taste profile</Text>

      <View style={styles.row}>
        <StatCard label="Votes cast" value={String(stats.votesCast)} />
        <StatCard label="Today" value={String(stats.votesToday)} />
      </View>
      <View style={styles.row}>
        <StatCard label="Polls created" value={String(stats.pollsCreated)} />
        <StatCard label="Streak" value={`${stats.currentStreak}d`} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Originality score</Text>
        <Text style={styles.bigScore}>{originality}%</Text>
        <Text style={styles.panelHint}>
          Based on {insights.totalScoredVotes} scored votes in the feed
        </Text>
      </View>

      {insights.categories.length > 0 && (
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>By category</Text>
          {insights.categories.map((row) => (
            <View key={row.category} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{row.category}</Text>
              <Text style={styles.categoryScore}>
                {originalityFromSimilarity(row.similarity)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Theme.background },
  content: { padding: 20, paddingBottom: 40 },
  title: {
    fontFamily: Fonts.extrabold,
    color: Theme.text,
    fontSize: 32,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    color: Theme.textMuted,
    marginTop: 6,
    marginBottom: 20,
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: Theme.radiusTile,
    borderWidth: 1,
    borderColor: Theme.line,
    padding: 16,
  },
  statLabel: {
    fontFamily: Fonts.semibold,
    color: Theme.textFaint,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: Fonts.extrabold,
    color: Theme.text,
    fontSize: 28,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  panel: {
    backgroundColor: Theme.surface,
    borderRadius: Theme.radiusTile,
    borderWidth: 1,
    borderColor: Theme.line,
    padding: 18,
    marginTop: 10,
  },
  panelLabel: {
    fontFamily: Fonts.semibold,
    color: Theme.textFaint,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  bigScore: {
    fontFamily: Fonts.extrabold,
    color: Theme.brand,
    fontSize: 44,
    letterSpacing: -1,
  },
  panelHint: {
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.line,
  },
  categoryName: {
    fontFamily: Fonts.medium,
    color: Theme.text,
  },
  categoryScore: {
    fontFamily: Fonts.bold,
    color: Theme.brand,
  },
});
