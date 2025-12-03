import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Article, Word, Progress, STORAGE_KEY } from './types';
import { calculateNextState, getReviewQueue } from './utils/srs';
import ImportScreen from './components/ImportScreen';
import ArticleContext from './components/ArticleContext';

const App: React.FC = () => {
  // --- State ---
  const [data, setData] = useState<AppState | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [sessionQueue, setSessionQueue] = useState<Word[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Effects ---

  // Load data on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save data on change
  useEffect(() => {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  // Build Queue when data is ready or review is done
  useEffect(() => {
    if (data && sessionQueue.length === 0) {
      const queue = getReviewQueue(data.words, data.progress);
      setSessionQueue(queue);
      setCurrentWordIndex(0);
      setShowAnswer(false);
    }
  }, [data, sessionQueue.length]);

  // --- Handlers ---

  const handleImport = (articles: Article[], words: Word[]) => {
    // Preserve existing progress if words match
    const initialProgress: Record<string, Progress> = data?.progress || {};
    
    // Merge Strategy: Keep old progress, overwrite/add words and articles
    setData({
      articles, // In a real app, might want to append, but here we replace source for simplicity
      words,
      progress: initialProgress
    });
  };

  const handleReset = () => {
    if(confirm('确定要清空所有数据吗？')) {
      localStorage.removeItem(STORAGE_KEY);
      setData(null);
      setSessionQueue([]);
    }
  }

  const handleReviewAction = (known: boolean) => {
    if (!data) return;

    const currentWord = sessionQueue[currentWordIndex];
    const currentProgress = data.progress[currentWord.id] || { level: 0, nextReview: 0, lastReview: 0 };
    
    const { level, nextReview } = calculateNextState(currentProgress.level, known);

    // Update Progress
    const newProgress = {
      ...data.progress,
      [currentWord.id]: {
        level,
        nextReview,
        lastReview: Date.now()
      }
    };

    setData({
      ...data,
      progress: newProgress
    });

    // Move to next card
    setShowAnswer(false);
    setShowContext(false);

    // If we have more in the queue, go next
    if (currentWordIndex < sessionQueue.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      // Session done, clear queue to trigger refresh effect
      setSessionQueue([]);
    }
  };

  // --- Renders ---

  if (!isInitialized) return null;

  if (!data) {
    return <ImportScreen onImport={handleImport} />;
  }

  // Completed State (No words in queue)
  if (sessionQueue.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🎉
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">当前任务完成!</h2>
          <p className="text-gray-500 mb-8">
            没有需要复习的单词了。你可以休息一下，或者等待下一批复习时间。
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setSessionQueue(getReviewQueue(data.words, data.progress))}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all"
            >
              刷新队列
            </button>
             <button 
              onClick={handleReset}
              className="w-full py-3 px-6 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-all"
            >
              清空数据 (重新导入)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = sessionQueue[currentWordIndex];
  const currentArticle = data.articles.find(a => a.id === currentWord.articleId);

  return (
    <div className="h-full flex flex-col max-w-lg mx-auto bg-white shadow-2xl relative">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <span className="text-sm font-bold text-gray-400">
          进度: {currentWordIndex + 1} / {sessionQueue.length}
        </span>
        <button onClick={handleReset} className="text-xs text-gray-300 hover:text-red-400">重置</button>
      </div>

      {/* Main Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        
        {/* Word */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-800 tracking-tight mb-4 break-words">
            {currentWord.id}
          </h1>
          
          {/* Answer Section */}
          <div className={`transition-all duration-300 transform ${showAnswer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <p className="text-2xl text-blue-600 font-medium">
              {currentWord.translation}
            </p>
          </div>
        </div>

      </div>

      {/* Floating Context Modal */}
      {showContext && currentArticle && (
        <ArticleContext 
          article={currentArticle} 
          highlightWord={currentWord.id} 
          onClose={() => setShowContext(false)} 
        />
      )}

      {/* Bottom Action Area */}
      <div className="p-6 bg-gray-50 border-t border-gray-100 pb-10">
        
        {/* Helper Actions */}
        {!showAnswer && (
          <div className="flex gap-3 mb-4">
             <button 
              onClick={() => setShowContext(true)}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-semibold shadow-sm hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              查看语境 (文章)
            </button>
            <button 
              onClick={() => setShowAnswer(true)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all"
            >
              显示意思
            </button>
          </div>
        )}

        {/* SRS Actions */}
        {showAnswer && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => handleReviewAction(false)}
              className="py-4 rounded-xl bg-red-100 text-red-600 font-bold text-lg hover:bg-red-200 transition-colors"
            >
              不认识
              <span className="block text-xs font-normal opacity-70 mt-1">6分钟后出现</span>
            </button>
            
            <button 
              onClick={() => handleReviewAction(true)}
              className="py-4 rounded-xl bg-green-100 text-green-700 font-bold text-lg hover:bg-green-200 transition-colors"
            >
              认识
              <span className="block text-xs font-normal opacity-70 mt-1">进入下一阶段</span>
            </button>
          </div>
        )}
        
        {/* Helper text when answer is shown */}
        {showAnswer && (
           <button 
             onClick={() => setShowContext(true)} 
             className="w-full mt-4 text-sm text-gray-400 underline decoration-gray-300 hover:text-blue-500"
           >
             再次查看文章语境
           </button>
        )}

      </div>
    </div>
  );
};

export default App;
