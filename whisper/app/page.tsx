"use client";

import { LandingPage } from "@/components/landing-page";

export interface Transcription {
  id: string;
  title: string;
  content: string;
  preview: string;
  timestamp: string;
  duration?: string;
}

export default function Home() {
  return <LandingPage />;
}
