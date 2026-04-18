import { isMessagingAiEnabled } from "@salonko/config";
import { getAppOriginFromHeaders } from "@salonko/trpc";
import { MessagingChannelsClient } from "@salonko/ui";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function MessagingSettingsPage() {
  if (!isMessagingAiEnabled()) {
    notFound();
  }
  const origin = getAppOriginFromHeaders(await headers());
  return <MessagingChannelsClient appOrigin={origin} />;
}
