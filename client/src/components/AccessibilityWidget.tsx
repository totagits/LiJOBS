import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accessibility, X, Volume2, VolumeX, Sun, Type } from "lucide-react";

const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 24;
const STEP = 2;

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [highContrast, setHighContrast] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("a11y-font-size");
    if (savedFontSize) {
      const parsed = parseInt(savedFontSize, 10);
      if (!isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) {
        setFontSize(parsed);
        document.documentElement.style.fontSize = `${parsed}px`;
      }
    }

    const savedContrast = localStorage.getItem("a11y-high-contrast");
    if (savedContrast === "true") {
      setHighContrast(true);
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  const updateFontSize = (newSize: number) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, newSize));
    setFontSize(clamped);
    document.documentElement.style.fontSize = `${clamped}px`;
    localStorage.setItem("a11y-font-size", String(clamped));
  };

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("a11y-high-contrast", String(next));
  };

  const handleReadPage = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    const content = document.querySelector("main")?.textContent || document.body.textContent || "";
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleStopReading = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const widget = (
    <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 99999 }}>
      {isOpen && (
        <Card
          data-testid="panel-accessibility"
          className="mb-2 w-72"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">Accessibility Options</CardTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-accessibility"
              aria-label="Close accessibility panel"
            >
              <X />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div data-testid="section-font-size">
              <div className="flex items-center gap-2 mb-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Font Size</span>
                <span className="text-xs text-muted-foreground ml-auto">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFontSize(fontSize - STEP)}
                  disabled={fontSize <= MIN_FONT_SIZE}
                  data-testid="button-font-decrease"
                  aria-label="Decrease font size"
                >
                  A-
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFontSize(DEFAULT_FONT_SIZE)}
                  data-testid="button-font-reset"
                  aria-label="Reset font size"
                >
                  A
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFontSize(fontSize + STEP)}
                  disabled={fontSize >= MAX_FONT_SIZE}
                  data-testid="button-font-increase"
                  aria-label="Increase font size"
                >
                  A+
                </Button>
              </div>
            </div>

            <div className="border-t" />

            <div data-testid="section-high-contrast">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">High Contrast</span>
              </div>
              <Button
                variant={highContrast ? "default" : "outline"}
                size="sm"
                onClick={toggleHighContrast}
                data-testid="button-toggle-contrast"
                aria-label="Toggle high contrast mode"
                className="toggle-elevate"
              >
                {highContrast ? "On" : "Off"}
              </Button>
            </div>

            {speechSupported && (
              <>
                <div className="border-t" />

                <div data-testid="section-text-to-speech">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Text-to-Speech</span>
                  </div>
                  {isSpeaking ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStopReading}
                      data-testid="button-stop-reading"
                      aria-label="Stop reading"
                    >
                      <VolumeX className="mr-1 h-4 w-4" />
                      Stop Reading
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReadPage}
                      data-testid="button-read-page"
                      aria-label="Read page content"
                    >
                      <Volume2 className="mr-1 h-4 w-4" />
                      Read Page
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        size="icon"
        variant="default"
        className="rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-accessibility-toggle"
        aria-label="Toggle accessibility options"
      >
        <Accessibility />
      </Button>
    </div>
  );

  return createPortal(widget, document.body);
}
