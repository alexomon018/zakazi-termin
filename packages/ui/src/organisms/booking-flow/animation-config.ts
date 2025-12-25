import type { Transition, Variants } from "framer-motion";

/**
 * Animation variants for booking flow components
 */

// Fade in from left (for time slots panel)
export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      ease: "easeInOut",
      delay: 0.1,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// Fade in from right
export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      ease: "easeInOut",
      delay: 0.1,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
    },
  },
};

// Fade in from bottom
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ease: "easeInOut",
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// Container for staggered children
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

// Individual item in staggered list
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ease: "easeOut",
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

// Scale animation for buttons
export const scaleOnHover: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// Resize transition for layout changes
export const resizeTransition: Transition = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1], // cubic-bezier
};

// Month transition (slide in/out)
export const createMonthTransition = (direction: "next" | "prev"): Variants => ({
  hidden: {
    opacity: 0,
    x: direction === "next" ? 20 : -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  exit: {
    opacity: 0,
    x: direction === "next" ? -20 : 20,
    transition: {
      duration: 0.25,
    },
  },
});

// Width animation for confirm button
export const confirmButtonAnimation: Variants = {
  hidden: {
    width: 0,
    opacity: 0,
    marginTop: 0,
  },
  visible: {
    width: "auto",
    opacity: 1,
    marginTop: 16,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  exit: {
    width: 0,
    opacity: 0,
    marginTop: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Pulse animation for loading states
export const pulse: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
};

// Shake animation for errors
export const shake: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};
