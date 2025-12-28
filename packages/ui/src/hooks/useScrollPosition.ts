"use client";

import { useEffect, useState } from "react";

export function useScrollPosition(threshold = 0) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const currentPosition = window.scrollY;
      setScrollPosition(currentPosition);
      setIsScrolled(currentPosition > threshold);
    };

    window.addEventListener("scroll", updatePosition);
    updatePosition(); // Initial check

    return () => window.removeEventListener("scroll", updatePosition);
  }, [threshold]);

  return { scrollPosition, isScrolled };
}
