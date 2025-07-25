import TranscriptionPageClient from "./TranscriptionPageClient";
import { Metadata } from "next";
import { PrismaClient } from "@/lib/generated/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const prisma = new PrismaClient();
  const whisper = await prisma.whisper.findUnique({
    where: { id },
    select: { title: true, fullTranscription: true },
  });
  await prisma.$disconnect();
  if (!whisper) {
    return {
      title: "Whisper Not Found",
      description: "The requested transcription could not be found.",
    };
  }
  return {
    title: `${whisper.title.slice(0, 60)} - Whisper App`,
    description:
      whisper.fullTranscription?.slice(0, 160) ||
      "View and edit your transcription.",
  };
}

export default async function TranscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TranscriptionPageClient id={id} />;
}
