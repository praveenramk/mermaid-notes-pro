

# MermaidNotes — AI-Powered Diagram Generator

## Overview
A tool that takes user content (files, URLs, or text) and generates Mermaid diagram code with live preview. Two modes: **Direct Mermaid** (skip to diagrams) and **Summary Overview** (review/customize summary first).

## Pages & Flow

### 1. Homepage
- **Header**: MermaidNotes logo (mermaid illustration) + "AI-Powered Diagram Generator" + Home nav link
- **Mode toggle**: "Summary Overview" (green theme) / "Direct Mermaid" (blue theme) — default is Direct Mermaid
- **Three input methods**: Upload File, Text Input, Paste URL buttons
- **Drag & drop zone** for file uploads
- **Supported Content Types** section: Images (PNG, JPG, GIF), Videos (MP4, AVI, MOV), Audio (MP3, WAV, M4A), Documents (PDF, DOC, TXT)
- Theme shifts between green/blue based on mode toggle

### 2. Processing Page
- Centered progress card with 3 steps: "Analyzing content" → "Processing with AI" → "Complete!"
- Progress bar with percentage
- Cancel button
- Themed background matching selected mode (green or blue)

### 3. Summary Review Page (Summary Overview mode only)
- **Prompt bar** at top: shows "Overall Summary" as placeholder, Submit button (disabled until user types). On click, placeholder clears and user can enter custom query. Submitting regenerates summary & key points based on the query.
- **Two panes side by side**:
  - **Summary pane**: Overall content summary with copy, edit, and redo (regenerate) buttons
  - **Key Points pane**: Structured title + description items with emoji icons, copy and edit buttons
- Both panes are read-only by default; clicking edit makes them editable
- Redo on summary regenerates both summary and key points
- **"Generate Mermaid" button** with play icon at bottom → navigates to Diagram Page

### 4. Diagram Page
- **Back navigation**: "Back to Upload" (Direct Mermaid) or "Back to Summary" (Summary Overview)
- **Title**: "URL Content Analysis" (or based on content type)
- **Visualization Type selector**: Chip/tag bar with options:
  - Mindmap (sub-options: Spidermap, Treemap, Multiflow)
  - Pie
  - Gantt
  - Sequence (sub-options: Basic, Loop, Alt/Else)
  - State (sub-options: Simple, Composite, Fork/Join)
  - Gitgraph
  - Flowchart (sub-options: Top-Down, Left-Right, Subgraph)
  - Sankey
  - Requirement
  - ER Diagram
  - C4 Context (sub-options: Context, Container, Component)
  - UML (sub-options: Class, Activity, Use Case)
- **Sub-options row** appears below when applicable
- **Three-column layout**:
  - **Diagram Preview**: Live rendered Mermaid diagram using mermaid.js
  - **Mermaid Diagram Code**: Syntax-highlighted code with copy button
  - **Open in Design Tools**: Three buttons — Excalidraw (purple #9D00FF), Draw.io (orange #FF9900), Miro (yellow #FFD02F) + tip text

## AI Integration (Lovable AI via Edge Functions)
- **Content extraction**: Firecrawl for URLs; client-side reading for text files; edge function processing for documents (PDF, DOCX) and media (audio transcription)
- **Summary generation**: Edge function calls Lovable AI to produce summary + key points from extracted content
- **Custom prompt**: Edge function re-generates summary/key points based on user's custom query
- **Mermaid code generation**: Edge function calls Lovable AI to generate valid Mermaid syntax for the selected visualization type and sub-option
  - In Direct Mermaid mode: based on full extracted content
  - In Summary Overview mode: based on the summary & key points
- **Mermaid sanitizer**: Client-side error handling — if mermaid.js fails to render, attempt common fixes (unclosed brackets, invalid syntax) and retry

## Technical Setup Required
- **Lovable Cloud**: For edge functions (AI calls, content processing)
- **Firecrawl connector**: For URL scraping
- **mermaid.js library**: For client-side diagram preview rendering
- **Logo**: Embed the uploaded mermaid illustration as app logo

## Design
- Green theme (#0D7C3D range) for Summary Overview mode
- Blue/indigo theme for Direct Mermaid mode
- Clean, minimal UI matching the mockups
- Responsive layout

