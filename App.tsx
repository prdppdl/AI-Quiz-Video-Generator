import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateQuizQuestions } from './services/geminiService';
import type { QuizQuestion } from './types';
import { QuizPlayer } from './components/QuizPlayer';

type AppState = 'idle' | 'generating' | 'ready' | 'error';
type AspectRatio = 'landscape' | 'portrait';

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center text-white">
        <svg className="animate-spin h-12 w-12 text-fuchsia-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-semibold">{message}</p>
        <p className="text-slate-400 mt-2">This may take a moment...</p>
    </div>
);

const TopicForm: React.FC<{
    onGenerate: (topic: string, aspectRatio: AspectRatio, questionCount: number) => void,
    isLoading: boolean
}> = ({ onGenerate, isLoading }) => {
    const [topic, setTopic] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('landscape');
    const [questionCount, setQuestionCount] = useState<number>(10);
    const questionOptions = [5, 10, 15, 20];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim() && !isLoading) {
            onGenerate(topic.trim(), aspectRatio, questionCount);
        }
    };

    return (
        <div className="w-full max-w-2xl text-center">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400 mb-4">
                AI Quiz Video Generator
            </h1>
            <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">
                Enter any topic, choose your settings, and our AI will create a quiz video for you to download.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., 'The Roman Empire' or '80s Pop Music'"
                    className="w-full px-6 py-4 bg-slate-800 text-white rounded-lg border-2 border-slate-700 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-all duration-300 text-lg"
                    disabled={isLoading}
                    aria-label="Quiz Topic"
                />
                <div>
                    <span className="text-lg font-semibold text-slate-300 mb-3 block">Number of Questions</span>
                    <div className="grid grid-cols-4 gap-4">
                       {questionOptions.map(count => (
                           <label key={count} className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${questionCount === count ? 'bg-fuchsia-600/30 border-fuchsia-500' : 'bg-slate-800 border-slate-700'}`}>
                               <input type="radio" name="questionCount" value={count} checked={questionCount === count} onChange={() => setQuestionCount(count)} className="sr-only" />
                               <span className="font-bold text-white">{count}</span>
                           </label>
                       ))}
                    </div>
                </div>
                <div>
                    <span className="text-lg font-semibold text-slate-300 mb-3 block">Video Format</span>
                    <div className="grid grid-cols-2 gap-4">
                        <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${aspectRatio === 'landscape' ? 'bg-fuchsia-600/30 border-fuchsia-500' : 'bg-slate-800 border-slate-700'}`}>
                            <input type="radio" name="aspectRatio" value="landscape" checked={aspectRatio === 'landscape'} onChange={() => setAspectRatio('landscape')} className="sr-only" />
                            <span className="font-bold text-white">Landscape (16:9)</span>
                            <span className="text-sm text-slate-400 block">Best for YouTube</span>
                        </label>
                        <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${aspectRatio === 'portrait' ? 'bg-fuchsia-600/30 border-fuchsia-500' : 'bg-slate-800 border-slate-700'}`}>
                            <input type="radio" name="aspectRatio" value="portrait" checked={aspectRatio === 'portrait'} onChange={() => setAspectRatio('portrait')} className="sr-only" />
                            <span className="font-bold text-white">Portrait (9:16)</span>
                            <span className="text-sm text-slate-400 block">Best for TikTok/Reels</span>
                        </label>
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full px-8 py-4 bg-fuchsia-600 text-white font-bold rounded-lg text-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                    disabled={isLoading}
                >
                    Generate Quiz Video
                </button>
            </form>
        </div>
    );
};

const QuizViewer: React.FC<{
    quiz: QuizQuestion[];
    topic: string;
    aspectRatio: AspectRatio;
    onStartOver: () => void;
}> = ({ quiz, topic, aspectRatio, onStartOver }) => {
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'preparing' | 'recording' | 'finished' | 'error'>('idle');
    const [playerKey, setPlayerKey] = useState(Date.now());
    const [errorMessage, setErrorMessage] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const handleDownloadClick = async () => {
        setRecordingStatus('preparing');
        setErrorMessage('');
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: "screen" } as any,
                audio: true,
            });
            mediaStreamRef.current = stream;

            stream.getVideoTracks()[0].onended = () => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
            };

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
            recordedChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${topic.replace(/\s+/g, '_').toLowerCase()}_quiz.webm`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setRecordingStatus('finished');
                mediaStreamRef.current?.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setRecordingStatus('recording');
            setPlayerKey(Date.now());
        } catch (err) {
            console.error("Error starting recording:", err);
            setErrorMessage("Permission to record screen was denied. Please allow and try again.");
            setRecordingStatus('error');
        }
    };

    const handleQuizFinish = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
    
    const isLandscape = aspectRatio === 'landscape';
    const isRecording = recordingStatus === 'recording' || recordingStatus === 'preparing';

    return (
        <div className="w-full flex flex-col items-center gap-6">
            <div className={`relative bg-gray-900 bg-gradient-to-br from-gray-900 to-slate-800 rounded-lg shadow-2xl overflow-hidden ${isLandscape ? 'w-full max-w-5xl aspect-video' : 'h-[80vh] aspect-[9/16]'}`}>
                 <QuizPlayer 
                    key={playerKey}
                    quiz={quiz} 
                    onFinish={handleQuizFinish} 
                    topic={topic}
                    isPlaying={true}
                    aspectRatio={aspectRatio}
                />
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg w-full max-w-5xl flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                    onClick={handleDownloadClick} 
                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg text-lg shadow-lg hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                    disabled={isRecording}
                >
                    {recordingStatus === 'preparing' ? 'Preparing...' : (recordingStatus === 'recording' ? '◉ Recording...' : 'Download Video')}
                </button>
                 <button onClick={onStartOver} className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors text-sm">
                    Start Over
                </button>
            </div>
             <div className="h-6 text-center mt-2">
                {recordingStatus === 'finished' && <p className="text-green-400 font-semibold text-lg">✅ Download complete! Your video has been saved.</p>}
                {recordingStatus === 'error' && <p className="text-red-400 font-semibold text-lg">❌ {errorMessage}</p>}
                {recordingStatus === 'recording' && <p className="text-cyan-400 font-semibold text-lg animate-pulse">Recording will stop automatically when the quiz ends.</p>}
            </div>
        </div>
    );
};

