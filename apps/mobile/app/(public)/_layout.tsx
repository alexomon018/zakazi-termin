import { Stack } from "expo-router";

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Rezervacija",
        }}
      />
      <Stack.Screen
        name="[salonSlug]/index"
        options={{
          title: "Usluge",
        }}
      />
      <Stack.Screen
        name="[salonSlug]/[eventSlug]"
        options={{
          title: "Zakaži termin",
        }}
      />
    </Stack>
  );
}
