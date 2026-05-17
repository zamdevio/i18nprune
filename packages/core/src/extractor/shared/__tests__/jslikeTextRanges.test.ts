import { describe, it, expect } from 'vitest';
import {
  commentRangesForJsLikeText,
  importBindingScanBlankRanges,
  literalRangesForJsLikeText,
  offsetInCommentRanges,
} from '../jslikeTextRanges.js';

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

describe('literalRangesForJsLikeText', () => {
  it('covers import-like text inside string literals (interior only)', () => {
    const text = `const a = 'import { t } from "m"'; import { t } from 'x';`;
    const ranges = literalRangesForJsLikeText(text);
    const impInsideString = text.indexOf('import { t }');
    expect(offsetInCommentRanges(impInsideString, ranges)).toBe(true);
    const realImport = text.lastIndexOf('import');
    expect(offsetInCommentRanges(realImport, ranges)).toBe(false);
  });

  it('covers template literals as a single span', () => {
    const text = 'const x = `\nimport { t } from "ghost"\n`;\nimport { t as tr } from "a";';
    const ranges = literalRangesForJsLikeText(text);
    const fakeImport = text.indexOf('import { t }');
    expect(offsetInCommentRanges(fakeImport, ranges)).toBe(true);
    const realImport = text.lastIndexOf('import');
    expect(offsetInCommentRanges(realImport, ranges)).toBe(false);
  });
});

describe('importBindingScanBlankRanges', () => {
  it('merges comment and literal spans', () => {
    const text = '// import { t } from "x"\nconst s = "import { t } from \'y\'";\nimport { t as z } from "z";';
    const ranges = importBindingScanBlankRanges(text);
    const onlyRealImport = text.lastIndexOf('import');
    expect(offsetInCommentRanges(onlyRealImport, ranges)).toBe(false);
    const inString = text.indexOf("import { t } from 'y'");
    expect(offsetInCommentRanges(inString, ranges)).toBe(true);
    const inComment = text.indexOf('import { t }');
    expect(offsetInCommentRanges(inComment, ranges)).toBe(true);
  });
});
