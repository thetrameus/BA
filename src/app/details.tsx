import CategoryIcon from "@/features/map/components/CategoryIcon";
import { getProfile } from "@/features/profile/store";
import { insertJobRequest } from "@/features/workers/store";
import {
  AMENITY_LABEL,
  CATEGORY_INFO,
  faNumber,
  type AmenityKey,
  type JobRequestPayload,
} from "@/shared/geo";
import { colors, fonts } from "@/shared/theme";
import { router } from "expo-router";
import {
  ArrowRight,
  Bus,
  Coffee,
  Gift,
  Loader2,
  Minus,
  MoonStar,
  Plus,
  Search,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react-native";
import { useState } from "react";
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
import { flowState } from "./location";
import { mapFlowState } from "./map";

const AMENITIES: { key: AmenityKey; label: string; Icon: any }[] = [
  { key: "breakfast", label: AMENITY_LABEL.breakfast, Icon: Coffee },
  { key: "lunch", label: AMENITY_LABEL.lunch, Icon: UtensilsCrossed },
  { key: "dinner", label: AMENITY_LABEL.dinner, Icon: MoonStar },
  { key: "transport", label: AMENITY_LABEL.transport, Icon: Bus },
  { key: "bonus", label: AMENITY_LABEL.bonus, Icon: Gift },
];

export default function DetailsStep() {
  const insets = useSafeAreaInsets();
  const [description, setDescription] = useState("");
  const [workersNeeded, setWorkersNeeded] = useState(1);
  const [amenities, setAmenities] = useState<string[]>(["lunch"]);
  const [categories, setCategories] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (list: string[], setter: (v: string[]) => void, key: string) =>
    setter(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const handleSubmit = () => {
    if (categories.length === 0) {
      setFormError("حداقل یک دسته‌بندی انتخاب کنید.");
      return;
    }
    setFormError(null);
    setSubmitting(true);

    const loc = flowState.employerLocation;
    if (!loc) {
      setFormError("محل پروژه یافت نشد. لطفاً به مرحله قبل برگردید.");
      setSubmitting(false);
      return;
    }

    const profile = getProfile();

    const payload: JobRequestPayload = {
      phone: profile.phone,
      address: flowState.employerAddress || undefined,
      description: description.trim() || undefined,
      lat: loc.lat,
      lng: loc.lng,
      wageAmount: profile.wageAmount,
      hasInsurance: profile.hasInsurance,
      workersNeeded,
      amenities,
      categories,
    };

    insertJobRequest({
      phone: payload.phone,
      address: payload.address ?? null,
      description: payload.description ?? null,
      lat: payload.lat,
      lng: payload.lng,
      wageAmount: payload.wageAmount,
      hasInsurance: payload.hasInsurance,
      workersNeeded: payload.workersNeeded,
      amenities: payload.amenities,
      categories: payload.categories,
    });

    mapFlowState.center = { lat: loc.lat, lng: loc.lng };
    mapFlowState.address = flowState.employerAddress;
    mapFlowState.allowedCategories = categories;

    setSubmitting(false);
    router.replace("/map");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header — بدون بج مرحله */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} strokeWidth={1.75} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>جزئیات درخواست</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {/* Categories */}
          <View>
            <Text style={styles.label}>
              دسته‌بندی <Text style={styles.hintText}>(چندانتخابی)</Text>
            </Text>
            <View style={styles.catGrid}>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                const active = categories.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggle(categories, setCategories, key)}
                    style={({ pressed }) => [
                      styles.catBtn,
                      active && styles.catBtnActive,
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <CategoryIcon
                      category={key}
                      size={18}
                      color={active ? "#ffffff" : colors.faint}
                    />
                    <Text
                      style={[
                        styles.catBtnText,
                        active && styles.catBtnTextActive,
                      ]}
                    >
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Workers needed */}
          <View>
            <View style={styles.labelRow}>
              <UsersRound size={16} strokeWidth={1.75} color={colors.muted} />
              <Text style={styles.label}>تعداد نیروی موردنیاز</Text>
            </View>
            <View style={styles.counterRow}>
              <Pressable
                onPress={() => setWorkersNeeded((n) => Math.min(n + 1, 50))}
                style={({ pressed }) => [
                  styles.counterBtn,
                  pressed && { opacity: 0.5 },
                ]}
                hitSlop={8}
                accessibilityLabel="افزایش"
              >
                <Plus size={24} strokeWidth={2.25} color={colors.ink} />
              </Pressable>

              <Text style={styles.counterValue}>
                {faNumber(workersNeeded)} نفر
              </Text>

              {workersNeeded > 1 ? (
                <Pressable
                  onPress={() => setWorkersNeeded((n) => Math.max(n - 1, 1))}
                  style={({ pressed }) => [
                    styles.counterBtn,
                    pressed && { opacity: 0.5 },
                  ]}
                  hitSlop={8}
                  accessibilityLabel="کاهش"
                >
                  <Minus size={24} strokeWidth={2.25} color={colors.ink} />
                </Pressable>
              ) : (
                <View style={styles.counterBtn} />
              )}
            </View>
          </View>

          {/* Amenities — یک ردیف، آبی در حالت فعال */}
          <View>
            <Text style={styles.label}>
              امکانات برای نیرو <Text style={styles.hintText}>(اختیاری)</Text>
            </Text>
            <View style={styles.chipsRow}>
              {AMENITIES.map(({ key, label, Icon }) => {
                const active = amenities.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggle(amenities, setAmenities, key)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && { transform: [{ scale: 0.97 }] },
                    ]}
                  >
                    <Icon
                      size={14}
                      strokeWidth={1.75}
                      color={active ? "#ffffff" : colors.faint}
                    />
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View>
            <Text style={styles.label}>
              توضیحات <Text style={styles.hintText}>(اختیاری)</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="مثلاً: پروژه بازسازی واحد مسکونی، ساعت کاری ۸ تا ۱۷"
              placeholderTextColor={colors.faint}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textarea]}
              textAlign="right"
            />
          </View>

          {formError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && { opacity: 0.92 },
            ]}
          >
            {submitting ? (
              <Loader2 size={20} strokeWidth={1.75} color="#fff" />
            ) : (
              <>
                <Text style={styles.submitText}>ثبت درخواست و یافتن نیرو</Text>
                <Search size={20} strokeWidth={1.75} color="#fff" />
              </>
            )}
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

  body: { padding: 16, gap: 20 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 6,
  },
  hintText: { fontSize: 11, fontFamily: fonts.medium, color: colors.faint },

  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    fontFamily: fonts.regular,
  },
  textarea: { height: 96, textAlignVertical: "top" },

  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBtn: {
    flex: 1,
    minWidth: "48%",
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  catBtnText: { fontSize: 13, fontFamily: fonts.bold, color: colors.muted },

  catBtnActive: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  catBtnTextActive: {
    color: "#ffffff",
  },
  counterRow: {
    height: 56, // ← از 48 به 56 (دکمه‌های بزرگ‌تر جا بشن)
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  counterBtn: {
    width: 44, // ← از 36 به 44
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    // ⬇️ بدون backgroundColor
  },
  counterValue: {
    fontSize: 20, // ← از 15 به 20
    fontFamily: fonts.black,
    color: colors.ink,
  },

  // ─── Amenities chips ───
  chipsRow: { flexDirection: "row", gap: 6 },
  chip: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 40,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: "#0ea5e9", // ← آبی آسمانی
    borderColor: "#0ea5e9",
  },
  chipText: { fontSize: 10, fontFamily: fonts.bold, color: colors.muted },
  chipTextActive: { color: "#ffffff" },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  errorText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#b91c1c",
    lineHeight: 18,
  },

  footer: { borderTopWidth: 1, borderTopColor: colors.line, padding: 16 },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: { color: "#fff", fontSize: 14, fontFamily: fonts.black },
});
