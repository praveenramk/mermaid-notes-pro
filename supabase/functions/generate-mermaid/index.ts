import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TEMPLATES: Record<string, string> = {
  "mindmap-spidermap": `graph LR
  A[Main Topic]
  
  %% Category 1
  A --> B[Category 1]
  B --> B1[Detail 1]
  B1 --> B1a[Sub-detail 1a]
  B1 --> B1b[Sub-detail 1b]
  B --> B2[Detail 2]
  B2 --> B2a[Sub-detail 2a]
  B2 --> B2b[Sub-detail 2b]
  
  %% Category 2
  A --> C[Category 2]
  C --> C1[Detail 1]
  C1 --> C1a[Sub-detail 1a]
  C1 --> C1b[Sub-detail 1b]
  C --> C2[Detail 2]
  C2 --> C2a[Sub-detail 2a]
  C2 --> C2b[Sub-detail 2b]
  
  %% Category 3
  A --> D[Category 3]
  D --> D1[Detail 1]
  D1 --> D1a[Sub-detail 1a]
  D1 --> D1b[Sub-detail 1b]
  D --> D2[Detail 2]
  D2 --> D2a[Sub-detail 2a]
  D2 --> D2b[Sub-detail 2b]`,

  "mindmap-treemap": `flowchart TB
  subgraph "Main Topic"
    subgraph Category1
      B1[Detail 1]
      B2[Detail 2]
    end
    subgraph Category2
      C1[Detail 1]
      C2[Detail 2]
    end
  end`,

  "mindmap-multiflow": `flowchart LR
  subgraph Inputs
    I1[Input 1]
    I2[Input 2]
  end
  subgraph Core
    P[Process 1]
    Q[Process 2]
  end
  subgraph Outcomes
    O1[Outcome 1]
    O2[Outcome 2]
  end

  I1 & I2 --> P
  P --> Q
  Q --> O1 & O2`,

  "pie": `pie showData
    title Topic Title 
    "Criteria 1" : 35
    "Criteria 2" : 25
    "Criteria 3" : 20
    "Criteria 4" : 20`,

  "gantt": `gantt
    title Sample Project Gantt Chart
    dateFormat  YYYY-MM-DD

    section Category 1
    Detail 1 - Sub-detail 1a :a1, 2025-08-15, 3d
    Detail 1 - Sub-detail 1b :a2, after a1, 2d
    Detail 2 - Sub-detail 2a :a3, after a2, 4d
    Detail 2 - Sub-detail 2b :a4, after a3, 3d

    section Category 2
    Detail 1 - Sub-detail 1a :b1, 2025-08-16, 2d
    Detail 1 - Sub-detail 1b :b2, after b1, 3d
    Detail 2 - Sub-detail 2a :b3, after b2, 2d
    Detail 2 - Sub-detail 2b :b4, after b3, 3d

    section Category 3
    Detail 1 - Sub-detail 1a :c1, 2025-08-17, 3d
    Detail 1 - Sub-detail 1b :c2, after c1, 2d
    Detail 2 - Sub-detail 2a :c3, after c2, 3d
    Detail 2 - Sub-detail 2b :c4, after c3, 2d`,

  "sequence-basic": `sequenceDiagram
    autonumber
    participant User
    participant System
    participant ProcessEngine
    participant OutputModule

    User->>System: Provide Input Data
    System->>ProcessEngine: Validate Criteria
    ProcessEngine-->>System: Validation Result
    System->>ProcessEngine: Execute Process
    ProcessEngine-->>OutputModule: Send Processed Data
    OutputModule-->>User: Return Outcome`,

  "sequence-loop": `sequenceDiagram
    autonumber
    participant User
    participant System
    participant ProcessEngine
    participant OutputModule

    User->>System: Provide Input Data
    loop Validation Checks
        System->>ProcessEngine: Validate Criteria
        ProcessEngine-->>System: Validation Result
    end
    System->>ProcessEngine: Execute Process
    ProcessEngine-->>OutputModule: Send Processed Data
    OutputModule-->>User: Return Outcome`,

  "sequence-alt-else": `sequenceDiagram
    autonumber
    participant User
    participant System
    participant ProcessEngine
    participant OutputModule

    User->>System: Provide Input Data
    System->>ProcessEngine: Validate Criteria
    ProcessEngine-->>System: Validation Result
    alt Criteria Met
        System->>ProcessEngine: Execute Process
        ProcessEngine-->>OutputModule: Send Processed Data
        OutputModule-->>User: Return Outcome
    else Criteria Not Met
        System-->>User: Return Error
    end`,

  "state-simple": `stateDiagram-v2
    [*] --> Input
    Input --> Validation
    Validation --> Process
    Process --> Decision
    Decision --> Outcome1 : Criteria Met
    Decision --> Outcome2 : Criteria Not Met
    Outcome1 --> [*]
    Outcome2 --> [*]`,

  "state-composite": `stateDiagram-v2
    [*] --> Input

    Input --> Validation
    Validation --> Process
    Process --> Decision
    Decision --> Outcome1 : Criteria Met
    Decision --> Outcome2 : Criteria Not Met

    Outcome1 --> [*]
    Outcome2 --> [*]

    state Validation {
        [*] --> Check1
        Check1 --> Check2
        Check2 --> [*]
    }

    state Process {
        [*] --> Step1
        Step1 --> Step2
        Step2 --> Step3
        Step3 --> [*]
    }

    state Decision {
        [*] --> Evaluate
        Evaluate --> Approve
        Evaluate --> Reject
        Approve --> [*]
        Reject --> [*]
    }`,

  "state-fork-join": `stateDiagram-v2
    [*] --> Input
    Input --> fork_state
    state fork_state <<fork>>
    fork_state --> Process1
    fork_state --> Process2
    Process1 --> join_state
    Process2 --> join_state
    state join_state <<join>>
    join_state --> Output
    Output --> [*]`,

  "gitgraph": `gitGraph
   commit id: "Initial Commit"
   branch category1
   checkout category1
   commit id: "Detail 1"
   commit id: "Sub-detail 1a"
   commit id: "Sub-detail 1b"
   checkout main

   branch category2
   checkout category2
   commit id: "Detail 1 "
   commit id: "Sub-detail 1a "
   commit id: "Sub-detail 1b "
   checkout main

   branch category3
   checkout category3
   commit id: "Detail 1  "
   commit id: "Sub-detail 1a  "
   commit id: "Sub-detail 1b  "
   commit id: "Detail 2"
   commit id: "Sub-detail 2a"
   commit id: "Sub-detail 2b"
   checkout main

   merge category1
   merge category2
   merge category3`,

  "flowchart-top-down": `flowchart TD
    %% Inputs
    A[Input Data] --> B[Validate Criteria]

    %% Process Steps
    B --> C[Process Step 1]
    C --> D[Process Step 2]
    D --> E[Process Step 3]

    %% Decision
    E --> F{Criteria Met?}
    F -->|Yes| G[Outcome 1]
    F -->|No| H[Outcome 2]

    %% End
    G --> I[Final Result]
    H --> I`,

  "flowchart-left-right": `flowchart LR
    A[Input Data] --> B[Validate Criteria]
    B --> C[Process Step 1]
    C --> D[Process Step 2]
    D --> E[Process Step 3]
    E --> F{Criteria Met?}
    F -->|Yes| G[Outcome 1]
    F -->|No| H[Outcome 2]
    G --> I[Final Result]
    H --> I`,

  "flowchart-subgraph": `flowchart TD
    subgraph Input
        A[Input Data]
    end
    subgraph Processing
        B[Validate Criteria]
        C[Process Step 1]
        D[Process Step 2]
    end
    subgraph Output
        E{Criteria Met?}
        F[Outcome 1]
        G[Outcome 2]
    end
    A --> B
    B --> C
    C --> D
    D --> E
    E -->|Yes| F
    E -->|No| G`,

  "sankey": `sankey-beta
%% source,target,value
Input 1,Process 1,50
Input 2,Process 1,30
Input 3,Process 2,20
Process 1,Outcome 1,40
Process 1,Outcome 2,40
Process 2,Outcome 2,10
Process 2,Outcome 3,10
Process 3,Outcome 3,20
Process 3,Outcome 4,20`,

  "requirement": `classDiagram
    %% Main Requirement
    class Requirement {
        +ID
        +Description
        +Priority
    }

    class Criteria1 {
        +Description
        +Type
    }

    class Criteria2 {
        +Description
        +Type
    }

    class Detail1_1 {
        +Description
        +Status
    }

    class Detail1_2 {
        +Description
        +Status
    }

    class Detail2_1 {
        +Description
        +Status
    }

    class Detail2_2 {
        +Description
        +Status
    }

    class SubDetail1_1a {
        +Description
        +Owner
    }

    class SubDetail1_1b {
        +Description
        +Owner
    }

    Requirement --> Criteria1
    Requirement --> Criteria2
    Criteria1 --> Detail1_1
    Criteria1 --> Detail1_2
    Criteria2 --> Detail2_1
    Criteria2 --> Detail2_2
    Detail1_1 --> SubDetail1_1a
    Detail1_1 --> SubDetail1_1b`,

  "erDiagram": `erDiagram
    CATEGORY {
        string category_id PK
        string category_name
    }

    DETAIL {
        string detail_id PK
        string detail_name
        string category_id FK
    }

    SUBDETAIL {
        string subdetail_id PK
        string subdetail_name
        string detail_id FK
    }

    INPUT {
        string input_id PK
        string input_name
    }

    PROCESS {
        string process_id PK
        string process_name
    }

    OUTCOME {
        string outcome_id PK
        string outcome_name
    }

    CATEGORY ||--o{ DETAIL : contains
    DETAIL ||--o{ SUBDETAIL : contains
    INPUT ||--o{ PROCESS : feeds
    PROCESS ||--o{ OUTCOME : produces`,

  "c4Context-context": `flowchart LR
    User1[User 1] --> SystemA[Main System]
    User2[User 2] --> SystemA
    ExternalSystem1[External System 1] --> SystemA
    ExternalSystem2[External System 2] --> SystemA

    subgraph MainSystem [Main System]
        Process1[Process 1]
        Process2[Process 2]
    end

    Process1 --> Process2`,

  "c4Context-container": `flowchart TD
    subgraph MainSystem [Main System]
        subgraph Container1 [Container 1]
            C1A[Component A]
            C1B[Component B]
        end
        subgraph Container2 [Container 2]
            C2A[Component A]
            C2B[Component B]
        end
    end
    C1A --> C1B
    C2A --> C2B
    C1B --> C2A`,

  "c4Context-component": `flowchart TD
    subgraph Container [Container]
        Comp1[Component 1]
        Comp2[Component 2]
        Comp3[Component 3]
        DB[(Database)]
    end
    Comp1 --> Comp2
    Comp2 --> Comp3
    Comp3 --> DB`,

  "uml-class": `classDiagram
    class Criteria {
        +id: int
        +name: string
        +description: string
        +getDetails(): Detail
    }

    class Detail {
        +id: int
        +summary: string
        +category: Category
        +fetchCriteria(): Criteria
    }

    class Category {
        +id: int
        +label: string
        +description: string
        +listDetails(): Detail[]
    }

    class Input {
        +id: int
        +source: string
        +timestamp: datetime
        +processData(): Process
    }

    class Process {
        +id: int
        +name: string
        +execute(input: Input): Outcome
    }

    class Outcome {
        +id: int
        +result: string
        +status: string
        +generateReport(): string
    }

    Criteria --> Detail : contains
    Detail --> Category : belongs to
    Input --> Process : triggers
    Process --> Outcome : produces`,

  "uml-activity": `flowchart TD
    Start([Start]) --> A[Receive Input]
    A --> B{Valid?}
    B -->|Yes| C[Process Data]
    B -->|No| D[Request Correction]
    D --> A
    C --> E{Decision Point}
    E -->|Option A| F[Execute Path A]
    E -->|Option B| G[Execute Path B]
    F --> H[Merge Results]
    G --> H
    H --> End([End])`,

  "uml-use-case": `flowchart LR
    Actor1((Actor 1))
    Actor2((Actor 2))
    
    subgraph System [System Boundary]
        UC1[Use Case 1]
        UC2[Use Case 2]
        UC3[Use Case 3]
        UC4[Use Case 4]
    end
    
    Actor1 --> UC1
    Actor1 --> UC2
    Actor2 --> UC3
    Actor2 --> UC4
    UC1 --> UC3`,
};

