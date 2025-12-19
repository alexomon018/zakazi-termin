"use client"

import { domAnimation, LazyMotion } from 'framer-motion'

/**
 * LazyMotion wrapper for optimal bundle size
 * Only includes DOM animation features needed for the booking flow
 */
export function FramerMotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
