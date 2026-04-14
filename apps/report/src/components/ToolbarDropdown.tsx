import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

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
  /** Extra class on the root (e.g. `toolbar-dropdown--dropup`, `toolbar-dropdown--theme`). */
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
  const [openLeft, setOpenLeft] = useState(false);
  const [openUp, setOpenUp] = useState(false);
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

  useEffect(() => {
    if (!open) return;
    const updatePlacement = (): void => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const estMenuWidth = 180;
      const estMenuHeight = Math.min(320, Math.max(120, options.length * 34 + 10));
      const spaceLeftForRightAlign = rect.right;
      const spaceRightForLeftAlign = window.innerWidth - rect.left;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenLeft(spaceLeftForRightAlign < estMenuWidth && spaceRightForLeftAlign > spaceLeftForRightAlign);
      setOpenUp(spaceBelow < estMenuHeight && spaceAbove > spaceBelow);
    };
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    return () => window.removeEventListener('resize', updatePlacement);
  }, [open, options.length]);

  const selectIndex = useCallback(
    (i: number) => {
      const o = options[i];
      if (o) {
        onChange(o.value);
        close();
      }
    },
    [options, onChange, close],
  );

  const moveHighlight = useCallback(
    (delta: number) => {
      setHighlight((h) => {
        const base = open ? h : idxOfValue;
        return Math.min(Math.max(0, base + delta), options.length - 1);
      });
    },
    [open, idxOfValue, options.length],
  );

  const onTriggerKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(e.key === 'ArrowDown' ? 0 : options.length - 1);
      } else {
        moveHighlight(e.key === 'ArrowDown' ? 1 : -1);
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

  const onOptionKeyDown = (e: React.KeyboardEvent, i: number): void => {
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
      const last = options.length - 1;
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
    <div
      className={`toolbar-dropdown${openLeft ? ' toolbar-dropdown--open-left' : ''}${openUp ? ' toolbar-dropdown--open-up' : ''}${className ? ` ${className}` : ''}`}
      ref={rootRef}
    >
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
        {prefix} <span className="toolbar-dropdown__current">{currentLabel}</span>
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
