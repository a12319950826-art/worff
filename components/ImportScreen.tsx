import React, { useRef, useState } from 'react';
import { parseImportFile } from '../utils/parser';
import { Article, Word } from '../types';

interface ImportScreenProps {
  onImport: (articles: Article[], words: Word[]) => void;
}

const ImportScreen: React.FC<ImportScreenProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { articles, words } = parseImportFile(text);
        
        if (words.length === 0) {
          setError('未能在文件中找到单词。请确保格式正确（包含"单词清单："）。');
          setLoading(false);
          return;
        }

        onImport(articles, words);
      } catch (err) {
        console.error(err);
        setError('解析文件时出错，请检查文件格式。');
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('读取文件失败');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-center space-y-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">导入学习素材</h1>
        <p className="text-gray-500 mb-8">请上传包含文章和单词清单的 .txt 文件。系统将自动为你生成复习计划。</p>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 transition-all"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".txt" 
            className="hidden" 
          />
          <p className="text-sm font-medium text-gray-600 group-hover:text-blue-500">点击选择文件</p>
          <p className="text-xs text-gray-400 mt-1">支持 .txt 格式</p>
        </div>

        {loading && <p className="mt-4 text-blue-500 text-sm animate-pulse">正在处理...</p>}
        {error && <p className="mt-4 text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
      </div>

      <div className="text-xs text-gray-400 max-w-xs">
        * 数据将仅保存在您的本地浏览器中，请放心使用。
      </div>
    </div>
  );
};

export default ImportScreen;
