import type { Metadata } from "next";
import { PlayClient } from "./PlayClient";

export const metadata: Metadata = {
  title: "Explore",
  alternates: { canonical: "/play" },
  description: "Walk the world.",
};

export default function PlayPage() {
  return <PlayClient />;
}
