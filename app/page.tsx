"use client";


import React, { useState, useCallback, useEffect } from 'react';
import type { GeneratedDream, QAEntry, DreamAnalysis } from '../lib/types';
import { analyzeDream, generateDreamscape } from '@/lib/ai';
import DreamInput from '@/components/dream-input';
import Dreamscape from '@/components/dreamscape';
import Loader from '@/components/loader';
import Clarify from '@/components/clarify';
import Analysis from '@/components/analysis';

const App: React.FC = () => {
  const [dreamDescription, setDreamDescription] = useState<string>('');
  const [generatedDream, setGeneratedDream] = useState<GeneratedDream | null>(null);
  const [qaTranscript, setQaTranscript] = useState<QAEntry[]>([]);
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [stage, setStage] = useState<'input' | 'clarify' | 'analyzing' | 'visualizing' | 'done'>('input');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDream = useCallback(async () => {
    if (!dreamDescription.trim()) {
      setError('Please describe your dream first.');
      return;
    }

    setIsLoading(false);
    setError(null);
    setGeneratedDream(null);
    setQaTranscript([]);
    setAnalysis(null);
    setStage('clarify');
  }, [dreamDescription]);

  const handleDreamAgain = () => {
    setGeneratedDream(null);
    setDreamDescription('');
    setError(null);
    setQaTranscript([]);
    setAnalysis(null);
    setStage('input');
  };

  // After analysis, generate the dreamscape image
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (stage !== 'visualizing') return;
      setIsLoading(true);
      try {
        const result = await generateDreamscape(dreamDescription);
        if (!cancelled) {
          setGeneratedDream(result);
          setStage('done');
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to visualize your dream.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [stage, dreamDescription]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">

        <header className="w-full my-8 animate-fade-in-down">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Dream Playground
          </h1>
          <p className="text-stone-400 mt-2 text-lg">
            Turn your wildest dreams into visual playgrounds.
          </p>
        </header>

        <main className="w-full flex-grow flex flex-col items-center justify-center">
          {stage === 'input' && (
            <div className="w-full max-w-2xl animate-fade-in-up">
              <DreamInput
                value={dreamDescription}
                onChange={(e) => setDreamDescription(e.target.value)}
                onSubmit={handleGenerateDream}
                isLoading={isLoading}
              />
            </div>
          )}

          {stage === 'clarify' && (
            <div className="w-full animate-fade-in-up">
              <Clarify
                description={dreamDescription}
                onDone={async (qa) => {
                  setQaTranscript(qa);
                  setStage('analyzing');
                  setIsLoading(true);
                  try {
                    const a = await analyzeDream(dreamDescription, qa);
                    setAnalysis(a);
                  } catch (err) {
                    console.error(err);
                    setError('Analysis failed. Proceeding to visualization.');
                  } finally {
                    setIsLoading(false);
                    setStage('visualizing');
                  }
                }}
              />
            </div>
          )}

          {stage === 'analyzing' && <Loader />}

          {stage === 'visualizing' && (
            <div className="w-full animate-fade-in-up">
              <Loader />
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg animate-fade-in-up" role="alert">
              <strong className="font-bold">Oh no! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {generatedDream && stage === 'done' && (
            <div className="w-full animate-fade-in-up space-y-8">
              <Dreamscape dream={generatedDream} onDreamAgain={handleDreamAgain} />
              <Analysis analysis={analysis} />
            </div>
          )}
        </main>

        <footer className="w-full text-center py-6 mt-12 text-stone-500">
          <p>Powered by Gemini. Weave your reality.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
