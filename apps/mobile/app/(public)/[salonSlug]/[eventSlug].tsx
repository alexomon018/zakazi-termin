import { AppButton, AppCard, AppInput, AppScreen, AppText } from "@/components/ui/primitives";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

export default function PublicEventBookingScreen() {
  const { theme } = useTheme();
  const { salonSlug, eventSlug } = useLocalSearchParams<{
    salonSlug: string;
    eventSlug: string;
  }>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");

  const eventQuery = trpc.eventType.getPublic.useQuery(
    { salonSlug: salonSlug ?? "", slug: eventSlug ?? "" },
    { enabled: !!salonSlug && !!eventSlug, retry: false }
  );

  const dateRange = useMemo(() => {
    const now = new Date();
    const to = new Date();
    to.setDate(now.getDate() + 14);
    return { now, to };
  }, []);

  const slotsQuery = trpc.availability.getSlots.useQuery(
    {
      eventTypeId: eventQuery.data?.id ?? "",
      dateFrom: dateRange.now,
      dateTo: dateRange.to,
      timeZone: "Europe/Belgrade",
    },
    {
      enabled: !!eventQuery.data?.id,
      retry: false,
    }
  );

  const bookingMutation = trpc.booking.create.useMutation();

  const handleCreateBooking = () => {
    if (!eventQuery.data || !selectedSlot || !name.trim() || !email.trim()) {
      return;
    }
    const startTime = new Date(selectedSlot);
    const endTime = new Date(startTime.getTime() + eventQuery.data.length * 60 * 1000);
    bookingMutation.mutate({
      eventTypeId: eventQuery.data.id,
      startTime,
      endTime,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      locale: "sr",
      timeZone: "Europe/Belgrade",
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing.xl,
        },
        content: {
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
        slotsWrap: {
          marginTop: theme.spacing.sm,
          gap: theme.spacing.xs,
        },
        form: {
          marginTop: theme.spacing.sm,
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <AppScreen>
      <View style={styles.container}>
        {eventQuery.isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {(eventQuery.error || !eventQuery.data) && !eventQuery.isLoading && (
          <View style={styles.centered}>
            <AppText variant="bodySm" centered muted>
              Usluga nije pronađena.
            </AppText>
          </View>
        )}

        {eventQuery.data && (
          <ScrollView contentContainerStyle={styles.content}>
            <AppCard>
              <AppText variant="h2">{eventQuery.data.title}</AppText>
              {!!eventQuery.data.description && (
                <AppText variant="bodySm" muted>
                  {eventQuery.data.description}
                </AppText>
              )}
              <AppText variant="caption" muted>
                Trajanje: {eventQuery.data.length} min
              </AppText>
            </AppCard>

            <AppCard>
              <AppText variant="body">Dostupni termini</AppText>
              <View style={styles.slotsWrap}>
                {slotsQuery.isError && (
                  <AppText variant="bodySm" centered muted>
                    Greška pri učitavanju termina. Pokušajte ponovo.
                  </AppText>
                )}
                {slotsQuery.isLoading && (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                )}
                {slotsQuery.data?.slots?.slice(0, 15).map((slot: { time: string }) => (
                  <AppButton
                    key={slot.time}
                    label={new Date(slot.time).toLocaleString("sr-RS", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Europe/Belgrade",
                    })}
                    onPress={() => setSelectedSlot(slot.time)}
                    variant={selectedSlot === slot.time ? "primary" : "outline"}
                  />
                ))}
                {slotsQuery.data?.slots?.length === 0 && (
                  <AppText variant="bodySm" centered muted>
                    Nema dostupnih termina u narednih 14 dana.
                  </AppText>
                )}
              </View>
            </AppCard>

            <AppCard>
              <AppText variant="body">Vaši podaci</AppText>
              <View style={styles.form}>
                <AppInput value={name} onChangeText={setName} placeholder="Ime i prezime" />
                <AppInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <AppInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Telefon (opciono)"
                  keyboardType="phone-pad"
                />
                <AppInput value={notes} onChangeText={setNotes} placeholder="Napomena (opciono)" />
                <AppButton
                  label={bookingMutation.isSuccess ? "Termin zakazan" : "Potvrdi rezervaciju"}
                  onPress={handleCreateBooking}
                  loading={bookingMutation.isPending}
                  disabled={
                    !selectedSlot || !name.trim() || !email.trim() || bookingMutation.isSuccess
                  }
                />
                {bookingMutation.error && (
                  <AppText variant="bodySm" centered muted>
                    {bookingMutation.error.message}
                  </AppText>
                )}
              </View>
            </AppCard>
          </ScrollView>
        )}
      </View>
    </AppScreen>
  );
}
