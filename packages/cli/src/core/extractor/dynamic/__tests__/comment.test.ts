import { describe, it, expect } from 'vitest';
import { commentRangesForJsLikeText, offsetInCommentRanges } from '@/core/extractor/dynamic/comment.js';

describe('commentRangesForJsLikeText', () => {
  it('marks line comments', () => {
    const text = 'foo\n// t(x)\nbar';
    const ranges = commentRangesForJsLikeText(text);
    const idx = text.indexOf('t(');
    expect(offsetInCommentRanges(idx, ranges)).toBe(true);
  });

  it('does not treat code inside strings as comment', () => {
    const text = "const s = '// not a comment'\nt(x)";
    const ranges = commentRangesForJsLikeText(text);
    const idx = text.lastIndexOf('t(');
    expect(offsetInCommentRanges(idx, ranges)).toBe(false);
  });
});
