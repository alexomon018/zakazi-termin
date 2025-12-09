import { router } from "../trpc";
import { userRouter } from "./user";
import { eventTypeRouter } from "./eventType";
import { bookingRouter } from "./booking";
import { availabilityRouter } from "./availability";
import { calendarRouter } from "./calendar";

export const appRouter = router({
  user: userRouter,
  eventType: eventTypeRouter,
  booking: bookingRouter,
  availability: availabilityRouter,
  calendar: calendarRouter,
});

export type AppRouter = typeof appRouter;
