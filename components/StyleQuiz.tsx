
import React, { useState, useEffect } from 'react';
import { RoomStyle } from '../types';
import { ROOM_STYLES } from '../constants';
import { generateQuizResultDescription } from '../services/geminiService';

interface StyleQuizProps {
  onComplete: (style: string) => void;
}

interface QuizOption {
  text: string;
  style: RoomStyle;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

const QUESTION_POOL = [
  {
    question: "What atmosphere do you want to create?",
    options: [
      { text: "Serene, organic, and nature-filled", style: RoomStyle.Biophilic },
      { text: "Sleek, uncluttered, and monochromatic", style: RoomStyle.Modern },
      { text: "Warm, rustic, and homelike", style: RoomStyle.Farmhouse },
      { text: "Bold, colorful, and full of curiosities", style: RoomStyle.Maximalist },
    ]
  },
  {
    question: "Which materials resonate with you?",
    options: [
      { text: "Exposed brick, metal, and concrete", style: RoomStyle.Industrial },
      { text: "Light woods, wool, and soft whites", style: RoomStyle.Scandinavian },
      { text: "Velvet, brass, and geometric patterns", style: RoomStyle.ArtDeco },
      { text: "High-tech surfaces, neon, and glass", style: RoomStyle.Cyberpunk },
    ]
  },
  {
    question: "Pick a visual aesthetic:",
    options: [
      { text: "Breezy, airy, seaside vibes", style: RoomStyle.Coastal },
      { text: "Free-spirited, patterned, and textured", style: RoomStyle.Bohemian },
      { text: "Dark, dramatic, and moody", style: RoomStyle.Gothic },
      { text: "Balanced blend of Japanese and Nordic", style: RoomStyle.Japandi },
    ]
  },
  {
    question: "What is your design priority?",
    options: [
      { text: "Peace, balance, and mindfulness", style: RoomStyle.Zen },
      { text: "Retro nostalgia from the 50s/60s", style: RoomStyle.MidCenturyModern },
      { text: "Classical elegance and luxury", style: RoomStyle.Neoclassical },
      { text: "Strict simplicity and essentialism", style: RoomStyle.Minimalist },
    ]
  },
  {
    question: "What kind of lighting do you prefer?",
    options: [
      { text: "Grand chandeliers and gold accents", style: RoomStyle.Baroque },
      { text: "Warm, ambient, hidden lighting", style: RoomStyle.Minimalist },
      { text: "Neon strips and colored LEDs", style: RoomStyle.Cyberpunk },
      { text: "Abundant natural sunlight", style: RoomStyle.Biophilic },
    ]
  },
  {
    question: "Choose a furniture style:",
    options: [
      { text: "Low profile, functional, tatami-style", style: RoomStyle.Japandi },
      { text: "Distressed wood and vintage finds", style: RoomStyle.Farmhouse },
      { text: "Glossy, curvy, and mirrored", style: RoomStyle.ArtDeco },
      { text: "Teak wood with tapered legs", style: RoomStyle.MidCenturyModern },
    ]
  },
  {
    question: "How should the room feel?",
    options: [
      { text: "Like a royal palace", style: RoomStyle.Baroque },
      { text: "Like a modern art gallery", style: RoomStyle.Modern },
      { text: "Like a cozy mountain cabin", style: RoomStyle.Farmhouse },
      { text: "Like a zen garden", style: RoomStyle.Zen },
    ]
  }
];

// Helper to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const StyleQuiz: React.FC<StyleQuizProps> = ({ onComplete }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string | null>(null);
  const [dynamicDescription, setDynamicDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);

  // Retry Countdown Timer
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  // Initialize random quiz
  useEffect(() => {
    initializeQuiz();
  }, []);

  const initializeQuiz = () => {
    // 1. Shuffle the pool
    const shuffledPool = shuffleArray(QUESTION_POOL);
    // 2. Select first 4 questions
    const selectedQuestions = shuffledPool.slice(0, 4);
    // 3. Shuffle options within each question and assign IDs
    const finalQuestions = selectedQuestions.map((q, index) => ({
      id: index,
      question: q.question,
      options: shuffleArray(q.options)
    }));
    
    setQuestions(finalQuestions);
    setCurrentQuestionIndex(0);
    setScores({});
    setResult(null);
    setDynamicDescription(null);
    setError(null);
    setRetryCountdown(0);
  };

