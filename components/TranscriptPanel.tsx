"use client";

import { useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { loadSettings } from "@/lib/SettingsStore";

// The TranscriptPanel component manages audio recording, transcription, and display of the transcript. 
// It uses the MediaRecorder API to capture audio in chunks, sends them to the server for transcription, and appends the results to the transcript display.
export default function TranscriptPanel({ onTranscriptUpdate }: { onTranscriptUpdate?: (text: string) => void }) {
  const transcriptLines = useStore((s) => s.transcriptLines);
  const appendTranscript = useStore((s) => s.appendTranscript);
  const isRecording = useStore((s) => s.isRecording);
  const setIsRecording = useStore((s) => s.setIsRecording);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // Scroll to the bottom of the transcript whenever new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptLines]);
  

  // Start recording audio in chunks and handle transcription
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setIsRecording(true);
    
    // Function to start recording a chunk of audio
    const startChunk = () => {
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];
      
      // When data is available, push it to the chunks array
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (blob.size > 1000) await transcribeBlob(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    };
    
    // Start the first chunk immediately
    //set up an interval to stop and start new chunks every ~30 seconds
    startChunk();
    intervalRef.current = setInterval(() => {
      mediaRecorderRef.current?.stop();
      startChunk();
    }, 3000);
  }
  
  // Stop recording and clear the interval
  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRecording(false);
  }
  
  // Send the audio blob to the server for transcription and handle the response
  async function transcribeBlob(blob: Blob) {
    const settings = loadSettings();
    
    // Prepare the form data with the audio blob and API key
    const formData = new FormData();
    formData.append("audio", blob, "chunk.webm");
    
    // Send the audio blob to the server for transcription
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      
      // Handle rate limiting
      if (res.status === 429) {
        console.warn("Rate limited — skipping chunk");
        return;
      }

      if (!res.ok) return;
      
      // Parse the response and append the transcribed text to the transcript
      const data = await res.json();
      if (data.text?.trim()) {
        appendTranscript(data.text.trim());
        onTranscriptUpdate?.(data.text.trim());
      }
    } catch (err) {
      console.error("Transcribe error:", err);
    }
  }

  return (
    <div className="flex flex-col h-full p-4">

      <div className="flex items-center gap-3 mb-3 shrink-0">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors relative ${
            isRecording ? "bg-red-500" : "bg-blue-600"
          }`}
        >
          {isRecording && (
            <>
              <span className="absolute w-10 h-10 rounded-full bg-red-500 animate-ping opacity-50" />
              <span className="absolute w-10 h-10 rounded-full bg-red-500 animate-ping opacity-30" />
            </>
          )}
          <span className={`w-3 h-3 rounded-full relative z-10 ${
            isRecording ? "bg-white" : "bg-black"
          }`} />
        </button>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">
            Click mic to start. Transcript appends every ~30s.
          </span>
        </div>
      </div>

      <div className="border border-slate-700 rounded-lg p-3 mb-3 shrink-0">
        <p className="text-xs text-slate-400 leading-relaxed">
          The transcript scrolls and appends new chunks every ~30 seconds while recording. Use the mic button to start/stop. Include an export button (not shown) so we can pull the full session.
        </p>
      </div>

      {/* overflow-y-auto — scrollbar only appears when content exceeds height */}
      <div ref={scrollRef} className={`flex-1 space-y-2 pr-1 ${transcriptLines.length > 0 ? "overflow-y-auto" : "overflow-hidden"}`}>
        {transcriptLines.length === 0 ? (
          <div className="h-full flex justify-center mt-7">
            <p className="text-slate-500 text-sm text-center">
              No transcript yet — start the mic.
            </p>
          </div>
        ) : (
          transcriptLines.map((line, i) => (
            <p key={i} className="text-sm text-slate-300 leading-relaxed">
              <span className="text-slate-500 text-xs mr-2">{line.timestamp}</span>
              {line.text}
            </p>
          ))
        )}
      </div>

    </div>
  );
  }