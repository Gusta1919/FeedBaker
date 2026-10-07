import * as Haptics from "expo-haptics";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OptionTile } from "@/components/OptionTile";
import { RollerCarousel } from "@/components/RollerCarousel";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";
import { voteOnPoll } from "@/lib/api/polls";
import type { Poll } from "@/lib/types";
import { formatCount, getPercent, timeAgo } from "@/lib/utils";

type PollCardProps = {
  poll: Poll;
  isAuthenticated: boolean;
  onLoginRequest: () => void;
  onVoted?: (optionId: string) => void;
  headerTopInset?: number;
  localVoteOnly?: boolean;
};

function CarouselDot({ active }: { active: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: active ? 18 : 6,
          backgroundColor: active ? Theme.brand : Theme.lineStrong,
        },
      ]}
    />
  );
}

function PageDots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;

  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, i) => (
        <CarouselDot key={i} active={i === active} />
      ))}
      <Text style={styles.dotLabel}>
        {active + 1}/{count}
      </Text>
    </View>
  );
}

export const PollCard = memo(function PollCard({
  poll,
  isAuthenticated,
  onLoginRequest,
  onVoted,
  headerTopInset,
  localVoteOnly = false,
}: PollCardProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topInset = headerTopInset ?? insets.top + 8;

  const [pickedId, setPickedId] = useState<string | null>(poll.userVoteOptionId);
  const [pending, setPending] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const syncVoteRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (syncVoteRef.current) clearTimeout(syncVoteRef.current);
    };
  }, []);

  useEffect(() => {
    setPickedId(poll.userVoteOptionId);
  }, [poll.id, poll.userVoteOptionId]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const option of poll.options) {
      map[option.id] =
        option.voteCount +
        (pickedId === option.id && !poll.userVoteOptionId ? 1 : 0);
    }
    return map;
  }, [pickedId, poll.options, poll.userVoteOptionId]);

  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(counts), 0);
  const hasVoted = Boolean(pickedId);
  const agreement = pickedId ? getPercent(counts[pickedId] ?? 0, totalVotes) : 0;

  const handlePick = useCallback(
    (optionId: string) => {
      if (hasVoted || pending) return;
      if (!isAuthenticated) {
        onLoginRequest();
        return;
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPickedId(optionId);

      if (syncVoteRef.current) clearTimeout(syncVoteRef.current);
      syncVoteRef.current = setTimeout(() => {
        onVoted?.(optionId);
      }, 120);

      if (localVoteOnly) {
        return;
      }

      void (async () => {
        setPending(true);
        const result = await voteOnPoll(poll.id, optionId);
        setPending(false);

        if (!result.ok) {
          if (result.error?.includes("already voted")) {
            return;
          }
          setPickedId(poll.userVoteOptionId);
          Alert.alert("Could not save vote", "Try again in a moment.");
        }
      })();
    },
    [
      hasVoted,
      pending,
      isAuthenticated,
      onLoginRequest,
      localVoteOnly,
      onVoted,
      poll.id,
      poll.userVoteOptionId,
    ],
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${poll.question}\nchoosy://poll/${poll.id}`,
      });
    } catch {
      // user dismissed
    }
  };

  const renderCarouselItem = useCallback(
    (option: Poll["options"][number], optionIndex: number) => {
      const picked = pickedId === option.id;
      return (
        <OptionTile
          option={option}
          index={optionIndex}
          displayCount={counts[option.id] ?? 0}
          totalVotes={totalVotes}
          picked={picked}
          isWinner={
            hasVoted && totalVotes > 0 && (counts[option.id] ?? 0) === maxCount
          }
          revealed={hasVoted}
          locked={hasVoted || pending}
          onPick={() => handlePick(option.id)}
        />
      );
    },
    [counts, handlePick, hasVoted, maxCount, pending, pickedId, totalVotes],
  );

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.inner}>
        <View style={[styles.header, { paddingTop: topInset }]}>
          <Text style={styles.meta}>
            @{poll.creatorUsername} · {timeAgo(poll.createdAt)}
          </Text>
          <Text style={styles.question}>{poll.question}</Text>
        </View>

        <View style={styles.carouselWrap}>
          <View style={styles.carouselBleed}>
            <RollerCarousel
              data={poll.options}
              keyExtractor={(option) => option.id}
              onIndexChange={setPageIndex}
              renderItem={renderCarouselItem}
            />
          </View>

          <PageDots count={poll.options.length} active={pageIndex} />

          {!hasVoted && poll.options.length > 1 ? (
            <Text style={styles.carouselHint}>Swipe either way · Tap photo to vote</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerMain}>
            {hasVoted ? (
              <View style={styles.resultPill}>
                <Text style={styles.resultText} numberOfLines={1}>
                  You&apos;re with{" "}
                  <Text style={styles.resultAccent}>{agreement}%</Text> of voters
                  <Text style={styles.resultMuted}>
                    {" "}
                    · {formatCount(totalVotes)} {totalVotes === 1 ? "vote" : "votes"}
                  </Text>
                </Text>
              </View>
            ) : !isAuthenticated ? (
              <Pressable style={styles.loginBtn} onPress={onLoginRequest}>
                <Text style={styles.loginBtnText}>Log in to vote</Text>
              </Pressable>
            ) : (
              <Text style={styles.tapHint}>Tap photo to vote</Text>
            )}
          </View>

          <Pressable style={styles.iconBtn} onPress={handleShare} hitSlop={8}>
            <Text style={styles.iconBtnLabel}>↗</Text>
          </Pressable>

          {pending ? (
            <View style={styles.pendingDot} />
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  header: {
    paddingBottom: 8,
  },
  meta: {
    color: Theme.textFaint,
    fontSize: 13,
    marginBottom: 6,
    fontFamily: Fonts.medium,
  },
  question: {
    color: Theme.text,
    fontSize: 24,
    fontFamily: Fonts.extrabold,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  carouselWrap: {
    flex: 1,
    minHeight: 0,
    paddingVertical: 4,
    overflow: "visible",
  },
  carouselBleed: {
    flex: 1,
    marginHorizontal: -16,
    overflow: "visible",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotLabel: {
    marginLeft: 4,
    color: Theme.textFaint,
    fontSize: 11,
    fontFamily: Fonts.semibold,
  },
  carouselHint: {
    textAlign: "center",
    color: Theme.textFaint,
    fontSize: 11,
    fontFamily: Fonts.semibold,
    letterSpacing: 0.2,
    marginTop: 6,
  },
  footer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 4,
  },
  footerMain: {
    flex: 1,
    minWidth: 0,
  },
  resultPill: {
    borderWidth: 1,
    borderColor: "rgba(42,42,46,0.9)",
    backgroundColor: Theme.surfaceGlass,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: Theme.radiusBtn,
  },
  resultText: {
    color: Theme.text,
    fontSize: 14,
    fontFamily: Fonts.semibold,
  },
  resultAccent: {
    color: Theme.brand,
    fontFamily: Fonts.extrabold,
  },
  resultMuted: {
    color: Theme.textFaint,
    fontFamily: Fonts.medium,
  },
  tapHint: {
    color: Theme.textFaint,
    fontSize: 11,
    fontFamily: Fonts.bold,
    letterSpacing: 0.4,
  },
  loginBtn: {
    alignSelf: "flex-start",
    backgroundColor: Theme.brand,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Theme.radiusBtn,
  },
  loginBtnText: {
    color: "#fff",
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Theme.radiusBtn,
    borderWidth: 1,
    borderColor: Theme.line,
    backgroundColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnLabel: {
    color: Theme.text,
    fontSize: 18,
    fontWeight: "600",
    marginTop: -2,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.brand,
    opacity: 0.7,
  },
});
