export const API_VERSION = "v1" as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 50
} as const;

export const NOTIFICATION_BADGE_MAX = 99 as const;

