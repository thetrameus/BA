import CategoryIcon from "@/features/map/components/CategoryIcon";
import {
  categoryLabel,
  faNumber,
  formatDistance,
  type NearbyWorker,
} from "@/shared/geo";
import { colors, fonts } from "@/shared/theme";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Navigation,
  Phone,
  X,
} from "lucide-react-native";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkerSheet({
  worker,
  onClose,
  onNavigate,
}: {
  worker: NearbyWorker;
  onClose: () => void;
  onNavigate: (w: NearbyWorker) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <Pressable
        onPress={onClose}
        style={styles.closeBtn}
        accessibilityLabel="بستن"
      >
        <X size={20} strokeWidth={1.75} color={colors.muted} />
      </Pressable>

      <View style={styles.head}>
        <View style={styles.avatar}>
          <CategoryIcon
            category={worker.category}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0, paddingLeft: 32 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.name} numberOfLines={1}>
              {worker.name}
            </Text>
            {worker.rating >= 4.4 && (
              <BadgeCheck
                size={18}
                strokeWidth={1.75}
                color={colors.secondary}
                fill={colors.secondarySoft}
              />
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{categoryLabel(worker.category)}</Text>
            <Text style={styles.dot}>·</Text>
            <Text
              style={[
                styles.meta,
                { fontFamily: fonts.bold },
                worker.isOnline
                  ? { color: colors.secondary }
                  : { color: colors.faint },
              ]}
            >
              {worker.isOnline ? "آنلاین" : "آفلاین"}
            </Text>
          </View>
        </View>
      </View>

      {worker.bio ? <Text style={styles.bio}>{worker.bio}</Text> : null}

      <View style={styles.infoRow}>
        <Text style={styles.meta}>
          امتیاز{" "}
          <Text style={{ color: colors.ink, fontFamily: fonts.bold }}>
            {faNumber(worker.rating)}
          </Text>{" "}
          از {faNumber(5)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <BriefcaseBusiness
            size={16}
            strokeWidth={1.75}
            color={colors.muted}
          />
          <Text style={styles.meta}>
            {faNumber(worker.jobsDone)} پروژه انجام‌شده
          </Text>
        </View>
        <Text
          style={[
            styles.meta,
            { fontFamily: fonts.black, color: colors.primary },
          ]}
        >
          {formatDistance(worker.distance)}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => void Linking.openURL(`tel:${worker.phone}`)}
          style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.9 }]}
        >
          <Phone size={20} strokeWidth={1.75} color="#fff" />
          <Text style={styles.callText}>تماس با استادکار</Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigate(worker)}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.9 }]}
        >
          <Navigation size={18} strokeWidth={1.75} color={colors.primary} />
          <Text style={styles.navText}>مسیریابی</Text>
        </Pressable>
      </View>
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
    padding: 20,
    paddingTop: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.soft,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  name: { fontSize: 15, fontFamily: fonts.black, color: colors.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  meta: { fontSize: 11, fontFamily: fonts.regular, color: colors.muted },
  dot: { color: colors.line },

  bio: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 20,
    color: colors.muted,
    fontFamily: fonts.regular,
  },

  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 16,
    rowGap: 8,
    marginTop: 12,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: colors.line,
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
  callText: { color: "#fff", fontSize: 14, fontFamily: fonts.black },
  navBtn: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navText: { fontSize: 13, fontFamily: fonts.black, color: colors.primary },
});
