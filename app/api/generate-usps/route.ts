/**
 * @fileoverview Next.js API Route for live AI-powered layman-friendly USP generation.
 * Hooks into OpenAI GPT-4o-mini using standard HTTP fetch to generate
 * 6 highly unique, direct, and non-jargon competitive advantages.
 *
 * @module app/api/generate-usps/route
 */

import { NextResponse } from "next/server";
import { generateUSPOptions } from "@/lib/projectStrategyGenerator";
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

    if (!payload || !payload.selectedProblem) {
      return NextResponse.json({ error: "Missing game state payload" }, { status: 400 });
    }

    const { selectedProblem, solutionDirection, techStack, gameMode, seed } = payload;
    const fileEnv = loadEnvFromFile();
    
    const openaiKey = process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY || 
                      process.env.NEXT_PUBLIC_OPENAI_API_KEY || fileEnv.NEXT_PUBLIC_OPENAI_API_KEY ||
                      process.env.OPENAI_KEY || fileEnv.OPENAI_KEY;
                      
    const openRouterKey = process.env.OPENROUTER_API_KEY || fileEnv.OPENROUTER_API_KEY || 
                          process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || fileEnv.NEXT_PUBLIC_OPENROUTER_API_KEY;
                          
    const geminiKey = process.env.GEMINI_API_KEY || fileEnv.GEMINI_API_KEY || 
                      process.env.NEXT_PUBLIC_GEMINI_API_KEY || fileEnv.NEXT_PUBLIC_GEMINI_API_KEY;

    // ─── Direct Fallback to Procedural offline USPs if no API keys configured ───
    if (!openaiKey && !openRouterKey && !geminiKey) {
      console.log("No AI API keys configured. Using high-fidelity procedural offline USPs fallback.");
      const offlineUSPs = generateUSPOptions(selectedProblem, solutionDirection, techStack, gameMode, seed);
      return NextResponse.json({ usps: offlineUSPs, fallbackUsed: true });
    }

    const systemPrompt = `You are a creative, expert startup strategist.
Your task is to generate 6 highly unique, distinct, and creative Unique Selling Propositions (USPs) for a hackathon project.

IMPORTANT - LAYMAN LANGUAGE REQUIREMENT:
Write the title ("name") and description ("desc") of each USP in extremely simple, friendly, and layman-friendly English (layperson language).
- AVOID complex jargon (e.g. "Zero-configuration spaced-repetition scheduler engine", "Elastic event-driven vital telemetry locker").
- USE simple, direct words that anyone can instantly understand (e.g. "One-Click Quick Prep", "Instant Vital Alerts", "Free Shareable Budget").
- Make sure the titles and names sound exciting, clear, and highly distinct from each other!

Each USP must map to a specific archetype "key" and have balanced game metrics:
- "Fastest": instant and simple to build. (High execution ~75-85, lower innovation ~40-50)
- "Cheapest": serverless, database-free, free to run. (High execution ~70-80, lower design ~40-50)
- "Most Scalable": robust, handles huge user count/data load. (High pitch ~65-75, lower execution ~50-60)
- "AI-powered": powered by smart LLM or voice. (High innovation ~80-90, lower execution ~45-55)
- "Sustainable": green, low emission, eco-friendly. (High pitch ~70-80, lower execution ~50-60)
- "Hyper-personalized": custom-tailored to the user. (High design ~75-85, lower execution ~50-60)
- "Community-first": built for sharing, peer help, local groups. (High pitch ~70-80, lower design ~50-60)

You MUST return a raw, valid JSON array of exactly 6 USP objects. Do not include markdown wraps or explanations. Follow this JSON format strictly:
[
  {
    "key": "Fastest" | "Cheapest" | "Most Scalable" | "AI-powered" | "Sustainable" | "Hyper-personalized" | "Community-first",
    "name": "layman-friendly creative name",
    "desc": "simple description of what this approach does",
    "innovation": integer between 35 and 90,
    "execution": integer between 35 and 90,
    "design": integer between 35 and 90,
    "pitch": integer between 35 and 90,
    "advantages": "layman benefit of this choice",
    "challenges": "layman drawback of this choice"
  }
]`;

    const userPrompt = `PROJECT SCENARIO DETAILS:
- SELECTED CHALLENGE: "${selectedProblem.title}" - "${selectedProblem.description}"
- CATEGORY: "${selectedProblem.category}"
- CHALLENGE CONSTRAINTS: ${JSON.stringify(selectedProblem.constraints)}
- SOLUTION FORMAT: "${solutionDirection || "web-app"}"
- SELECTED TECH STACK: ${JSON.stringify(techStack.slice(0, 4).map((t: any) => t.name))}
Please output exactly 6 highly creative, layman-friendly USPs matching this context in strict JSON format. Select 6 distinct keys from the allowed list.`;

    let responseText = "";

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
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI USP Generation API error:", errText);
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content || "";
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
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter USP Generation API error:", errText);
        throw new Error(`OpenRouter API responded with status ${response.status}`);
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content || "";
    } else if (geminiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\nHere are the details:\n${userPrompt}` }]
          }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini USP Generation API error:", errText);
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const data = await response.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Clean JSON response (remove markdown wrap if present)
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    try {
      const usps = JSON.parse(cleanedText);
      if (Array.isArray(usps) && usps.length > 0) {
        return NextResponse.json({ usps, fallbackUsed: false });
      }
      throw new Error("Invalid structure returned from AI model");
    } catch (parseErr) {
      console.error("JSON parsing of AI USP failed, falling back.", parseErr, cleanedText);
      const offlineUSPs = generateUSPOptions(selectedProblem, solutionDirection, techStack, gameMode, seed);
      return NextResponse.json({ usps: offlineUSPs, fallbackUsed: true });
    }
  } catch (err: any) {
    console.error("USP API error, falling back:", err);
    // Graceful fallback to avoid crash
    try {
      const payload = await req.json();
      const offlineUSPs = generateUSPOptions(payload.selectedProblem, payload.solutionDirection, payload.techStack, payload.gameMode, payload.seed);
      return NextResponse.json({ usps: offlineUSPs, fallbackUsed: true, error: err.message });
    } catch {
      return NextResponse.json({ error: "Failed to generate USPs entirely" }, { status: 500 });
    }
  }
}
