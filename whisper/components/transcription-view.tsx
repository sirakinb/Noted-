"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit3, Save, Trash2, Plus, Mic } from "lucide-react";
import { RecordingModal } from "@/components/RecordingModal";
import type { Transcription } from "@/app/page";
import { useRouter } from "next/navigation";

interface TranscriptionViewProps {
  transcription: Transcription;
  onUpdate: (transcription: Transcription) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function TranscriptionView({
  transcription,
  onUpdate,
  onDelete,
  onBack,
}: TranscriptionViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(transcription.title);
  const [editedContent, setEditedContent] = useState(transcription.content);
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    const preview =
      editedContent.length > 100
        ? editedContent.substring(0, 100) + "..."
        : editedContent;

    onUpdate({
      ...transcription,
      title: editedTitle,
      content: editedContent,
      preview,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(transcription.title);
    setEditedContent(transcription.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this transcription?")) {
      onDelete(transcription.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/")}
            >
              <Mic className="w-6 h-6" />
              <span className="text-xl font-semibold">Note</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Extra
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          {/* Title */}
          <div className="mb-6">
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold border-none px-0 focus-visible:ring-0"
                placeholder="Transcription title..."
              />
            ) : (
              <h1 className="text-2xl font-bold">{transcription.title}</h1>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>{transcription.timestamp}</span>
              {transcription.duration && <span>{transcription.duration}</span>}
            </div>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[400px] text-base leading-relaxed resize-none border-none px-0 focus-visible:ring-0"
                placeholder="Your transcription content..."
              />
            ) : (
              <div className="text-base leading-relaxed whitespace-pre-wrap">
                {transcription.content}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Extra Modal */}
      {showAddModal && (
        <RecordingModal
          onClose={() => setShowAddModal(false)}
          title="Add Extra Recording"
        />
      )}
    </div>
  );
}
