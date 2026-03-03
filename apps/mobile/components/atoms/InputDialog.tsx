import { useTheme } from "@/lib/theme-context";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

import { AppInput } from "./AppInput";

export function InputDialog({
  visible,
  title,
  placeholder = "",
  value,
  onChangeText,
  confirmLabel = "Potvrdi",
  cancelLabel = "Otkaži",
  loading = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const confirmDisabled = loading || !value.trim();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) onCancel();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={24}
        style={{ flex: 1 }}
      >
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
            <AppInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              autoFocus
            />
            <View
              style={{
                flexDirection: "row",
                gap: theme.spacing.sm,
                justifyContent: "flex-end",
                marginTop: theme.spacing.lg,
              }}
            >
              <Pressable
                style={{
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.lg,
                  borderRadius: theme.radius.sm,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  opacity: loading ? 0.6 : 1,
                }}
                onPress={onCancel}
                disabled={loading}
                accessibilityState={{ disabled: loading }}
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
                  backgroundColor: theme.colors.primary,
                  opacity: confirmDisabled ? 0.6 : 1,
                }}
                onPress={onConfirm}
                disabled={confirmDisabled}
                accessibilityState={{ disabled: confirmDisabled }}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.primaryForeground} size="small" />
                ) : (
                  <Text
                    style={{
                      fontSize: theme.typography.body,
                      color: theme.colors.primaryForeground,
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
