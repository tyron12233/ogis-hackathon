import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedDream, SceneObject, ClarifyingQuestion, QAEntry, DreamAnalysis } from './types';
import { extension as mimeExtension } from 'mime-types';

if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
    throw new Error("NEXT_PUBLIC_GOOGLE_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY });

// --- Helpers: tolerant JSON extraction/parsing ---
const normalizeQuotes = (s: string) => s
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

const stripCodeFences = (s: string) => s.replace(/```json|```/gi, '');

const removeTrailingCommas = (s: string) => s.replace(/,(\s*[}\]])/g, '$1');

function extractJsonBlock(text: string): string | null {
    const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced) return fenced[1];
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
        return text.slice(first, last + 1);
    }
    return null;
}

function tryParseJson<T>(rawText: string): T | null {
    let candidate = stripCodeFences(normalizeQuotes(rawText)).trim();
    const block = extractJsonBlock(candidate);
    if (block) candidate = block;
    // Remove trailing commas and attempt parse
    candidate = removeTrailingCommas(candidate);
    try {
        return JSON.parse(candidate) as T;
    } catch {
        return null;
    }
}

/**
 * Generates a dreamscape image and title based on a user's description.
 * Ensures the title is a clean single-line string (no JSON, no labels, no bullets).
 */
export const generateDreamscape = async (description: string): Promise<GeneratedDream> => {
    try {
        // Step 1: Generate a captivating title for the dream.
        const titlePrompt = `You are titling a dream. Return ONLY the title as a single line.
Rules:
- 2 to 5 words, evocative, no quotes, no markdown, no emojis.
- No prefixes like "Title:", "Option", numbers, or bullets.
- Do not explain. Do not include JSON.

Dream description: ${JSON.stringify(description)}`;

        const titleResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: titlePrompt,
            config: {
                temperature: 0.5,
                maxOutputTokens: 16,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        const rawTitle = (titleResponse!.text ?? '').trim();
        const title = (() => {
            const strip = (s: string) => s
                .replace(/```[\s\S]*?```/g, '')
                .replace(/[\u201C\u201D]/g, '"')
                .replace(/[\u2018\u2019]/g, "'")
                .replace(/^\s*(?:(?:title\s*:\s*)|(?:here are.*$)|(?:options?:.*$))/i, '')
                .replace(/^\s*[-*]\s*/, '')
                .replace(/^\s*\d+[\).\]]\s*/, '')
                .replace(/^\s*"|"\s*$/g, '')
                .replace(/\*\*?|__|~~/g, '')
                .trim();

            // Consider first few non-empty lines as candidates
            const candidates = rawTitle
                .split(/\r?\n/)
                .map(strip)
                .filter(Boolean);

            // Prefer a line with 2..6 words, no colon
            const good = candidates.find(l => {
                const words = l.split(/\s+/).filter(Boolean);
                return words.length >= 2 && words.length <= 6 && !l.includes(':');
            });

            const pick = good ?? (candidates[0] ?? 'Untitled Dream');
            // Final clean: collapse spaces and cap length
            return pick.replace(/\s+/g, ' ').slice(0, 64);
        })();

        // Step 2: Generate the 360-degree dreamscape image.
        const imagePrompt = `
        Generate a realistic, high-resolution 360-degree image suitable for a VR experience.
    The title of the scene is: "${title}".
      The scene is based on this description: "${description}".
      
      Style guidelines:
      - Seamlessly wrappable for a 3D skybox or VR experience.
      - Photorealistic.
      - The panorama should be seamless, with no visible edges or distortions

      The camera should be positioned at somewhere in a head height perspective, 
      capturing a wide field of view.

      The image should be in an equirectangular format with a 2:1 aspect ratio,
    `;

        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash-image-preview',
            config: {

            },
            contents: imagePrompt,
        });

        let fileIndex = 0;
        for await (const chunk of response) {
            if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
                continue;
            }
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                const inlineData = chunk.candidates[0].content.parts[0].inlineData;
                const imageUrl = `data:${inlineData.mimeType};base64,${inlineData.data}`;

                // Step 3: Ask the model for a minimal 3D scene plan (JSON) with simple primitives.
                const scenePrompt = `You are a 3D scene planner. Based on the dream title and description, return a concise JSON array of objects to place in a 3D scene using primitives only. Use keys: type (box|sphere|torus|cone|cylinder|icosahedron|dodecahedron|plane), position [x,y,z], rotation [x,y,z] (optional, radians), scale (number or [x,y,z], optional), color (hex), emissive (hex, optional), metalness 0..1 (optional), roughness 0..1 (optional), animation (none|rotate|float|orbit, optional). Keep values small so objects are around the origin and within -5..5. Return ONLY JSON with no markdown or explanation.

Title: ${title}
Description: ${description}`;

                let sceneObjects: SceneObject[] | undefined;
                try {
                    const sceneResp = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: scenePrompt,
                        config: { temperature: 0.6, maxOutputTokens: 300, thinkingConfig: { thinkingBudget: 0 } }
                    });
                    const raw = sceneResp!.text!.trim();
                    // Extract JSON even if wrapped in code fences or text
                    const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i);
                    const extracted = fenced ? fenced[1] : raw;
                    const json = extracted.replace(/```json|```/gi, '').trim();
                    const parsed = JSON.parse(json) as SceneObject[];
                    // Basic sanitize: limit positions and set defaults
                    sceneObjects = parsed?.slice(0, 12).map((o, i) => ({
                        id: o.id ?? `obj-${i}`,
                        type: o.type,
                        position: [
                            Math.max(-8, Math.min(8, o.position?.[0] ?? 0)),
                            Math.max(-2, Math.min(5, o.position?.[1] ?? 0)),
                            Math.max(-8, Math.min(8, o.position?.[2] ?? -2)),
                        ],
                        rotation: o.rotation ?? [0, 0, 0],
                        scale: o.scale ?? 1,
                        color: o.color ?? '#9ca3af',
                        emissive: o.emissive,
                        metalness: typeof o.metalness === 'number' ? Math.max(0, Math.min(1, o.metalness)) : 0.2,
                        roughness: typeof o.roughness === 'number' ? Math.max(0, Math.min(1, o.roughness)) : 0.6,
                        animation: o.animation ?? 'none',
                    }));
                } catch (e) {
                    console.warn('Scene planning failed, proceeding without objects', e);
                }

                return { imageUrl, title, sceneObjects };
            }
            else {
                console.log(chunk.text);
            }
        }

        throw new Error('No image data received from the AI model.');
    } catch (error) {
        console.error('Error in generateDreamscape:', error);
        if (error instanceof Error && error.message.includes('SAFETY')) {
            throw new Error('The dream description could not be processed due to safety policies. Please try a different description.');
        }
        throw new Error('Failed to bring your dream to life. The connection to the dream realm might be unstable.');
    }
};

