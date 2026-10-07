import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";
import { useAuth } from "@/context/AuthContext";
import { getPollsByCreator } from "@/lib/api/polls";
import type { Poll } from "@/lib/types";
import { formatCount, timeAgo } from "@/lib/utils";

export default function MyPollsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setPolls(await getPollsByCreator(user.id));
  }, [user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Theme.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>My polls</Text>
        <Pressable style={styles.createBtn} onPress={() => router.push("/login")}>
          <Text style={styles.createBtnText}>+ New</Text>
        </Pressable>
      </View>

      <FlatList
        data={polls}
        keyExtractor={(item) => item.id}
        contentContainerStyle={polls.length === 0 ? styles.emptyList : styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Theme.brand} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No polls yet. Create poll flow coming soon.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.thumbs}>
              {item.options.slice(0, 3).map((opt) => (
                <Image key={opt.id} source={{ uri: opt.imageUrl }} style={styles.thumb} contentFit="cover" />
              ))}
            </View>
            <Text style={styles.question}>{item.question}</Text>
            <Text style={styles.meta}>
              {formatCount(item.totalVotes)} votes · {timeAgo(item.createdAt)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Theme.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: Fonts.extrabold,
    color: Theme.text,
    fontSize: 32,
    letterSpacing: -0.8,
  },
  createBtn: {
    backgroundColor: Theme.brand,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Theme.radiusBtn,
  },
  createBtnText: {
    fontFamily: Fonts.bold,
    color: "#fff",
  },
  list: { padding: 16, paddingBottom: 32 },
  emptyList: { flexGrow: 1, justifyContent: "center", padding: 24 },
  empty: {
    fontFamily: Fonts.medium,
    color: Theme.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Theme.radiusTile,
    borderWidth: 1,
    borderColor: Theme.line,
    padding: 12,
    marginBottom: 12,
  },
  thumbs: { flexDirection: "row", gap: 6 },
  thumb: { flex: 1, aspectRatio: 1, borderRadius: 8, backgroundColor: Theme.inkSoft },
  question: {
    fontFamily: Fonts.bold,
    color: Theme.text,
    marginTop: 12,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  meta: {
    fontFamily: Fonts.medium,
    color: Theme.textFaint,
    fontSize: 12,
    marginTop: 6,
  },
});
