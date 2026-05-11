import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle options and update correct answer accordingly
function shuffleQuestionOptions(question: any): any {
  const optionKeys = ['A', 'B', 'C', 'D'];
  const optionEntries = optionKeys.map(key => ({
    originalKey: key,
    value: question.options[key]
  }));
  
  // Shuffle the entries
  const shuffledEntries = shuffleArray(optionEntries);
  
  // Find where the correct answer ended up
  const correctOriginalKey = question.correct;
  const newCorrectIndex = shuffledEntries.findIndex(e => e.originalKey === correctOriginalKey);
  const newCorrectKey = optionKeys[newCorrectIndex];
  
  // Build new options object
  const newOptions: Record<string, string> = {};
  shuffledEntries.forEach((entry, index) => {
    newOptions[optionKeys[index]] = entry.value;
  });
  
  return {
    ...question,
    options: newOptions,
    correct: newCorrectKey
  };
}

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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { topic, count = 10, difficulty = 'easy', type = 'practice' } = await req.json() as QuestionRequest;

    // Input validation
    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid request: topic is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize topic (alphanumeric, spaces, and common punctuation only)
    const sanitizedTopic = topic.replace(/[^a-zA-Z0-9\s\-\+\(\)]/g, '').slice(0, 200);
    
    if (sanitizedTopic.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid topic" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate count (max 50 questions)
    const validatedCount = Math.min(Math.max(1, Number(count) || 10), 50);

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard', 'mixed'];
    const validatedDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'easy';

    // Validate type
    const validTypes = ['practice', 'competition', 'mock'];
    const validatedType = validTypes.includes(type) ? type : 'practice';

    // Semester 1 focused prompt - easier, beginner-friendly questions
    const difficultyGuide = validatedDifficulty === 'easy' 
      ? `EASY LEVEL (Semester 1 Beginners):
- Focus on basic definitions and concepts
- Simple recall-based questions
- No tricky or confusing options
- Clear, straightforward language
- Examples: "What is a variable?", "Which keyword is used for output in C++?", "What is a noun?"`
      : validatedDifficulty === 'medium'
      ? `MEDIUM LEVEL (Understanding):
- Application of basic concepts
- Simple problem-solving
- Code output prediction (simple cases)
- Grammar application questions
- Examples: "What will be the output of: cout << 5 + 3;", "Identify the verb in: She runs fast"`
      : `MIXED LEVEL: Include both easy and medium questions`;

    const systemPrompt = `You are an expert question generator for BS Semester 1 students in Pakistan. Generate exactly ${validatedCount} multiple choice questions.

TOPIC: ${sanitizedTopic}
DIFFICULTY: ${validatedDifficulty}
TYPE: ${validatedType}

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

3. **Applied Physics (PHYS-103):**
   - For "Electric Charge": Quantization (Q=ne), conservation, Coulomb's law
   - For "Conductors/Insulators": Free electrons, resistivity, band gap
   - For "Electric Field": E=kQ/r², field lines, superposition
   - For "Electric Flux": Φ=EA cos θ, Gauss's law applications
   - For "Electric Potential": V=kQ/r, potential difference, gradient
   - For "Current/Resistance": Ohm's law, resistivity, power (P=VI)
   - For "Magnetic Force": F=qvB, Lorentz force, cyclotron motion
   - For "Biot-Savart/Ampere": B=μ₀I/2πr, solenoid, toroid
   - For "Electromagnetic Induction": Faraday's law, Lenz's law, motional EMF
   - For "Optics": Snell's law, TIR, interference, diffraction, polarization
   - Use proper physics formulas and units
   - Include numerical problems with simple calculations

4. **General Knowledge:**
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
    "difficulty": "${validatedDifficulty}"
  }
]

Generate ${validatedCount} unique, beginner-friendly questions NOW:`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY")}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://gpgc.lovable.app",
        "X-Title": "GPGC Portal",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
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

    // Add unique IDs to questions and shuffle options
    const formattedQuestions = questions.map((q: any, index: number) => {
      const shuffledQuestion = shuffleQuestionOptions(q);
      return {
        id: `q-${Date.now()}-${index}`,
        question: shuffledQuestion.question,
        options: shuffledQuestion.options,
        correct: shuffledQuestion.correct,
        explanation: shuffledQuestion.explanation,
        difficulty: shuffledQuestion.difficulty || validatedDifficulty
      };
    });

    return new Response(JSON.stringify({ 
      success: true, 
      questions: formattedQuestions,
      topic: sanitizedTopic,
      count: formattedQuestions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error("Error generating questions:", error);
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
