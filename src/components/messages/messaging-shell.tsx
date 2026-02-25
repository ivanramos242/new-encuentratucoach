"use client";

import { useEffect, useMemo, useState } from "react";
import { ThreadList } from "@/components/messages/thread-list";
import { ChatThread } from "@/components/messages/chat-thread";
import type { MessageThreadDetailDto, MessageThreadSummaryDto, MessagingRole } from "@/types/messages";

type ThreadsResponse = {
  ok: boolean;
  threads?: MessageThreadSummaryDto[];
  pollIntervalMs?: number;
  message?: string;
};

function mergeThreadSummary(
  list: MessageThreadSummaryDto[],
  updated: MessageThreadSummaryDto,
) {
  const map = new Map(list.map((thread) => [thread.id, thread]));
  map.set(updated.id, { ...(map.get(updated.id) ?? updated), ...updated });
  return [...map.values()].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
}

export function MessagingShell({
  role,
  initialThreads,
  initialThread,
}: {
  role: MessagingRole;
  initialThreads: MessageThreadSummaryDto[];
  initialThread?: MessageThreadDetailDto | null;
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [selectedThread, setSelectedThread] = useState<MessageThreadDetailDto | null>(initialThread ?? null);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadsPollMs, setThreadsPollMs] = useState(5000);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    setSelectedThread(initialThread ?? null);
  }, [initialThread]);

  async function refreshThreads() {
    setLoadingThreads(true);
    try {
      const res = await fetch("/api/messages/threads?mode=inbox", { cache: "no-store" });
      const payload = (await res.json()) as ThreadsResponse;
      if (res.ok && payload.ok && payload.threads) {
        setThreads(payload.threads);
        if (typeof payload.pollIntervalMs === "number" && payload.pollIntervalMs > 0) {
          setThreadsPollMs(payload.pollIntervalMs);
        }
      }
    } finally {
      setLoadingThreads(false);
    }
  }

  useEffect(() => {
    let timeoutId: number | null = null;
    let canceled = false;
    const loop = async () => {
      if (canceled) return;
      await refreshThreads();
      if (canceled) return;
      const jitter = Math.round(threadsPollMs * Math.random() * 0.15);
      timeoutId = window.setTimeout(loop, Math.max(4000, threadsPollMs) + jitter);
    };
    timeoutId = window.setTimeout(loop, Math.max(3000, threadsPollMs));
    return () => {
      canceled = true;
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [threadsPollMs]);

  const selectedSummaryId = selectedThread?.id ?? null;
  const placeholder = useMemo(
    () => (
      <section className="hidden min-h-[60vh] items-center justify-center rounded-3xl border border-black/10 bg-white p-8 text-center text-zinc-500 shadow-sm md:flex">
        <div>
          <p className="text-lg font-black tracking-tight text-zinc-900">Selecciona una conversación</p>
          <p className="mt-2 max-w-md text-sm leading-6">
            Tu inbox interno está listo para mensajes con coaches/clientes, adjuntos e incluso notas de audio (MVP).
          </p>
        </div>
      </section>
    ),
    [],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className={selectedThread ? "hidden xl:block" : ""}>
        <ThreadList
          role={role}
          threads={threads}
          selectedThreadId={selectedSummaryId}
          onRefresh={refreshThreads}
          loading={loadingThreads}
        />
      </div>

      <div className="min-w-0">
        {selectedThread ? (
          <ChatThread
            role={role}
            initialThread={selectedThread}
            onThreadUpdate={(updatedThread) => {
              setSelectedThread(updatedThread);
              const summary: MessageThreadSummaryDto = {
                id: updatedThread.id,
                clientUserId: updatedThread.clientUserId,
                clientName: updatedThread.clientName,
                coachUserId: updatedThread.coachUserId,
                coachProfileId: updatedThread.coachProfileId,
                coachName: updatedThread.coachName,
                coachSlug: updatedThread.coachSlug,
                coachMembershipActive: updatedThread.coachMembershipActive,
                status: updatedThread.status,
                unreadForCoach: updatedThread.unreadForCoach,
                unreadForClient: updatedThread.unreadForClient,
                lastMessageAt: updatedThread.lastMessageAt,
                createdAt: updatedThread.createdAt,
                messagesCount: updatedThread.messagesCount,
                lastMessagePreview: updatedThread.lastMessagePreview,
              };
              setThreads((prev) => mergeThreadSummary(prev, summary));
            }}
          />
        ) : (
          placeholder
        )}
      </div>
    </div>
  );
}
