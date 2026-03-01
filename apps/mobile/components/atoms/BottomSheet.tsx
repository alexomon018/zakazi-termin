import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type BottomSheetAction = {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
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
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      backdropAnim.setValue(0);
    }
  }, [visible, slideAnim, backdropAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.4)",
            opacity: backdropAnim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>
        <Animated.View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            paddingBottom: Math.max(insets.bottom, 16),
            paddingTop: theme.spacing.md,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [400, 0],
                }),
              },
            ],
          }}
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
          {actions.map((action, index) => (
            <Pressable
              key={`${action.label}-${index}`}
              disabled={action.disabled}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: theme.spacing.xl,
                gap: theme.spacing.md,
                opacity: action.disabled ? 0.5 : 1,
              }}
              onPress={() => {
                action.onPress();
                handleClose();
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
            onPress={handleClose}
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
        </Animated.View>
      </View>
    </Modal>
  );
}
