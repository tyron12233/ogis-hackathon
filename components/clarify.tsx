"use client";

import React, { useEffect, useState } from 'react';
import type { ClarifyingQuestion, QAEntry } from '@/lib/types';
import { getClarifyingQuestions } from '@/lib/ai';

interface ClarifyProps {
    description: string;
    onDone: (qa: QAEntry[]) => void;
}

const Clarify: React.FC<ClarifyProps> = ({ description, onDone }) => {
    const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const qs = await getClarifyingQuestions(description);
                if (mounted) setQuestions(qs);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [description]);

    const handleSubmit = () => {
        const qa: QAEntry[] = questions
            .map(q => {
                const a = answers[q.id];
                const answerStr = Array.isArray(a) ? a.join(', ') : (a ?? '');
                return { q, answerStr: (answerStr as string).trim() };
            })
            .filter(({ answerStr }) => answerStr.length > 0)
            .map(({ q, answerStr }) => ({ question: q.question, answer: answerStr }));
        onDone(qa);
    };

    const toggleMultiChoice = (qid: string, option: string) => {
        setAnswers(prev => {
            const current = prev[qid];
            const arr = Array.isArray(current) ? [...current] : [];
            const idx = arr.indexOf(option);
            if (idx >= 0) arr.splice(idx, 1); else arr.push(option);
            return { ...prev, [qid]: arr };
        });
    };

    if (loading) {
        return (
            <div className="w-full max-w-2xl p-4 rounded-lg border border-stone-800 bg-stone-900/40 text-stone-300">
                Thinking of a couple helpful questions…
            </div>
        );
    }

    if (questions.length === 0) {
        // No questions needed; continue
        onDone([]);
        return null;
    }

    return (
        <div className="w-full max-w-2xl space-y-4">
            <div className="text-left">
                <h3 className="text-xl font-semibold neon-text">Quick clarifications</h3>
                <p className="text-stone-400 text-sm">Answer what you like; skip anything. This helps tailor the interpretation and scene.</p>
            </div>

            {questions.map((q) => (
                <div key={q.id} className="card p-4">
                    <label className="block text-stone-200 font-medium mb-2">{q.question}</label>
                    {Array.isArray(q.choices) && q.choices.length > 0 ? (
                        <div className="space-y-2">
                            {q.choices.map((opt, idx) => (
                                <label key={idx} className="flex items-center gap-2 text-stone-300">
                                    {q.multi ? (
                                        <input
                                            type="checkbox"
                                            className="accent-violet-500"
                                            checked={Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).includes(opt) : false}
                                            onChange={() => toggleMultiChoice(q.id, opt)}
                                        />
                                    ) : (
                                        <input
                                            type="radio"
                                            name={q.id}
                                            className="accent-violet-500"
                                            checked={answers[q.id] === opt}
                                            onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                                        />
                                    )}
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <textarea
                            className="w-full h-20 p-3 text-stone-100 glass-input rounded-lg focus:outline-none accent-ring resize-none"
                            placeholder="Type your answer (optional)"
                            value={(typeof answers[q.id] === 'string' ? (answers[q.id] as string) : '')}
                            onChange={(e) => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                        />
                    )}
                    {q.rationale && (
                        <p className="mt-2 text-xs text-stone-500">Why this helps: {q.rationale}</p>
                    )}
                </div>
            ))}

            <div className="flex gap-3">
                <button onClick={handleSubmit} className="px-5 py-2 btn-primary neon-border rounded-md">Continue</button>
                <button onClick={() => onDone([])} className="px-5 py-2 bg-stone-800 border border-stone-700 rounded-md text-stone-200">Skip</button>
            </div>
        </div>
    );
};

export default Clarify;
