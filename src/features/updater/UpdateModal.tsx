import { colors, fonts } from "@/shared/theme";
import { Download, RefreshCw, X } from "lucide-react-native";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { UpdateState } from "./types";

export default function UpdateModal({
  state,
  onClose,
  onStartDownload,
  onInstall,
}: {
  state: UpdateState;
  onClose: () => void;
  onStartDownload: () => void;
  onInstall: () => void;
}) {
  const visible =
    state.status === "available" ||
    state.status === "downloading" ||
    state.status === "installing" ||
    state.status === "error";

  if (!visible) return null;

  const version =
    state.status === "error" ? null : (state as any).manifest?.version;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>بروزرسانی اپلیکیشن</Text>
            {state.status === "available" && (
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <X size={18} strokeWidth={2} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {version && <Text style={styles.versionText}>نسخه {version}</Text>}

          {/* Body */}
          {state.status === "available" && (
            <>
              <Text style={styles.bodyText}>
                نسخه‌ی جدیدی از «خشت» آماده شده است. برای استفاده از امکانات
                جدید، لطفاً بروزرسانی کنید.
              </Text>
              <Pressable
                onPress={onStartDownload}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Download size={18} strokeWidth={2} color="#fff" />
                <Text style={styles.primaryText}>دانلود و نصب</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.secondaryText}>بعداً</Text>
              </Pressable>
            </>
          )}

          {state.status === "downloading" && (
            <>
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(state.progress * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(state.progress * 100)}٪
                </Text>
              </View>
              <Text style={styles.bodyText}>
                در حال دانلود… لطفاً اپ را نبندید.
              </Text>
            </>
          )}

          {state.status === "installing" && (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.bodyText,
                  { textAlign: "center", marginTop: 12 },
                ]}
              >
                در حال باز کردن نصب‌کننده…{"\n"}اگر پیام «نصب از منابع ناشناس»
                دیدید، اجازه دهید.
              </Text>
              <Pressable
                onPress={onInstall}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <RefreshCw size={16} strokeWidth={2} color={colors.primary} />
                <Text style={styles.secondaryText}>
                  باز کردن دوباره نصب‌کننده
                </Text>
              </Pressable>
            </>
          )}

          {state.status === "error" && (
            <>
              <Text style={[styles.bodyText, { color: "#b91c1c" }]}>
                {state.message}
              </Text>
              <Pressable
                onPress={onStartDownload}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <RefreshCw size={16} strokeWidth={2} color="#fff" />
                <Text style={styles.primaryText}>تلاش دوباره</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.secondaryText}>بستن</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.black,
    color: colors.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.soft,
  },
  versionText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.muted,
    writingDirection: "rtl",
  },
  bodyText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.muted,
    lineHeight: 22,
    textAlign: "right",
    writingDirection: "rtl",
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { fontSize: 14, fontFamily: fonts.black, color: "#fff" },
  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  progressWrap: {
    gap: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.soft,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: "center",
  },
});
