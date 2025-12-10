import { router } from "../trpc";
import { userRouter } from "./user";
import { eventTypeRouter } from "./eventType";
import { bookingRouter } from "./booking";
import { availabilityRouter } from "./availability";
import { calendarRouter } from "./calendar";
import { outOfOfficeRouter } from "./outOfOffice";

export const appRouter = router({
  user: userRouter,
  eventType: eventTypeRouter,
  booking: bookingRouter,
  availability: availabilityRouter,
  calendar: calendarRouter,
  outOfOffice: outOfOfficeRouter,
});

export type AppRouter = typeof appRouter;
