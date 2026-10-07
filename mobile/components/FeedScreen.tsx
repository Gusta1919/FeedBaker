import { useRouter } from "expo-router";
import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type ViewToken,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActiveCategoryChip } from "@/components/ActiveCategoryChip";
import { FeedWelcomeSlide } from "@/components/FeedWelcomeSlide";
import { PollCard } from "@/components/PollCard";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";
import { useAuth } from "@/context/AuthContext";
import { useCategory } from "@/context/CategoryContext";
import { getFeed } from "@/lib/api/polls";
import type { Poll } from "@/lib/types";

type FeedPollRow = {
  poll: Poll;
  localVoteOnly: boolean;
};

type FeedItem =
  | { kind: "welcome"; id: "welcome" }
  | {
      kind: "poll";
      id: string;
      poll: Poll;
      pollIndex: number;
      localVoteOnly: boolean;
    };

function stripVoteState(poll: Poll): Poll {
  return {
    ...poll,
    userVoteOptionId: null,
  };
}

function freshPollForLoop(poll: Poll): Poll {
  return stripVoteState({
    ...poll,
    options: poll.options.map((option) => ({ ...option })),
  });
}

type FeedSlideProps = {
  item: FeedItem;
  slideHeight: number;
  isAuthenticated: boolean;
  headerTopInset?: number;
  onLoginRequest: () => void;
  onVoted: (pollIndex: number, optionId: string) => void;
};

const FeedSlide = memo(function FeedSlide({
  item,
  slideHeight,
  isAuthenticated,
  headerTopInset,
  onLoginRequest,
  onVoted,
}: FeedSlideProps) {
  if (item.kind === "welcome") {
    return (
      <View style={{ height: slideHeight }}>
        <FeedWelcomeSlide height={slideHeight} />
      </View>
    );
  }

  return (
    <View style={{ height: slideHeight }}>
      <PollCard
        poll={item.poll}
        localVoteOnly={item.localVoteOnly}
        isAuthenticated={isAuthenticated}
        onLoginRequest={onLoginRequest}
        onVoted={(optionId) => onVoted(item.pollIndex, optionId)}
        headerTopInset={headerTopInset}
      />
    </View>
  );
});

