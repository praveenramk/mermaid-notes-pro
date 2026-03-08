import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Link, Type, FileText, Image, Film, Music, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { InputMethod } from "@/types/app";

const Homepage = () => {
  const { mode, setMode, setContentData } = useApp();
  const navigate = useNavigate();
  const [activeInput, setActiveInput] = useState<InputMethod>("file");
  const [url, setUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    let rawContent = "";
    let sourceName = "";

    if (activeInput === "file" && selectedFile) {
      // For text-based files, read content. For others, we'll pass the file name and handle in processing.
      rawContent = `[File: ${selectedFile.name}]`;
      sourceName = selectedFile.name;
    } else if (activeInput === "url" && url.trim()) {
      rawContent = url.trim();
      sourceName = url.trim();
    } else if (activeInput === "text" && textContent.trim()) {
      rawContent = textContent.trim();
      sourceName = "Text Input";
    } else {
      toast({ title: "Missing input", description: "Please provide content to analyze.", variant: "destructive" });
      return;
    }

    setContentData({
      rawContent,
      summary: "",
      keyPoints: [],
      sourceType: activeInput,
      sourceName,
    });

    navigate("/processing");
  }, [activeInput, selectedFile, url, textContent, setContentData, navigate]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setActiveInput("file");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const contentTypes = [
    { icon: Image, label: "Images", formats: "PNG, JPG, GIF", color: "text-blue-500" },
    { icon: Film, label: "Videos", formats: "MP4, AVI, MOV", color: "text-purple-500" },
    { icon: Music, label: "Audio", formats: "MP3, WAV, M4A", color: "text-pink-500" },
    { icon: FileText, label: "Documents", formats: "PDF, DOC, TXT", color: "text-orange-500" },
  ];

  return (
    <div className="min-h-screen mode-gradient-bg">
      <Header />

      <main className="container mx-auto max-w-4xl px-6 py-12">
        {/* Title */}
        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Transform Content into
            <span className="block text-mode"> Beautiful Diagrams</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Upload any content and generate Mermaid diagram code ready for Excalidraw, Draw.io, and Miro.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-mode-border/40 bg-card p-1 shadow-sm">
            <button
              onClick={() => setMode("summary-overview")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                mode === "summary-overview"
                  ? "bg-mode text-mode-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📝 Summary Overview
            </button>
            <button
              onClick={() => setMode("direct-mermaid")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                mode === "direct-mermaid"
                  ? "bg-mode text-mode-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ⚡ Direct Mermaid
            </button>
          </div>
        </div>

        {/* Input Method Tabs */}
        <div className="mb-6 flex justify-center gap-2">
          {[
            { id: "file" as InputMethod, icon: Upload, label: "Upload File" },
            { id: "url" as InputMethod, icon: Link, label: "Paste URL" },
            { id: "text" as InputMethod, icon: Type, label: "Text Input" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveInput(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeInput === id
                  ? "border border-mode-border bg-mode/10 text-mode shadow-sm"
                  : "border border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="rounded-2xl border border-mode-border/30 bg-card p-8 shadow-lg">
          {activeInput === "file" && (
            <div
              className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                dragOver
                  ? "border-mode bg-mode/10"
                  : "border-border hover:border-mode-border"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.png,.jpg,.jpeg,.gif,.mp4,.avi,.mov,.mp3,.wav,.m4a"
              />
              <Upload className="mb-3 h-10 w-10 text-mode/60" />
              {selectedFile ? (
                <div className="text-center">
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    Drop your file here or <span className="text-mode">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports images, videos, audio, and documents
                  </p>
                </div>
              )}
            </div>
          )}

          {activeInput === "url" && (
            <div className="space-y-4">
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-14 border-mode-border/40 text-base focus-visible:ring-mode"
              />
              <p className="text-xs text-muted-foreground">
                Enter a webpage URL to extract and analyze its content
              </p>
            </div>
          )}

          {activeInput === "text" && (
            <div className="space-y-4">
              <Textarea
                placeholder="Paste or type your content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[200px] border-mode-border/40 text-base focus-visible:ring-mode"
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSubmit}
              className="gap-2 bg-mode px-8 py-3 text-mode-foreground shadow-lg transition-all hover:opacity-90"
              size="lg"
            >
              Analyze Content
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Supported Content Types */}
        <div className="mt-12">
          <h3 className="mb-6 text-center font-display text-lg font-semibold text-foreground">
            Supported Content Types
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {contentTypes.map(({ icon: Icon, label, formats, color }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-sm"
              >
                <Icon className={`h-8 w-8 ${color}`} />
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{formats}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homepage;
