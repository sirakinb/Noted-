import React from "react";

export function RecordingMinutesLeft({ minutesLeft }: { minutesLeft: number }) {
  return (
    <div className="text-sm flex flex-row items-center gap-1">
      <span className="font-light text-[#4a5565]">Recording minutes left:</span>
      <span className="text-[#101828] font-medium">
        {minutesLeft === Infinity ? "∞" : minutesLeft}
      </span>
    </div>
  );
}
