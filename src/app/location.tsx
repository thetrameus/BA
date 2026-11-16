import { reverseGeocode } from "@/features/geocode/nominatim";
import PickMap from "@/features/map/components/PickMap";
import { FALLBACK_CENTER, type LatLng } from "@/shared/geo";
import { colors, fonts } from "@/shared/theme";
import { router } from "expo-router";
import {
  ArrowRight,
  ChevronLeft,
  Loader2,
  MapPin,
  RotateCcw,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Hold state across navigation steps using a tiny module-scope store
// (this matches Next.js useState-in-page behavior; swap for global store later)
export const flowState: {
  employerLocation: LatLng | null;
  employerAddress: string;
} = {
  employerLocation: null,
  employerAddress: "",
};

function faCoords(p: LatLng): string {
  return `${Number(p.lat.toFixed(3)).toLocaleString("fa-IR")}، ${Number(p.lng.toFixed(3)).toLocaleString("fa-IR")}`;
}

export default function LocationStep() {
  const insets = useSafeAreaInsets();
  const [loc, setLoc] = useState<LatLng>(
    flowState.employerLocation ?? FALLBACK_CENTER,
  );
  const [address, setAddress] = useState(flowState.employerAddress);
  const [geoLoading, setGeoLoading] = useState(false);
  const [manualEdit, setManualEdit] = useState(false);

  const seqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualRef = useRef(false);

  const fetchAreaAddress = useCallback(async (p: LatLng) => {
    const seq = ++seqRef.current;
    setGeoLoading(true);
    try {
      const text = await reverseGeocode(p.lat, p.lng);
      if (seq !== seqRef.current) return;
      setAddress(text ?? `منطقهٔ انتخاب‌شده روی نقشه (${faCoords(p)})`);
    } finally {
      if (seq === seqRef.current) setGeoLoading(false);
    }
  }, []);

  const handleMapChange = useCallback(
    (p: LatLng) => {
      setLoc(p);
      if (manualRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fetchAreaAddress(p), 700);
    },
    [fetchAreaAddress],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleNext = () => {
    flowState.employerLocation = loc;
    flowState.employerAddress = address.trim();
    router.push("/details");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="بازگشت"
          >
            <ArrowRight size={20} strokeWidth={1.75} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>محل پروژه</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>مرحله ۱ از ۲</Text>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text style={styles.title}>آدرس پروژه کجاست؟</Text>
            <Text style={styles.sub}>
              نقشه را جابه‌جا کنید تا پین دقیقاً روی محل کار قرار بگیرد — آدرس
              منطقه به‌صورت خودکار نوشته می‌شود.
            </Text>
          </View>

          <View style={{ height: 300 }}>
            <PickMap initial={loc} onChange={handleMapChange} />
          </View>

          <View>
            <View style={styles.labelRow}>
              <View style={styles.labelInner}>
                <MapPin size={16} strokeWidth={1.75} color={colors.muted} />
                <Text style={styles.label}>
                  آدرس (از روی نقشه، قابل ویرایش)
                </Text>
              </View>
              {geoLoading && (
                <View style={styles.loadingRow}>
                  <Loader2 size={12} strokeWidth={2} color={colors.faint} />
                  <Text style={styles.loadingText}>در حال یافتن آدرس…</Text>
                </View>
              )}
            </View>

            <TextInput
              value={address}
              onChangeText={(v) => {
                setAddress(v);
                manualRef.current = true;
                setManualEdit(true);
              }}
              placeholder="مثلاً: بلوار وکیل‌آباد، نبش وکیل‌آباد ۱۲"
              placeholderTextColor={colors.faint}
              multiline
              numberOfLines={2}
              style={styles.textarea}
              textAlign="right"
            />

            {manualEdit && (
              <Pressable
                onPress={() => {
                  manualRef.current = false;
                  setManualEdit(false);
                  void fetchAreaAddress(loc);
                }}
                style={styles.resetRow}
              >
                <RotateCcw size={12} strokeWidth={2} color={colors.muted} />
                <Text style={styles.resetText}>بازگشت به آدرس نقشه</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.coords}>
            {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
          </Text>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextBtn,
              pressed && { opacity: 0.92 },
            ]}
          >
            <Text style={styles.nextBtnText}>ثبت آدرس و ادامه</Text>
            <ChevronLeft size={20} strokeWidth={1.75} color="#fff" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.soft,
  },
  headerTitle: { fontSize: 14, fontFamily: fonts.black, color: colors.ink },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  stepBadgeText: { fontSize: 10, fontFamily: fonts.bold, color: colors.muted },

  body: { padding: 16, gap: 16 },
  title: { fontSize: 17, fontFamily: fonts.black, color: colors.ink },
  sub: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 20,
    color: colors.muted,
    fontFamily: fonts.regular,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  labelInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  loadingText: { fontSize: 10, fontFamily: fonts.bold, color: colors.faint },

  textarea: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    fontSize: 13,
    lineHeight: 22,
    color: colors.ink,
    fontFamily: fonts.regular,
  },

  resetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  resetText: { fontSize: 10, fontFamily: fonts.bold, color: colors.muted },

  coords: {
    fontSize: 10,
    color: colors.faint,
    textAlign: "left",
    writingDirection: "ltr",
  },

  footer: { borderTopWidth: 1, borderTopColor: colors.line, padding: 16 },
  nextBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextBtnText: { color: "#fff", fontSize: 14, fontFamily: fonts.black },
});
