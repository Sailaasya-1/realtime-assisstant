"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";
import { useSuggestions } from "@/lib/useSuggestions";
import SuggestionCard from "./SuggestionCard";
import { Suggestion } from "@/lib/types";

interface Props {
  getTranscript?: () => string;
  onSuggestionClick: (suggestion: Suggestion) => void;
}

// The SuggestionsPanel component displays batches of suggestions generated from the transcript context. 
// It includes a manual refresh button and an auto-refresh mechanism that triggers every ~30 seconds. 
// Each batch of suggestions fades as new batches arrive, and users can click on individual suggestions to take action.

export default function SuggestionsPanel({ onSuggestionClick }: Props) {
  const suggestionBatches = useStore((s) => s.suggestionBatches);
  const { fetchSuggestions, isFetching } = useSuggestions();
  const [countdown, setCountdown] = useState(30);
  const prevBatchCount = useRef(0);
  const hasStarted = useRef(false);

  const handleRefresh = useCallback(() => {
    fetchSuggestions();
    setCountdown(30);
  }, [fetchSuggestions]);

  // Single countdown interval — starts once recording begins, never restarts
  useEffect(() => {
    if (suggestionBatches.length === 0 || hasStarted.current) return;
    hasStarted.current = true;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [suggestionBatches.length]);

  // Trigger fetch when countdown hits 1
  useEffect(() => {
    if (countdown === 1 && suggestionBatches.length > 0 && !isFetching) {
      fetchSuggestions();
    }
  }, [countdown]);

  // Reset countdown when new batch arrives
  // Always tick — regardless of batches
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full p-4">

      {}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="text-xs text-slate-400 hover:text-slate-100 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 flex items-center gap-1"
        >
          <span>↻</span>
          <span>{isFetching ? "Refreshing..." : "Reload suggestions"}</span>
        </button>
        <span className="text-xs text-slate-400 px-2 py-1">
          {suggestionBatches.length === 0 ? "auto-refresh in 30s" : `auto-refresh in ${countdown}s`}
        </span>
      </div>

      {}
      <div className="border border-slate-700 rounded-lg p-3 mb-3 shrink-0">
        <p className="text-xs text-slate-400 leading-relaxed">
          On reload (or auto every ~30s), generate <strong className="text-slate-300">3 fresh suggestions</strong> from recent transcript context. New batch appears at the top; older batches push down (faded). Each is a tappable card: a <span className="text-blue-400">question to ask</span>, a <span className="text-purple-400">talking point</span>, an <span className="text-green-400">answer</span>, or a <span className="text-yellow-400">fact-check</span>. The preview alone should already be useful.
        </p>
      </div>

      {}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {suggestionBatches.length === 0 && isFetching ? (
          // Loading state — fetching first batch
          <div className="flex justify-center mt-7">
            <p className="text-slate-400 text-sm text-center animate-pulse">
              Generating suggestions...
            </p>
          </div>
        ) : suggestionBatches.length === 0 ? (
          // Empty state — not yet started
          <div className="flex justify-center mt-7">
            <p className="text-slate-500 text-sm text-center">
              Suggestions appear here once recording starts.
            </p>
          </div>
        ) : (
          // Batches — show all
          suggestionBatches.map((batch, index) => {
            const opacity = index === 0 ? "opacity-100" : index === 1 ? "opacity-60" : "opacity-40";
            return (
              <div key={batch.id} className={`transition-opacity ${opacity}`}>
                <p className="text-xs text-slate-600 text-center mb-2">
                  — Batch {suggestionBatches.length - index} · {new Date(batch.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} —
                </p>
                <div className="space-y-2">
                  {batch.suggestions.map((s, i) => (
                    <SuggestionCard key={i} suggestion={s} onSelect={onSuggestionClick} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
