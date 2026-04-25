import { useCallback, useEffect, useRef } from "react";
import { useStore } from "./store";
import { loadSettings } from "./SettingsStore";

// Custom hook to manage fetching suggestions based on the transcript and settings
export function useSuggestions() {

  // Access transcript lines and suggestion-related state from the store
  const transcriptLines = useStore((s) => s.transcriptLines);
  const addSuggestionBatch = useStore((s) => s.addSuggestionBatch);
  const isFetching = useStore((s) => s.isFetchingSuggestions);
  const isRecording = useStore((s) => s.isRecording);
  const prevRecording = useRef(false);
  const setIsFetching = useStore((s) => s.setIsFetchingSuggestions);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchSuggestionsRef = useRef<(() => Promise<void>) | null>(null);
  const hasStarted = useRef(false);
  const lastTranscriptLength = useRef(0);
  
  const fetchSuggestions = useCallback(async (force = false) => {
    // Prevent multiple simultaneous fetches
    if (isFetching) return;

    // Skip if transcript hasn't grown — unless forced by reload button
    if (!force && transcriptLines.length === lastTranscriptLength.current) return;
    lastTranscriptLength.current = transcriptLines.length;

    const settings = loadSettings();
    if (transcriptLines.length === 0) return;

    // Prepare transcript context
    const transcriptText = transcriptLines
      .slice(-settings.suggestionContextLines)
      .map((line) => `${line.timestamp} ${line.text}`)
      .join("\n");

    setIsFetching(true);
    
    // Make the API call to fetch suggestions based on the prepared transcript context and settings
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          prompt: settings.suggestionPrompt
        }),
      });
      
      // Parse the response and add the received suggestions to the store
      const data = await res.json();
      console.log("Suggestions response:", data);
      if (data.suggestions?.length > 0) {
        addSuggestionBatch(data.suggestions);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setIsFetching(false);
    }
  }, [transcriptLines, isFetching, addSuggestionBatch, setIsFetching]);
  
  // Keep a ref to the fetchSuggestions function to use inside setInterval
  useEffect(() => {
    fetchSuggestionsRef.current = fetchSuggestions;
  }, [fetchSuggestions]);

  
  
  // Trigger once transcript has meaningful content, then every 30s
  useEffect(() => {
    const totalWords = transcriptLines
      .map((l) => l.text)
      .join(" ")
      .split(" ")
      .filter(Boolean).length;
      
    
    if (totalWords > 10 && !hasStarted.current && isRecording) {
      hasStarted.current = true;
      fetchSuggestionsRef.current?.();
      intervalRef.current = setInterval(() => {
        fetchSuggestionsRef.current?.();
      }, 30000);
    }
  }, [transcriptLines, isRecording]);



    // Stop when recording stops
  useEffect(() => {
    if (!isRecording) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      hasStarted.current = false;
    }
  }, [isRecording]);

  // Reset when transcript cleared
  useEffect(() => {
    if (transcriptLines.length === 0) {
      hasStarted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [transcriptLines.length]);

return { fetchSuggestions, isFetching };
}