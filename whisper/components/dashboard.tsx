"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search } from "lucide-react";
import { RecordingModal } from "@/components/RecordingModal";
import { UploadModal } from "./UploadModal";
import { formatWhisperTimestamp } from "@/lib/utils";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

// Define the Transcription type based on the TRPC router return type
interface Transcription {
  id: string;
  title: string;
  content: string;
  preview: string;
  timestamp: string;
}

interface DashboardProps {
  transcriptions: Transcription[];
}

export function Dashboard({ transcriptions }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [localTranscriptions, setLocalTranscriptions] =
    useState(transcriptions);
  const trpc = useTRPC();
  const deleteMutation = useMutation(
    trpc.whisper.deleteWhisper.mutationOptions()
  );

  // Desktop detection (simple window width check)
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const filteredTranscriptions = searchQuery
    ? localTranscriptions.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : localTranscriptions;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Note?")) return;
    // Optimistically remove from UI
    setLocalTranscriptions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (err) {
      // Rollback if error
      setLocalTranscriptions(transcriptions);
      alert(
        "Failed to delete. You may not own this Note or there was a network error."
      );
    }
  };

  const handleNewWhisper = () => {
    setShowRecordingModal(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.metaKey &&
        e.shiftKey &&
        (e.code === "Space" || e.key === " " || e.key === "Spacebar")
      ) {
        e.preventDefault();
        handleNewWhisper();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleUploadVoiceNote = () => {
    setShowUploadModal(true);
  };

  return (
    <>
      <div className="flex-1 h-full mx-auto w-full">
        <div className="mb-8">
          <div className="mx-auto max-w-[729px] w-full md:rounded-xl bg-white border-b-[0.7px] md:border-[0.7px] border-gray-200 md:border-[#d1d5dc] px-6 py-5 flex flex-col gap-3 md:my-4 ">
            <h1 className="text-xl font-semibold text-left text-[#101828]">
              Your Notes
            </h1>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Empty State or Transcriptions List */}
          {filteredTranscriptions.length === 0 && searchQuery === "" ? (
            <div className="text-center py-16 flex flex-col items-center">
              <h2 className="text-xl font-medium text-left text-black mb-2">
                Welcome, note-taker!
              </h2>
              <p className="max-w-[264px] text-base text-center text-[#364153] mb-8">
                Start by creating a new Note, or
                <br />
                upload a voice note for
                <br />
                transcription
              </p>
            </div>
          ) : (
            <div className="flex flex-col justify-start items-start relative space-y-4 mx-auto max-w-[727px]">
              {filteredTranscriptions.map((transcription) =>
                isDesktop ? (
                  <div key={transcription.id} className="relative w-full">
                    <Link
                      href={`/whispers/${transcription.id}`}
                      className="self-stretch flex-grow-0 flex-shrink-0 h-[121px] overflow-hidden group border-t-0 border-r-0 border-b-[0.7px] border-l-0 border-gray-200 md:border-[0.7px] md:border-transparent md:rounded-xl focus-within:bg-gray-50 focus-within:border-[#d1d5dc] hover:bg-gray-50 hover:border-[#d1d5dc] transition-all flex flex-col justify-between px-6 py-4 pr-14"
                      tabIndex={0}
                    >
                      <p className="text-base font-medium text-left text-[#101828] mb-2">
                        {transcription.title}
                      </p>
                      <p className="text-sm text-left text-[#4a5565] mb-4 line-clamp-2">
                        {transcription.preview}
                      </p>
                      <p className="text-xs text-left text-[#99a1af] mt-auto">
                        {formatWhisperTimestamp(transcription.timestamp)}
                      </p>
                    </Link>
                    <div className="absolute top-4 right-6 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 cursor-pointer rounded-md bg-transparent hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                            aria-label="More actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-5 h-5 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(transcription.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={`/whispers/${transcription.id}`}
                    key={transcription.id}
                    className="self-stretch flex-grow-0 flex-shrink-0 h-[121px] overflow-hidden group border-t-0 border-r-0 border-b-[0.7px] border-l-0 border-gray-200 md:border-[0.7px] md:border-transparent md:rounded-xl focus-within:bg-gray-50 focus-within:border-[#d1d5dc] hover:bg-gray-50 hover:border-[#d1d5dc] transition-all flex flex-col justify-between px-6 py-4"
                    tabIndex={0}
                  >
                    <p className="text-base font-medium text-left text-[#101828] mb-2">
                      {transcription.title}
                    </p>
                    <p className="text-sm text-left text-[#4a5565] mb-4 line-clamp-2">
                      {transcription.preview}
                    </p>
                    <p className="text-xs text-left text-[#99a1af] mt-auto">
                      {formatWhisperTimestamp(transcription.timestamp)}
                    </p>
                  </Link>
                )
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[688px] flex justify-center items-center px-6 pb-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-3 w-full">
            <Button
              variant="outline"
              size="lg"
              onClick={handleUploadVoiceNote}
              className="w-full rounded-lg bg-gray-100 border border-[#d1d5dc] text-base h-[42px]"
            >
              <img src="/upload.svg" className="w-5 h-5 size-5" />
              Upload Voice Note
            </Button>
            <Button
              size="lg"
              onClick={handleNewWhisper}
              className="w-full bg-[#101828] text-base text-left text-white rounded-lg h-[42px]"
            >
              <img src="/microphone.svg" className="w-5 h-5 size-5" />
              New Note
              {/* <img src="/command.svg" className="w-[87px] h-[16px]" /> */}
            </Button>
          </div>
        </div>
      </div>

      {/* Recording Modal */}
      {showRecordingModal && (
        <RecordingModal onClose={() => setShowRecordingModal(false)} />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </>
  );
}
