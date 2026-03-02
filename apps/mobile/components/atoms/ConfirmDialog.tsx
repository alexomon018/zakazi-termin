import { useTheme } from "@/lib/theme-context";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

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
            padding: theme.spacing.xl,
            width: "100%",
            maxWidth: 340,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.h2,
              fontWeight: "600",
              color: theme.colors.foreground,
              marginBottom: theme.spacing.sm,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.body,
              color: theme.colors.mutedForeground,
              marginBottom: theme.spacing.xl,
              lineHeight: 22,
            }}
          >
            {message}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.sm,
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              style={{
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.radius.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
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
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.radius.sm,
                backgroundColor: destructive ? theme.colors.destructive : theme.colors.primary,
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
