import React, { useState } from 'react';

interface AndroidTopicFormProps {
    onGenerate: (topic: string, questionCount: number) => void;
    isLoading: boolean;
}

const AndroidTopicForm: React.FC<AndroidTopicFormProps> = ({ onGenerate, isLoading }) => {
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
            <div className="flex flex-col gap-8">
                <div className="relative">
                    <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="block px-3 pb-2 pt-4 w-full text-lg text-gray-900 bg-gray-200/70 rounded-t-lg border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-600 peer"
                        placeholder=" "
                        disabled={isLoading}
                    />
                    <label
                        htmlFor="topic"
                        className="absolute text-md text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3 peer-focus:text-fuchsia-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4"
                    >
                        Quiz Topic (e.g., 'Ancient Egypt')
                    </label>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                    <h3 className="text-lg font-medium text-slate-800 mb-3">Number of Questions</h3>
                    <div className="grid grid-cols-2 gap-3">
                       {questionOptions.map(count => (
                           <label key={count} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${questionCount === count ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-slate-200 bg-transparent'}`}>
                               <input 
                                  type="radio" 
                                  name="questionCount" 
                                  value={count} 
                                  checked={questionCount === count} 
                                  onChange={() => setQuestionCount(count)} 
                                  className="w-5 h-5 accent-fuchsia-600" 
                                />
                               <span className="font-semibold text-slate-700">{count} Questions</span>
                           </label>
                       ))}
                    </div>
                </div>
            </div>
            
            <button
                type="submit"
                onClick={handleSubmit}
                className="fixed bottom-6 right-6 w-16 h-16 bg-fuchsia-600 text-white rounded-2xl shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-fuchsia-300 flex items-center justify-center"
                disabled={isLoading || !topic.trim()}
                aria-label="Generate Quiz"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

export default AndroidTopicForm;