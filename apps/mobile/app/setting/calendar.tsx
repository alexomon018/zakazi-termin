import {
  AppButton,
  AppCard,
  AppText,
  ConfirmDialog,
  QueryStateView,
  ScreenHeader,
  SectionHeader,
} from "@/components/atoms";
import { SettingsScrollView } from "@/components/molecules";
import { API_URL } from "@/lib/api-url";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, StyleSheet, Switch, View } from "react-native";

type CalendarConnection = {
  id: string;
  type: string;
  createdAt: Date;
  calendarsCount: number;
  email?: string;
  calendars?: { externalId: string; name: string; selected: boolean }[];
};

export default function CalendarSettingsScreen() {
  const { theme } = useTheme();
  const utils = trpc.useUtils();
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null);

  const connectionsQuery = trpc.calendar.listConnections.useQuery(undefined, {
    retry: false,
  });

  const disconnectMutation = trpc.calendar.disconnect.useMutation({
    onSuccess: async () => {
      setDisconnectTarget(null);
      await utils.calendar.listConnections.invalidate();
    },
  });

  const toggleCalendarMutation = trpc.calendar.toggleCalendarSelection.useMutation({
    onSuccess: async () => {
      await utils.calendar.listConnections.invalidate();
    },
  });

  const pendingRefetch = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && pendingRefetch.current) {
        pendingRefetch.current = false;
        connectionsQuery.refetch();
      }
    });
    return () => subscription.remove();
  }, [connectionsQuery]);

  const handleConnect = async () => {
    pendingRefetch.current = true;
    await WebBrowser.openBrowserAsync(`${API_URL}/api/calendar/google/connect`);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        connectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        calendarsList: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
        calendarRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
        },
        actions: { marginTop: theme.spacing.md },
      }),
    [theme]
  );

  if (connectionsQuery.isLoading) {
    return <QueryStateView state="loading" />;
  }

  if (connectionsQuery.isError) {
    return (
      <QueryStateView
        state="error"
        message="Neuspešno učitavanje kalendara."
        onRetry={() => connectionsQuery.refetch()}
      />
    );
  }

  const connections = (connectionsQuery.data ?? []) as CalendarConnection[];

  return (
    <>
      <SettingsScrollView>
        <ScreenHeader title="Kalendar" />
        <SectionHeader title="Povezani kalendari" />

        {connections.length === 0 ? (
          <AppCard>
            <AppText variant="bodySm" muted>
              Nemate povezanih kalendara. Povežite Google Calendar da automatski sinhronizujete
              termine.
            </AppText>
            <View style={styles.actions}>
              <AppButton label="Poveži Google Calendar" onPress={handleConnect} />
            </View>
          </AppCard>
        ) : (
          connections.map((conn) => (
            <AppCard key={conn.id}>
              <View style={styles.connectionHeader}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body">{conn.type ?? "Google Calendar"}</AppText>
                  <AppText variant="caption" muted>
                    {conn.email ?? "Povezano"}
                  </AppText>
                </View>
                <AppButton
                  label="Prekini vezu"
                  onPress={() => setDisconnectTarget(conn.id)}
                  variant="outline"
                />
              </View>

              {conn.calendars && conn.calendars.length > 0 && (
                <View style={styles.calendarsList}>
                  <AppText variant="caption" muted>
                    Kalendari za proveru dostupnosti:
                  </AppText>
                  {conn.calendars.map((cal) => (
                    <View key={cal.externalId} style={styles.calendarRow}>
                      <Switch
                        value={cal.selected}
                        onValueChange={(selected) =>
                          toggleCalendarMutation.mutate({
                            credentialId: conn.id,
                            externalId: cal.externalId,
                            selected,
                          })
                        }
                        trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                      />
                      <AppText variant="bodySm">{cal.name}</AppText>
                    </View>
                  ))}
                </View>
              )}
            </AppCard>
          ))
        )}

        {connections.length > 0 && (
          <AppButton label="Poveži novi kalendar" onPress={handleConnect} variant="outline" />
        )}
      </SettingsScrollView>

      <ConfirmDialog
        visible={!!disconnectTarget}
        title="Prekini vezu"
        message="Da li ste sigurni da želite da prekinete vezu sa ovim kalendarom?"
        confirmLabel="Prekini vezu"
        destructive
        loading={disconnectMutation.isPending}
        onConfirm={() => {
          if (disconnectTarget) disconnectMutation.mutate({ credentialId: disconnectTarget });
        }}
        onCancel={() => setDisconnectTarget(null)}
      />
    </>
  );
}
