import { router } from "@salonko/trpc/trpc";
import { availabilityRouter } from "./availability";
import { bookingRouter } from "./booking";
import { calendarRouter } from "./calendar";
import { eventTypeRouter } from "./eventType";
import { organizationRouter } from "./organization";
import { outOfOfficeRouter } from "./outOfOffice";
import { subscriptionRouter } from "./subscription";
import { teamRouter } from "./team";
import { userRouter } from "./user";

export const appRouter = router({
  user: userRouter,
  eventType: eventTypeRouter,
  booking: bookingRouter,
  availability: availabilityRouter,
  calendar: calendarRouter,
  outOfOffice: outOfOfficeRouter,
  subscription: subscriptionRouter,
  organization: organizationRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;