function getTemplateKey(visualizationType: string, subOption: string | null): string {
  if (subOption) return `${visualizationType}-${subOption}`;
  return visualizationType;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, keyPoints, visualizationType, subOption } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const templateKey = getTemplateKey(visualizationType, subOption);
    const template = TEMPLATES[templateKey] || TEMPLATES[visualizationType] || TEMPLATES["mindmap-spidermap"];

    const keyPointsText = keyPoints?.length
      ? keyPoints.map((kp: any) => `${kp.emoji} ${kp.title}: ${kp.description}`).join("\n")
      : "";

    const systemPrompt = `You are a Mermaid diagram code generator. You MUST follow the exact structural pattern provided below as a template. Replace the placeholder labels with real content derived from the user's summary and key points.

TEMPLATE PATTERN TO FOLLOW (use this exact structure, only replace labels):
\`\`\`
${template}
\`\`\`

CRITICAL RULES:
- Output ONLY valid Mermaid code, nothing else
- No markdown code fences in output
- No explanations, just the mermaid code
- Follow the EXACT structural pattern from the template above
- Replace placeholder names (Category 1, Detail 1, etc.) with actual content from the user's data
- Keep labels concise (max 5 words per node)
- Do not use emojis in the mermaid code
- Do not use special characters that break mermaid syntax (avoid quotes inside labels, use alphanumeric and spaces only)
- Adapt the number of nodes/branches to fit the content (add or remove branches as needed while keeping the same pattern)`;

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
