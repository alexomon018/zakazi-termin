import { useTheme } from "@/lib/theme-context";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Potvrdi",
  cancelLabel = "Otkaži",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const confirmForeground = destructive
    ? theme.colors.destructiveForeground
    : theme.colors.primaryForeground;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
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
          {/* Header + Content */}
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

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.sm,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.border,
            }}
          >
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: theme.radius.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
              }}
              onPress={onCancel}
              disabled={loading}
            >
              <Text
                style={{
                  fontSize: theme.typography.body,
                  color: theme.colors.foreground,
                  fontWeight: "500",
                }}
              >
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: theme.radius.sm,
                backgroundColor: destructive ? theme.colors.destructive : theme.colors.primary,
                alignItems: "center",
              }}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={confirmForeground} size="small" />
              ) : (
                <Text
                  style={{
                    fontSize: theme.typography.body,
                    color: confirmForeground,
                    fontWeight: "600",
                  }}
                >
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
