import { Progress, MasteryLevel, Word } from '../types';

// Constants for intervals (in milliseconds)
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Strategy:
// 1st time known (Level 0 -> 1): +6 mins
// 2nd time known (Level 1 -> 2): +1 hour
// 3rd time known (Level 2 -> 3): +1 hour
// 4th time known (Level 3 -> 4): Graduated (Infinity)
// Unknown (Any Level): Reset/Keep at Level 1 -> +6 mins

export const calculateNextState = (
  currentLevel: MasteryLevel,
  isCorrect: boolean
): { level: MasteryLevel; nextReview: number } => {
  const now = Date.now();

  if (!isCorrect) {
    // If unknown, reset to level 1 logic (6 mins later)
    // We keep them in the loop.
    return {
      level: 1,
      nextReview: now + 6 * MINUTE,
    };
  }

  // If Correct
  let nextLevel: MasteryLevel = (currentLevel + 1) as MasteryLevel;
  let interval = 0;

  switch (currentLevel) {
    case 0: // New -> 1
      interval = 6 * MINUTE;
      nextLevel = 1;
      break;
    case 1: // 1 -> 2
      interval = 1 * HOUR;
      nextLevel = 2;
      break;
    case 2: // 2 -> 3
      interval = 1 * HOUR;
      nextLevel = 3;
      break;
    case 3: // 3 -> 4 (Done)
      interval = -1; // -1 signifies graduated/never
      nextLevel = 4;
      break;
    default:
      // Already graduated or invalid
      interval = -1;
      nextLevel = 4;
      break;
  }

  return {
    level: nextLevel,
    nextReview: interval === -1 ? Number.MAX_SAFE_INTEGER : now + interval,
  };
};

export const getReviewQueue = (words: Word[], progress: Record<string, Progress>) => {
  const now = Date.now();
  
  // Separate into categories
  const due: Word[] = [];
  const newWords: Word[] = [];

  words.forEach(word => {
    const prog = progress[word.id];
    
    // If completed (Level 4), skip
    if (prog && prog.level >= 4) return;

    if (!prog) {
      // No progress means it's a new word
      newWords.push(word);
    } else {
      // Has progress, check if due
      if (prog.nextReview <= now) {
        due.push(word);
      }
    }
  });

  // Sort due words by who has been waiting longest (optional, but good for UX)
  due.sort((a, b) => progress[a.id].nextReview - progress[b.id].nextReview);

  // Strategy: Review Queue Priority > New Words
  return [...due, ...newWords];
};
