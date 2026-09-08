import type { Metadata } from "next";
import { LookDevClient } from "./LookDevClient";

/**
 * Phase 1 gate — the look-dev route.
 *
 * Not linked from anywhere and not indexed. It exists to answer one question
 * in isolation: does the anime look land? Delete it once the zones exist.
 */
export const metadata: Metadata = {
  title: "Look Dev",
  robots: { index: false, follow: false },
};

export default function LookDevPage() {
  return <LookDevClient />;
}
