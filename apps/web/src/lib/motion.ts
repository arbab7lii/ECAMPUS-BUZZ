const easeOut = [0.25, 0.46, 0.45, 0.94] as const;

export const pageFadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: easeOut }
};

/** Auth card entrance — pairs with MotionConfig reduced-motion. */
export const authFormReveal = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.4, ease: easeOut }
};

export const cardHover = {
  whileHover: { y: -3, scale: 1.01 },
  transition: { type: "spring", stiffness: 360, damping: 24 }
};
