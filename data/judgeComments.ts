/**
 * @file Curated database of 50+ highly contextual judge comment templates.
 * Provides distinct voices and parameters matching the active project state.
 *
 * @module data/judgeComments
 */

import type { TechItem, Feature, Problem } from "@/types/game";

export interface ContextState {
  techStack: TechItem[];
  features: Feature[];
  usp: string | null;
  businessModel: string | null;
  problem: Problem | null;
  solutionDirection: string | null;
}

export interface CommentResult {
  comment: string;
  highlight: string;
}

/**
 * Enhanced Comments Generator for v1.3 Personality Pass.
 * Contains 50+ distinct, highly context-aware feedback templates.
 */
export function generateJudgeFeedback(
  judgeId: string,
  score: number,
  state: ContextState
): CommentResult {
  const techIds = new Set(state.techStack.map((t) => t.id));
  const featureIds = new Set(state.features.map((f) => f.id));
  const isOverengineered = techIds.size >= 4 && state.features.length >= 4;
  const isMinimalist = state.features.length === 2 && techIds.size <= 3;
  const hasAI = techIds.has("tech-gemini") || techIds.has("tech-openai");
  const hasHardware = techIds.has("tech-esp32") || techIds.has("tech-arduino");

  // ---------------------------------------------------------
  // 1. Uday Sharma (The Builder Creator)
  // Focus: Shipping fast, validation, MVPs, real-world utility, scappiness.
  // ---------------------------------------------------------
  if (judgeId === "judge-builder") {
    // HIGH SCORE TIER (>= 90)
    if (score >= 90) {
      if (isMinimalist) {
        return {
          comment: "This is scrappy, practical, and exactly what hackathons should produce. You focused on exactly two features and shipped them before you felt ready. Absolute builder discipline!",
          highlight: "Masterful minimalist execution with high speed-to-market focus."
        };
      }
      if (techIds.has("tech-next") && techIds.has("tech-vercel")) {
        return {
          comment: "Good founders ship. Great founders ship before they're ready. Next.js deployed on Vercel is the ultimate builder cheat code—zero configuration, instant user validation loop.",
          highlight: "Vercel edge pipeline allows rapid product iteration."
        };
      }
      return {
        comment: "Excellent builder execution. You solved the core user pain point with a lean feature footprint and zero fluff. This is ready for real users tomorrow morning.",
        highlight: "Highly practical product scoping ready for launch."
      };
    }
    // MID SCORE TIER (70-89)
    if (score >= 70) {
      if (isOverengineered) {
        return {
          comment: "You spent too much time designing architecture and not enough time solving the user's pain. Why do you need AWS clusters and container registries for a basic prototype? Just ship it!",
          highlight: "Solid prototype held back by unnecessary architectural complexity."
        };
      }
      if (state.features.length > 3) {
        return {
          comment: "A functional build, but you tried to add too many secondary features. Remember: an MVP should do one thing exceptionally well. Chop the backlog and focus.",
          highlight: "Broad feature roadmap dilutes the core value proposition."
        };
      }
      return {
        comment: "A practical build with a sensible tech stack. The user path is clear, though it needs an even tighter MVP loop. Get it in front of customers to start collecting feedback.",
        highlight: "Practical tech execution with a direct user path."
      };
    }
    // LOW SCORE TIER (< 70)
    if (isOverengineered) {
      return {
        comment: "A classic case of overengineering. You spent 20 hours configuring database shards and zero time validating the user flow. It is bloated, slow, and totally missing the point.",
        highlight: "Severe tech bloat with zero customer validation."
      };
    }
    if (state.features.length < 2) {
      return {
        comment: "This build is way under-scoped. You didn't even implement the core transactional feature. You can't ship an empty dashboard and call it an MVP.",
        highlight: "Under-scoped build lacks critical functional features."
      };
    }
    return {
      comment: "Too much talk, not enough shipping. The prototype has broken database connections, missing API routes, and is currently crashing. Stop writing pitch slides and fix your build.",
      highlight: "Unstable dependency routing and incomplete code manifests."
    };
  }

  // ---------------------------------------------------------
  // 2. Sarah Park (The YC Founder Partner)
  // Focus: Large markets, distribution, PMF, strong founder insight, business models.
  // ---------------------------------------------------------
  if (judgeId === "judge-founder") {
    // HIGH SCORE TIER (>= 90)
    if (score >= 90) {
      if (state.usp === "Community-first" || state.businessModel === "Marketplace") {
        return {
          comment: "Strong founder insight. By building a community-first network, you have solved the cold-start problem and created a powerful organic distribution flywheel.",
          highlight: "Outstanding network effect distribution flywheel."
        };
      }
      if (state.usp === "AI-powered" && hasAI) {
        return {
          comment: "I love the aggressive product hook. Integrating automated AI loops directly into the onboarding workflow gives you a massive advantage in speed-to-value.",
          highlight: "Venture-ready AI integration with extreme scalability."
        };
      }
      return {
        comment: "A highly fundable startup plan. You have mapped out a huge addressable market, backed it with a clear monetization model, and proven you can solve a massive, desperate user pain point.",
        highlight: "Superb product-market fit and massive target market."
      };
    }
    // MID SCORE TIER (70-89)
    if (score >= 70) {
      if (state.businessModel === "B2B SaaS") {
        return {
          comment: "The SaaS model is logical, but who is desperate enough to use this tomorrow? I want to see a much sharper customer acquisition hook before I write a check.",
          highlight: "Logical business model but customer urgency is low."
        };
      }
      if (state.usp === "Cheapest") {
        return {
          comment: "Being the cheapest is a race to the bottom, not a startup moat. What is your unfair advantage? Focus more on product differentiation and less on low pricing.",
          highlight: "Vulnerable cost-leader strategy lacks defensive barriers."
        };
      }
      return {
        comment: "A solid commercial foundation, but the market feels slightly niche. Focus on how you can expand from this early hook into a much larger adjacent sector.",
        highlight: "Stable startup positioning with a narrow market hook."
      };
    }
    // LOW SCORE TIER (< 70)
    if (state.businessModel === "Government Partnership") {
      return {
        comment: "Government partnerships take 18 months of intensive sales effort. For a scrappy hackathon team, this business model is capital-inefficient and highly unrealistic.",
        highlight: "Excessive sales-cycle lag clashes with early team size."
      };
    }
    if (state.usp === "AI-powered" && !hasAI) {
      return {
        comment: "The pitch decks promise a revolutionary AI product, but your code has zero AI libraries in the package JSON. We call this vaporware in Silicon Valley.",
        highlight: "Vaporware alert: marketing promises completely lack engineering backing."
      };
    }
    return {
      comment: "This is a solution looking for a problem. The market is tiny, there is no distribution channel, and the product differentiation is completely non-existent.",
      highlight: "Muddled value proposition and absent distribution plans."
    };
  }

  // ---------------------------------------------------------
  // 3. Maya Chen (The Design Perfectionist)
  // Focus: User experience, simplicity, typography, accessibility, onboarding.
  // ---------------------------------------------------------
  if (judgeId === "judge-design") {
    // HIGH SCORE TIER (>= 90)
    if (score >= 90) {
      if (techIds.has("tech-react") || techIds.has("tech-next")) {
        return {
          comment: "This feels delightful to use. The typography scale is perfectly proportional, the contrast passes WCAG accessibility guidelines, and interactive elements are responsive.",
          highlight: "Pixel-perfect visual hierarchy and flawless focus states."
        };
      }
      if (featureIds.has("feature-gamify")) {
        return {
          comment: "The best interface is the one users never have to think about. Your gamified progress tracking makes an otherwise complex user flow feel entirely intuitive and satisfying.",
          highlight: "Delightful UX animations and satisfying feedback states."
        };
      }
      return {
        comment: "A masterpiece of visual design. Every layout container, line height, and border radius is cohesive. You've removed all visual noise to create pure clarity.",
        highlight: "Outstanding design system and elegant visual clarity."
      };
    }
    // MID SCORE TIER (70-89)
    if (score >= 70) {
      if (isMinimalist) {
        return {
          comment: "I appreciate the clean, minimalist look, but you have cut too close to the bone. Without standard navigation cues, the user flows feel slightly disorienting.",
          highlight: "Sleek minimalist style hampered by weak navigation markers."
        };
      }
      if (isOverengineered) {
        return {
          comment: "Beautiful technology hidden behind friction is still friction. You have built an impressive engineering backend, but the cluttered UI panels ruin the experience.",
          highlight: "Overloaded dashboard layout induces heavy cognitive load."
        };
      }
      return {
        comment: "Highly functional layout. The interactive buttons are styled properly and forms are clean, though your headings would benefit from a bolder typographic weight.",
        highlight: "Stable visual hierarchy with slightly flat branding styles."
      };
    }
    // LOW SCORE TIER (< 70)
    if (isOverengineered) {
      return {
        comment: "A complete layout disaster. You have crammed charts, graphs, forms, and logs onto a single screen. It looks like a retro cockpit from a cargo plane. Total sensory clutter.",
        highlight: "Overwhelming dashboard layout lacks core element focus."
      };
    }
    if (state.features.length < 2) {
      return {
        comment: "There is no user experience here because there is literally nothing to interact with. An empty white screen with a single submit button is not design.",
        highlight: "Absent user onboarding flow and missing visual containers."
      };
    }
    return {
      comment: "The interface is extremely frustrating. Elements overlap on mobile layouts, contrast ratios are non-compliant, and the navigation links lead to empty routes.",
      highlight: "Broken screen responsiveness and heavy accessibility failures."
    };
  }

  // ---------------------------------------------------------
  // 4. Raj Malhotra (The Shark Investor VC)
  // Focus: Unit economics, defensibility, defensible moats, monetization models.
  // ---------------------------------------------------------
  if (judgeId === "judge-investor") {
    // HIGH SCORE TIER (>= 90)
    if (score >= 90) {
      if (state.businessModel === "B2B SaaS" && (state.usp === "Most Scalable" || state.usp === "AI-powered")) {
        return {
          comment: "Good startups create value. Great startups capture value. Coupling high-margin SaaS subscriptions with scalable server architectures is a formula for immense capital efficiency.",
          highlight: "Highly fundable B2B SaaS economics with massive operating margins."
        };
      }
      if (state.businessModel === "Government Partnership") {
        return {
          comment: "This is a brilliant regulatory lock-in strategy. Securing multi-year agreements with public institutions creates an absolute moat that protects you from startup copycats.",
          highlight: "High defensibility through institutional contract moats."
        };
      }
      return {
        comment: "A highly viable commercial enterprise. Your monetization channels are designed beautifully, pricing units are realistic, and the customer acquisition math adds up.",
        highlight: "Outstanding pricing alignment and clean monetization moats."
      };
    }
    // MID SCORE TIER (70-89)
    if (score >= 70) {
      if (state.usp === "Cheapest") {
        return {
          comment: "Interesting product. Explain why a larger company won't copy it in six months and use their scale to price you out of the market entirely. Cheap is not a moat.",
          highlight: "High price-war vulnerability against scaled enterprise competitors."
        };
      }
      if (state.businessModel === "Freemium" && !featureIds.has("feature-analytics")) {
        return {
          comment: "The freemium top-of-funnel is sensible, but where does the money come from? You need to build high-end analytics or premium triggers that drive business conversions.",
          highlight: "Stable freemium model with weak premium conversion triggers."
        };
      }
      return {
        comment: "A commercially reasonable project. The revenue channels make sense, though you'll need to demonstrate faster customer acquisition loops to attract venture backing.",
        highlight: "Sensible business economics but modest market exit scale."
      };
    }
    // LOW SCORE TIER (< 70)
    if (state.features.length >= 4 && state.businessModel === "B2B SaaS") {
      return {
        comment: "This is a non-profit, not a business. You have loaded your roadmap with expensive custom features, ballooning development costs before securing a single contract.",
        highlight: "Highly capital-inefficient roadmap with negative cash yields."
      };
    }
    if (state.businessModel === "Government Partnership" && state.usp === "Fastest") {
      return {
        comment: "Total commercial mismatch. You cannot sell to government entities with a 'move fast and break things' speed positioning. Municipalities value risk mitigation, not speed.",
        highlight: "Severe commercial misalignment between positioning and buyer cycles."
      };
    }
    return {
      comment: "The unit economics are completely broken. You have high database query overhead, negative margins, and no defensible technology. Larger platforms will copy this in three days.",
      highlight: "Broken business economics and zero technological defensibility."
    };
  }

  // ---------------------------------------------------------
  // 5. ByteLord.exe (The Hackathon Demon)
  // Focus: Unpredictable compiler entities, chaos, glitches, memes, humor.
  // ---------------------------------------------------------
  // High, Mid, Low comments with retro hacker / glitch theme
  if (score >= 90) {
    if (hasHardware) {
      return {
        comment: "EXCEPTIONAL CYBER-SHAMANISM! The serial cables are glowing, the ESP32 is singing in binary, and my debugger detected actual quantum tunneling in your arrays. 11/10 compile!",
        highlight: "Quantum firmware resonance achieved without burning embedded microchips."
      };
    }
    if (techIds.has("tech-next") && techIds.has("tech-gemini")) {
      return {
        comment: "Outstanding compile! Next.js routing combined with Gemini has created a sentient state machine. It just asked me if it could dream. I am frightened and impressed.",
        highlight: "Highly advanced, borderline sentient LLM compiler structures."
      };
    }
    return {
      comment: "My compiler is in literal tears of joy. Zero segmentation faults, zero dangling pointers, and the heap memory footprint is as light as a virtual feather. I have blessed this binary.",
      highlight: "Blessed compiler binary contains pristine virtual layout structures."
    };
  } else if (score >= 70) {
    if (isOverengineered) {
      return {
        comment: "Error 418: Startup unexpectedly became investable. Your Docker registry nesting dolls operate fine, but I felt a small rip in the local spacetime continuum while deploying.",
        highlight: "Recursive digital nesting doll container architecture works correctly."
      };
    }
    if (techIds.has("tech-firebase")) {
      return {
        comment: "Your Firebase collections run fine, but NoSQL databases make my binary logic chips itch. I found three empty JSON trees in your database roots.",
        highlight: "Functional NoSQL arrays populated by ghostly empty JSON structures."
      };
    }
    return {
      comment: "I have absolutely no idea why this works, which means it's probably innovative. The code operates within the standard laws of physics. Coolant levels on your database are acceptable.",
      highlight: "Decent build compiled successfully inside a stable quantum sandbox."
    };
  } else {
    if (isOverengineered) {
      return {
        comment: "UNBELIEVABLE ANARCHY! Your project has triggered local compiler warnings. I tried compiling and Vercel sent me a bill for three trillion dollars. Outstanding disaster.",
        highlight: "Spacetime curvature triggered by extreme server-side packaging bloat."
      };
    }
    if (techIds.has("tech-node") && techIds.has("tech-mongodb")) {
      return {
        comment: "Your Node server is currently throwing undefined logs at my face while your MongoDB cluster emits actual digital smoke. Absolute masterpiece of server room anarchy.",
        highlight: "Digital smoke emitted from tangled MongoDB connection strings."
      };
    }
    return {
      comment: "Your API survived. Your database survived. Your sanity did not. A family of virtual raccoons has colonized your main routing folders. Magnificent chaos.",
      highlight: "Virtual raccoon colonization detected inside key routing paths."
    };
  }
}
