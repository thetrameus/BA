import {
  checkForUpdate,
  downloadApk,
  installApk,
} from "@/features/updater/service";
import type { UpdateState } from "@/features/updater/types";
import UpdateModal from "@/features/updater/UpdateModal";
import { colors, fonts } from "@/shared/theme";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  ChevronDown,
  Hammer,
  HardHat,
  Paintbrush,
  Plug,
  Search,
  Snowflake,
  Sparkles,
  Trees,
  Wrench,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// دو رنگ اصلی
const ACCENT_BLUE = "#0ea5e9";
const ACCENT_ORANGE = "#f97316";
const CREAM = "#fdf6e3";

const CITIES = [
  "مشهد",
  "تهران",
  "اصفهان",
  "شیراز",
  "تبریز",
  "کرج",
  "اهواز",
  "قم",
  "کرمانشاه",
  "رشت",
];

type Card = { label: string; icon: LucideIcon };

const POPULAR_BANNERS: string[] = [
  "تخفیف ۲۰٪ نظافت منزل",
  "استخدام فوری نیروی ساختمانی",
  "۱۰٪ تخفیف برای سفارش اول",
  "خدمات شبانه‌روزی",
  "بیمه رایگان نیرو",
];

const CATEGORIES: Card[] = [
  { label: "نقاشی", icon: Paintbrush },
  { label: "نجاری", icon: Hammer },
  { label: "تعمیرات", icon: Wrench },
  { label: "کولر و سرمایش", icon: Snowflake },
  { label: "باغبانی", icon: Trees },
  { label: "تأسیسات برق", icon: Plug },
  { label: "ساختمانی", icon: HardHat },
  { label: "نظافتی", icon: Sparkles },
  { label: "سایر خدمات", icon: Wrench },
];

