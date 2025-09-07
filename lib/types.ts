export type PrimitiveType =
    | 'box'
    | 'sphere'
    | 'torus'
    | 'cone'
    | 'cylinder'
    | 'icosahedron'
    | 'dodecahedron'
    | 'plane';

export type AnimationType = 'none' | 'rotate' | 'float' | 'orbit';

export interface SceneObject {
    id?: string;
    type: PrimitiveType;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
    color?: string; // hex or css color
    emissive?: string; // hex or css color
    metalness?: number; // 0..1
    roughness?: number; // 0..1
    animation?: AnimationType;
}

export interface GeneratedDream {
    imageUrl: string;
    title: string;
    sceneObjects?: SceneObject[];
}

// --- Dream analysis types ---

export interface ClarifyingQuestion {
    id: string;
    question: string;
    rationale?: string;
    choices?: string[]; // optional multiple-choice options
    multi?: boolean; // allow multiple selections when true
}

export interface QAEntry {
    question: string;
    answer: string;
}

export interface DreamAnalysisTheme {
    name: string; // e.g., "control", "uncertainty", "transformation"
    description: string;
    strength: number; // 0..1
}

export interface DreamSymbolInsight {
    symbol: string; // e.g., "teeth", "falling", "water"
    meaning: string;
    evidence?: string; // what from the transcript suggests this
}

export interface DreamAnalysis {
    summary: string; // short, human-friendly overview
    emotions: string[]; // e.g., ["anxious", "curious"]
    themes: DreamAnalysisTheme[];
    symbols: DreamSymbolInsight[];
    likelyFactors: string[]; // e.g., stressors, habits, context
    suggestions: string[]; // practical tips or reflection prompts
    confidence: number; // 0..1
    narrative: string; // a short narrative explanation
    sleepStage?: string; // e.g., REM, light sleep
    sensoryModalities?: string[]; // e.g., visual, auditory, kinesthetic
    copingStrategies?: string[]; // additional, distinct from suggestions
    intensity?: number; // 0..1 perceived intensity
}

// --- Legacy world generation types (used by experimental components) ---

export type DreamShape = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane';

export interface DreamObjectData {
    shape: DreamShape;
    position: [number, number, number];
    rotation: [number, number, number]; // degrees
    scale: [number, number, number];
    texturePrompt?: string;
    textureData?: string; // data URL
}

export interface WorldData {
    ambientLightIntensity: number;
    fogColor: string;
    objects: DreamObjectData[];
}

export interface GenerationProgress {
    message: string;
    percentage: number; // 0..100
}

