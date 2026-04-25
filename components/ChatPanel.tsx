"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@/lib/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import type { Suggestion } from "@/lib/types";


// The main chat panel component that displays the conversation and handles user input
interface Props {
  getTranscript: () => string;
  pendingSuggestion?: Suggestion | null;
  onSuggestionConsumed?: () => void;
}

// Displays the chat messages and an input box. It also handles sending messages and suggestions to the chat hook.
export default function ChatPanel({ getTranscript, pendingSuggestion, onSuggestionConsumed }: Props) {
  const { messages, isLoading, sendMessage, sendSuggestion } = useChat(getTranscript);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (pendingSuggestion) {
      sendSuggestion(pendingSuggestion as any);
      onSuggestionConsumed?.();
    }
  }, [pendingSuggestion]);
  
  // Handle sending a message when the user clicks send or presses Enter
  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  }

  // Format
  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-full p-4">

      {}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">

        {}
        <div className="border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Clicking a suggestion adds it to this chat and streams a detailed answer (separate prompt, more context). User can also type questions directly. One continuous chat per session — no login, no persistence.
          </p>
        </div>
        {messages.length === 0 && (
          <div className="flex items-center justify-center mt-10">
            <p className="text-slate-500 text-sm text-center">
              Click a suggestion or type a question below.
            </p>
          </div>
        
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            
            {}
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {msg.role === "user" 
                ? `You${msg.label ? ` · ${msg.label}` : ""}` 
                : "Assistant"}
            </span>

            <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-slate-800 text-slate-100"
                : "bg-slate-800 text-slate-100"
            }`}>
              {msg.content ? (
                <ReactMarkdown
                  components={{
                    strong: ({ children }) => <span className="font-semibold">{children}</span>,
                    table: ({ children }) => <table className="text-xs border-collapse mt-2 w-full">{children}</table>,
                    th: ({ children }) => <th className="border border-slate-600 px-2 py-1 text-left text-slate-300">{children}</th>,
                    td: ({ children }) => <td className="border border-slate-600 px-2 py-1 text-slate-400">{children}</td>,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                    h1: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
                    h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
                    h3: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <span className="animate-pulse text-slate-400">Thinking…</span>
              )}
            </div>
            <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {}
      <div className="flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask anything..."
          className="bg-slate-800 border-slate-600 text-sm"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
        >
          Send
        </Button>
      </div>
    </div>
  );
}