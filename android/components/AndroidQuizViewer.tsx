import React, { useState, useRef } from 'react';
import type { QuizQuestion } from '../../types';
import { QuizPlayer } from '../../components/QuizPlayer';

interface AndroidQuizViewerProps {
    quiz: QuizQuestion[];
    topic: string;
    onStartOver: () => void;
}

const AndroidQuizViewer: React.FC<AndroidQuizViewerProps> = ({ quiz, topic, onStartOver }) => {
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
            setErrorMessage("Permission denied. Please allow screen recording and try again.");
            setRecordingStatus('error');
        }
    };
    
    const handleQuizFinish = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const isRecording = recordingStatus === 'recording' || recordingStatus === 'preparing';

    return (
        <div className="w-full h-full flex flex-col bg-black">
            <header className="flex-shrink-0 p-3 flex items-center gap-4 bg-slate-900/80 backdrop-blur-sm z-10">
                <button onClick={onStartOver} className="text-white">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-xl font-medium text-white">{topic}</h1>
            </header>
            <div className="flex-grow flex items-center justify-center overflow-hidden relative">
                <div className="w-full h-full aspect-[9/16] max-h-full max-w-[56.25vh] bg-gray-900 bg-gradient-to-br from-gray-900 to-slate-800">
                    <QuizPlayer 
                        key={playerKey}
                        quiz={quiz} 
                        onFinish={handleQuizFinish} 
                        topic={topic}
                        isPlaying={true}
                        aspectRatio="portrait"
                    />
                </div>
            </div>
            <div className="flex-shrink-0 p-4 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                 <button
                    onClick={handleDownloadClick}
                    disabled={isRecording}
                    className="flex items-center gap-3 px-6 py-3 bg-fuchsia-600 text-white font-bold rounded-full text-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-600 transition-all transform hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                   {recordingStatus === 'preparing' ? 'Starting...' : (recordingStatus === 'recording' ? 'Recording...' : 'Download')}
                </button>
            </div>
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-20">
                {recordingStatus === 'finished' && <div className="bg-green-600 text-white text-center py-2 px-4 rounded-lg shadow-lg text-sm">✅ Download complete!</div>}
                {recordingStatus === 'error' && <div className="bg-red-600 text-white text-center py-2 px-4 rounded-lg shadow-lg text-sm">❌ {errorMessage}</div>}
            </div>
        </div>
    );
};

export default AndroidQuizViewer;
