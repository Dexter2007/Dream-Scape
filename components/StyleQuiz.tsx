import React, { useState } from 'react';
import { RoomStyle } from '../types';

interface StyleQuizProps {
  onComplete: (style: RoomStyle) => void;
}

const QUESTIONS = [
  {
    id: 1,
    question: "How do you want your room to feel?",
    options: [
      { text: "Clean, uncluttered, and functional", style: RoomStyle.Minimalist },
      { text: "Cozy, warm, and inviting", style: RoomStyle.Scandinavian },
      { text: "Bold, eclectic, and artistic", style: RoomStyle.Bohemian },
      { text: "Sleek, futuristic, and high-tech", style: RoomStyle.Cyberpunk },
    ]
  },
  {
    id: 2,
    question: "Pick a material you love:",
    options: [
      { text: "Raw concrete and exposed brick", style: RoomStyle.Industrial },
      { text: "Natural wood and soft textiles", style: RoomStyle.Zen },
      { text: "Velvet, brass, and geometric patterns", style: RoomStyle.ArtDeco },
      { text: "Glass, steel, and monochrome surfaces", style: RoomStyle.Modern },
    ]
  },
  {
    id: 3,
    question: "What's your ideal color palette?",
    options: [
      { text: "Neutrals, whites, and greys", style: RoomStyle.Minimalist },
      { text: "Earthy tones like greens and browns", style: RoomStyle.Bohemian },
      { text: "Ocean blues and sandy beiges", style: RoomStyle.Coastal },
      { text: "Vibrant contrasting colors", style: RoomStyle.MidCenturyModern },
    ]
  },
  {
    id: 4,
    question: "Which furniture piece appeals to you most?",
    options: [
      { text: "A low-profile platform bed", style: RoomStyle.Zen },
      { text: "A vintage leather Chesterfield sofa", style: RoomStyle.Industrial },
      { text: "A teak sideboard with tapered legs", style: RoomStyle.MidCenturyModern },
      { text: "A white slipcovered armchair", style: RoomStyle.Coastal },
    ]
  }
];

export const StyleQuiz: React.FC<StyleQuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});

  const handleOptionSelect = (style: RoomStyle) => {
    const newScores = { ...scores, [style]: (scores[style] || 0) + 1 };
    setScores(newScores);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Find winner
      const winner = Object.entries(newScores).reduce((a, b) => a[1] > b[1] ? a : b)[0] as RoomStyle;
      onComplete(winner);
    }
  };

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-2xl font-bold text-slate-900">Find Your Style</h2>
            <span className="text-sm font-medium text-slate-500">Question {currentQuestion + 1} of {QUESTIONS.length}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <h3 className="text-xl font-medium text-slate-800 mb-6">
          {QUESTIONS[currentQuestion].question}
        </h3>

        <div className="grid gap-4">
          {QUESTIONS[currentQuestion].options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionSelect(option.style)}
              className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-200 group"
            >
              <span className="text-slate-700 font-medium group-hover:text-indigo-900">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};