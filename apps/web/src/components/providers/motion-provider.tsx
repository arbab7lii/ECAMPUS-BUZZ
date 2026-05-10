"use client";

import { MotionConfig, useReducedMotion } from "framer-motion";
import * as React from "react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}
