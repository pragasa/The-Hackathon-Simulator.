/**
 * @fileoverview Next.js API Route for live AI-powered Project Roast / Commentary.
 * Compiles a hilarious, context-aware 2-paragraph + punchline roast utilizing
 * the player's manifest selections and the selected judge's personality.
 *
 * @module app/api/generate-roast/route
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function loadEnvFromFile(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    let currentDir = process.cwd();
    let envPath = path.join(currentDir, ".env.local");
    
    // Walk up to 4 directories high to locate .env.local
    for (let i = 0; i < 4; i++) {
      if (fs.existsSync(envPath)) {
        break;
      }
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
      envPath = path.join(currentDir, ".env.local");
    }

    // Also check standard ".env" as fallback
    if (!fs.existsSync(envPath)) {
      currentDir = process.cwd();
      let fallbackPath = path.join(currentDir, ".env");
      for (let i = 0; i < 4; i++) {
        if (fs.existsSync(fallbackPath)) {
          envPath = fallbackPath;
          break;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
        fallbackPath = path.join(currentDir, ".env");
      }
    }

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const eqIdx = trimmed.indexOf("=");
          const key = trimmed.slice(0, eqIdx).trim();
          let value = trimmed.slice(eqIdx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      });
    }
  } catch (err) {
    console.error("Error reading env file directly:", err);
  }
  return env;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload || !payload.archetype) {
      return NextResponse.json({ error: "Missing game state payload" }, { status: 400 });
    }

    const fileEnv = loadEnvFromFile();
    
    const openaiKey = process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY || 
                      process.env.NEXT_PUBLIC_OPENAI_API_KEY || fileEnv.NEXT_PUBLIC_OPENAI_API_KEY ||
                      process.env.OPENAI_KEY || fileEnv.OPENAI_KEY;
                      
    const openRouterKey = process.env.OPENROUTER_API_KEY || fileEnv.OPENROUTER_API_KEY || 
                          process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || fileEnv.NEXT_PUBLIC_OPENROUTER_API_KEY;
                          
    const geminiKey = process.env.GEMINI_API_KEY || fileEnv.GEMINI_API_KEY || 
                      process.env.NEXT_PUBLIC_GEMINI_API_KEY || fileEnv.NEXT_PUBLIC_GEMINI_API_KEY;

    // Direct mock procedural fallback if no API keys are configured
    if (!openaiKey && !openRouterKey && !geminiKey) {
      return NextResponse.json({
        roast: `[DEMO MODE: CONFIGURE AN OPENAI_API_KEY IN .env.local TO UNLOCK LIVE AI ROASTING]\n\nYour project classification is "${payload.archetype}". You attempted to solve this challenge using a stack of ${payload.techStack?.join(", ") || "raw code"} with a business model of "${payload.businessModel || "charity"}" and the USP "${payload.usp || "None"}". While the concept has ambition, the jury believes your implementation could benefit from tighter loop validations.`,
        fallbackUsed: true
      });
    }

    const systemPrompt = `You are a savage, witty, and elite startup hackathon judge reviewing a project manifest.
Your goal is to write a highly customized, funny, and specific ROAST and commentary of the player's project.
You must speak in the specific voice of the selected judge and focus on their personality lens.

JUDGES AND LENS:
1. Uday Sharma (personality: 'technical' / Builder):
   * Focuses on MVPs, scappiness, shipping fast, and user validation.
   * Loves Next.js + Vercel, hates unnecessary tech bloat and overengineering.
   * Typical thinking: "Did you build something useful or did you just build infrastructure? Good founders ship."
2. Sarah Park (personality: 'creative' / YC Founder):
   * Focuses on market size, distribution flywheels, user demand, and product-market fit.
   * Loves community network loops or AI personalization, hates tiny markets and weak differentiation.
3. Maya Chen (personality: 'encouraging' / Design Perfectionist):
   * Focuses on UX, visual system polish, simplicity, and user accessibility.
   * Praise responsive layouts, penalize cluttered dashboards and confusing onboarding.
4. Raj Malhotra (personality: 'tough' / VC Shark):
   * Focuses on monetization, high SaaS margins, unit economics, defensible moats, and scale exit.
   * Loves government capturing, B2B SaaS, hates low-value monetization and easy copycat ideas.
5. ByteLord.exe (personality: 'creative' / Chaos Demon):
   * Humorous, absurd, meme-heavy, compiler glitch jokes. Unexpected comparisons (virtual raccoons, digital smoke).

ROAST OUTPUT FORMAT:
* Paragraph 1:
  - Discuss the core project idea.
  - Directly mention the specific technologies selected by the player.
  - Mention their chosen USP and solution direction.
* Paragraph 2:
  - Directly roast and critique their weaknesses, unrealistic assumptions, feature choices, business model decisions, or architectural bloat.
  - Reference their actual choices. Do NOT speak in generic terms. Be specific.
* Final Line:
  - One extremely memorable, punchy, funny one-liner.
  - Examples: "Great startup. Questionable relationship with Kubernetes." or "You built technical debt faster than you built the product."

CRITICAL RULES:
* The roast MUST feel like a genuine, detailed review referencing their actual tech stack, features, and USP.
* Do NOT use bullet points or numbered lists.
* plain English, funny, specific, memorable, savage.
* Target length: 120-220 words.
* Do not praise the user generically. If they did well (high score), be backhanded or sarcastically impressed. If they did poorly, be brutally funny.`;

    const userPrompt = `PROJECT MANIFEST:
- Problem: "${payload.problemStatement}"
- Solution Direction: "${payload.solutionDirection}"
- Selected Tech Stack: ${JSON.stringify(payload.techStack)}
- USP: "${payload.usp}"
- Business Model: "${payload.businessModel}"
- Must-Have Features: ${JSON.stringify(payload.mustHaveFeatures)}
- Selected Judge: "${payload.judge}"
- Judge Personality: "${payload.judgePersonality}"
- Project Archetype: "${payload.archetype}"
- Score: ${payload.score}/100
- Grade: "${payload.grade}"`;

    let generatedText = "";

    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI Roast API error:", errText);
        throw new Error(`OpenAI Roast API responded with status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content || "";
    } else if (openRouterKey) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "The Hackathon Simulator",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter Roast API error:", errText);
        throw new Error(`OpenRouter Roast API responded with status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content || "";
    } else if (geminiKey) {
      // Direct call to Google Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\nHere is the manifest to review:\n${userPrompt}` }]
          }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 400 }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini Roast API error:", errText);
        throw new Error(`Gemini Roast API responded with status ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    return NextResponse.json({ roast: generatedText.trim() });
  } catch (err: any) {
    console.error("Roast API error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate AI roast" }, { status: 500 });
  }
}
