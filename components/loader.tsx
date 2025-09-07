import React, { useState, useEffect } from 'react';

const loadingMessages = [
    "Weaving the threads of your dream...",
    "Consulting the astral plane...",
    "Constructing your 3D playground...",
    "Polishing the starlight...",
    "Waking the muses...",
    "Almost there, don't wake up yet..."
];

const Loader: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center glass-panel rounded-xl neon-border">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 [border-color:color-mix(in_oklab,var(--accent)_30%,transparent)] rounded-full"></div>
                <div className="absolute inset-0 border-t-4 [border-color:var(--accent)] rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-stone-300 transition-opacity duration-500">
                {loadingMessages[messageIndex]}
            </p>
        </div>
    );
};

export default Loader;