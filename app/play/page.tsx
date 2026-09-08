import type { Metadata } from "next";
import { PlayClient } from "./PlayClient";

export const metadata: Metadata = {
  title: "Explore",
  description: "Walk the world.",
};

export default function PlayPage() {
  return <PlayClient />;
}
