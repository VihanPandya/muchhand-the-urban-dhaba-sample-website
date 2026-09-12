"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";

export function MarkAllRead() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const markAll = async () => {
    setBusy(true);
    try {
      await api.put("/api/admin/notifications", { all: true });
      router.refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update notifications.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={markAll} className="btn btn-sm btn-outline" disabled={busy}>
      {busy ? "Updating…" : "Mark all as read"}
    </button>
  );
}
