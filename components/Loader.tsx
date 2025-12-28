import { useState, useEffect } from 'react';

export default function SimpleUnicodeLoader() {
  const [charIndex, setCharIndex] = useState(0);
  const chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCharIndex(prev => (prev + 1) % chars.length);
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen dark:bg-gray-900 flex items-center justify-center">
      <div className="text-6xl text-blue-500 font-bold">
        {chars[charIndex]}
      </div>
    </div>
  );
}