import type { AppMode } from "@/lib/modes";

// React Query key factory. Every hook in src/lib/queries/ builds its keys
// from here so invalidation stays consistent across the app.
export const queryKeys = {
  profile: (userId: string) => ["profile", userId] as const,
  entitlements: (userId: string) => ["entitlements", userId] as const,
  feed: (mode: AppMode) => ["feed", mode] as const,
  discover: (mode: AppMode) => ["discover", mode] as const,
  threads: (mode: AppMode) => ["threads", mode] as const,
  thread: (threadId: string) => ["thread", threadId] as const,
  messages: (threadId: string) => ["messages", threadId] as const,
  comments: (postId: string) => ["comments", postId] as const,
};
