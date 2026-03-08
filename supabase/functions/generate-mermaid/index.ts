import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, keyPoints, visualizationType, subOption } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const vizInstructions: Record<string, string> = {
      mindmap: `Generate a Mermaid mindmap diagram.${
        subOption === "spidermap" ? " Use a central node with branches radiating outward." :
        subOption === "treemap" ? " Use a hierarchical tree structure with parent-child nodes." :
        subOption === "multiflow" ? " Show causes and effects flowing from a central event." : ""
      }`,
      pie: "Generate a Mermaid pie chart. Use 'pie title [Title]' followed by entries like '\"Label\" : value'.",
      gantt: "Generate a Mermaid gantt chart with tasks, sections, and dates. Use 'gantt' followed by dateFormat, title, sections and tasks.",
      sequence: `Generate a Mermaid sequence diagram.${
        subOption === "loop" ? " Include loop blocks." :
        subOption === "alt-else" ? " Include alt/else conditional blocks." : " Keep it straightforward."
      }`,
      state: `Generate a Mermaid state diagram using 'stateDiagram-v2'.${
        subOption === "composite" ? " Include composite/nested states." :
        subOption === "fork-join" ? " Include fork and join states." : ""
      }`,
      gitgraph: "Generate a Mermaid gitGraph diagram showing branches, commits, and merges.",
      flowchart: `Generate a Mermaid flowchart.${
        subOption === "top-down" ? " Use 'flowchart TD'." :
        subOption === "left-right" ? " Use 'flowchart LR'." :
        subOption === "subgraph" ? " Use 'flowchart TD' with subgraph groupings." : " Use 'flowchart TD'."
      }`,
      sankey: "Generate a Mermaid sankey-beta diagram showing flows between nodes with values.",
      requirement: "Generate a Mermaid requirementDiagram showing requirements, elements, and relationships.",
      erDiagram: "Generate a Mermaid erDiagram showing entities, attributes, and relationships.",
      c4Context: `Generate a Mermaid C4Context diagram.${
        subOption === "container" ? " Focus on containers within the system." :
        subOption === "component" ? " Focus on components within a container." : " Show the system context."
      }`,
      uml: `${
        subOption === "class" ? "Generate a Mermaid classDiagram showing classes, attributes, methods, and relationships." :
        subOption === "activity" ? "Generate a Mermaid flowchart representing an activity diagram with decision points and parallel activities." :
        subOption === "use-case" ? "Generate a Mermaid flowchart representing a use case diagram showing actors and use cases." :
        "Generate a Mermaid classDiagram."
      }`,
    };

    const instruction = vizInstructions[visualizationType] || vizInstructions.mindmap;

    const keyPointsText = keyPoints?.length
      ? keyPoints.map((kp: any) => `${kp.emoji} ${kp.title}: ${kp.description}`).join("\n")
      : "";

    const systemPrompt = `You are a Mermaid diagram code generator. ${instruction}

CRITICAL RULES:
- Output ONLY valid Mermaid code, nothing else
- No markdown code fences
- No explanations
- Ensure valid syntax that mermaid.js can render
- Keep labels concise (max 5 words per node)
- Do not use special characters that break mermaid syntax
- Do not use emojis in the mermaid code`;

    const userContent = `Generate a ${visualizationType}${subOption ? ` (${subOption})` : ""} diagram for this content:

Summary: ${content}

${keyPointsText ? `Key Points:\n${keyPointsText}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    let mermaidCode = data.choices?.[0]?.message?.content || "";

    // Clean up
    mermaidCode = mermaidCode.replace(/```mermaid\n?/g, "").replace(/```\n?/g, "").trim();

    return new Response(JSON.stringify({ mermaidCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-mermaid error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
