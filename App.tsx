
import React, { useState, useRef } from 'react';
import { ConversionState, QuizQuestion } from './types';
import { parseQuizText } from './services/geminiService';

declare const mammoth: any;

const App: React.FC = () => {
  const [state, setState] = useState<ConversionState>({
    isProcessing: false,
    error: null,
    result: null,
    fileName: null
  });
  const [startingLaw, setStartingLaw] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setState(prev => ({ ...prev, error: "Please upload a valid .docx file." }));
      return;
    }

    setState({
      isProcessing: true,
      error: null,
      result: null,
      fileName: file.name
    });

    try {
      // 1. Convert Word to Text using Mammoth
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = result.value;

      if (!rawText.trim()) {
        throw new Error("The Word document appears to be empty.");
      }

      // 2. Parse text into JSON using Gemini
      const questions = await parseQuizText(rawText, startingLaw);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        result: questions
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || "An unexpected error occurred during processing."
      }));
    }
  };

  const downloadJson = () => {
    if (!state.result) return;
    const blob = new Blob([JSON.stringify(state.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.fileName?.replace('.docx', '.json') || 'quiz.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          QuizDoc Converter <span className="text-blue-600">Pro</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Преобразование тестов из Word в структурированный JSON формат с использованием искусственного интеллекта.
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Начальный ID (law)
            </label>
            <input 
              type="number"
              value={startingLaw}
              onChange={(e) => setStartingLaw(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="0001"
            />
          </div>
          
          <div className="flex-[2] w-full">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".docx"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={state.isProcessing}
              className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                state.isProcessing 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200'
              }`}
            >
              {state.isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обработка...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Загрузить .docx файл
                </>
              )}
            </button>
          </div>
        </div>

        {state.error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {state.error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {state.result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              Результат
              <span className="text-sm font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                {state.result.length} вопросов найдено
              </span>
            </h2>
            <button 
              onClick={downloadJson}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Скачать JSON
            </button>
          </div>

          <div className="grid gap-6">
            {state.result.map((q) => (
              <div key={q.law} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-sm text-slate-400 mt-1">#{String(q.law).padStart(4, '0')}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-3 text-lg leading-tight">{q.question}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">{q.correctAnswer}</span>
                      </div>
                      {q.incorrectAnswers.map((ans, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{ans}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 mb-20">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Raw JSON Preview</h3>
            <pre className="bg-slate-900 text-slate-300 p-6 rounded-2xl overflow-x-auto text-xs leading-relaxed border border-slate-800 shadow-xl">
              <code>{JSON.stringify(state.result, null, 2)}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Guide if nothing is processed */}
      {!state.result && !state.isProcessing && (
        <div className="mt-20 border-t border-slate-200 pt-12">
          <h3 className="text-center text-slate-400 font-medium mb-8">Как это работает?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mx-auto mb-4">1</div>
              <h4 className="font-bold text-slate-800 mb-2">Загрузите Word</h4>
              <p className="text-sm text-slate-500">Файл должен содержать вопросы и варианты ответов по шаблону.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mx-auto mb-4">2</div>
              <h4 className="font-bold text-slate-800 mb-2">AI Обработка</h4>
              <p className="text-sm text-slate-500">Gemini анализирует текст и преобразует его в структурированные данные.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mx-auto mb-4">3</div>
              <h4 className="font-bold text-slate-800 mb-2">Получите JSON</h4>
              <p className="text-sm text-slate-500">Скачайте готовый JSON файл для ваших приложений или платформ обучения.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
