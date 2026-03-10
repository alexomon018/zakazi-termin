import { useTheme } from "@/lib/theme-context";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export function InfoDialog({
  visible,
  title,
  message,
  okLabel = "U redu",
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  okLabel?: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: theme.spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            width: "100%",
            maxWidth: 340,
            overflow: "hidden",
          }}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
            <Text
              style={{
                fontSize: theme.typography.h1,
                fontWeight: "600",
                color: theme.colors.foreground,
                marginBottom: 6,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.bodySm,
                color: theme.colors.mutedForeground,
                lineHeight: 18,
              }}
            >
              {message}
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.border,
            }}
          >
            <Pressable
              style={{
                paddingVertical: 10,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
              }}
              onPress={onClose}
            >
              <Text
                style={{
                  fontSize: theme.typography.body,
                  color: theme.colors.primaryForeground,
                  fontWeight: "600",
                }}
              >
                {okLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
