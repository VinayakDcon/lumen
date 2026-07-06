// src/components/load-people.tsx
"use client";

import { useEffect } from "react";
import { usePmoStore } from "@/store/use-pmo-store";

export default function LoadPeople() {
  useEffect(() => {
    // Load people once on client side
    usePmoStore.getState().loadPeople().catch(console.error);
  }, []);

  return null;
}
