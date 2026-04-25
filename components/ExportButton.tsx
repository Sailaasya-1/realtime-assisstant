"use client";

import { Button } from "@/components/ui/button";
import { useExport } from "@/lib/useExport";
import type { ExportSession } from "@/lib/types";

// A button component that allows the user to export the current session, including the transcript, suggestions, and chat history. 
interface Props {
  transcript: Array<{ timestamp: string; text: string }>;
  suggestionBatches: Array<{
    timestamp: number;
    suggestions: any[];
  }>;
  chatMessages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
}


// When clicked, it compiles the session data into a structured format and triggers
export default function ExportButton({
  transcript,
  suggestionBatches,
  chatMessages,
}: Props) {
  const { exportSession } = useExport();
  

  // When clicked, it compiles the session data into a structured format and triggers the export function.
  function handleExport() {
    if (transcript.length === 0 && chatMessages.length === 0) {
      alert("Nothing to export. Record a meeting first.");
      return;
    } 
    
    // Compile the session data into a structured format for export
    const data: ExportSession = {
      exportedAt: new Date().toISOString(),
      transcript,
      suggestionBatches: suggestionBatches.map((batch) => ({
        timestamp: new Date(batch.timestamp).toISOString(),
        suggestions: batch.suggestions,
      })),
      chatHistory: chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toISOString(),
      })),
    };

    exportSession(data);
  }

  return (
    
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport}
      className="text-slate-400"
    > Export
    </Button>
  );
}