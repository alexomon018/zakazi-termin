import { getAppOriginFromHeaders } from "@salonko/trpc";
import { MessagingChannelsClient } from "@salonko/ui";
import { headers } from "next/headers";

export default async function MessagingSettingsPage() {
  const origin = getAppOriginFromHeaders(await headers());
  return <MessagingChannelsClient appOrigin={origin} />;
}
