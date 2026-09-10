import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ministryLogo from "@/assets/images/ministry-of-labor-logo.png";
import liberianFlag from "@/assets/liberian-flag-wave.png";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const GREETING = "Hi, welcome to LiJOBS! What brings you to LiJOBS today? Is there anything specific you are looking for?";

async function getAIResponse(message: string, history: Message[]): Promise<string> {
  try {
    const response = await fetch("/api/ai-assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.slice(-10) }),
    });
    if (!response.ok) throw new Error("Chat failed");
    const data = await response.json();
    return data.reply || "I'm sorry, I couldn't process that. Could you try again?";
  } catch (err) {
    console.error("AI chat error:", err);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [orbPulse, setOrbPulse] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const callActiveRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pendingCloseRef = useRef(false);
  const endCallRef = useRef<() => void>(() => {});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCallActive]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        endCallRef.current();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const speakWithElevenLabs = useCallback(async (text: string) => {
    if (!callActiveRef.current) return;
    setIsSpeaking(true);
    setOrbPulse(true);

    try {
      const response = await fetch("/api/ai-assistant/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      const handleAudioEnd = () => {
        setIsSpeaking(false);
        setOrbPulse(false);
        URL.revokeObjectURL(audioUrl);
        audioPlayerRef.current = null;
        if (pendingCloseRef.current) {
          setTimeout(() => {
            callActiveRef.current = false;
            setIsCallActive(false);
            setIsOpen(false);
            setMessages([]);
            setShowChat(false);
            setIsProcessing(false);
            setCurrentTranscript("");
            pendingCloseRef.current = false;
          }, 1500);
        } else if (callActiveRef.current) {
          startListening();
        }
      };

      audio.onended = handleAudioEnd;
      audio.onerror = handleAudioEnd;

      await audio.play();
    } catch (err) {
      console.error("ElevenLabs TTS error:", err);
      setIsSpeaking(false);
      setOrbPulse(false);
      audioPlayerRef.current = null;
      if (pendingCloseRef.current) {
        setTimeout(() => {
          callActiveRef.current = false;
          setIsCallActive(false);
          setIsOpen(false);
          setMessages([]);
          setShowChat(false);
          setIsProcessing(false);
          setCurrentTranscript("");
          pendingCloseRef.current = false;
        }, 1500);
      } else if (callActiveRef.current) {
        startListening();
      }
    }
  }, []);

  const transcribeWithElevenLabs = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setCurrentTranscript("Transcribing...");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");

      const response = await fetch("/api/ai-assistant/stt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("STT failed");

      const { text } = await response.json();
      setCurrentTranscript("");
      setIsProcessing(false);
      return text;
    } catch (err) {
      console.error("ElevenLabs STT error:", err);
      setCurrentTranscript("");
      setIsProcessing(false);
      return null;
    }
  }, []);

  const processInput = useCallback(async (text: string, speakResponse = false) => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsProcessing(true);

    const currentMessages = [...messages, { role: "user" as const, text: userMsg }];
    let response = await getAIResponse(userMsg, currentMessages);

    const shouldClose = response.includes("[CLOSE_SESSION]");
    response = response.replace(/\s*\[CLOSE_SESSION\]\s*/g, "").trim();

    setIsProcessing(false);
    setMessages(prev => [...prev, { role: "assistant", text: response }]);

    if (shouldClose) {
      pendingCloseRef.current = true;
      if (speakResponse && callActiveRef.current) {
        speakWithElevenLabs(response);
      } else {
        setTimeout(() => {
          callActiveRef.current = false;
          setIsCallActive(false);
          setIsOpen(false);
          setMessages([]);
          setShowChat(false);
          setIsSpeaking(false);
          setOrbPulse(false);
          pendingCloseRef.current = false;
        }, 3000);
      }
    } else if (speakResponse && callActiveRef.current) {
      speakWithElevenLabs(response);
    }
  }, [speakWithElevenLabs, messages]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setCurrentTranscript("");
  }, [clearSilenceTimer]);

  const startListening = useCallback(async () => {
    if (!callActiveRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      audioChunksRef.current = [];
      let hasSpoken = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (audioContext.state !== "closed") audioContext.close().catch(() => {});
        audioContextRef.current = null;
        analyserRef.current = null;

        if (audioChunksRef.current.length === 0 || !callActiveRef.current) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size < 1000 || !hasSpoken) {
          if (callActiveRef.current) startListening();
          return;
        }

        const transcript = await transcribeWithElevenLabs(audioBlob);
        if (transcript && transcript.trim()) {
          processInput(transcript, true);
        } else if (callActiveRef.current) {
          startListening();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsListening(true);
      setCurrentTranscript("");

      const SILENCE_THRESHOLD = 15;
      const SILENCE_DURATION = 1500;
      const MAX_RECORD_TIME = 15000;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const maxTimer = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          setIsListening(false);
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORD_TIME);

      const checkSilence = () => {
        if (!callActiveRef.current || !analyserRef.current) {
          clearTimeout(maxTimer);
          return;
        }
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;

        if (avg > SILENCE_THRESHOLD) {
          hasSpoken = true;
          clearSilenceTimer();
        } else if (hasSpoken && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            clearTimeout(maxTimer);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              setIsListening(false);
              mediaRecorderRef.current.stop();
            }
          }, SILENCE_DURATION);
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          requestAnimationFrame(checkSilence);
        }
      };
      requestAnimationFrame(checkSilence);
    } catch (err) {
      console.error("Microphone access error:", err);
      setIsListening(false);
    }
  }, [transcribeWithElevenLabs, processInput, clearSilenceTimer]);

  const startCall = useCallback(() => {
    callActiveRef.current = true;
    setIsCallActive(true);
    setShowChat(false);
    setMessages([{ role: "assistant", text: GREETING }]);
    speakWithElevenLabs(GREETING);
  }, [speakWithElevenLabs]);

  const endCall = useCallback(() => {
    callActiveRef.current = false;
    setIsCallActive(false);
    stopListening();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsSpeaking(false);
    setOrbPulse(false);
    setIsProcessing(false);
    setCurrentTranscript("");
    pendingCloseRef.current = false;
  }, [stopListening]);

  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    const msg = textInput;
    setTextInput("");
    await processInput(msg, false);
  };

  const toggleChat = () => {
    if (!showChat) {
      setShowChat(true);
      if (messages.length === 0) {
        setMessages([{ role: "assistant", text: GREETING }]);
      }
    } else {
      setShowChat(false);
    }
  };

  const widget = (
    <div className="fixed z-[9998]" style={{ bottom: "24px", right: "24px" }} data-testid="ai-assistant-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="LiJOBS AI Assistant"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="mb-3 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden w-[300px]"
            data-testid="ai-assistant-panel"
          >
            <div className="flex flex-col h-full" style={{ maxHeight: "440px" }}>
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-medium text-muted-foreground" data-testid="call-timer">
                  {isCallActive ? formatTime(callDuration) : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Close assistant"
                  onClick={() => { setIsOpen(false); endCall(); }}
                  data-testid="button-close-assistant"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              {!showChat ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
                  <div className={`relative w-20 h-20 mb-4 ${orbPulse || isListening ? "animate-pulse" : ""}`}>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-300 via-cyan-400 to-blue-600 opacity-25 blur-md" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-sky-200 via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg overflow-hidden">
                      <img src={ministryLogo} alt="LiJOBS" className="w-14 h-14 rounded-full object-cover" />
                    </div>
                    {(isSpeaking || isListening) && (
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-40" />
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-foreground mb-0.5" data-testid="text-assistant-name">LiJOBS Assistant</h3>
                  <p className="text-xs text-muted-foreground mb-1">Your Ministry of Labor AI guide</p>

                  {isCallActive && (
                    <p className="text-xs font-medium mb-2" data-testid="text-call-status">
                      {isSpeaking ? (
                        <span className="text-cyan-600">Speaking...</span>
                      ) : isProcessing ? (
                        <span className="text-amber-600 animate-pulse">Processing...</span>
                      ) : isListening ? (
                        <span className="text-green-600 animate-pulse">Listening...</span>
                      ) : (
                        <span className="text-muted-foreground">Ready</span>
                      )}
                    </p>
                  )}
                  {!isCallActive && <div className="mb-2" />}

                  {currentTranscript && (
                    <div className="mb-3 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground italic max-w-full text-center" data-testid="text-transcript">
                      "{currentTranscript}"
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={toggleChat}
                      aria-label="Liberia - switch to text chat"
                      className="w-10 h-10 rounded-full border border-border bg-muted/50 hover:bg-muted flex items-center justify-center overflow-hidden transition-colors"
                      data-testid="button-toggle-chat"
                    >
                      <img src={liberianFlag} alt="Liberia" className="w-6 h-6 object-contain" />
                    </button>

                    <Button
                      variant={isListening ? "destructive" : "ghost"}
                      size="icon"
                      className={`rounded-full w-10 h-10 ${!isListening ? "border border-border" : ""}`}
                      aria-label={isListening ? "Mute microphone" : "Unmute microphone"}
                      onClick={isListening ? stopListening : (isCallActive ? startListening : undefined)}
                      data-testid="button-microphone"
                      disabled={!isCallActive || isSpeaking || isProcessing}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>

                    <Button
                      variant={isCallActive ? "destructive" : "default"}
                      size="icon"
                      className={`rounded-full w-10 h-10 ${!isCallActive ? "bg-red-500 hover:bg-red-600 text-white" : "bg-red-500 hover:bg-red-600"}`}
                      aria-label={isCallActive ? "End voice call" : "Start voice call"}
                      onClick={isCallActive ? endCall : startCall}
                      data-testid="button-call"
                    >
                      {isCallActive ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </Button>
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center px-4 leading-tight">
                    Discover the capabilities of Conversational<br />Agents powered by ElevenLabs
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                          data-testid={`chat-message-${i}`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isProcessing && showChat && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground px-3 py-2 rounded-xl rounded-bl-sm text-sm">
                          <span className="inline-flex gap-1">
                            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleTextSubmit} className="p-3 border-t border-border flex gap-2">
                    <Input
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 text-sm"
                      aria-label="Chat message input"
                      data-testid="input-chat-message"
                    />
                    <Button type="submit" size="icon" aria-label="Send message" data-testid="button-send-message" disabled={isProcessing || !textInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>

                  <div className="px-3 pb-2 flex justify-center">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => setShowChat(false)}
                      data-testid="button-back-to-voice"
                    >
                      Back to voice assistant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setIsOpen(true); startCall(); }}
          aria-label="Open AI assistant"
          className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full shadow-lg bg-background border border-border hover:shadow-xl transition-all"
          data-testid="button-open-assistant"
        >
          <img src={ministryLogo} alt="" className="w-7 h-7 rounded-full object-cover" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">Voice chat</span>
        </motion.button>
      )}
    </div>
  );

  return createPortal(widget, document.body);
}
