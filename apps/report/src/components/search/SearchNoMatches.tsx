import React from 'react';

type Props = {
  /** What is being filtered (e.g. "keys", "rows"). */
  noun: string;
  onClear: () => void;
};

/** Shown when the global search filters a non-empty dataset to zero matches. */
export function SearchNoMatches({ noun, onClear }: Props): JSX.Element {
  return (
    <div className="card search-no-matches">
      <p className="search-no-matches__title">No {noun} match your search.</p>
      <p className="search-no-matches__hint">Try a shorter term or clear the filter to see everything again.</p>
      <button type="button" className="theme-btn search-no-matches__clear" onClick={onClear}>
        Clear search
      </button>
    </div>
  );
}
