"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAppMounted } from "@/components/providers";
import { DashboardView } from "@/components/dashboard-view";

export default function RootPage() {
  const router = useRouter();
  const [shouldRedirect] = useState(!getAppMounted());

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/portfolio");
    }
  }, [shouldRedirect, router]);

  if (shouldRedirect) {
    return null;
  }

  return <DashboardView />;
}
