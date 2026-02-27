import { typography } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";
import { MoreHorizontal, Search, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TextVariant = "title" | "h1" | "h2" | "body" | "bodySm" | "caption";

const textVariantStyles: Record<TextVariant, TextStyle> = {
  title: { fontSize: typography.title, fontWeight: "800", letterSpacing: -0.5 },
  h1: { fontSize: typography.h1, fontWeight: "700", letterSpacing: -0.3 },
  h2: { fontSize: typography.h2, fontWeight: "600" },
  body: { fontSize: typography.body, fontWeight: "400" },
  bodySm: { fontSize: typography.bodySm, fontWeight: "400" },
  caption: { fontSize: typography.caption, fontWeight: "400" },
};

export function AppScreen({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {children}
    </SafeAreaView>
  );
}

export function AppCard({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
      }}
    >
      {children}
    </View>
  );
}

export function AppText({
  children,
  variant = "body",
  muted = false,
  centered = false,
  style,
}: {
  children: ReactNode;
  variant?: TextVariant;
  muted?: boolean;
  centered?: boolean;
  style?: TextStyle;
}) {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        { color: theme.colors.foreground },
        textVariantStyles[variant],
        muted && { color: theme.colors.mutedForeground },
        centered && { textAlign: "center" },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function AppInput(props: TextInputProps) {
  const { theme } = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.colors.mutedForeground}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.input,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          fontSize: theme.typography.body,
          color: theme.colors.foreground,
          backgroundColor: theme.colors.surface,
        },
        props.style,
      ]}
    />
  );
}

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline" | "destructive";
}) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const containerStyle = useMemo(
    () => ({
      height: 46,
      borderRadius: theme.radius.sm,
      backgroundColor:
        variant === "outline"
          ? theme.colors.surface
          : variant === "destructive"
            ? theme.colors.destructive
            : theme.colors.primary,
      borderWidth: variant === "outline" ? 1 : 0,
      borderColor: variant === "outline" ? theme.colors.border : "transparent",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: theme.spacing.lg,
      opacity: isDisabled ? 0.6 : 1,
    }),
    [theme, variant, isDisabled]
  );

  const textColor =
    variant === "outline"
      ? theme.colors.foreground
      : variant === "destructive"
        ? theme.colors.destructiveForeground
        : theme.colors.primaryForeground;

  return (
    <Pressable style={containerStyle} onPress={onPress} disabled={isDisabled}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={{
            color: textColor,
            fontSize: theme.typography.body,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function SectionHeader({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <Text
      style={{
        fontSize: theme.typography.caption,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: theme.colors.mutedForeground,
        fontWeight: "600",
        marginBottom: theme.spacing.xs,
      }}
    >
      {title}
    </Text>
  );
}

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
    </Modal>
  );
}

/* ── SearchBar ── */

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Pretraži...",
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
        gap: theme.spacing.sm,
      }}
    >
      <Search size={16} color={theme.colors.mutedForeground} />
      <TextInput
        style={{
          flex: 1,
          fontSize: theme.typography.bodySm,
          color: theme.colors.foreground,
          padding: 0,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <X size={16} color={theme.colors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}

/* ── BottomSheet ── */

export type BottomSheetAction = {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  destructive?: boolean;
};

export function BottomSheet({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  actions: BottomSheetAction[];
  onClose: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            paddingBottom: 34,
            paddingTop: theme.spacing.md,
          }}
          onStartShouldSetResponder={() => true}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.border,
              alignSelf: "center",
              marginBottom: theme.spacing.lg,
            }}
          />
          {title && (
            <Text
              style={{
                fontSize: theme.typography.bodySm,
                fontWeight: "600",
                color: theme.colors.mutedForeground,
                paddingHorizontal: theme.spacing.xl,
                marginBottom: theme.spacing.sm,
              }}
            >
              {title}
            </Text>
          )}
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: theme.spacing.xl,
                gap: theme.spacing.md,
              }}
              onPress={() => {
                action.onPress();
                onClose();
              }}
            >
              {action.icon && (
                <View style={{ width: 24, alignItems: "center" }}>{action.icon}</View>
              )}
              <Text
                style={{
                  fontSize: theme.typography.body,
                  color: action.destructive ? theme.colors.destructive : theme.colors.foreground,
                  fontWeight: "500",
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={{
              marginTop: theme.spacing.sm,
              paddingVertical: 14,
              paddingHorizontal: theme.spacing.xl,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
            onPress={onClose}
          >
            <Text
              style={{
                fontSize: theme.typography.body,
                color: theme.colors.mutedForeground,
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              Otkaži
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

/* ── MoreButton (⋯ trigger) ── */

export function MoreButton({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={{
        width: 36,
        height: 36,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
      }}
      onPress={onPress}
      hitSlop={8}
    >
      <MoreHorizontal size={20} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}

/* ── FAB (Floating Action Button) ── */

export function FAB({
  onPress,
  icon,
  label,
}: {
  onPress: () => void;
  icon: ReactNode;
  label?: string;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={{
        position: "absolute",
        bottom: 100,
        right: theme.spacing.xl,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.full,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        ...theme.shadow.md,
      }}
      onPress={onPress}
    >
      {icon}
      {label && (
        <Text
          style={{
            fontSize: theme.typography.bodySm,
            fontWeight: "600",
            color: theme.colors.primaryForeground,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/* ── FilterChip ── */

export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: active ? theme.colors.primary : theme.colors.border,
        backgroundColor: active ? theme.colors.primary : theme.colors.surface,
      }}
      onPress={onPress}
    >
      <Text
        style={{
          fontSize: theme.typography.bodySm,
          fontWeight: "500",
          color: active ? theme.colors.primaryForeground : theme.colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ── SectionDateHeader ── */

export function SectionDateHeader({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.xs }}>
      <Text
        style={{
          fontSize: theme.typography.caption,
          fontWeight: "600",
          color: theme.colors.mutedForeground,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

/* ── InputDialog (replacement for Alert.prompt) ── */

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
          <AppInput value={value} onChangeText={onChangeText} placeholder={placeholder} autoFocus />
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
                backgroundColor: theme.colors.primary,
              }}
              onPress={onConfirm}
              disabled={loading || !value.trim()}
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
    </Modal>
  );
}

/* ── Shared utility styles (layout-only, no colors) ── */

export const uiStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    justifyContent: "space-between",
  },
});
