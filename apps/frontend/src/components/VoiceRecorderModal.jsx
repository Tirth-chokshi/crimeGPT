import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Square, Play, RefreshCw, Check, X, Globe, UploadCloud, AlertCircle } from "lucide-react";
import { api } from "../api";

export default function VoiceRecorderModal({ isOpen, onClose, onApplyTranscript, defaultLang = "en" }) {
  const [selectedLang, setSelectedLang] = useState(defaultLang === "gu" ? "gu-IN" : defaultLang === "hi" ? "hi-IN" : "en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [webSpeechSupported, setWebSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setWebSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    // Reset transcripts when modal opens
    if (isOpen) {
      setTranscript("");
      setInterimTranscript("");
      setErrorMsg("");
      setIsRecording(false);
    } else {
      stopRecording();
    }
  }, [isOpen]);

  const startRecording = () => {
    setErrorMsg("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLang;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event) => {
          let currentInterim = "";
          let finalAccumulated = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptText = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalAccumulated += transcriptText + " ";
            } else {
              currentInterim += transcriptText;
            }
          }

          if (finalAccumulated) {
            setTranscript((prev) => prev + finalAccumulated);
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setErrorMsg("Microphone permission was denied. Please allow microphone access in browser settings.");
          } else if (event.error !== "no-speech") {
            setErrorMsg(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          // If still marked as recording, restart (keeps listening)
          if (recognitionRef.current && isRecording) {
            try {
              recognition.start();
            } catch (e) {}
          } else {
            setIsRecording(false);
            setInterimTranscript("");
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.error("Failed to initialize speech recognition:", err);
        setErrorMsg("Failed to start speech recognition. You can record and upload audio below.");
      }
    } else {
      // Fallback: Browser MediaRecorder
      startMediaRecorderFallback();
    }
  };

  const startMediaRecorderFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsUploading(true);
        try {
          const langCode = selectedLang.split("-")[0];
          const res = await api.transcribeAudio(audioBlob, langCode);
          if (res.transcript) {
            setTranscript((prev) => prev + (prev ? " " : "") + res.transcript);
          } else if (res.error) {
            setErrorMsg(res.error);
          }
        } catch (err) {
          setErrorMsg("Transcription failed: " + err.message);
        } finally {
          setIsUploading(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      setErrorMsg("Microphone access failed: " + err.message);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript("");
  };

  const handleApply = () => {
    const fullText = (transcript + (interimTranscript ? " " + interimTranscript : "")).trim();
    if (fullText) {
      onApplyTranscript(fullText, selectedLang.split("-")[0]);
    }
    onClose();
  };

  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");
    try {
      const langCode = selectedLang.split("-")[0];
      const res = await api.transcribeAudio(file, langCode);
      if (res.transcript) {
        setTranscript((prev) => prev + (prev ? "\n" : "") + res.transcript);
      } else {
        setErrorMsg(res.error || "No speech detected in audio file");
      }
    } catch (err) {
      setErrorMsg("Failed to transcribe audio: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px"
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "640px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Mic size={20} color="var(--police-gold)" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#f8fafc" }}>
                Live Audio & Voice Statement Ingestion
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                Record oral complaint, victim testimony, or interrogation statements in Indian languages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          {/* Spoken Language Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label className="form-label" style={{ fontSize: "12px", marginBottom: "8px" }}>
              <Globe size={13} style={{ display: "inline", marginRight: "6px" }} /> Select Spoken Language:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[
                { code: "en-IN", label: "English (India)" },
                { code: "hi-IN", label: "हिन्दी (Hindi)" },
                { code: "gu-IN", label: "ગુજરાતી (Gujarati)" }
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  disabled={isRecording}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`btn ${selectedLang === lang.code ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: "12px", padding: "8px 12px", textAlign: "center" }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Central Pulsing Mic / Action Center */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              background: "rgba(15, 23, 42, 0.6)",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              marginBottom: "20px"
            }}
          >
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: isRecording
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: isRecording
                  ? "0 0 25px rgba(239, 68, 68, 0.6)"
                  : "0 0 20px rgba(245, 158, 11, 0.4)",
                transition: "all 0.3s ease",
                marginBottom: "12px"
              }}
            >
              {isRecording ? <Square size={28} /> : <Mic size={32} />}
            </button>

            <span
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: isRecording ? "#ef4444" : "#38bdf8"
              }}
            >
              {isRecording ? "🔴 Listening... Speak clearly into microphone" : "Click Microphone to Start Speaking"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              {webSpeechSupported ? "⚡ Powered by Native Indian ASR Engine" : "Backend Audio Streaming Mode"}
            </span>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#fca5a5",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Transcript Display Box */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label className="form-label" style={{ fontSize: "12px", margin: 0 }}>
                Live Speech Transcript (Editable):
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    cursor: "pointer"
                  }}
                >
                  Clear Transcript
                </button>
              )}
            </div>

            <textarea
              className="form-control"
              style={{
                minHeight: "120px",
                fontSize: "13.5px",
                lineHeight: "1.5",
                background: "rgba(7, 11, 20, 0.9)",
                borderColor: isRecording ? "var(--police-gold)" : "var(--border-subtle)"
              }}
              value={transcript + (interimTranscript ? " " + interimTranscript : "")}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Spoken words will appear here in real-time as you speak..."
            />
          </div>

          {/* Audio File Upload Fallback */}
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(15, 23, 42, 0.4)",
              borderRadius: "8px",
              border: "1px dashed var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UploadCloud size={16} color="var(--text-muted)" />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Or transcribe pre-recorded audio file (.webm, .mp3, .wav):
              </span>
            </div>
            <label
              className="btn btn-secondary"
              style={{ fontSize: "11px", padding: "4px 10px", margin: 0, cursor: "pointer" }}
            >
              {isUploading ? "Transcribing..." : "Choose Audio File"}
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileUpload}
                style={{ display: "none" }}
                disabled={isUploading || isRecording}
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            background: "rgba(15, 23, 42, 0.8)"
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: "13px" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!transcript.trim() && !interimTranscript.trim()}
            className="btn btn-primary"
            style={{ fontSize: "13px", padding: "8px 20px" }}
          >
            <Check size={16} /> Apply Transcript to Incident Narrative
          </button>
        </div>
      </div>
    </div>
  );
}