function App() {
    const [topic, setTopic] = useState<string>('');
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [appState, setAppState] = useState<AppState>('idle');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('landscape');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedSession = localStorage.getItem('ai-quiz-video-session');
        if (savedSession) {
            try {
                const { quiz, topic, aspectRatio } = JSON.parse(savedSession);
                if (quiz && topic && aspectRatio) {
                    setQuiz(quiz);
                    setTopic(topic);
                    setAspectRatio(aspectRatio);
                    setAppState('ready');
                }
            } catch (e) {
                console.error("Failed to parse saved session", e);
                localStorage.removeItem('ai-quiz-video-session');
            }
        }
    }, []);

    const handleGenerateQuiz = useCallback(async (newTopic: string, newAspectRatio: AspectRatio, questionCount: number) => {
        setTopic(newTopic);
        setAspectRatio(newAspectRatio);
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
                aspectRatio: newAspectRatio
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
                return <Loader message={`Generating a quiz about ${topic}...`} />;
            case 'ready':
                return quiz && <QuizViewer quiz={quiz} onStartOver={handleStartOver} topic={topic} aspectRatio={aspectRatio} />;
            case 'error':
                 return (
                    <div className="text-center text-white bg-red-900/50 p-8 rounded-lg border border-red-700">
                        <h2 className="text-3xl font-bold text-red-400 mb-4">Generation Failed</h2>
                        <p className="text-lg text-red-200 mb-6">{error}</p>
                        <button
                            onClick={handleStartOver}
                            className="px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                );
            case 'idle':
            default:
                return <TopicForm onGenerate={handleGenerateQuiz} isLoading={false} />;
        }
    };

    return (
        <main className="bg-gray-900 bg-gradient-to-br from-gray-900 to-slate-800 min-h-screen w-full flex items-center justify-center p-4 transition-all duration-500">
            {renderState()}
        </main>
    );
}

export default App;
