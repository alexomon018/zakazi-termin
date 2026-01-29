import { createServerCaller } from "@/lib/trpc/server";
import { AvailabilityEditorClient } from "@salonko/ui";
import { notFound } from "next/navigation";

interface AvailabilityEditorPageProps {
  params: Promise<{
    scheduleId: string;
  }>;
}

export default async function AvailabilityEditorPage({ params }: AvailabilityEditorPageProps) {
  const { scheduleId } = await params;
  const caller = await createServerCaller();

  const [schedule, currentUser] = await Promise.all([
    caller.availability.getSchedule({ id: scheduleId }),
    caller.user.me(),
  ]);

  if (!schedule) {
    notFound();
  }

  return <AvailabilityEditorClient schedule={schedule} currentUser={currentUser} />;
}
