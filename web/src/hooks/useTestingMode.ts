"use client";

import { useCallback, useEffect, useState } from "react";
import { readTestingMode, writeTestingMode } from "@/lib/testing-mode";

export function useTestingMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readTestingMode());
  }, []);

  const setTestingMode = useCallback((next: boolean) => {
    setEnabled(next);
    writeTestingMode(next);
  }, []);

  return [enabled, setTestingMode] as const;
}
