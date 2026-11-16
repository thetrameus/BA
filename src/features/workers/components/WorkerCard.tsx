import CategoryIcon from "@/features/map/components/CategoryIcon";
import {
  categoryLabel,
  faNumber,
  formatDistance,
  type NearbyWorker,
} from "@/shared/geo";
import { colors, fonts } from "@/shared/theme";
import { Phone } from "lucide-react-native";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

export default function WorkerCard({
  worker,
  onFocus,
}: {
  worker: NearbyWorker;
  onFocus: () => void;
}) {
  return (
    <Pressable
      onPress={onFocus}
      style={({ pressed }) => [
        styles.card,
        pressed && { borderColor: "rgba(23,43,77,0.3)" },
      ]}
      accessibilityRole="button"
      accessibilityLabel={worker.name}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <CategoryIcon
          category={worker.category}
          size={19}
          color={colors.primary}
        />
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: worker.isOnline
                ? colors.secondary
                : colors.faint,
            },
          ]}
        />
      </View>

      {/* Body */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {worker.name}
          </Text>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>
              {formatDistance(worker.distance)}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{categoryLabel(worker.category)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>
            امتیاز{" "}
            <Text style={{ color: colors.ink, fontFamily: fonts.bold }}>
              {faNumber(worker.rating)}
            </Text>
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{faNumber(worker.jobsDone)} پروژه</Text>
        </View>
      </View>

      {/* Call */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          void Linking.openURL(`tel:${worker.phone}`);
        }}
        style={styles.callBtn}
        accessibilityRole="link"
        accessibilityLabel={`تماس با ${worker.name}`}
      >
        <Phone size={16} strokeWidth={1.75} color={colors.muted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
  },
  statusDot: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { flex: 1, fontSize: 13, fontFamily: fonts.black, color: colors.ink },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  distanceText: {
    fontSize: 10,
    fontFamily: fonts.black,
    color: colors.primary,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  meta: { fontSize: 10, color: colors.muted, fontFamily: fonts.regular },
  dot: { color: colors.line, fontSize: 10 },
  callBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.soft,
    marginTop: 4,
  },
});
