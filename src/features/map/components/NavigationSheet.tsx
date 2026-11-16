import {
  categoryLabel,
  faNumber,
  formatDistance,
  type NearbyWorker,
} from "@/shared/geo";
import { colors, fonts } from "@/shared/theme";
import {
  CircleCheckBig,
  CornerUpLeft,
  Loader2,
  Navigation,
  PlayCircle,
  Route,
  TriangleAlert,
  X,
} from "lucide-react-native";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CategoryIcon from "./CategoryIcon";

function formatEta(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `${faNumber(min)} دقیقه`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m
    ? `${faNumber(h)} ساعت و ${faNumber(m)} دقیقه`
    : `${faNumber(h)} ساعت`;
}

export default function NavigationSheet({
  target,
  destinationLabel,
  loading,
  error,
  totalDistance,
  duration,
  remaining,
  nextStep,
  arrived,
  simulating,
  onSimulate,
  onEnd,
}: {
  target: NearbyWorker;
  destinationLabel: string;
  loading: boolean;
  error: string | null;
  totalDistance: number | null;
  duration: number | null;
  remaining: number | null;
  nextStep: string | null;
  arrived: boolean;
  simulating: boolean;
  onSimulate: () => void;
  onEnd: () => void;
}) {
  const insets = useSafeAreaInsets();

  const progress =
    totalDistance && remaining !== null && totalDistance > 0
      ? Math.min(
          100,
          Math.max(0, ((totalDistance - remaining) / totalDistance) * 100),
        )
      : 0;

  if (arrived) {
    return (
      <View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 20 },
          { borderTopColor: "rgba(16,185,129,0.4)" },
        ]}
      >
        <View style={styles.head}>
          <View
            style={[styles.avatar, { backgroundColor: colors.secondarySoft }]}
          >
            <CircleCheckBig
              size={24}
              strokeWidth={1.75}
              color={colors.secondary}
              fill={colors.secondarySoft}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.arrivedTitle}>استادکار به محل شما رسید</Text>
            <Text style={styles.arrivedSub}>
              <Text style={{ fontFamily: fonts.black, color: colors.ink }}>
                {target.name}
              </Text>{" "}
              ({categoryLabel(target.category)}) اکنون در محل پروژه است.
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <Pressable
            onPress={() => void Linking.openURL(`tel:${target.phone}`)}
            style={[styles.callBtn, { backgroundColor: colors.secondary }]}
          >
            <Text style={styles.callText}>تماس با استادکار</Text>
          </Pressable>
          <Pressable onPress={onEnd} style={styles.endBtn}>
            <Text style={styles.endText}>پایان</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.head}>
        <View style={styles.avatar}>
          <CategoryIcon
            category={target.category}
            size={19}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {target.name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {categoryLabel(target.category)} · در حال حرکت به سمت{" "}
            {destinationLabel}
          </Text>
        </View>
        <Pressable
          onPress={onEnd}
          style={styles.closeBtn}
          accessibilityLabel="پایان مسیریابی"
        >
          <X size={20} strokeWidth={1.75} color={colors.muted} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <Loader2 size={16} strokeWidth={2} color={colors.muted} />
          <Text style={styles.loadingText}>در حال محاسبه مسیر…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <TriangleAlert
            size={16}
            strokeWidth={1.75}
            color={colors.statusAmber}
            style={{ marginTop: 2 }}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>باقی‌مانده</Text>
              <Text style={styles.metricValue}>
                {remaining !== null ? formatDistance(remaining) : "—"}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>زمان تقریبی</Text>
              <Text style={styles.metricValue}>
                {duration !== null ? formatEta(duration) : "—"}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>کل مسیر</Text>
              <Text style={styles.metricValue}>
                {totalDistance !== null ? formatDistance(totalDistance) : "—"}
              </Text>
            </View>
          </View>

          {nextStep && (
            <View style={styles.nextStep}>
              <CornerUpLeft
                size={20}
                strokeWidth={1.75}
                color={colors.primary}
              />
              <Text style={styles.nextStepText}>{nextStep}</Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              onPress={onSimulate}
              disabled={simulating}
              style={({ pressed }) => [
                styles.callBtn,
                { opacity: simulating ? 0.6 : pressed ? 0.9 : 1 },
              ]}
            >
              {simulating ? (
                <>
                  <Navigation
                    size={18}
                    strokeWidth={1.75}
                    color="#fff"
                    fill="#ffffff40"
                  />
                  <Text style={styles.callText}>استادکار در حال حرکت…</Text>
                </>
              ) : (
                <>
                  <PlayCircle size={18} strokeWidth={1.75} color="#fff" />
                  <Text style={styles.callText}>شبیه‌سازی حرکت استادکار</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => void Linking.openURL(`tel:${target.phone}`)}
              style={styles.endBtn}
            >
              <Text style={styles.endText}>تماس</Text>
            </Pressable>
          </View>

          <View style={styles.hint}>
            <Route size={12} strokeWidth={1.75} color={colors.faint} />
            <Text style={styles.hintText}>
              در نسخه واقعی، موقعیت استادکار از اپ کارگر به‌صورت زنده ارسال
              می‌شود.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.soft,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: { height: 4, backgroundColor: colors.primary },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  name: { fontSize: 14, fontFamily: fonts.black, color: colors.ink },
  sub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.soft,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  loadingText: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted },

  errorBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    backgroundColor: "rgba(245,158,11,0.05)",
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
    fontFamily: fonts.bold,
    color: colors.amberDark,
  },

  metricsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  metric: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    alignItems: "center",
  },
  metricLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.muted },
  metricValue: {
    fontSize: 14,
    fontFamily: fonts.black,
    color: colors.ink,
    marginTop: 2,
  },

  nextStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.primarySoft,
    marginTop: 12,
  },
  nextStepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: fonts.bold,
    color: colors.primary,
  },

  callBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  callText: { color: "#fff", fontSize: 13, fontFamily: fonts.black },
  endBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  endText: { fontSize: 13, fontFamily: fonts.black, color: colors.primary },

  hint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  hintText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.faint,
    textAlign: "center",
    flexShrink: 1,
  },

  arrivedTitle: { fontSize: 16, fontFamily: fonts.black, color: colors.ink },
  arrivedSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 20,
    color: colors.muted,
    fontFamily: fonts.regular,
  },
});
