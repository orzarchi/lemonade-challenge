import _ from "lodash";
import { Readable } from "stream";
import es from "event-stream";

// Based on https://stackoverflow.com/a/49718347/948829
// Matches words without their starting or ending punctuation symbols (except apostrophes)
const WORDS_WITHOUT_PUNCTUATION_REGEX = /\b[\w']+\b/g;

export default class WordCounter {
  private wordCountStorage: Record<string, number> = {};

  countWords = (input: string) => {
    const sanitizedWords =
      input.toLowerCase().match(WORDS_WITHOUT_PUNCTUATION_REGEX) || [];

    const wordCounts: Record<string, number> = {};
    for (const word of sanitizedWords) {
      if (!(word in wordCounts)) {
        wordCounts[word] = 1;
      } else {
        wordCounts[word] += 1;
      }
    }

    // Store words counts in memory, in the wordCountStorage field
    _.mergeWith(
      this.wordCountStorage,
      wordCounts,
      (wordCount?: number, otherWordCount?: number) => {
        return (wordCount || 0) + (otherWordCount || 0);
      }
    );
  };

  countWordsInStream = (wordStream: Readable) => {
    wordStream.pipe(es.split()).pipe(es.mapSync(this.countWords));
  };

  getAllWordCounts = () => {
    return { ...this.wordCountStorage };
  };

  getWordCount = (word: string) => {
    return this.wordCountStorage[word] || 0;
  };
}
