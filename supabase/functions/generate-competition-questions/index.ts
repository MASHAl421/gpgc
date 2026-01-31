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
    const { topic, count = 10, difficulty = 'easy', type = 'practice' } = await req.json() as QuestionRequest;

    // Semester 1 focused prompt - easier, beginner-friendly questions
    const difficultyGuide = difficulty === 'easy' 
      ? `EASY LEVEL (Semester 1 Beginners):
- Focus on basic definitions and concepts
- Simple recall-based questions
- No tricky or confusing options
- Clear, straightforward language
- Examples: "What is a variable?", "Which keyword is used for output in C++?", "What is a noun?"`
      : difficulty === 'medium'
      ? `MEDIUM LEVEL (Understanding):
- Application of basic concepts
- Simple problem-solving
- Code output prediction (simple cases)
- Grammar application questions
- Examples: "What will be the output of: cout << 5 + 3;", "Identify the verb in: She runs fast"`
      : `MIXED LEVEL: Include both easy and medium questions`;

    const systemPrompt = `You are an expert question generator for BS Semester 1 students in Pakistan. Generate exactly ${count} multiple choice questions.

TOPIC: ${topic}
DIFFICULTY: ${difficulty}
TYPE: ${type}

${difficultyGuide}

SUBJECT-SPECIFIC GUIDELINES:
1. **Programming Fundamentals (C++):**
   - For "Introduction to C++": History, IDE, basic structure of program
   - For "Variables & Data Types": int, float, char, string declaration
   - For "I/O Operations": cin, cout syntax and usage
   - For "Operators": +, -, *, /, %, ==, !=, &&, ||
   - For "Control Structures": if-else, switch, for, while loops
   - For "Arrays": Declaration, initialization, accessing elements
   - For "Functions": Definition, calling, parameters, return types
   - For "Pointers": Basic concept, & and * operators
   - Keep code snippets SHORT (2-4 lines max)
   - Use simple variable names (a, b, x, num)

2. **Functional English:**
   - For "Parts of Speech": Identify nouns, verbs, adjectives, adverbs
   - For "Tenses": Present, past, future tense identification
   - For "Sentence Structure": Simple vs compound sentences
   - For "Punctuation": Comma, period, question mark usage
   - For "Voice": Active to passive conversion basics
   - Use simple, clear sentences
   - Avoid complex vocabulary

3. **General Knowledge:**
   - Pakistan geography, capitals, provinces
   - Basic current affairs
   - Simple science facts
   - Computer basics (hardware/software)

RULES:
1. Questions must be educational and accurate
2. Each question has exactly 4 options (A, B, C, D)
3. Only ONE correct answer per question
4. Include brief explanation (1-2 sentences)
5. Make wrong options plausible but clearly wrong
6. No advanced/tricky questions for easy level
7. Questions should be unique

RESPONSE FORMAT (JSON array only, no markdown):
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
    "difficulty": "${difficulty}"
  }
]

Generate ${count} unique, beginner-friendly questions NOW:`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert academic question generator for beginners. Always respond with valid JSON array only, no markdown. Keep questions simple and educational." },
          { role: "user", content: systemPrompt }
        ],
        temperature: 0.7,
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
      difficulty: q.difficulty || difficulty
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
