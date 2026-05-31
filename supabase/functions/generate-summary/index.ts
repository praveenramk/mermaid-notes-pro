import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_CONTENT_CHARS = 60000;

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MermaidNotesBot/1.0)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`Failed to fetch URL (${res.status})`);
    const ct = res.headers.get("content-type") ?? "";
    const body = await res.text();

    if (ct.includes("text/html") || /<html[\s>]/i.test(body)) {
      // Strip script/style, then tags
      const cleaned = body
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
      return cleaned;
    }
    return body;
  } catch (e) {
    throw new Error(`Could not fetch URL: ${e instanceof Error ? e.message : "unknown"}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, sourceType, sourceName, customPrompt, imageDataUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Resolve the actual analyzable content based on source type.
    let resolvedContent: string = typeof content === "string" ? content : "";
    let isImage = false;

    if (sourceType === "url") {
      const url = (content ?? "").trim();
      if (!/^https?:\/\//i.test(url)) {
        return new Response(JSON.stringify({ error: "Invalid URL" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      resolvedContent = await fetchUrlContent(url);
      if (!resolvedContent || resolvedContent.length < 30) {
        return new Response(JSON.stringify({ error: "URL returned no readable content." }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (sourceType === "file" && imageDataUrl) {
      isImage = true;
      resolvedContent = "";
    }

    if (!isImage) {
      resolvedContent = (resolvedContent || "").slice(0, MAX_CONTENT_CHARS);
      if (!resolvedContent.trim()) {
        return new Response(JSON.stringify({ error: "No content to analyze." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const systemPrompt = `You are a strict, faithful content analyst.

GROUNDING RULES (CRITICAL):
- Base every word of your output ONLY on the user-provided content (text or image) below.
- DO NOT invent facts, names, statistics, dates, or examples that are not present in the source.
- DO NOT add general knowledge, assumptions, or outside context.
- If the source is too short, vague, or lacks information for a section, write "Not specified in the source" rather than guessing.
- Quote terminology from the source where reasonable.

Produce a JSON response with:
1. "summary": A faithful summary paragraph (150-350 words) drawn strictly from the source content.
2. "keyPoints": An array of 4-6 key points actually present in the source, each with: "id" (string number), "emoji" (relevant emoji), "title" (short title), "description" (1-2 sentence description grounded in the source).

${customPrompt ? `User focus: "${customPrompt}". Tailor accordingly but stay grounded in the source.` : "Cover the main themes actually present in the source."}

Respond ONLY with valid JSON. No markdown, no code fences, no preamble.`;

    // Build user message — multimodal if image, plain text otherwise.
    const userMessage = isImage
      ? {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze the following uploaded image (file: ${sourceName ?? "image"}). Base your summary and key points strictly on what is visibly present in the image. Do not invent details.`,
            },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        }
      : {
          role: "user",
          content: `Source type: ${sourceType}${sourceName ? ` (${sourceName})` : ""}.\n\n--- BEGIN SOURCE CONTENT ---\n${resolvedContent}\n--- END SOURCE CONTENT ---`,
        };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, userMessage],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text();
      console.error("AI gateway error", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add more credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summary: rawText,
        keyPoints: [
          { id: "1", emoji: "📌", title: "Main Point", description: "Key insight from the content" },
        ],
      };
    }

    // Echo back the resolved content so downstream mermaid generation can ground on it too.
    return new Response(
      JSON.stringify({ ...parsed, resolvedContent: isImage ? "[image]" : resolvedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
