import { colors } from "@/shared/theme";
import {
  HardHat,
  SprayCan,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";

const CATEGORY_ICONS: Record<string, { Icon: LucideIcon; filled?: boolean }> = {
  cleaner: { Icon: SprayCan },
  builder: { Icon: HardHat },
};

export default function CategoryIcon({
  category,
  size = 16,
  color = colors.primary,
  forceFilled,
}: {
  category: string;
  size?: number;
  color?: string;
  forceFilled?: boolean;
}) {
  const entry = CATEGORY_ICONS[category] ?? { Icon: Wrench };
  const { Icon, filled } = entry;
  const useFill = forceFilled ?? filled ?? false;
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      color={color}
      fill={useFill ? color : "none"}
    />
  );
}
