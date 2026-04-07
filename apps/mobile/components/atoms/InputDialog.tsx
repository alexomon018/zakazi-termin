import { useTheme } from "@/lib/theme-context";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppInput } from "./AppInput";

export function InputDialog({
  visible,
  title,
  description,
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
  description?: string;
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
                  marginBottom: description ? 6 : 12,
                }}
              >
                {title}
              </Text>
              {description && (
                <Text
                  style={{
                    fontSize: theme.typography.bodySm,
                    color: theme.colors.mutedForeground,
                    marginBottom: 12,
                    lineHeight: 18,
                  }}
                >
                  {description}
                </Text>
              )}
              <AppInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                autoFocus
              />
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
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.primary,
                  alignItems: "center",
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
