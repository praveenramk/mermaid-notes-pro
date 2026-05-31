export type AppMode = "direct-mermaid" | "summary-overview";

export type InputMethod = "file" | "url" | "text";

export interface KeyPoint {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export interface ContentData {
  rawContent: string;
  summary: string;
  keyPoints: KeyPoint[];
  sourceType: InputMethod;
  sourceName: string;
  /** Optional base64 data URL for image inputs (multimodal). */
  imageDataUrl?: string;
}

export type VisualizationType =
  | "mindmap" | "pie" | "gantt" | "sequence" | "state"
  | "gitgraph" | "flowchart" | "sankey" | "requirement"
  | "erDiagram" | "c4Context" | "uml";

export interface SubOption {
  id: string;
  label: string;
}

export interface VisualizationConfig {
  id: VisualizationType;
  label: string;
  subOptions?: SubOption[];
}

export const VISUALIZATION_OPTIONS: VisualizationConfig[] = [
  {
    id: "mindmap", label: "Mindmap",
    subOptions: [
      { id: "spidermap", label: "Spidermap" },
      { id: "treemap", label: "Treemap" },
      { id: "multiflow", label: "Multiflow Map" },
    ],
  },
  { id: "pie", label: "Pie" },
  { id: "gantt", label: "Gantt" },
  {
    id: "sequence", label: "Sequence",
    subOptions: [
      { id: "basic", label: "Basic" },
      { id: "loop", label: "Loop" },
      { id: "alt-else", label: "Alt/Else" },
    ],
  },
  {
    id: "state", label: "State",
    subOptions: [
      { id: "simple", label: "Simple" },
      { id: "composite", label: "Composite" },
      { id: "fork-join", label: "Fork/Join" },
    ],
  },
  { id: "gitgraph", label: "Gitgraph" },
  {
    id: "flowchart", label: "Flowchart",
    subOptions: [
      { id: "top-down", label: "Top-Down" },
      { id: "left-right", label: "Left-Right" },
      { id: "subgraph", label: "Subgraph" },
    ],
  },
  { id: "sankey", label: "Sankey" },
  { id: "requirement", label: "Requirement" },
  { id: "erDiagram", label: "ER Diagram" },
  {
    id: "c4Context", label: "C4 Context",
    subOptions: [
      { id: "context", label: "Context" },
      { id: "container", label: "Container" },
      { id: "component", label: "Component" },
    ],
  },
  {
    id: "uml", label: "UML",
    subOptions: [
      { id: "class", label: "Class" },
      { id: "activity", label: "Activity" },
      { id: "use-case", label: "Use Case" },
    ],
  },
];
