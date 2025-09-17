import React, { useState, useCallback, useEffect } from 'react';
import { generateQuizQuestions } from '../services/geminiService';
import type { QuizQuestion } from '../types';
import { QuizPlayer } from '../components/QuizPlayer';
import IOSTopicForm from './components/IOSTopicForm';
import IOSQuizViewer from './components/IOSQuizViewer';

type AppState = 'idle' | 'generating' | 'ready' | 'error';

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center text-gray-700">
        <svg className="animate-spin h-10 w-10 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-medium">{message}</p>
        <p className="text-gray-500 mt-1">Please wait...</p>
    </div>
);


function IOSApp() {
    const [topic, setTopic] = useState<string>('');
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [appState, setAppState] = useState<AppState>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedSession = localStorage.getItem('ai-quiz-video-session');
        if (savedSession) {
            try {
                const { quiz, topic } = JSON.parse(savedSession);
                if (quiz && topic) {
                    setQuiz(quiz);
                    setTopic(topic);
                    setAppState('ready');
                }
            } catch (e) {
                console.error("Failed to parse saved session", e);
                localStorage.removeItem('ai-quiz-video-session');
            }
        }
    }, []);

    const handleGenerateQuiz = useCallback(async (newTopic: string, questionCount: number) => {
        setTopic(newTopic);
        setAppState('generating');
        setError(null);
        setQuiz(null);

        try {
            const questions = await generateQuizQuestions(newTopic, questionCount);
            setQuiz(questions);
            setAppState('ready');
            localStorage.setItem('ai-quiz-video-session', JSON.stringify({
                quiz: questions,
                topic: newTopic,
                aspectRatio: 'portrait'
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setAppState('error');
        }
    }, []);

    const handleStartOver = () => {
        setAppState('idle');
        setQuiz(null);
        setTopic('');
        localStorage.removeItem('ai-quiz-video-session');
    };
    
    const renderState = () => {
        switch (appState) {
            case 'generating':
                return <div className="w-full h-full flex items-center justify-center"><Loader message={`Creating quiz on ${topic}...`} /></div>;
            case 'ready':
                return quiz && <IOSQuizViewer quiz={quiz} onStartOver={handleStartOver} topic={topic} />;
            case 'error':
                 return (
                    <div className="text-center text-gray-800 bg-red-100 p-6 rounded-lg border border-red-200 m-4">
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Generation Failed</h2>
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={handleStartOver}
                            className="px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                );
            case 'idle':
            default:
                return <IOSTopicForm onGenerate={handleGenerateQuiz} isLoading={false} />;
        }
    };

    return (
        <div className="w-full h-screen bg-gray-50 text-gray-900 overflow-hidden">
             {appState !== 'ready' && (
                <header className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
                    <div className="max-w-md mx-auto px-4 py-3">
                        <h1 className="text-xl font-bold text-center">AI Quiz Video</h1>
                    </div>
                </header>
            )}
            <main className="w-full h-full pt-16 flex flex-col">
                {renderState()}
            </main>
        </div>
    );
}

export default IOSApp;
