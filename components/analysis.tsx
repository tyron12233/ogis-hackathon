"use client";

import React from 'react';
import type { DreamAnalysis } from '@/lib/types';

interface AnalysisProps {
    analysis: DreamAnalysis | null;
}

const Bar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="mb-3">
        <div className="flex justify-between text-[11px] text-stone-400">
            <span className="tracking-wide">{label}</span>
            <span className="text-stone-300">{Math.round(value * 100)}%</span>
        </div>
        <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.round(value * 100)}%` }} />
        </div>
    </div>
);

const Analysis: React.FC<AnalysisProps> = ({ analysis }) => {
    if (!analysis) return null;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="card p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold neon-text">What this dream may express</h3>
                    <span className="chip">Confidence {Math.round((analysis.confidence ?? 0) * 100)}%</span>
                </div>
                <div className="holo-divider my-3" />
                <p className="text-stone-300 leading-relaxed text-sm sm:text-base">{analysis.summary}</p>
            </div>

            {(analysis.sleepStage || analysis.sensoryModalities?.length || typeof analysis.intensity === 'number') && (
                <div className="card p-5 sm:p-6">
                    <h4 className="section-title">Dream profile</h4>
                    <div className="flex flex-wrap items-center gap-3">
                        {typeof analysis.intensity === 'number' && (
                            <span className="chip">Intensity {Math.round(analysis.intensity * 100)}%</span>
                        )}
                        {analysis.sleepStage && (
                            <span className="chip">Sleep stage: {analysis.sleepStage}</span>
                        )}
                        {analysis.sensoryModalities?.map((m) => (
                            <span key={m} className="chip">{m}</span>
                        ))}
                    </div>
                </div>
            )}

            {analysis.emotions?.length > 0 && (
                <div className="card p-5 sm:p-6">
                    <h4 className="section-title">Emotion tone</h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.emotions.map((e) => (
                            <span key={e} className="chip">{e}</span>
                        ))}
                    </div>
                </div>
            )}

            {analysis.themes?.length > 0 && (
                <div className="card p-5 sm:p-6">
                    <h4 className="section-title">Themes</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {analysis.themes.map((t) => (
                            <div key={t.name}>
                                <Bar label={t.name} value={Math.min(1, Math.max(0, t.strength))} />
                                <p className="text-sm text-stone-400 mt-1">{t.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {analysis.symbols?.length > 0 && (
                <div className="card p-5 sm:p-6">
                    <h4 className="section-title">Symbols & possible meanings</h4>
                    <ul className="text-stone-300 space-y-2">
                        {analysis.symbols.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                                <span className="dot mt-1.5" />
                                <div className="text-sm">
                                    <div className="text-stone-200"><span className="font-medium capitalize">{s.symbol}</span>: {s.meaning}</div>
                                    {s.evidence && <div className="text-stone-500 mt-0.5 text-xs">{s.evidence}</div>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {(analysis.likelyFactors?.length ?? 0) > 0 && (
                <div className="card p-5 sm:p-6">
                    <h4 className="section-title">What might be influencing this dream</h4>
                    <ul className="text-stone-300 space-y-2">
                        {analysis.likelyFactors.map((f, i) => (
                            <li key={i} className="flex items-start gap-3 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                                <span className="dot mt-1.5" />
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {(analysis.copingStrategies?.length ?? 0) > 0 && (
                <div className="card p-5 sm:p-6">
                    <h4 className="section-title">Coping strategies</h4>
                    <ul className="text-stone-300 space-y-2">
                        {analysis.copingStrategies!.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                                <span className="dot mt-1.5" />
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {(analysis.suggestions?.length ?? 0) > 0 && (
                <div className="card p-5 sm:p-6">
                    <h4 className="section-title">Reflection prompts</h4>
                    <ul className="text-stone-300 space-y-2">
                        {analysis.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                                <span className="dot mt-1.5" />
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="card p-5 sm:p-6">
                <h4 className="section-title">Gentle perspective</h4>
                <p className="text-stone-300 text-sm leading-relaxed">{analysis.narrative}</p>
                <p className="text-stone-500 text-xs mt-3">This is reflective guidance, not medical advice. If dreams cause distress, consider talking with a professional.</p>
            </div>
        </div>
    );
};

export default Analysis;
