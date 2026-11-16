// src/features/map/components/PickMap.tsx
import { MAP_STYLE_URL } from "@/shared/config";
import type { LatLng } from "@/shared/geo";
import { colors } from "@/shared/theme";
import {
  Camera,
  Map,
  type CameraRef,
  type MapRef,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { LocateFixed, MapPin } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
} from "react-native";

export default function PickMap({
  initial,
  onChange,
}: {
  initial: LatLng;
  onChange: (p: LatLng) => void;
}) {
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [locating, setLocating] = useState(false);
  const emittingRef = useRef(false);

  // Emit initial center once after mount
  useEffect(() => {
    const t = setTimeout(() => {
      onChangeRef.current(initial);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegionDidChange = async (_event: NativeSyntheticEvent<any>) => {
    if (emittingRef.current) return;
    emittingRef.current = true;
    try {
      const center = await mapRef.current?.getCenter();
      if (
        center &&
        Array.isArray(center) &&
        center.length === 2 &&
        Number.isFinite(center[0]) &&
        Number.isFinite(center[1])
      ) {
        // getCenter() returns [lng, lat]
        onChangeRef.current({ lng: center[0], lat: center[1] });
      }
    } finally {
      emittingRef.current = false;
    }
  };

  const locate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      cameraRef.current?.flyTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        duration: 800,
      });
    } catch {
      /* ignore */
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Map
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE_URL}
        logo={false}
        attribution
        onRegionDidChange={handleRegionDidChange}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [initial.lng, initial.lat],
            zoom: 15,
          }}
          minZoom={10}
          maxZoom={19}
        />
      </Map>

      {/* Fixed center pin — point of the pin lands on the dot */}
      <View pointerEvents="none" style={styles.pinWrap}>
        <MapPin size={38} strokeWidth={1.5} color="#ffffff" fill="#f97316" />
      </View>

      {/* Center reference dot */}
      <View pointerEvents="none" style={styles.pinDot} />

      {/* Locate button */}
      <Pressable
        onPress={locate}
        disabled={locating}
        style={({ pressed }) => [
          styles.locateBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <LocateFixed
          size={20}
          strokeWidth={1.75}
          color={colors.primary}
          opacity={locating ? 0.5 : 1}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  // marginLeft/marginTop are physical → not flipped by RTL.
  // marginTop -35 puts the visual tip of the pin (~34.8px from top) at the center.
  pinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 38,
    height: 38,
    marginLeft: -19,
    marginTop: -35,
  },
  pinDot: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
    backgroundColor: "rgba(15,23,42,0.35)",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  locateBtn: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
