import { router } from "@salonko/trpc/trpc";
import { availabilityRouter } from "./availability";
import { bookingRouter } from "./booking";
import { calendarRouter } from "./calendar";
import { eventTypeRouter } from "./eventType";
import { outOfOfficeRouter } from "./outOfOffice";
import { userRouter } from "./user";

export const appRouter = router({
  user: userRouter,
  eventType: eventTypeRouter,
  booking: bookingRouter,
  availability: availabilityRouter,
  calendar: calendarRouter,
  outOfOffice: outOfOfficeRouter,
});

export type AppRouter = typeof appRouter;
