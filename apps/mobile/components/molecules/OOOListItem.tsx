import { AppCard, AppText, MoreButton } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

type OOOEntry = {
  uuid: string;
  start: string | Date;
  end: string | Date;
  notes?: string | null;
};

type OOOReason = {
  emoji: string;
  reason: string;
};

type OOOListItemProps = {
  item: OOOEntry;
  reason?: OOOReason;
  onMorePress: () => void;
};

export function OOOListItem({ item, reason, onMorePress }: OOOListItemProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
        cardContent: { flex: 1, gap: 2 },
      }),
    [theme]
  );

  const startLabel = new Date(item.start).toLocaleDateString("sr-RS");
  const endLabel = new Date(item.end).toLocaleDateString("sr-RS");

  return (
    <AppCard>
      <View style={styles.cardRow}>
        <View style={styles.cardContent}>
          <AppText variant="body">
            {startLabel} — {endLabel}
          </AppText>
          {reason && (
            <AppText variant="bodySm" muted>
              {reason.emoji} {reason.reason}
            </AppText>
          )}
          {item.notes && (
            <AppText variant="caption" muted>
              {item.notes}
            </AppText>
          )}
        </View>
        <MoreButton
          onPress={onMorePress}
          accessibilityLabel={`Više opcija za odsustvo od ${startLabel} do ${endLabel}`}
        />
      </View>
    </AppCard>
  );
}
