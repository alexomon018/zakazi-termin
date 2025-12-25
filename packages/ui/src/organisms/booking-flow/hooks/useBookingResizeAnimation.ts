"use client";

import { useAnimate } from "framer-motion";
import { useEffect } from "react";
import type { BookingState } from "../store";

interface UseBookingResizeAnimationProps {
  state: BookingState;
  isMobile?: boolean;
}

/**
 * Hook to animate the booking container resize when transitioning between states
 * Respects prefers-reduced-motion for accessibility
 */
export function useBookingResizeAnimation({
  state,
  isMobile = false,
}: UseBookingResizeAnimationProps) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Don't animate on mobile or if reduced motion is preferred
    if (isMobile || prefersReducedMotion) {
      return;
    }

    const animateResize = async () => {
      // Define width based on state
      let containerWidth: string;
      let gridTemplateColumns: string;

      switch (state) {
        case "selecting_date":
          containerWidth = "var(--calendar-width)";
          gridTemplateColumns = "1fr";
          break;
        case "selecting_time":
          containerWidth = "calc(var(--calendar-width) + var(--timeslots-width) + 2rem)";
          gridTemplateColumns = "var(--calendar-width) var(--timeslots-width)";
          break;
        case "booking":
          containerWidth = "calc(var(--calendar-width) + var(--timeslots-width) + 2rem)";
          gridTemplateColumns = "var(--calendar-width) var(--timeslots-width)";
          break;
        case "confirmation":
          containerWidth = "var(--calendar-width)";
          gridTemplateColumns = "1fr";
          break;
        default:
          containerWidth = "var(--calendar-width)";
          gridTemplateColumns = "1fr";
      }

      // Animate the container
      await animate(
        scope.current,
        {
          width: containerWidth,
        },
        {
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1], // cubic-bezier
        }
      );
    };

    animateResize();
  }, [state, isMobile, animate, scope]);

  return scope;
}
