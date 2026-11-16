import * as Location from "expo-location";
import { ChevronUp, LocateFixed, SearchX, Users } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CategoryIcon from "@/features/map/components/CategoryIcon";
import NavigationSheet from "@/features/map/components/NavigationSheet";
import WorkersMap from "@/features/map/components/WorkersMap";
import {
  getDirections,
  type DirectionsResponse,
} from "@/features/routing/osrm";
import WorkerCard from "@/features/workers/components/WorkerCard";
import WorkerSheet from "@/features/workers/components/WorkerSheet";
import { nearbyWorkers } from "@/features/workers/store";
import { DEFAULT_RADIUS, RADIUS_OPTIONS } from "@/shared/config";
import {
  CATEGORY_INFO,
  FALLBACK_CENTER,
  faNumber,
  haversineMeters,
  type LatLng,
  type NearbyWorker,
} from "@/shared/geo";
import { colors, fonts } from "@/shared/theme";

// ---------- Shared flow state (set by DetailsStep) ----------
export const mapFlowState: {
  center: LatLng;
  address: string;
  allowedCategories: string[];
} = {
  center: FALLBACK_CENTER,
  address: "",
  allowedCategories: [],
};

const SCREEN_HEIGHT = Dimensions.get("window").height;
const PANEL_COLLAPSED = 100;
const PANEL_EXPANDED = Math.round(SCREEN_HEIGHT * 0.52);

