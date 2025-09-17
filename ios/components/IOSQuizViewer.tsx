import React, { useState, useRef } from 'react';
import type { QuizQuestion } from '../../types';
import { QuizPlayer } from '../../components/QuizPlayer';

interface IOSQuizViewerProps {
    quiz: QuizQuestion[];
    topic: string;
    onStartOver: () => void;
}

const IOSQuizViewer: React.FC<IOSQuizViewerProps> = ({ quiz, topic, onStartOver }) => {
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
            <div className="flex-shrink-0 p-2 flex items-center justify-between bg-black">
                 <button onClick={onStartOver} className="text-blue-500 font-semibold px-2 py-1">
                    New Quiz
                </button>
                 <span className="text-white font-bold">{topic}</span>
                 <div className="w-16"></div>
            </div>
            <div className="flex-grow flex items-center justify-center overflow-hidden">
                <div className="w-full h-full aspect-[9/16] max-h-full max-w-[56.25vh] bg-gray-900 bg-gradient-to-br from-gray-900 to-slate-800 shadow-2xl">
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
            <div className="flex-shrink-0 p-4 bg-black/80 backdrop-blur-sm">
                <button
                    onClick={handleDownloadClick}
                    disabled={isRecording}
                    className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg text-lg shadow-md hover:bg-blue-600 disabled:bg-gray-500 disabled:opacity-70 transition-all"
                >
                    {recordingStatus === 'preparing' ? 'Starting...' : (recordingStatus === 'recording' ? 'Recording...' : 'Download Video')}
                </button>
                 <div className="h-5 text-center mt-2">
                    {recordingStatus === 'finished' && <p className="text-green-400 text-sm">✅ Download complete!</p>}
                    {recordingStatus === 'error' && <p className="text-red-400 text-sm">❌ {errorMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default IOSQuizViewer;
