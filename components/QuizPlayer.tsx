import React, { useState, useEffect, useRef } from 'react';
import type { QuizQuestion } from '../types';

interface QuizPlayerProps {
  quiz: QuizQuestion[];
  onFinish: () => void;
  topic: string;
  isPlaying: boolean;
  aspectRatio: 'landscape' | 'portrait';
}

type Phase = 'intro' | 'question' | 'countdown' | 'reveal' | 'finished';

const optionLetters = ['A', 'B', 'C', 'D'];
const MUSIC_URL = 'https://cdn.pixabay.com/audio/2024/05/09/audio_2903784a9e.mp3';

const TimerBar: React.FC<{ duration: number }> = ({ duration }) => {
    return (
        <div className="absolute top-0 left-0 h-2 w-full bg-slate-700">
            <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{
                    animation: `shrink ${duration}ms linear forwards`,
                }}
            ></div>
            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onFinish, topic, isPlaying, aspectRatio }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(e => console.error("Audio autoplay was blocked:", e));
      }
    } else {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }
  }, [isPlaying]);
  
  useEffect(() => {
    if (!isPlaying) {
      if (phase !== 'intro') {
          // Reset to beginning if playback stops
          setPhase('intro');
          setCurrentQuestionIndex(0);
      }
      return;
    }

    // FIX: Use `ReturnType<typeof setTimeout>` which resolves to the correct type in browser (number) and Node.js environments.
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (phase === 'intro') {
      timeoutId = setTimeout(() => setPhase('question'), 4000);
    } else if (phase === 'question') {
      timeoutId = setTimeout(() => setPhase('countdown'), 2000);
    } else if (phase === 'countdown') {
      timeoutId = setTimeout(() => setPhase('reveal'), 5000);
    } else if (phase === 'reveal') {
      timeoutId = setTimeout(() => {
        if (currentQuestionIndex < quiz.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setPhase('question');
        } else {
          setPhase('finished');
        }
      }, 4000);
    } else if (phase === 'finished') {
        onFinish();
    }
    
    return () => clearTimeout(timeoutId);
  }, [phase, currentQuestionIndex, quiz.length, isPlaying, onFinish]);

  const currentQuestion = quiz[currentQuestionIndex];

  const isLandscape = aspectRatio === 'landscape';

  const renderContent = () => {
    switch (phase) {
      case 'intro':
        return (
          <div className="text-center animate-fade-in">
            <h1 className={`font-black text-white uppercase tracking-wider ${isLandscape ? 'text-6xl' : 'text-5xl'}`}>{topic}</h1>
            <p className={`mt-4 text-cyan-300 ${isLandscape ? 'text-3xl' : 'text-2xl'}`}>Quiz Challenge</p>
          </div>
        );
      case 'finished':
        return (
          <div className="text-center animate-fade-in">
            <h2 className={`font-bold text-white ${isLandscape ? 'text-5xl' : 'text-4xl'}`}>Quiz Complete!</h2>
            <p className={`mt-4 text-slate-300 ${isLandscape ? 'text-2xl' : 'text-xl'}`}>Thanks for playing.</p>
          </div>
        );
      default:
        if (!currentQuestion) return null;
        return (
          <div key={currentQuestionIndex} className="w-full max-w-4xl mx-auto animate-fade-in">
            {phase === 'countdown' && <TimerBar duration={5000} />}
            <div className={`bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-slate-700 ${isLandscape ? 'md:p-8' : 'p-4'}`}>
              <p className={`font-semibold text-cyan-400 mb-4 ${isLandscape ? 'text-lg' : 'text-base'}`}>Question {currentQuestionIndex + 1} / {quiz.length}</p>
              <h2 className={`font-bold text-white mb-6 flex items-center ${isLandscape ? 'text-4xl min-h-[140px]' : 'text-2xl min-h-[100px]'}`}>
                {currentQuestion.question}
              </h2>
              <div className={`grid gap-3 ${isLandscape ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {currentQuestion.options.map((option, index) => {
                  const isCorrect = index === currentQuestion.correctAnswerIndex;
                  let optionClass = "bg-slate-700/80 hover:bg-slate-600";
                  if (phase === 'reveal') {
                    optionClass = isCorrect
                      ? 'bg-green-600 scale-105 shadow-lg shadow-green-600/30'
                      : 'bg-gray-800 opacity-60';
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 border-slate-600 text-white font-medium transition-all duration-500 ease-in-out transform ${isLandscape ? 'text-xl' : 'text-lg'} ${optionClass}`}
                    >
                      <span className="font-black text-cyan-300 mr-3">{optionLetters[index]}</span>
                      {option}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center text-white overflow-hidden p-4 ${isLandscape ? 'md:p-8' : 'p-2'}`}>
      <audio ref={audioRef} src={MUSIC_URL} loop />
      {renderContent()}
       <style>{`
        .animate-fade-in {
            animation: fadeIn 0.8s ease-in-out forwards;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
       `}</style>
    </div>
  );
};