export default function MapScreen() {
  const insets = useSafeAreaInsets();

  // ---------- Search ----------
  const [center, setCenter] = useState<LatLng>(mapFlowState.center);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  // اگر فقط یک دسته مجاز است، همان از اول انتخاب شود
  const [category, setCategory] = useState<string | null>(
    mapFlowState.allowedCategories.length === 1
      ? mapFlowState.allowedCategories[0]
      : null,
  );
  const [workers, setWorkers] = useState<NearbyWorker[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------- UI ----------
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<NearbyWorker | null>(
    null,
  );
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [locating, setLocating] = useState(false);

  // ---------- Navigation ----------
  const [navTarget, setNavTarget] = useState<NearbyWorker | null>(null);
  const [route, setRoute] = useState<DirectionsResponse | null>(null);
  const [navPos, setNavPos] = useState<LatLng | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [arrived, setArrived] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [navError, setNavError] = useState<string | null>(null);
  const [fitRouteTick, setFitRouteTick] = useState(0);
  const [navProgress, setNavProgress] = useState(0);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------- Panel animation ----------
  const panelHeight = useRef(new Animated.Value(PANEL_EXPANDED)).current;
  useEffect(() => {
    Animated.timing(panelHeight, {
      toValue: panelOpen ? PANEL_EXPANDED : PANEL_COLLAPSED,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [panelOpen, panelHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderRelease: (_, g) => {
        if (g.dy > 40) setPanelOpen(false);
        else if (g.dy < -40) setPanelOpen(true);
      },
    }),
  ).current;

  // ---------- Search effect ----------
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const all = nearbyWorkers({
        lat: center.lat,
        lng: center.lng,
        radius,
        category,
        limit: 120,
        onlyOnline: true,
      });
      const results = all.filter(
        (w) =>
          mapFlowState.allowedCategories.length === 0 ||
          mapFlowState.allowedCategories.includes(w.category),
      );
      setWorkers(results);
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [center.lat, center.lng, radius, category]);

  // ---------- Locate me ----------
  const locate = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setSelectedWorker(null);
    } catch {
      /* ignore */
    } finally {
      setLocating(false);
    }
  }, []);

  const focusWorker = (w: NearbyWorker) => {
    setFocus({ lat: w.lat, lng: w.lng });
    setFocusTick((t) => t + 1);
    setSelectedWorker(w);
  };

  // ---------- Navigation ----------
  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setSimulating(false);
  }, []);

  const endNavigation = useCallback(() => {
    stopSimulation();
    setNavTarget(null);
    setRoute(null);
    setNavPos(null);
    setRemaining(null);
    setArrived(false);
    setNavError(null);
    setNavProgress(0);
  }, [stopSimulation]);

  const startNavigation = useCallback(
    async (w: NearbyWorker) => {
      setSelectedWorker(null);
      setPanelOpen(false);
      setNavTarget(w);
      setArrived(false);
      setNavError(null);
      setRoute(null);
      setNavProgress(0);
      setNavLoading(true);

      const origin: LatLng = { lat: w.lat, lng: w.lng };
      const dest: LatLng = center;
      setNavPos(origin);
      setRemaining(Math.round(haversineMeters(origin, dest)));

      try {
        const json = await getDirections(origin, dest);
        setRoute(json);
        setRemaining(json.distance);
        setFitRouteTick((t) => t + 1);
      } catch {
        setNavError("محاسبه مسیر ممکن نشد. اتصال اینترنت را بررسی کنید.");
      } finally {
        setNavLoading(false);
      }
    },
    [center],
  );

  const simulateMovement = useCallback(() => {
    if (!route || !navTarget || simulating) return;
    const coords = route.coords;
    if (coords.length < 2) return;
    stopSimulation();
    setSimulating(true);

    const dest = center;
    let i = 0;
    const stepSize = Math.max(1, Math.floor(coords.length / 60));

    simTimerRef.current = setInterval(() => {
      i += stepSize;
      const done = i >= coords.length - 1;
      const idx = Math.min(i, coords.length - 1);
      const c = coords[idx];
      const p: LatLng = { lat: c[1], lng: c[0] };
      setNavPos(p);
      setNavProgress(idx);
      setRemaining(done ? 0 : Math.round(haversineMeters(p, dest)));
      if (done) {
        setArrived(true);
        stopSimulation();
      }
    }, 180);
  }, [route, navTarget, simulating, stopSimulation, center]);

  useEffect(() => () => stopSimulation(), [stopSimulation]);

  // ---------- Filtered categories chips ----------
  const chipCategories = Object.entries(CATEGORY_INFO).filter(
    ([key]) =>
      mapFlowState.allowedCategories.length === 0 ||
      mapFlowState.allowedCategories.includes(key),
  );

  const navActive = navTarget !== null;

  return (
    <View style={{ flex: 1 }}>
      {/* Map (fill) */}
      <WorkersMap
        center={center}
        radius={radius}
        workers={workers}
        focus={focus}
        focusTick={focusTick}
        onSelectWorker={(w) => {
          if (!navActive) setSelectedWorker(w);
        }}
        routeCoords={
          route && !arrived
            ? route.coords.slice(
                Math.min(navProgress, Math.max(0, route.coords.length - 2)),
              )
            : null
        }
        navPosition={navPos}
        navActive={navActive}
        fitRouteTick={fitRouteTick}
        navCategory={navTarget?.category ?? null}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + 10 }]}>
        <View style={styles.topBarCard}>
          <View style={styles.topText}>
            <Text style={styles.topTitle}>
              {navActive ? "در انتظار نیرو" : "انتخاب نیرو"}
            </Text>
            <Text style={styles.topSub} numberOfLines={1}>
              {navActive
                ? `${navTarget?.name} در راه است`
                : mapFlowState.address || "محل پروژه شما"}
            </Text>
          </View>
          {!navActive && (
            <View style={styles.countChip}>
              <Users size={18} strokeWidth={1.75} color={colors.secondary} />
              <Text style={styles.countText}>
                {loading ? "…" : faNumber(workers.length)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Locate button */}
      {!navActive && (
        <Pressable
          onPress={locate}
          disabled={locating}
          style={[
            styles.locateBtn,
            { bottom: (panelOpen ? PANEL_EXPANDED : PANEL_COLLAPSED) + 12 },
            locating && { opacity: 0.6 },
          ]}
        >
          <LocateFixed size={20} strokeWidth={1.75} color={colors.primary} />
        </Pressable>
      )}

      {/* Draggable bottom panel */}
      {!navActive && !selectedWorker && (
        <Animated.View style={[styles.panel, { height: panelHeight }]}>
          <View {...panResponder.panHandlers}>
            <Pressable
              onPress={() => setPanelOpen((v) => !v)}
              style={styles.panelHandle}
            >
              <View style={styles.handleBar} />
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>
                  {loading
                    ? "در حال جستجو…"
                    : `${faNumber(workers.length)} نیرو در اطراف`}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={styles.panelHint}>
                    {panelOpen ? "بستن" : "نمایش لیست"}
                  </Text>
                  <ChevronUp
                    size={16}
                    strokeWidth={2}
                    color={colors.muted}
                    style={{
                      transform: [{ rotate: panelOpen ? "180deg" : "0deg" }],
                    }}
                  />
                </View>
              </View>
            </Pressable>
          </View>

          {panelOpen && (
            <View
              style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 8,
              }}
            >
              {/* Radius segmented */}
              <View style={styles.segment}>
                {RADIUS_OPTIONS.map((r) => {
                  const active = radius === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRadius(r)}
                      style={[
                        styles.segmentBtn,
                        active && { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          active && { color: "#fff" },
                        ]}
                      >
                        تا {faNumber(r / 1000)} کیلومتر
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Categories — ارتفاع ثابت تا فضای اضافی نگیرد */}
              <View style={{ height: 44 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    gap: 6,
                    paddingVertical: 4,
                    paddingHorizontal: 0,
                  }}
                >
                  {mapFlowState.allowedCategories.length > 1 && (
                    <Pressable
                      onPress={() => setCategory(null)}
                      style={[
                        styles.chip,
                        category === null && {
                          backgroundColor: colors.primarySoft,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          category === null && { color: colors.primary },
                        ]}
                      >
                        همه
                      </Text>
                    </Pressable>
                  )}
                  {chipCategories.map(([key, info]) => {
                    const active = category === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setCategory(active ? null : key)}
                        style={[
                          styles.chip,
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          },
                          active && {
                            backgroundColor: colors.primarySoft,
                            borderColor: colors.primary,
                          },
                        ]}
                      >
                        <CategoryIcon
                          category={key}
                          size={15}
                          color={active ? colors.primary : colors.faint}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            active && { color: colors.primary },
                          ]}
                        >
                          {info.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* List */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  gap: 8,
                  paddingTop: 12,
                  paddingBottom: 8,
                }}
              >
                {loading ? (
                  <View style={styles.searching}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.searchingText}>در حال جستجو…</Text>
                  </View>
                ) : workers.length === 0 ? (
                  <View style={styles.empty}>
                    <SearchX
                      size={26}
                      strokeWidth={1.75}
                      color={colors.faint}
                    />
                    <Text style={styles.emptyTitle}>
                      در این شعاع نیرویی از مشاغل انتخابی نیست
                    </Text>
                    <Text style={styles.emptySub}>شعاع را بیشتر کنید</Text>
                  </View>
                ) : (
                  workers.map((w) => (
                    <WorkerCard
                      key={w.id}
                      worker={w}
                      onFocus={() => focusWorker(w)}
                    />
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}

      {/* Worker sheet */}
      {!navActive && selectedWorker && (
        <WorkerSheet
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onNavigate={startNavigation}
        />
      )}

      {/* Navigation sheet */}
      {navTarget && (
        <NavigationSheet
          target={navTarget}
          destinationLabel={mapFlowState.address || "محل پروژه شما"}
          loading={navLoading}
          error={navError}
          totalDistance={route?.distance ?? null}
          duration={route?.duration ?? null}
          remaining={remaining}
          nextStep={route?.steps?.[0]?.text ?? null}
          arrived={arrived}
          simulating={simulating}
          onSimulate={simulateMovement}
          onEnd={endNavigation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { position: "absolute", left: 12, right: 12, zIndex: 10 },
  topBarCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topText: { flex: 1 },
  topTitle: { fontSize: 13, fontFamily: fonts.black, color: colors.ink },
  topSub: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.muted,
    marginTop: 2,
  },
  countChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.soft,
  },
  countText: { fontSize: 13, fontFamily: fonts.black, color: colors.ink },

  locateBtn: {
    position: "absolute",
    left: 12,
    zIndex: 11,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },

  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    zIndex: 12,
  },
  panelHandle: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
    alignSelf: "center",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  panelTitle: { fontSize: 13, fontFamily: fonts.black, color: colors.ink },
  panelHint: { fontSize: 10, fontFamily: fonts.bold, color: colors.muted },

  segment: {
    flexDirection: "row",
    backgroundColor: colors.soft,
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  segmentBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: { fontSize: 11, fontFamily: fonts.black, color: colors.muted },

  chip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipText: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted },

  // ─── Searching ───
  searching: {
    minHeight: 150,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
  },
  searchingText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.muted,
  },

  // ─── Empty ───
  empty: {
    minHeight: 150,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.muted,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.faint,
  },
});
