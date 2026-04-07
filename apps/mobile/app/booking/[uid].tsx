import {
  AppButton,
  AppText,
  ConfirmDialog,
  QueryStateView,
  ScreenHeader,
  SectionHeader,
} from "@/components/atoms";
import { SettingsScrollView } from "@/components/molecules";
import { RescheduleSheet } from "@/components/molecules/RescheduleSheet";
import { SubscriptionGate } from "@/components/organisms/SubscriptionGate";
import { statusColor, statusLabel } from "@/lib/booking-status";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { Calendar, Clock, Mail, Phone, Store, User } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";

function formatBookingDate(date: Date, timeZone?: string): string {
  return date.toLocaleDateString("sr-RS", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  });
}

function formatBookingTime(start: Date, end: Date, timeZone?: string): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit", timeZone });
  return `${fmt(start)} - ${fmt(end)}`;
}

function computeDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

export default function BookingDetailScreen() {
  return (
    <SubscriptionGate>
      <InnerBookingDetailScreen />
    </SubscriptionGate>
  );
}

function InnerBookingDetailScreen() {
  const { theme } = useTheme();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const utils = trpc.useUtils();

  const bookingQuery = trpc.booking.byUid.useQuery({ uid: uid! }, { retry: false, enabled: !!uid });

  const [showCancel, setShowCancel] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  function invalidateAll() {
    return Promise.all([
      utils.booking.byUid.invalidate({ uid: uid! }),
      utils.booking.upcoming.invalidate(),
      utils.booking.listPaginated.invalidate(),
      utils.booking.dashboardStats.invalidate(),
    ]);
  }

  function mutationCallbacks(errorMessage: string, onSuccessCleanup?: () => void) {
    return {
      onSuccess: () => {
        void invalidateAll();
        onSuccessCleanup?.();
      },
      onError: (error: { message?: string }) => {
        Alert.alert("Greška", error.message || errorMessage);
      },
    };
  }

  const confirmMutation = trpc.booking.confirm.useMutation(
    mutationCallbacks("Nije moguće potvrditi termin.")
  );
  const rejectMutation = trpc.booking.reject.useMutation(
    mutationCallbacks("Nije moguće odbiti termin.", () => setShowReject(false))
  );
  const cancelMutation = trpc.booking.cancel.useMutation(
    mutationCallbacks("Nije moguće otkazati termin.", () => setShowCancel(false))
  );

  const isMutating =
    confirmMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  const booking = bookingQuery.data;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        badge: {
          alignSelf: "flex-start",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          borderWidth: 1,
        },
        infoRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        separator: {
          height: 1,
          backgroundColor: theme.colors.border,
        },
        actionsGap: {
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  if (bookingQuery.isLoading) {
    return <QueryStateView state="loading" />;
  }

  if (bookingQuery.error || !booking) {
    return (
      <QueryStateView
        state="error"
        message="Nije moguće učitati detalje termina."
        onRetry={() => void bookingQuery.refetch()}
      />
    );
  }

  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const durationMinutes = computeDurationMinutes(startTime, endTime);
  const timeZone = booking.user?.timeZone;
  const color = statusColor(booking.status, theme);
  const attendee = booking.attendees[0];
  const isPending = booking.status === "PENDING";
  const isCancellable = booking.status !== "CANCELLED" && booking.status !== "REJECTED";
  const refId = booking.uid.slice(0, 8).toUpperCase();

  return (
    <>
      <SettingsScrollView
        stickyHeader={
          <ScreenHeader title={booking.eventType?.title ?? booking.title ?? "Termin"} />
        }
      >
        {/* Title & Reference */}
        <View style={styles.card}>
          <AppText variant="h2" style={{ fontWeight: "700" }}>
            {booking.eventType?.title ?? booking.title ?? "Termin"}
          </AppText>
          <AppText variant="bodySm" muted>
            Ref: {refId}
          </AppText>

          {/* Status badge */}
          <View style={[styles.badge, { borderColor: color }]}>
            <AppText variant="caption" style={{ color, fontWeight: "600" }}>
              {statusLabel(booking.status)}
            </AppText>
          </View>

          <View style={styles.separator} />

          {/* Date */}
          <View style={styles.infoRow}>
            <Calendar size={18} color={theme.colors.mutedForeground} />
            <AppText variant="body">{formatBookingDate(startTime, timeZone)}</AppText>
          </View>

          {/* Time */}
          <View style={styles.infoRow}>
            <Clock size={18} color={theme.colors.mutedForeground} />
            <View>
              <AppText variant="body">{formatBookingTime(startTime, endTime, timeZone)}</AppText>
              <AppText variant="caption" muted>
                {durationMinutes} minuta
              </AppText>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Salon info */}
          {booking.user && (
            <>
              <AppText variant="bodySm" muted>
                Salon
              </AppText>
              <View style={styles.infoRow}>
                <Store size={18} color={theme.colors.mutedForeground} />
                <View>
                  <AppText variant="body" style={{ fontWeight: "600" }}>
                    {booking.user.salonName ?? booking.user.name}
                  </AppText>
                  <AppText variant="caption" muted>
                    {booking.user.email}
                  </AppText>
                </View>
              </View>
            </>
          )}

          <View style={styles.separator} />

          {/* Attendee info */}
          {attendee && (
            <>
              <AppText variant="bodySm" muted>
                Klijent
              </AppText>
              <View style={styles.infoRow}>
                <User size={18} color={theme.colors.mutedForeground} />
                <AppText variant="body">{attendee.name ?? "Nepoznato"}</AppText>
              </View>
              <Pressable
                style={styles.infoRow}
                onPress={() => Linking.openURL(`mailto:${attendee.email}`)}
                accessibilityRole="link"
                accessibilityLabel={`Pošalji email na ${attendee.email}`}
              >
                <Mail size={18} color={theme.colors.mutedForeground} />
                <AppText variant="body" style={{ color: theme.colors.primary }}>
                  {attendee.email}
                </AppText>
              </Pressable>
              {attendee.phoneNumber && (
                <Pressable
                  style={styles.infoRow}
                  onPress={async () => {
                    await Clipboard.setStringAsync(attendee.phoneNumber!);
                    Alert.alert("Kopirano", "Broj telefona je kopiran.");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Kopiraj broj ${attendee.phoneNumber}`}
                >
                  <Phone size={18} color={theme.colors.mutedForeground} />
                  <AppText variant="body" style={{ color: theme.colors.primary }}>
                    {attendee.phoneNumber}
                  </AppText>
                </Pressable>
              )}
            </>
          )}

          {/* Notes */}
          {booking.description && (
            <>
              <View style={styles.separator} />
              <AppText variant="bodySm" muted>
                Napomene
              </AppText>
              <AppText variant="body">{booking.description}</AppText>
            </>
          )}
        </View>

        {/* Actions */}
        <SectionHeader title="Akcije" />
        <View style={styles.actionsGap}>
          {isPending && (
            <AppButton
              label="Potvrdi termin"
              onPress={() => confirmMutation.mutate({ uid: uid! })}
              loading={confirmMutation.isPending}
              disabled={isMutating}
            />
          )}

          {isCancellable && (
            <AppButton
              label="Promeni termin"
              onPress={() => setShowReschedule(true)}
              variant="outline"
              disabled={isMutating}
            />
          )}

          {isPending && (
            <AppButton
              label="Odbij termin"
              onPress={() => setShowReject(true)}
              variant="outline"
              textColorOverride={theme.colors.destructive}
              disabled={isMutating}
            />
          )}

          {isCancellable && (
            <AppButton
              label="Otkaži termin"
              onPress={() => setShowCancel(true)}
              variant="outline"
              textColorOverride={theme.colors.destructive}
              disabled={isMutating}
            />
          )}
        </View>
      </SettingsScrollView>

      <ConfirmDialog
        visible={showCancel}
        title="Otkaži termin"
        message="Da li ste sigurni da želite da otkažete ovaj termin?"
        confirmLabel="Otkaži"
        destructive
        loading={cancelMutation.isPending}
        onConfirm={() => {
          cancelMutation.mutate({ uid: uid! });
        }}
        onCancel={() => setShowCancel(false)}
      />

      <ConfirmDialog
        visible={showReject}
        title="Odbij termin"
        message="Da li ste sigurni da želite da odbijete ovaj termin?"
        confirmLabel="Odbij"
        destructive
        loading={rejectMutation.isPending}
        onConfirm={() => {
          rejectMutation.mutate({ uid: uid! });
        }}
        onCancel={() => setShowReject(false)}
      />

      <RescheduleSheet
        visible={showReschedule}
        bookingTitle={booking.eventType?.title ?? booking.title ?? "Termin"}
        attendeeName={attendee?.name ?? "Klijent"}
        currentStart={startTime}
        durationMinutes={durationMinutes}
        bookingUid={uid!}
        timeZone={timeZone}
        onClose={() => setShowReschedule(false)}
        onSuccess={() => {
          setShowReschedule(false);
          invalidateAll();
        }}
      />
    </>
  );
}
