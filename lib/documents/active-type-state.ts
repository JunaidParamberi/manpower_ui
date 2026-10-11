"use client";

import { useEffect, useState } from "react";
import type { DocumentType } from "@/types";

let _activeType: DocumentType | null = null;
const _listeners = new Set<(type: DocumentType | null) => void>();

export function setActiveDocumentType(type: DocumentType | null): void {
  _activeType = type;
  _listeners.forEach((fn) => fn(type));
}

export function useActiveDocumentType(): DocumentType | null {
  // Always start null to match server render — sync via effect after hydration.
  const [type, setType] = useState<DocumentType | null>(null);
  useEffect(() => {
    setType(_activeType);
    _listeners.add(setType);
    return () => { _listeners.delete(setType); };
  }, []);
  return type;
}
