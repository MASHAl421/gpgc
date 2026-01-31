import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionRequest {
  subject: string;
  topics: string[];
  shortCount: number;
  longCount: number;
  questionTypes: string[];
  difficultyLevels: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      subject, 
      topics, 
      shortCount = 5, 
      longCount = 3, 
      questionTypes = ['exercise', 'conceptual'],
      difficultyLevels = ['easy', 'medium', 'hard']
    } = await req.json() as QuestionRequest;

    const topicsText = topics.join(', ');
    const typesText = questionTypes.join(' and ');
    const difficultiesText = difficultyLevels.join(', ');

    const systemPrompt = `You are an expert exam paper generator for BS Semester 1 students in Pakistan. Generate subjective questions with detailed answers.

SUBJECT: ${subject}
TOPICS: ${topicsText}
QUESTION TYPES: ${typesText}
DIFFICULTY LEVELS: ${difficultiesText}

Generate exactly ${shortCount} SHORT questions and ${longCount} LONG questions.

GUIDELINES:
1. **Short Questions** (2-4 lines answer):
   - Define terms, explain concepts briefly
   - "What is...", "Define...", "Differentiate between...", "List..."
   - Answers should be 2-4 sentences

2. **Long Questions** (detailed paragraph answer):
   - Explain in detail, describe processes, compare and contrast
   - "Explain in detail...", "Describe the process of...", "Discuss..."
   - Answers should be 5-10 sentences with proper explanation

3. **For Programming Fundamentals (C++):**
   - Short: Define variable, explain operators, syntax questions
   - Long: Write programs, explain algorithms, trace output with explanation

4. **For Functional English:**
   - Short: Grammar rules, definitions, identify parts of speech
   - Long: Essay writing, paragraph construction, comprehension

5. **Question Types:**
   - Exercise: Practice problems, code writing, grammar exercises
   - Conceptual: Theory, definitions, explanations

6. **Difficulty Distribution:**
   - Easy: Basic definitions, simple examples
   - Medium: Application of concepts
   - Hard: Complex problems, critical thinking

RESPONSE FORMAT (JSON array only, no markdown):
{
  "questions": [
    {
      "id": "q-unique-id",
      "question": "Question text here?",
      "answer": "Detailed answer here...",
      "type": "short" or "long",
      "category": "exercise" or "conceptual",
      "difficulty": "easy" or "medium" or "hard"
    }
  ]
}

Generate unique, educational questions with accurate answers. Each question must be different from others. For programming questions, include code examples where relevant.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert academic question generator. Always respond with valid JSON only, no markdown code blocks. Generate educational questions with accurate, detailed answers." },
          { role: "user", content: systemPrompt }
        ],
        temperature: 0.8,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Rate limit exceeded. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Service temporarily unavailable. Please try again later." 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Parse error, content:", content);
      throw new Error("Failed to parse AI response");
    }

    // Validate and ensure proper format
    if (!result.questions || !Array.isArray(result.questions)) {
      throw new Error("Invalid response format");
    }

    // Add unique IDs if not present and validate structure
    const formattedQuestions = result.questions.map((q: any, index: number) => ({
      id: q.id || `q-${Date.now()}-${index}`,
      question: q.question,
      answer: q.answer,
      type: q.type || (index < shortCount ? 'short' : 'long'),
      category: q.category || 'conceptual',
      difficulty: q.difficulty || 'medium'
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      questions: formattedQuestions,
      subject,
      shortCount: formattedQuestions.filter((q: any) => q.type === 'short').length,
      longCount: formattedQuestions.filter((q: any) => q.type === 'long').length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error("Error generating subjective questions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
