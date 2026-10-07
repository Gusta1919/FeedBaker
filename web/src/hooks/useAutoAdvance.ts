"use client";

import { useCallback, useEffect, useState } from "react";
import { readAutoAdvance, writeAutoAdvance } from "@/lib/auto-advance";

export function useAutoAdvance() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readAutoAdvance());
  }, []);

  const setAutoAdvance = useCallback((next: boolean) => {
    setEnabled(next);
    writeAutoAdvance(next);
  }, []);

  return [enabled, setAutoAdvance] as const;
}
