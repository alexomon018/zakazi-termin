import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  type LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  cancelLabel = "Otkaži",
}: {
  visible: boolean;
  title?: string;
  actions: BottomSheetAction[];
  onClose: () => void;
  cancelLabel?: string;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [sheetHeight, setSheetHeight] = useState<number | null>(null);

  const onSheetLayout = useCallback((e: LayoutChangeEvent) => {
    setSheetHeight(e.nativeEvent.layout.height);
  }, []);

  const runExitAnimation = useCallback(
    (onComplete?: () => void) => {
      return Animated.parallel([
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
      ]).start(onComplete);
    },
    [backdropAnim, slideAnim]
  );

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (visible) {
      animation = Animated.parallel([
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
      ]);
      animation.start();
    } else {
      animation = Animated.parallel([
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
      ]);
      animation.start();
    }

    return () => {
      animation?.stop();
    };
  }, [visible, slideAnim, backdropAnim]);

  const handleClose = () => {
    runExitAnimation(() => onClose());
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
          onLayout={onSheetLayout}
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
                  outputRange: [sheetHeight ?? 800, 0],
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
                runExitAnimation(() => {
                  onClose();
                  action.onPress();
                });
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
              {cancelLabel}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
