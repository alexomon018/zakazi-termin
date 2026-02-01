import { createServerCaller } from "@/lib/trpc/server";
import { Button, EditEventTypeClient } from "@salonko/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditEventTypePage({ params }: Props) {
  const { id } = await params;

  const caller = await createServerCaller();

  const [eventType, schedules] = await Promise.all([
    caller.eventType.byId({ id }).catch((err) => {
      const isNotFound =
        err?.code === "NOT_FOUND" ||
        err?.data?.code === "NOT_FOUND" ||
        err?.data?.httpStatus === 404 ||
        err?.status === 404;
      if (isNotFound) return null;
      throw err;
    }),
    caller.availability.listSchedules(),
  ]);

  if (!eventType) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Tip termina nije pronađen
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
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
