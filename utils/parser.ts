import { Article, Word } from '../types';
import { v4 as uuidv4 } from 'uuid'; // We'll implement a simple mock since we can't import libraries easily

const simpleId = () => Math.random().toString(36).substr(2, 9);

export const parseImportFile = (text: string): { articles: Article[]; words: Word[] } => {
  // 1. Split by the separator line (approximate)
  const rawBlocks = text.split(/={10,}/);
  
  const articles: Article[] = [];
  const allWords: Word[] = [];

  rawBlocks.forEach(block => {
    const trimmed = block.trim();
    if (!trimmed) return;

    // 2. Extract Parts
    // Pattern: Title -> Tags -> Date -> Content -> "单词清单：" -> List
    
    // Simple line parsing
    const lines = trimmed.split('\n').map(l => l.trim());
    
    let title = "无标题";
    let date = "";
    let contentLines: string[] = [];
    let wordListLines: string[] = [];
    let isScanningWordList = false;

    // Iterate lines to categorize
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.includes('单词清单：') || line.includes('单词清单:')) {
        isScanningWordList = true;
        continue;
      }

      if (isScanningWordList) {
        wordListLines.push(line);
      } else {
        // Metadata extraction heuristics
        if (line.startsWith('#') && title === "无标题") {
          title = line;
        } else if (line.startsWith('生成时间')) {
          date = line.replace('生成时间：', '').replace('生成时间:', '').trim();
        } else {
          // Add to main content if it's not a tag line (optional filter)
          contentLines.push(line);
        }
      }
    }

    const articleId = simpleId();
    const fullContent = contentLines.join('\n');

    articles.push({
      id: articleId,
      title,
      date,
      content: fullContent
    });

    // 3. Parse Words
    // Format: • instalment - 分期付款；连载的一部分
    wordListLines.forEach(line => {
      // Remove bullet point and trim
      const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
      
      // Split by ' - ' or just space if format varies, but prompt shows ' - '
      // Some lines might not match, wrap in try/catch or checks
      const separatorMatch = cleanLine.match(/\s+[-–]\s+/); 
      
      if (separatorMatch) {
        const separatorIndex = separatorMatch.index!;
        const enWord = cleanLine.substring(0, separatorIndex).trim();
        const cnTrans = cleanLine.substring(separatorIndex + separatorMatch[0].length).trim();

        if (enWord && cnTrans) {
          allWords.push({
            id: enWord, // ID is the word itself to prevent dupes across articles if needed
            translation: cnTrans,
            articleId: articleId
          });
        }
      }
    });
  });

  return { articles, words: allWords };
};
