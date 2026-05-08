import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export type ToolbarDropdownOption<T extends string = string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  prefix: string;
  options: readonly ToolbarDropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export function ToolbarDropdown<T extends string>({
  prefix,
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: Props<T>): JSX.Element {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();
  const foundIdx = options.findIndex((o) => o.value === value);
  const idxOfValue = foundIdx >= 0 ? foundIdx : 0;
  const hi = open ? Math.min(Math.max(0, highlight), Math.max(0, options.length - 1)) : idxOfValue;

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => btnRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    setHighlight(idxOfValue);
    requestAnimationFrame(() => optionRefs.current[idxOfValue]?.focus());
  }, [open, idxOfValue]);

  const selectIndex = useCallback(
    (i: number) => {
      const opt = options[i];
      if (opt) {
        onChange(opt.value);
        close();
      }
    },
    [options, onChange, close],
  );

  const onTriggerKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(e.key === 'ArrowDown' ? 0 : Math.max(0, options.length - 1));
      } else {
        setHighlight((v) => Math.min(Math.max(0, v + (e.key === 'ArrowDown' ? 1 : -1)), Math.max(0, options.length - 1)));
      }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) setOpen(true);
      else selectIndex(hi);
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      close();
    }
  };

  const onOptionKeyDown = (e: KeyboardEvent, i: number): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (i < options.length - 1) {
        setHighlight(i + 1);
        optionRefs.current[i + 1]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (i > 0) {
        setHighlight(i - 1);
        optionRefs.current[i - 1]?.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHighlight(0);
      optionRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = Math.max(0, options.length - 1);
      setHighlight(last);
      optionRefs.current[last]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectIndex(i);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className={`toolbar-dropdown${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="theme-btn toolbar-dropdown__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
      >
        {prefix ? (
          <>
            {prefix} <span className="toolbar-dropdown__current">{currentLabel}</span>
          </>
        ) : (
          <span className="toolbar-dropdown__current">{currentLabel}</span>
        )}
      </button>
      {open ? (
        <ul className="toolbar-dropdown__menu" role="listbox" id={listboxId} aria-label={ariaLabel} tabIndex={-1}>
          {options.map((o, i) => (
            <li key={o.value} role="none">
              <button
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                className={`toolbar-dropdown__option${o.value === value ? ' is-active' : ''}`}
                role="option"
                aria-selected={o.value === value}
                tabIndex={-1}
                onClick={() => selectIndex(i)}
                onMouseEnter={() => {
                  setHighlight(i);
                  optionRefs.current[i]?.focus();
                }}
                onKeyDown={(e) => onOptionKeyDown(e, i)}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
