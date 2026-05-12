import { CHUNK_SIZE_TOKENS, CHUNK_OVERLAP_TOKENS } from '../constants';

// Approximate token count: ~4 characters per token (conservative estimate)
const CHARS_PER_TOKEN = 4;

interface TextChunk {
  text: string;
  index: number;
}

export function chunkText(fullText: string): TextChunk[] {
  const chunkSizeChars = CHUNK_SIZE_TOKENS * CHARS_PER_TOKEN;
  const overlapChars = CHUNK_OVERLAP_TOKENS * CHARS_PER_TOKEN;

  if (fullText.length === 0) {
    return [];
  }

  // If the text is smaller than one chunk, return it as a single chunk
  if (fullText.length <= chunkSizeChars) {
    return [{ text: fullText.trim(), index: 0 }];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < fullText.length) {
    let endIndex = startIndex + chunkSizeChars;

    // If this isn't the last chunk, try to break at a sentence or paragraph boundary
    if (endIndex < fullText.length) {
      const searchWindow = fullText.substring(
        Math.max(startIndex, endIndex - 200),
        endIndex
      );

      // Try paragraph break first, then sentence break, then word break
      const paragraphBreak = searchWindow.lastIndexOf('\n\n');
      const sentenceBreak = searchWindow.lastIndexOf('. ');
      const wordBreak = searchWindow.lastIndexOf(' ');

      if (paragraphBreak > 0) {
        endIndex = endIndex - (searchWindow.length - paragraphBreak) + 2;
      } else if (sentenceBreak > 0) {
        endIndex = endIndex - (searchWindow.length - sentenceBreak) + 2;
      } else if (wordBreak > 0) {
        endIndex = endIndex - (searchWindow.length - wordBreak) + 1;
      }
    } else {
      endIndex = fullText.length;
    }

    const chunkText = fullText.substring(startIndex, endIndex).trim();
    if (chunkText.length > 0) {
      chunks.push({ text: chunkText, index: chunkIndex });
      chunkIndex++;
    }

    // Move start forward, accounting for overlap
    startIndex = endIndex - overlapChars;

    // Safety: ensure forward progress
    if (startIndex <= chunks[chunks.length - 1]?.index && endIndex >= fullText.length) {
      break;
    }
  }

  return chunks;
}
