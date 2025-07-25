"use client";

import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { useUser } from "@clerk/nextjs";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export interface Transcription {
  id: string;
  title: string;
  content: string;
  preview: string;
  timestamp: string;
  duration?: string;
}

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <img
        src="/spinner.svg"
        alt="Loading..."
        className="w-8 h-8 animate-spin"
      />
    </div>
  );
}

export default function WhispersPage() {
  const router = useRouter();
  const { user } = useUser();
  const trpc = useTRPC();

  useEffect(() => {
    if (user === null) {
      router.push("/");
    }
  }, [user, router]);

  const { data: transcriptions = [], isLoading } = useQuery(
    trpc.whisper.listWhispers.queryOptions(undefined, {
      enabled: !!user?.id,
    })
  );

  if (isLoading) {
    return <Spinner />;
  }

  return <Dashboard transcriptions={transcriptions} />;
}
