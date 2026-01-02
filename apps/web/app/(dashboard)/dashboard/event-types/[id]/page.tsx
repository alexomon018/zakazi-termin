import { createServerCaller } from "@/lib/trpc/server";
import { Button, EditEventTypeClient } from "@salonko/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Render the edit page for an event type identified by the route params.
 *
 * Fetches the event type and schedules in parallel; if the event type is not found or inaccessible,
 * renders a not-found message with a link back to the event types list, otherwise renders the
 * EditEventTypeClient populated with the fetched data.
 *
 * @param params - A promise that resolves to an object containing the `id` of the event type
 * @returns A React element that shows either the not-found UI or the edit UI with `eventType` and `schedules`
 */
export default async function EditEventTypePage({ params }: Props) {
  const { id } = await params;

  const caller = await createServerCaller();

  // Fetch data in parallel
  const [eventType, schedules] = await Promise.all([
    caller.eventType.byId({ id }).catch(() => null),
    caller.availability.listSchedules(),
  ]);

  if (!eventType) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Tip termina nije pronađen
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Ovaj tip termina ne postoji ili nemate pristup.
        </p>
        <Link href="/dashboard/event-types">
          <Button className="mt-4">Nazad na tipove termina</Button>
        </Link>
      </div>
    );
  }

  return <EditEventTypeClient eventType={eventType} schedules={schedules} />;
}