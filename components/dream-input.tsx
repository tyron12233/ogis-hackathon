import React from 'react';
import SparklesIcon from './icon/sparkles-icon';

interface DreamInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

const DreamInput: React.FC<DreamInputProps> = ({ value, onChange, onSubmit, isLoading }) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="w-full flex flex-col items-center space-y-4">
            <div className="w-full relative">
                <textarea
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe a fragment (e.g. neon rain on obsidian streets, a mirror that remembers, a city breathing)."
                    className="w-full h-36 p-4 pr-12 text-stone-100 glass-input rounded-lg focus:outline-none accent-ring transition-all duration-300 resize-none placeholder-stone-500"
                    disabled={isLoading}
                />
            </div>
            <button
                onClick={onSubmit}
                disabled={isLoading || !value.trim()}
                className="btn-primary glitch-btn group relative inline-flex items-center justify-center px-8 py-3 h-12 overflow-hidden font-semibold text-white transition-all duration-300 neon-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50"
            >
                <span className="bar" />
                <span className="flex items-center space-x-2">
                    <SparklesIcon className="w-5 h-5" />
                    <span className="font-orbitron tracking-wide text-sm">{isLoading ? 'DREAMING…' : 'VISUALIZE'}</span>
                </span>
            </button>
        </div>
    );
};

export default DreamInput;
