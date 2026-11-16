import { MAP_STYLE_URL } from "@/shared/config";
import type { LatLng, NearbyWorker } from "@/shared/geo";
import { colors } from "@/shared/theme";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  ViewAnnotation,
  type CameraRef,
  type MapRef,
} from "@maplibre/maplibre-react-native";
import { useEffect, useRef } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import CategoryIcon from "./CategoryIcon";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export type WorkersMapProps = {
  center: LatLng;
  radius: number;
  workers: NearbyWorker[];
  focus: LatLng | null;
  focusTick: number;
  onSelectWorker: (w: NearbyWorker) => void;
  routeCoords?: [number, number][] | null;
  navPosition?: LatLng | null;
  navActive?: boolean;
  fitRouteTick?: number;
  navCategory?: string | null;
};

function circleGeoJSON(center: LatLng, radiusMeters: number) {
  const N = 64;
  const coords: [number, number][] = [];
  const kmPerLat = 111.32;
  const kmPerLng = (40075 * Math.cos((center.lat * Math.PI) / 180)) / 360;
  const rLat = radiusMeters / 1000 / kmPerLat;
  const rLng = radiusMeters / 1000 / kmPerLng;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * 2 * Math.PI;
    coords.push([
      center.lng + rLng * Math.cos(t),
      center.lat + rLat * Math.sin(t),
    ]);
  }
  coords.push(coords[0]);
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coords] },
    properties: {},
  };
}

export default function WorkersMap({
  center,
  radius,
  workers,
  focus,
  focusTick,
  onSelectWorker,
  routeCoords,
  navPosition,
  navActive,
  fitRouteTick,
  navCategory,
}: WorkersMapProps) {
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);

  // Fly to focused worker
  useEffect(() => {
    if (!focus) return;
    cameraRef.current?.flyTo({
      center: [focus.lng, focus.lat],
      zoom: 16,
      duration: 800,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);

  // Auto-fit map to radius (only when not navigating)
  useEffect(() => {
    if (navActive) return;
    const timer = setTimeout(() => {
      try {
        if (!cameraRef.current) return;
        const dLat = radius / 111320;
        const dLng =
          radius /
          (111320 * Math.max(0.01, Math.cos((center.lat * Math.PI) / 180)));
        cameraRef.current.fitBounds(
          [
            center.lng - dLng,
            center.lat - dLat,
            center.lng + dLng,
            center.lat + dLat,
          ],
          {
            padding: {
              top: 160,
              bottom: Math.round(SCREEN_HEIGHT * 0.55),
              left: 40,
              right: 40,
            },
            duration: 500,
          },
        );
      } catch {
        /* ignore */
      }
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, radius, navActive]);

  // Fit route bounds on first load
  useEffect(() => {
    if (!routeCoords || routeCoords.length < 2) return;
    const lngs = routeCoords.map((c) => c[0]);
    const lats = routeCoords.map((c) => c[1]);
    const bounds: [number, number, number, number] = [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats),
    ];
    cameraRef.current?.fitBounds(bounds, {
      padding: { top: 110, bottom: 300, left: 40, right: 40 },
      duration: 700,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitRouteTick]);

  const radiusSource = navActive ? null : circleGeoJSON(center, radius);

  const routeLineFeature =
    routeCoords && routeCoords.length >= 2
      ? {
          type: "Feature" as const,
          geometry: { type: "LineString" as const, coordinates: routeCoords },
          properties: {},
        }
      : null;

  return (
    <Map
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      mapStyle={MAP_STYLE_URL}
      logo={false}
      attribution
      // ⚠️ عمداً onPress حذف شده تا کلیک روی آیکون یا نقشه، موقعیت را عوض نکند
    >
      <Camera
        ref={cameraRef}
        center={[center.lng, center.lat]}
        zoom={12.5}
        minZoom={10}
        maxZoom={19}
      />

      {radiusSource && (
        <GeoJSONSource id="nk-radius" data={radiusSource}>
          <Layer
            type="fill"
            id="nk-radius-fill"
            paint={{ "fill-color": colors.secondary, "fill-opacity": 0.06 }}
          />
          <Layer
            type="line"
            id="nk-radius-stroke"
            paint={{
              "line-color": colors.primary,
              "line-width": 1.5,
              "line-dasharray": [3, 2],
              "line-opacity": 0.7,
            }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </GeoJSONSource>
      )}

      {routeLineFeature && (
        <GeoJSONSource id="nk-route" data={routeLineFeature}>
          <Layer
            type="line"
            id="nk-route-casing"
            paint={{ "line-color": "#ffffff", "line-width": 10 }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
          <Layer
            type="line"
            id="nk-route-line"
            paint={{ "line-color": colors.primary, "line-width": 5 }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </GeoJSONSource>
      )}

      {!navActive && (
        <ViewAnnotation lngLat={[center.lng, center.lat]} anchor="center">
          <View style={styles.userMarker}>
            <View style={styles.userPulse} />
            <View style={styles.userDot} />
          </View>
        </ViewAnnotation>
      )}

      {!navActive &&
        workers.map((w) => (
          <ViewAnnotation key={w.id} lngLat={[w.lng, w.lat]} anchor="center">
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onSelectWorker(w);
              }}
              style={[styles.workerMarker, !w.isOnline && { opacity: 0.7 }]}
            >
              <CategoryIcon
                category={w.category}
                size={17}
                color={w.isOnline ? colors.primary : colors.faint}
              />
            </Pressable>
          </ViewAnnotation>
        ))}

      {navPosition && (
        <ViewAnnotation
          lngLat={[navPosition.lng, navPosition.lat]}
          anchor="center"
        >
          <View style={styles.userMarker}>
            <View style={styles.userPulse} />
            <View style={styles.navPin}>
              {navCategory ? (
                <CategoryIcon
                  category={navCategory}
                  size={16}
                  color={colors.primary}
                />
              ) : (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.statusBlue,
                  }}
                />
              )}
            </View>
          </View>
        </ViewAnnotation>
      )}
    </Map>
  );
}

const styles = StyleSheet.create({
  userMarker: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  userPulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(59,130,246,0.28)",
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.statusBlue,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  workerMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  navPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: colors.statusBlue,
    alignItems: "center",
    justifyContent: "center",
  },
});