function TwoToneIcon({
  Icon,
  size = 26,
  primary = ACCENT_BLUE,
  secondary = ACCENT_ORANGE,
}: {
  Icon: LucideIcon;
  size?: number;
  primary?: string;
  secondary?: string;
}) {
  return (
    <View style={{ width: size + 2, height: size + 2 }}>
      <View style={{ position: "absolute", left: 2, top: 2 }}>
        <Icon size={size} strokeWidth={1.75} color={secondary} />
      </View>
      <View style={{ position: "absolute", left: 0, top: 0 }}>
        <Icon size={size} strokeWidth={1.75} color={primary} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [city, setCity] = useState("مشهد");
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const [updateState, setUpdateState] = useState<UpdateState>({
    status: "idle",
  });
  const apkUriRef = useRef<string | null>(null);
  const checkedRef = useRef(false);

  const goToFlow = () => {
    router.push("/location");
  };

  const startDownload = async () => {
    if (updateState.status !== "available" && updateState.status !== "error")
      return;
    const manifest =
      updateState.status === "available" ? updateState.manifest : null;
    if (!manifest) return;

    setUpdateState({ status: "downloading", manifest, progress: 0 });
    try {
      const uri = await downloadApk(manifest.apkUrl, (ratio) => {
        setUpdateState({ status: "downloading", manifest, progress: ratio });
      });
      apkUriRef.current = uri;
      setUpdateState({ status: "installing", manifest });
      await installApk(uri);
    } catch (err: any) {
      setUpdateState({
        status: "error",
        message: String(err?.message ?? "دانلود یا نصب ناموفق بود"),
      });
    }
  };

  const retryInstall = async () => {
    if (apkUriRef.current && updateState.status === "installing") {
      try {
        await installApk(apkUriRef.current);
      } catch {
        setUpdateState({
          status: "error",
          message: "باز کردن نصب‌کننده ناموفق بود",
        });
      }
    }
  };

  const closeUpdate = () => {
    setUpdateState({ status: "idle" });
  };

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      setUpdateState({ status: "checking" });
      const manifest = await checkForUpdate();
      if (manifest) {
        setUpdateState({ status: "available", manifest });
      } else {
        setUpdateState({ status: "idle" });
      }
    })();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: brand + city selector */}
        <View style={styles.header}>
          <Text style={styles.brand}>خشت</Text>
          <Pressable
            onPress={() => setCityModalOpen(true)}
            style={({ pressed }) => [
              styles.cityChip,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.cityChipText}>{city}</Text>
            <ChevronDown size={14} strokeWidth={2} color={colors.ink} />
          </Pressable>
        </View>

        {/* Search bar (visual button) */}
        <Pressable
          onPress={goToFlow}
          style={({ pressed }) => [
            styles.searchWrap,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.searchText}>چه خدمتی نیاز دارید؟</Text>
          <Search size={18} strokeWidth={2.25} color={colors.ink} />
        </Pressable>

        {/* Two main entries */}
        <View style={styles.entriesRow}>
          <Pressable
            onPress={goToFlow}
            style={({ pressed }) => [
              styles.entryCard,
              { backgroundColor: ACCENT_BLUE },
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
          >
            <ExpoImage
              source={require("../../assets/images/simple.png")}
              style={styles.entryImage}
              contentFit="contain"
            />
            <View style={styles.entryTextWrap}>
              <Text style={styles.entryTitle}>نیروی ساده</Text>
              <Text style={styles.entrySub}>نظافت، کمک عمومی</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={goToFlow}
            style={({ pressed }) => [
              styles.entryCard,
              { backgroundColor: ACCENT_ORANGE },
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
          >
            <ExpoImage
              source={require("../../assets/images/expert.png")}
              style={styles.entryImage}
              contentFit="contain"
            />
            <View style={styles.entryTextWrap}>
              <Text style={styles.entryTitle}>نیروی متخصص</Text>
              <Text style={styles.entrySub}>ساختمانی، بازسازی</Text>
            </View>
          </Pressable>
        </View>

        {/* Popular services — banner carousel */}
        <Text style={styles.sectionTitle}>خدمات پرکاربرد</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
          style={{ marginBottom: 24 }}
        >
          {POPULAR_BANNERS.map((text, idx) => (
            <Pressable
              key={idx}
              onPress={goToFlow}
              style={({ pressed }) => [
                styles.banner,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.bannerText} numberOfLines={2}>
                {text}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 3x3 categories */}
        <Text style={styles.sectionTitle}>دسته‌بندی‌ها</Text>
        <View style={styles.grid3x3}>
          {CATEGORIES.map((item, idx) => {
            const Icon = item.icon;
            const primary = idx % 2 === 0 ? ACCENT_BLUE : ACCENT_ORANGE;
            const secondary = idx % 2 === 0 ? ACCENT_ORANGE : ACCENT_BLUE;
            return (
              <Pressable
                key={item.label}
                onPress={goToFlow}
                style={({ pressed }) => [
                  styles.card3x3,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <TwoToneIcon
                  Icon={Icon}
                  size={28}
                  primary={primary}
                  secondary={secondary}
                />
                <Text style={styles.cardLabel3} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Skeleton row — placeholder */}
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonIcon} />
            <View style={[styles.skeletonLine, { width: "70%" }]} />
            <View style={[styles.skeletonLine, { width: "45%" }]} />
          </View>
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonIcon} />
            <View style={[styles.skeletonLine, { width: "60%" }]} />
            <View style={[styles.skeletonLine, { width: "40%" }]} />
          </View>
        </View>
      </ScrollView>

      {/* City picker modal */}
      <Modal
        visible={cityModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCityModalOpen(false)}
        >
          <Pressable
            style={styles.cityModal}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.cityModalHeader}>
              <Text style={styles.cityModalTitle}>شهر خود را انتخاب کنید</Text>
              <Pressable
                onPress={() => setCityModalOpen(false)}
                style={styles.cityModalClose}
                hitSlop={8}
              >
                <X size={18} strokeWidth={2} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
            >
              {CITIES.map((c) => {
                const active = city === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => {
                      setCity(c);
                      setCityModalOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.cityItem,
                      active && styles.cityItemActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cityItemText,
                        active && styles.cityItemTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                    {active && <View style={styles.cityActiveDot} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <UpdateModal
        state={updateState}
        onClose={closeUpdate}
        onStartDownload={startDownload}
        onInstall={retryInstall}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingHorizontal: 16 },

  // ─── Header ───
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  brand: {
    fontSize: 26,
    fontFamily: fonts.black,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  cityChipText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },

  // ─── Search bar (darker gray, bold text) ───
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    marginBottom: 20,
  },
  searchText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: "right",
    writingDirection: "rtl",
  },

  // ─── Two main entries ───
  entriesRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  entryCard: {
    flex: 1,
    minHeight: 120,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  entryImage: {
    width: 56,
    height: 56,
  },
  entryTextWrap: {
    flex: 1,
    gap: 2,
  },
  entryTitle: {
    fontSize: 15,
    fontFamily: fonts.black,
    color: "#ffffff",
  },
  entrySub: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: "rgba(255,255,255,0.85)",
  },

  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.black,
    color: colors.ink,
    marginBottom: 10,
  },

  // ─── Banner carousel ───
  banner: {
    width: 210,
    height: 70,
    borderRadius: 14,
    backgroundColor: CREAM,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  bannerText: {
    fontSize: 13,
    fontFamily: fonts.black,
    color: colors.ink,
    lineHeight: 20,
  },

  // ─── 3x3 categories ───
  grid3x3: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  card3x3: {
    width: "31.5%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 6,
  },
  cardLabel3: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: "center",
  },

  // ─── Skeleton ───
  skeletonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  skeletonCard: {
    flex: 1,
    height: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    padding: 12,
    gap: 8,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.soft,
    marginBottom: 4,
  },
  skeletonLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.soft,
  },

  // ─── City picker modal ───
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  cityModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  cityModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cityModalTitle: {
    fontSize: 14,
    fontFamily: fonts.black,
    color: colors.ink,
  },
  cityModalClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.soft,
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  cityItemActive: {
    backgroundColor: colors.primarySoft,
  },
  cityItemText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  cityItemTextActive: {
    color: colors.primary,
  },
  cityActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT_BLUE,
  },
});
