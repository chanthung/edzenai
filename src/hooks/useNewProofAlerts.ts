import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

const SOUND_KEY = "edzen_proof_alert_sound";

export function useProofAlertSoundPref() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? true : v === "1";
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  return { enabled, toggle };
}

export function useNewProofAlerts(schoolId: string | undefined | null) {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!schoolId) return;

    if (!audioRef.current && typeof Audio !== "undefined") {
      try {
        audioRef.current = new Audio("/notify.mp3");
        audioRef.current.preload = "auto";
        audioRef.current.volume = 0.6;
      } catch {}
    }

    const channel = supabase
      .channel(`payment-proofs-${schoolId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payment_proofs",
          filter: `school_id=eq.${schoolId}`,
        },
        async (payload) => {
          const row: any = payload.new;
          if (!row?.id || seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);

          // Lookup student name
          let studentName = "Student";
          try {
            const { data: s } = await supabase
              .from("students")
              .select("name")
              .eq("id", row.student_id)
              .maybeSingle();
            if (s?.name) studentName = s.name;
          } catch {}

          const amount = row.amount_paid ?? row.ocr_amount;
          const amountText = amount ? formatCurrency(Number(amount)) : "Payment";

          toast.success(`New payment submitted: ${amountText} – ${studentName}`, {
            duration: 6000,
          });

          // Play sound if enabled
          const enabled = (() => {
            try {
              const v = localStorage.getItem(SOUND_KEY);
              return v === null ? true : v === "1";
            } catch {
              return true;
            }
          })();

          if (enabled && audioRef.current) {
            try {
              audioRef.current.currentTime = 0;
              const p = audioRef.current.play();
              if (p && typeof p.catch === "function") p.catch(() => {});
            } catch {}
          }

          // Refresh pending proofs list
          queryClient.invalidateQueries({ queryKey: ["payment-proofs"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, queryClient]);
}
