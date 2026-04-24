"use client";

import { useState, useCallback } from "react";
import { loadSettings } from "./SettingsStore";
import type { Suggestion } from "./types";


// chat messages are only stored in memory, not persisted, since they can be regenerated from the transcript and settings
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}


// Custom hook to manage chat state and interactions
export function useChat(getTranscript: () => string) {

  // State for chat messages and loading status
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to send a user message and get assistant response
  const sendMessage = useCallback(async (userText: string) => {
    const settings = loadSettings();
    
     
    // Add user message to chat
    const userMsg: ChatMessage = {
      role: "user",
      content: userText,
      timestamp: Date.now(),
    };
    
    // Update messages state with the new user message and set loading state
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    
    // Add a placeholder assistant message that will be updated once the response is received
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    // Update messages state with the new assistant message
    setMessages((prev) => [...prev, assistantMsg]);

    
    // Prepare the transcript context and send the chat request to the backend API
    try {
      const transcript = getTranscript();
      const contextLines = transcript
        .split("\n")
        .slice(-settings.detailContextLines)
        .join("\n");
      
        // Send the chat request to the backend API with the user message, transcript context, and settings
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: settings.chatPrompt.replace("{{transcript}}", contextLines),
          transcript: contextLines,
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
    
      // Parse the response and update the assistant message with the received content
      const data = await res.json();
      const content = data.content ?? "No response received.";
      
      // Update the last message with the received content
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content,
        };
        return updated;
      });
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, getTranscript]);
  
  // Function to send a suggestion as a message
  const sendSuggestion = useCallback((suggestion: Suggestion) => {
    // Format the suggestion into a message format and send it using the sendMessage function
    const text = `**${suggestion.type.replace(/_/g, " ")}**: ${suggestion.preview}\n\n${suggestion.detail}`;
    sendMessage(text);
  }, [sendMessage]);

  return { messages, isLoading, sendMessage, sendSuggestion };
}