import React, { useState } from 'react';
import { generateLinkSuggestions } from '../services/geminiService';

interface KeywordInputProps {
  onGenerate: (keywordsA: string, keywordsB: string, explicitLinks: string) => void;
  onAnalyzeDocument: (file: File, system: 'A' | 'B') => void;
  isLoading: boolean;
  isAnalyzing: { A: boolean, B: boolean };
  keywordsA: string;
  setKeywordsA: (value: string) => void;
  keywordsB: string;
  setKeywordsB: (value: string) => void;
}

export const KeywordInput: React.FC<KeywordInputProps> = ({ 
  onGenerate, 
  onAnalyzeDocument,
  isLoading, 
  isAnalyzing,
  keywordsA,
  setKeywordsA,
  keywordsB,
  setKeywordsB
}) => {
  const [systemAName, setSystemAName] = useState('System A');
  const [systemBName, setSystemBName] = useState('System B');
  const [explicitLinks, setExplicitLinks] = useState('product-solution, design-brand, collaboration-team');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(keywordsA.trim(), keywordsB.trim(), explicitLinks.trim());
  };
  
  const handleSuggestLinks = async () => {
    setIsSuggesting(true);
    try {
      const suggestions = await generateLinkSuggestions(keywordsA.trim(), keywordsB.trim());
      if (suggestions) {
         setExplicitLinks(prev => prev.trim() ? `${prev.trim()}, ${suggestions}` : suggestions);
      }
    } catch (error) {
      console.error('Failed to suggest links:', error);
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, system: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (file) {
      onAnalyzeDocument(file, system);
    }
    // Reset file input to allow re-uploading the same file
    e.target.value = '';
  };
  
  const isAnythingLoading = isLoading || isAnalyzing.A || isAnalyzing.B || isSuggesting;

  const textAreaClasses = "w-full bg-gray-800 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none transition duration-200 text-gray-200 resize-y h-32";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* --- System A --- */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <input 
              type="text"
              value={systemAName}
              onChange={(e) => setSystemAName(e.target.value)}
              className="bg-transparent text-lg font-semibold text-pink-400 border-b-2 border-gray-700 focus:border-pink-500 focus:outline-none p-1 w-full sm:w-auto"
            />
             <label className="relative cursor-pointer px-3 py-1 text-sm bg-pink-500/20 border border-pink-500 text-pink-300 rounded-md hover:bg-pink-500/40 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
              {isAnalyzing.A ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing...
                </>
              ) : '📤 Upload & Analyze'}
              <input type="file" className="hidden" accept=".txt,.md,.pdf" onChange={(e) => handleFileChange(e, 'A')} disabled={isAnythingLoading}/>
            </label>
          </div>
          <textarea
            id="system-a"
            value={keywordsA}
            onChange={(e) => setKeywordsA(e.target.value)}
            placeholder="e.g., design:10, product:8, user-experience:7"
            className={textAreaClasses}
            disabled={isAnythingLoading}
          />
        </div>

        {/* --- System B --- */}
         <div className="space-y-2">
           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <input 
              type="text"
              value={systemBName}
              onChange={(e) => setSystemBName(e.target.value)}
              className="bg-transparent text-lg font-semibold text-teal-400 border-b-2 border-gray-700 focus:border-teal-500 focus:outline-none p-1 w-full sm:w-auto"
            />
            <label className="relative cursor-pointer px-3 py-1 text-sm bg-teal-500/20 border border-teal-500 text-teal-300 rounded-md hover:bg-teal-500/40 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
              {isAnalyzing.B ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing...
                </>
              ) : '📤 Upload & Analyze'}
              <input type="file" className="hidden" accept=".txt,.md,.pdf" onChange={(e) => handleFileChange(e, 'B')} disabled={isAnythingLoading}/>
            </label>
          </div>
          <textarea
            id="system-b"
            value={keywordsB}
            onChange={(e) => setKeywordsB(e.target.value)}
            placeholder="e.g., business:9, startup:7, market-fit:8"
            className={textAreaClasses}
            disabled={isAnythingLoading}
          />
        </div>
      </div>

      <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="explicit-links" className="text-lg font-semibold text-lime-400">Explicit Links</label>
            <button 
              type="button" 
              onClick={handleSuggestLinks} 
              disabled={isAnythingLoading}
              className="px-3 py-1 text-sm bg-lime-500/20 border border-lime-500 text-lime-300 rounded-md hover:bg-lime-500/40 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSuggesting ? (
                 <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Suggesting...
                </>
              ) : (
                '✨ Suggest Links'
              )}
            </button>
          </div>
           <textarea
            id="explicit-links"
            value={explicitLinks}
            onChange={(e) => setExplicitLinks(e.target.value)}
            placeholder="Link keywords, e.g., product-business, design-startup"
            className={`${textAreaClasses} h-20`}
            disabled={isAnythingLoading}
          />
      </div>

      <div className="text-center pt-2">
        <button
          type="submit"
          disabled={isAnythingLoading}
          className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg shadow-lg hover:from-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto sm:mx-auto"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Generating...
            </>
          ) : (
            'Generate Graph'
          )}
        </button>
      </div>
    </form>
  );
};
