"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faStop } from "@fortawesome/free-solid-svg-icons";

export type RecordedAudio = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  previewUrl: string;
  fileName: string;
};

function chooseMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? "";
}

function normalizeAudioMime(mimeType: string) {
  return mimeType.split(";")[0]?.trim().toLowerCase() || mimeType.trim().toLowerCase() || "audio/webm";
}

export function AudioRecorder({
  disabled,
  onRecorded,
}: {
  disabled?: boolean;
  onRecorded: (audio: RecordedAudio) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined",
    );
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = chooseMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const durationMs = Math.max(1, Date.now() - startAtRef.current);
        const rawMime = recorder.mimeType || "audio/webm";
        const normalizedMime = normalizeAudioMime(rawMime);
        const blob = new Blob(chunksRef.current, { type: normalizedMime });
        const previewUrl = URL.createObjectURL(blob);
        const ext = normalizedMime.includes("mp4") ? "m4a" : normalizedMime.includes("ogg") ? "ogg" : "webm";

        onRecorded({
          blob,
          mimeType: normalizedMime,
          durationMs,
          previewUrl,
          fileName: `nota-audio-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`,
        });

        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRef.current = recorder;
      startAtRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = window.setInterval(() => setElapsedMs(Date.now() - startAtRef.current), 200);
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo acceder al micrófono.");
    }
  }

  function stop() {
    if (!mediaRef.current || mediaRef.current.state === "inactive") return;
    mediaRef.current.stop();
    mediaRef.current = null;
    if (timerRef.current != null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {!recording ? (
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          aria-label="Grabar nota de audio"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-zinc-700 disabled:opacity-50"
          title="Grabar audio"
        >
          <FontAwesomeIcon icon={faMicrophone} className="h-4 w-4" />
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={stop}
            aria-label="Detener grabación"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-500 px-3 text-sm font-semibold text-white"
          >
            <FontAwesomeIcon icon={faStop} className="h-3.5 w-3.5" />
            Detener
          </button>
          <span className="text-xs font-semibold text-red-600">{(elapsedMs / 1000).toFixed(1)}s</span>
        </>
      )}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

