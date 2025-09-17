import React, { useState } from 'react';

interface IOSTopicFormProps {
    onGenerate: (topic: string, questionCount: number) => void;
    isLoading: boolean;
}

const SegmentedControl: React.FC<{
    options: number[];
    value: number;
    onChange: (value: number) => void;
}> = ({ options, value, onChange }) => {
    return (
        <div className="flex w-full bg-gray-200 rounded-lg p-1">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
                        value === option ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                    }`}
                >
                    {option} Questions
                </button>
            ))}
        </div>
    );
};


const IOSTopicForm: React.FC<IOSTopicFormProps> = ({ onGenerate, isLoading }) => {
    const [topic, setTopic] = useState('');
    const [questionCount, setQuestionCount] = useState<number>(10);
    const questionOptions = [5, 10, 15, 20];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim() && !isLoading) {
            onGenerate(topic.trim(), questionCount);
        }
    };

    return (
        <div className="flex-grow flex flex-col justify-between p-4">
             <div>
                <h2 className="text-3xl font-bold px-2 mb-4">New Quiz</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white border border-gray-200 rounded-lg p-4">
                     <div>
                        <label htmlFor="topic" className="text-xs font-medium text-gray-500 uppercase px-2">Topic</label>
                        <input
                            id="topic"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Solar System"
                            className="w-full px-2 py-2 bg-transparent text-lg border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                            disabled={isLoading}
                        />
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500 uppercase px-2 mb-2 block">Length</label>
                        <SegmentedControl options={questionOptions} value={questionCount} onChange={setQuestionCount} />
                     </div>
                </form>
            </div>
            <div className="p-4">
                 <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg text-lg shadow-md hover:bg-blue-600 disabled:bg-gray-300 transition-all transform hover:scale-105"
                    disabled={isLoading || !topic.trim()}
                >
                    Generate Quiz
                </button>
            </div>
        </div>
    );
};

export default IOSTopicForm;