/**
 * Generate up to 3 clarifying questions to better understand the dream.
 */
export const getClarifyingQuestions = async (description: string): Promise<ClarifyingQuestion[]> => {
    const prompt = `You're a thoughtful, trauma-informed dream interviewer.
Return up to 3 concise, non-leading questions that could clarify important details of the dream.
If helpful, include "choices" (2-6 short options) and optionally set "multi": true for multiple selection.
Keep each question under 160 characters, avoid assumptions, be kind.
Reply as a pure JSON array with shape: [{"id":"q1","question":"...","rationale":"...","choices":["..."],"multi":false}]

Dream: ${JSON.stringify(description)}`;

    const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.4 }
    });
    const raw = (resp!.text ?? '').trim();
    const parsed = tryParseJson<ClarifyingQuestion[]>(raw);
    if (!parsed) return [];
    return parsed.slice(0, 3).map((q, i) => ({
        id: q.id ?? `q${i + 1}`,
        question: q.question,
        rationale: q.rationale,
        choices: Array.isArray(q.choices) ? q.choices.slice(0, 8) : undefined,
        multi: typeof q.multi === 'boolean' ? q.multi : false,
    }));
};

/**
 * Analyze the dream with the Q&A transcript and return structured insights.
 */
export const analyzeDream = async (description: string, transcript: QAEntry[]): Promise<DreamAnalysis> => {
    const prompt = `You're an evidence-based, trauma-informed dream analyst. Combine symbolic, cognitive, cultural, and emotional perspectives.
Given a user's dream description and optional Q&A transcript, produce a structured JSON with:
{
    "summary": string, // concise overview in 2-3 sentences
    "emotions": string[], // 2-6 core emotions
    "themes": [{"name": string, "description": string, "strength": 0..1}],
    "symbols": [{"symbol": string, "meaning": string, "evidence"?: string}],
    "likelyFactors": string[], // habits, stressors, life contexts
    "suggestions": string[], // gentle prompts, journaling ideas, rituals
    "confidence": 0..1,
    "narrative": string, // reflective, supportive, surreal yet grounded
    "sleepStage"?: string, // e.g., REM, N2, unknown
    "sensoryModalities"?: string[], // e.g., visual, auditory, kinesthetic, olfactory
    "copingStrategies"?: string[], // concise actionable tips
    "intensity"?: 0..1
}
Tone: supportive, non-diagnostic, practical. Avoid medical terms or disorders.
Return ONLY JSON with the fields above.

Dream: ${JSON.stringify(description)}
Transcript: ${JSON.stringify(transcript)}
`;

    const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.5 }
    });

    const raw = (resp!.text ?? '').trim();
    const parsed = tryParseJson<DreamAnalysis>(raw);

    console.log('Raw analysis response:', raw);

    if (parsed) {
        // Basic sanity defaults
        parsed.emotions = parsed.emotions?.slice(0, 6) ?? [];
        parsed.themes = parsed.themes?.slice(0, 6) ?? [];
        parsed.symbols = parsed.symbols?.slice(0, 10) ?? [];
        parsed.likelyFactors = parsed.likelyFactors?.slice(0, 6) ?? [];
        parsed.suggestions = parsed.suggestions?.slice(0, 6) ?? [];
        parsed.confidence = Math.min(1, Math.max(0, parsed.confidence ?? 0.6));
        if (typeof (parsed as any).intensity === 'number') {
            (parsed as any).intensity = Math.min(1, Math.max(0, (parsed as any).intensity));
        }
        return parsed;
    }

    // Fallback: non-JSON response — synthesize a minimal analysis to avoid breaking the flow
    const summary = raw
        .replace(/^[^A-Za-z0-9\{\[]+/, '')
        .split(/\n+/)
        .slice(0, 3)
        .join(' ')
        .slice(0, 600) || 'A reflective take on your dream could not be structured automatically.';

    return {
        summary,
        emotions: [],
        themes: [],
        symbols: [],
        likelyFactors: [],
        suggestions: [],
        confidence: 0.4,
        narrative: summary,
    };
};