export function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { category, setCategory } = useCategory();
  const [pollRows, setPollRows] = useState<FeedPollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [slideHeight, setSlideHeight] = useState(0);
  const loadingMoreRef = useRef(false);
  const feedItemsLengthRef = useRef(0);
  const loadMoreRef = useRef<() => void>(() => {});

  const loadInitial = useCallback(async (cat: string | null) => {
    try {
      const page = await Promise.race([
        getFeed(cat),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Feed request timed out")), 10000),
        ),
      ]);
      setPollRows(
        page.polls.map((poll) => ({
          poll: stripVoteState(poll),
          localVoteOnly: false,
        })),
      );
      setHasMore(page.hasMore);
    } catch {
      setPollRows([]);
      setHasMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    loadInitial(category).finally(() => setLoading(false));
  }, [category, loadInitial]);

  const feedItems = useMemo<FeedItem[]>(() => {
    const pollItems = pollRows.map((row, index) => ({
      kind: "poll" as const,
      id: `${row.poll.id}-${index}`,
      poll: row.poll,
      pollIndex: index,
      localVoteOnly: row.localVoteOnly,
    }));
    if (category || pollRows.length === 0) return pollItems;
    return [{ kind: "welcome", id: "welcome" }, ...pollItems];
  }, [category, pollRows]);

  useEffect(() => {
    feedItemsLengthRef.current = feedItems.length;
  }, [feedItems.length]);

  const handleVoted = useCallback((pollIndex: number, optionId: string) => {
    startTransition(() => {
      setPollRows((prev) =>
        prev.map((row, index) => {
          if (index !== pollIndex) return row;
          const options = row.poll.options.map((option) => ({
            ...option,
            voteCount: option.id === optionId ? option.voteCount + 1 : option.voteCount,
          }));
          const totalVotes = options.reduce((sum, option) => sum + option.voteCount, 0);
          return {
            ...row,
            poll: {
              ...row.poll,
              userVoteOptionId: optionId,
              options,
              totalVotes,
            },
          };
        }),
      );
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || pollRows.length === 0) return;

    loadingMoreRef.current = true;
    try {
      if (hasMore) {
        const last = pollRows[pollRows.length - 1].poll;
        const page = await getFeed(category, { after: last.createdAt });
        setPollRows((prev) => {
          const seen = new Set(prev.map((row) => row.poll.id));
          const next = page.polls
            .filter((poll) => !seen.has(poll.id))
            .map((poll) => ({ poll: stripVoteState(poll), localVoteOnly: false }));
          return next.length > 0 ? [...prev, ...next] : prev;
        });
        setHasMore(page.hasMore);
        return;
      }

      const page = await getFeed(category);
      if (page.polls.length === 0) return;

      setPollRows((prev) => {
        const seen = new Set(prev.map((row) => row.poll.id));
        const unseen = page.polls
          .filter((poll) => !seen.has(poll.id))
          .map((poll) => ({ poll: stripVoteState(poll), localVoteOnly: false }));
        if (unseen.length > 0) return [...prev, ...unseen];
        return [
          ...prev,
          ...page.polls.map((poll) => ({
            poll: freshPollForLoop(poll),
            localVoteOnly: true,
          })),
        ];
      });
    } finally {
      loadingMoreRef.current = false;
    }
  }, [category, hasMore, pollRows]);

  useEffect(() => {
    loadMoreRef.current = () => {
      void loadMore();
    };
  }, [loadMore]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 80,
  }).current;

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const lastIndex = feedItemsLengthRef.current - 1;
      const nearEnd = viewableItems.some(
        (item) => item.index != null && item.index >= lastIndex - 1,
      );
      if (nearEnd) loadMoreRef.current();
    },
  ).current;

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitial(category);
    setRefreshing(false);
  };

  const pollHeaderInset = category ? 8 : undefined;
  const isAuthenticated = Boolean(user);

  const onLoginRequest = useCallback(() => {
    router.push("/login");
  }, [router]);

  const renderItem = useCallback<ListRenderItem<FeedItem>>(
    ({ item }) => (
      <FeedSlide
        item={item}
        slideHeight={slideHeight}
        isAuthenticated={isAuthenticated}
        headerTopInset={pollHeaderInset}
        onLoginRequest={onLoginRequest}
        onVoted={handleVoted}
      />
    ),
    [handleVoted, isAuthenticated, onLoginRequest, pollHeaderInset, slideHeight],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<FeedItem> | null | undefined, index: number) => ({
      length: slideHeight,
      offset: slideHeight * index,
      index,
    }),
    [slideHeight],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.brand} />
        </View>
      </View>
    );
  }

  if (pollRows.length === 0) {
    return (
      <View style={styles.container}>
        {category ? (
          <View style={[styles.categoryBar, { paddingTop: insets.top + 8 }]}>
            <ActiveCategoryChip
              variant="inline"
              category={category}
              onClear={() => setCategory(null)}
            />
          </View>
        ) : null}
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            {category ? `Nothing in ${category}` : "You're all caught up"}
          </Text>
          <Text style={styles.emptyBody}>
            {category
              ? "Try another category in Explore."
              : "Pull down to refresh."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {category ? (
        <View style={[styles.categoryBar, { paddingTop: insets.top + 8 }]}>
          <ActiveCategoryChip
            variant="inline"
            category={category}
            onClear={() => setCategory(null)}
          />
        </View>
      ) : null}

      <View
        style={styles.feedArea}
        onLayout={(e) => setSlideHeight(e.nativeEvent.layout.height)}
      >
        {slideHeight > 0 && (
          <FlatList
            key={category ?? "all"}
            data={feedItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            pagingEnabled
            bounces
            decelerationRate="fast"
            nestedScrollEnabled={Platform.OS === "android"}
            removeClippedSubviews={false}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews
            onEndReachedThreshold={0.6}
            onEndReached={() => loadMoreRef.current()}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Theme.brand}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  categoryBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
    backgroundColor: Theme.background,
  },
  feedArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    color: Theme.text,
    fontSize: 22,
    fontFamily: Fonts.bold,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: Fonts.medium,
    color: Theme.textMuted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
