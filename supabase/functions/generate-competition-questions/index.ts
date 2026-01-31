import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionRequest {
  topic: string;
  count: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  type?: 'practice' | 'competition' | 'mock';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, count = 10, difficulty = 'mixed', type = 'practice' } = await req.json() as QuestionRequest;

    const systemPrompt = `You are an expert question generator for BS-level academic competitions. Generate exactly ${count} multiple choice questions.

TOPIC: ${topic}
DIFFICULTY: ${difficulty}
TYPE: ${type}

RULES:
1. Questions must be educational and accurate
2. Each question has exactly 4 options (A, B, C, D)
3. Only ONE correct answer per question
4. Include brief explanation for each answer
5. Mix difficulty levels if 'mixed' is specified
6. Questions should be unique and test different concepts
7. For General Knowledge: include current affairs, history, geography, science facts, sports, famous personalities
8. For Programming: include syntax, logic, algorithms, data structures
9. For Physics/Chemistry: include formulas, concepts, applications
10. For English: include grammar, vocabulary, comprehension

RESPONSE FORMAT (JSON array):
[
  {
    "question": "Question text here?",
    "options": {
      "A": "First option",
      "B": "Second option", 
      "C": "Third option",
      "D": "Fourth option"
    },
    "correct": "A",
    "explanation": "Brief explanation of why this is correct",
    "difficulty": "easy|medium|hard"
  }
]

Generate ${count} unique, high-quality questions NOW:`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert academic question generator. Always respond with valid JSON array only, no markdown." },
          { role: "user", content: systemPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let questions;
    try {
      questions = JSON.parse(content);
    } catch (parseError) {
      console.error("Parse error, content:", content);
      throw new Error("Failed to parse AI response");
    }

    // Validate and ensure proper format
    if (!Array.isArray(questions)) {
      throw new Error("Invalid response format");
    }

    // Add unique IDs to questions
    const formattedQuestions = questions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium'
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      questions: formattedQuestions,
      topic,
      count: formattedQuestions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error generating questions:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
