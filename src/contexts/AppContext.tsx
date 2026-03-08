import React, { createContext, useContext, useState, ReactNode } from "react";
import { AppMode, ContentData, VisualizationType } from "@/types/app";

interface AppContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  contentData: ContentData | null;
  setContentData: (data: ContentData | null) => void;
  mermaidCode: string;
  setMermaidCode: (code: string) => void;
  selectedVisualization: VisualizationType;
  setSelectedVisualization: (v: VisualizationType) => void;
  selectedSubOption: string | null;
  setSelectedSubOption: (s: string | null) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppMode>("direct-mermaid");
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [selectedVisualization, setSelectedVisualization] = useState<VisualizationType>("mindmap");
  const [selectedSubOption, setSelectedSubOption] = useState<string | null>("spidermap");
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <AppContext.Provider
      value={{
        mode, setMode,
        contentData, setContentData,
        mermaidCode, setMermaidCode,
        selectedVisualization, setSelectedVisualization,
        selectedSubOption, setSelectedSubOption,
        isProcessing, setIsProcessing,
      }}
    >
      <div className={mode === "direct-mermaid" ? "mode-direct-mermaid" : "mode-summary-overview"}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
