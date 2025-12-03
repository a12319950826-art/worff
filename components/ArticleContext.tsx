import React, { useMemo } from 'react';
import { Article } from '../types';

interface ArticleContextProps {
  article: Article;
  highlightWord: string;
  onClose: () => void;
}

const ArticleContext: React.FC<ArticleContextProps> = ({ article, highlightWord, onClose }) => {
  
  // Create safe HTML with highlighting
  const highlightedContent = useMemo(() => {
    if (!article.content) return '';
    
    // Escape regex characters in the word
    const safeWord = highlightWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match word with word boundaries to avoid partial matches inside other words
    const regex = new RegExp(`(${safeWord})`, 'gi');
    
    return article.content.replace(regex, '<span class="bg-yellow-300 text-black font-bold px-1 rounded border border-yellow-400">$1</span>');
  }, [article.content, highlightWord]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800 line-clamp-1">{article.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{article.date}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto leading-relaxed text-gray-700 text-lg whitespace-pre-wrap">
          <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-blue-50 text-blue-600 text-xs text-center font-medium border-t border-blue-100">
           上下文能帮助你更好地理解单词用法
        </div>
      </div>
    </div>
  );
};

export default ArticleContext;