  const handleOptionSelect = (style: RoomStyle) => {
    const newScores = { ...scores, [style]: (scores[style] || 0) + 1 };
    setScores(newScores);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateFinalResult(newScores);
    }
  };

  const calculateFinalResult = async (finalScores: Record<string, number>) => {
    const sortedScores = Object.entries(finalScores).sort((a, b) => b[1] - a[1]);
    
    let finalStyle = RoomStyle.Modern;
    if (sortedScores.length > 0) {
       const [topStyle, topScore] = sortedScores[0];
       finalStyle = topStyle as RoomStyle;

       if (sortedScores.length > 1) {
          const [secondStyle, secondScore] = sortedScores[1];
          if (secondScore === topScore) {
            finalStyle = `${topStyle} + ${secondStyle}` as any;
          }
       }
    }
    
    setResult(finalStyle);
    setError(null);
    setRetryCountdown(0);
    
    // Generate dynamic description using Gemini Text Model
    // This runs strictly ON DEMAND when quiz finishes
    try {
      const desc = await generateQuizResultDescription(finalStyle);
      setDynamicDescription(desc);
    } catch (e: any) {
      console.error("Failed to generate description", e);
      if (e.message === 'RATE_LIMIT_EXCEEDED') {
        setError("System busy. Please wait 60s.");
        setRetryCountdown(60);
      } else {
        setError("Could not generate description.");
      }
    }
  };

  const retryDescription = () => {
    if (result && retryCountdown === 0) {
      // Re-run the description generation logic
      // We can't easily call calculateFinalResult again without scores, 
      // but we can just call the API directly since we have the result.
      setError(null);
      setDynamicDescription(null); // Show loading state
      
      generateQuizResultDescription(result)
        .then(desc => setDynamicDescription(desc))
        .catch((e: any) => {
           console.error("Failed to generate description", e);
           if (e.message === 'RATE_LIMIT_EXCEEDED') {
             setError("System busy. Please wait 60s.");
             setRetryCountdown(60);
           } else {
             setError("Could not generate description.");
           }
        });
    }
  };

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (questions.length === 0) return <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading quiz...</div>;

  if (result) {
    const styleInfo = ROOM_STYLES.find(s => s.value === result);
    // Use generic image for hybrids if no direct match
    const displayImage = styleInfo?.image || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80';
    
    // Use dynamic description if available, otherwise static fallback
    const description = dynamicDescription || (styleInfo?.description || `A unique fusion style tailored just for you: ${result}.`);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in-up">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center transition-colors">
          <div className="h-64 relative group">
             <img 
               src={displayImage} 
               alt={result} 
               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col items-center justify-end pb-8">
                <div className="absolute top-4 right-4 opacity-70">
                   <span className="font-serif italic text-white text-sm tracking-widest drop-shadow-lg">DreamSpace</span>
                </div>
                
                <p className="text-white/80 font-medium uppercase tracking-widest text-sm mb-2">Result</p>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-wide shadow-black drop-shadow-lg px-4">
                  {result}
                </h2>
             </div>
          </div>
          <div className="p-10 space-y-8 bg-white dark:bg-slate-800 relative transition-colors">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Your preferred style is {result}</h3>
              <div className="w-12 h-1 bg-indigo-600 mx-auto rounded-full"></div>
              <div className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed max-w-lg mx-auto min-h-[3rem]">
                {dynamicDescription ? (
                  description
                ) : error ? (
                  <div className="flex flex-col items-center gap-2 animate-fade-in-up">
                    <span className="text-red-500 text-sm font-medium">{error}</span>
                    {retryCountdown > 0 ? (
                       <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Retry in {retryCountdown}s</span>
                    ) : (
                       <button onClick={retryDescription} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 underline hover:no-underline">Retry Description</button>
                    )}
                  </div>
                ) : (
                  <span className="animate-pulse">Curating your style profile...</span>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <button
                onClick={() => onComplete(result)}
                className="px-10 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-xl hover:shadow-indigo-500/30 transform hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto"
              >
                <span>Design with this Style</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                onClick={initializeQuiz}
                className="mt-6 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium transition-colors"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in-up">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 transition-colors">
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Find Your Style</h2>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <h3 className="text-xl font-medium text-slate-800 dark:text-slate-100 mb-6 min-h-[3rem]">
          {currentQ.question}
        </h3>

        <div className="grid gap-4">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionSelect(option.style)}
              className="w-full text-left p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 group flex items-center justify-between"
            >
              <span className="text-slate-700 dark:text-slate-200 font-medium group-hover:text-indigo-900 dark:group-hover:text-indigo-300 text-lg">{option.text}</span>
              <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-600 dark:group-hover:border-indigo-500 flex items-center justify-center">
                 <div className="w-3 h-3 rounded-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
