import { AppButton, AppCard, AppScreen, AppText } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

export default function PublicSalonScreen() {
  const { theme } = useTheme();
  const { salonSlug } = useLocalSearchParams<{ salonSlug: string }>();
  const router = useRouter();

  const profileQuery = trpc.user.getPublicProfile.useQuery(
    { salonSlug: salonSlug ?? "" },
    {
      enabled: !!salonSlug,
      retry: false,
    }
  );

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
        action: {
          marginTop: theme.spacing.sm,
        },
      }),
    [theme]
  );

  if (profileQuery.isLoading) {
    return (
      <AppScreen>
        <View style={styles.container}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </AppScreen>
    );
  }

  if (profileQuery.error || !profileQuery.data) {
    return (
      <AppScreen>
        <View style={styles.container}>
          <View style={styles.centered}>
            <AppText variant="bodySm" centered muted>
              Salon nije pronađen.
            </AppText>
          </View>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppCard>
            <AppText variant="h2">{profileQuery.data.salonName ?? "Salon"}</AppText>
            <AppText variant="bodySm" muted>
              Odaberite uslugu za rezervaciju.
            </AppText>
          </AppCard>

          {profileQuery.data.eventTypes.map((eventType) => (
            <AppCard key={eventType.id}>
              <AppText variant="body">{eventType.title}</AppText>
              {eventType.description && (
                <AppText variant="bodySm" muted>
                  {eventType.description}
                </AppText>
              )}
              <AppText variant="caption" muted>
                Trajanje: {eventType.length} min
              </AppText>
              <View style={styles.action}>
                <AppButton
                  label="Izaberi termin"
                  onPress={() => router.push(`/(public)/${salonSlug}/${eventType.slug}`)}
                />
              </View>
            </AppCard>
          ))}
        </ScrollView>
      </View>
    </AppScreen>
  );
}
