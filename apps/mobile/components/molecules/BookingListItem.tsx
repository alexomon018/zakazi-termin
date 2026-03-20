import { AppText, MoreButton } from "@/components/atoms";
import { statusColor, statusLabel } from "@/lib/booking-status";
import { useTheme } from "@/lib/theme-context";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type BookingListItemProps = {
  title: string;
  attendeeName: string;
  time: string;
  status: string;
  onPress?: () => void;
  onMorePress: () => void;
};

export function BookingListItem({
  title,
  attendeeName,
  time,
  status,
  onPress,
  onMorePress,
}: BookingListItemProps) {
  const { theme } = useTheme();
  const color = statusColor(status, theme);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: theme.spacing.md,
        },
        content: { flex: 1, gap: 3 },
        badge: {
          alignSelf: "flex-start",
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
          borderWidth: 1,
          marginTop: 4,
        },
      }),
    [theme]
  );

  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.content}>
        <AppText variant="body" style={{ fontWeight: "600" }}>
          {title}
        </AppText>
        <AppText variant="bodySm" muted>
          {attendeeName} · {time}
        </AppText>
        <View style={[styles.badge, { borderColor: color }]}>
          <AppText variant="caption" style={{ color, fontWeight: "600" }}>
            {statusLabel(status)}
          </AppText>
        </View>
      </View>
      <MoreButton onPress={onMorePress} />
    </Pressable>
  );
}
