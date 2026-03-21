import { AppText } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Check, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  type LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Fallback height before onLayout measures the sheet (slide-up animation). */
const DEFAULT_SHEET_HEIGHT = 800;

type RescheduleSheetProps = {
  visible: boolean;
  bookingTitle: string;
  attendeeName: string;
  currentStart: Date;
  durationMinutes: number;
  bookingUid: string;
  timeZone?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function RescheduleSheet({
  visible,
  bookingTitle,
  attendeeName,
  currentStart,
  durationMinutes,
  bookingUid,
  timeZone,
  onClose,
  onSuccess,
}: RescheduleSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [sheetHeight, setSheetHeight] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] = useState(currentStart);
  const [selectedTime, setSelectedTime] = useState(currentStart);
  const [reason, setReason] = useState("");

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setSelectedDate(currentStart);
      setSelectedTime(currentStart);
      setReason("");
    }
  }, [visible, currentStart]);

  const onSheetLayout = useCallback((e: LayoutChangeEvent) => {
    setSheetHeight(e.nativeEvent.layout.height);
  }, []);

  const runExitAnimation = useCallback(
    (onComplete?: () => void) => {
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
    }

    return () => {
      animation?.stop();
    };
  }, [visible, slideAnim, backdropAnim]);

  const handleClose = () => {
    if (rescheduleMutation.isPending) return;
    rescheduleMutation.reset();
    runExitAnimation(() => onClose());
  };

  const rescheduleMutation = trpc.booking.reschedule.useMutation({
    onSuccess: () => {
      runExitAnimation(() => onSuccess());
    },
    onError: (error) => {
      Alert.alert("Greška", error.message || "Nije moguće promeniti termin.");
    },
  });

  const handleConfirm = () => {
    const newStart = new Date(selectedDate);
    newStart.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

    if (newStart <= new Date()) {
      Alert.alert("Greška", "Novi termin mora biti u budućnosti.");
      return;
    }

    const newEnd = new Date(newStart.getTime() + durationMinutes * 60_000);

    rescheduleMutation.mutate({
      uid: bookingUid,
      newStartTime: newStart,
      newEndTime: newEnd,
      reason: reason.trim() || undefined,
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.md,
        },
        headerButton: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.mutedForeground,
          alignItems: "center",
          justifyContent: "center",
        },
        content: {
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.lg,
        },
        pickerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        reasonInput: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.md,
          minHeight: 80,
          color: theme.colors.foreground,
          fontSize: theme.typography.body,
          textAlignVertical: "top",
        },
      }),
    [theme]
  );

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
          <Pressable
            style={{ flex: 1 }}
            onPress={handleClose}
            disabled={rescheduleMutation.isPending}
          />
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
                  outputRange: [sheetHeight ?? DEFAULT_SHEET_HEIGHT, 0],
                }),
              },
            ],
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.border,
              alignSelf: "center",
              marginBottom: theme.spacing.md,
            }}
          />

          {/* Header with close / title / confirm */}
          <View style={styles.headerRow}>
            <Pressable
              style={[styles.headerButton, rescheduleMutation.isPending && { opacity: 0.4 }]}
              onPress={handleClose}
              disabled={rescheduleMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Zatvori"
            >
              <X size={18} color={theme.colors.foreground} />
            </Pressable>
            <AppText variant="body" style={{ fontWeight: "600" }}>
              Promeni termin
            </AppText>
            <Pressable
              style={[styles.headerButton, { backgroundColor: theme.colors.foreground }]}
              onPress={handleConfirm}
              disabled={rescheduleMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Potvrdi"
            >
              <Check size={18} color={theme.colors.background} />
            </Pressable>
          </View>

          <View style={styles.content}>
            {/* Booking info */}
            <AppText variant="body" style={{ fontWeight: "600", textAlign: "center" }}>
              {bookingTitle} — {attendeeName}
            </AppText>

            {/* Date & Time pickers */}
            <View style={styles.pickerRow}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "compact" : "default"}
                minimumDate={new Date()}
                timeZoneName={timeZone}
                onChange={(_, date) => {
                  if (date) setSelectedDate(date);
                }}
              />
              <AppText variant="body" muted>
                u
              </AppText>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === "ios" ? "compact" : "default"}
                minuteInterval={5}
                timeZoneName={timeZone}
                onChange={(_, time) => {
                  if (time) setSelectedTime(time);
                }}
              />
            </View>

            {/* Reason */}
            <View>
              <AppText variant="bodySm" muted style={{ marginBottom: 6 }}>
                Razlog (opciono)
              </AppText>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder="Unesite razlog za promenu termina..."
                placeholderTextColor={theme.colors.mutedForeground}
                multiline
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
