import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { RECORDING_TYPES } from "@/lib/utils";
import { useLimits } from "./hooks/useLimits";

export function TransformDropdown({
  onTransform,
  isStreaming = false,
}: {
  onTransform: (type: string) => void;
  isStreaming?: boolean;
}) {
  const { isLoading, transformationsData } = useLimits();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        asChild
        disabled={
          isStreaming || isLoading || transformationsData?.remaining === 0
        }
      >
        <button
          className={`w-full md:max-w-[322px] max-w-md py-2 rounded-lg font-semibold text-base flex items-center justify-center gap-2 cursor-pointer transition-colors
            ${
              isStreaming
                ? "bg-slate-100 text-slate-400"
                : "bg-slate-900 text-white"
            }
          `}
        >
          <img src="/sparkFull.svg" className="size-5 min-w-5 min-h-5" />
          <span>{isStreaming ? "Streaming ..." : "Transform"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="!p-0">
        {RECORDING_TYPES.map((type) => (
          <DropdownMenuItem
            key={type.value}
            onSelect={() => onTransform(type.value)}
            className="flex items-center gap-2 cursor-pointer h-[51px] p-3 border-b border-slate-200 hover:bg-slate-50 min-w-[322px] max-w-full"
          >
            <img
              src={`/recordings/${type.value}.svg`}
              className="size-[18px] min-w-[18px]"
            />
            <span>{type.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
