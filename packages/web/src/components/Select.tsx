import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function Select({ options, value, onChange, label, placeholder }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label || placeholder || 'Select...';

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlightIndex(-1);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close]);

  useEffect(() => {
    if (isOpen && highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightIndex(options.findIndex((o) => o.value === value));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightIndex >= 0) {
          onChange(options[highlightIndex].value);
          close();
        }
        break;
      case 'Escape':
        close();
        break;
    }
  };

  return (
    <div ref={containerRef} style={styles.container} onKeyDown={handleKeyDown}>
      {label && <span style={styles.label}>{label}</span>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.trigger,
          ...(isOpen ? styles.triggerOpen : {}),
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span style={{
          ...styles.triggerText,
          ...(!selectedOption ? styles.triggerPlaceholder : {}),
        }}>
          {displayLabel}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            ...styles.chevron,
            ...(isOpen ? styles.chevronOpen : {}),
          }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        ref={listRef}
        role="listbox"
        style={{
          ...styles.dropdown,
          ...(isOpen ? styles.dropdownOpen : styles.dropdownClosed),
        }}
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            role="option"
            aria-selected={option.value === value}
            onClick={() => {
              onChange(option.value);
              close();
            }}
            onMouseEnter={() => setHighlightIndex(index)}
            style={{
              ...styles.option,
              ...(option.value === value ? styles.optionSelected : {}),
              ...(index === highlightIndex ? styles.optionHighlighted : {}),
            }}
          >
            {option.value === value && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={styles.checkmark}>
                <path
                  d="M3 7L6 10L11 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span>{option.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '160px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-4)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: '16px',
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '8px 12px',
    minHeight: '36px',
    backgroundColor: 'var(--bg-2)',
    border: '1px solid var(--border-default)',
    borderRadius: '6px',
    cursor: 'pointer',
    color: 'var(--text-1)',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
    lineHeight: '20px',
  },
  triggerOpen: {
    borderColor: 'var(--accent)',
    backgroundColor: 'var(--bg-3)',
    boxShadow: '0 0 0 1px var(--accent)',
  },
  triggerText: {
    flex: 1,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  triggerPlaceholder: {
    color: 'var(--text-4)',
  },
  chevron: {
    flexShrink: 0,
    color: 'var(--text-3)',
    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    transform: 'rotate(0deg)',
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: 'var(--bg-3)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 50,
    maxHeight: '240px',
    overflowY: 'auto',
    transformOrigin: 'top',
    transition: 'opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  dropdownOpen: {
    opacity: 1,
    transform: 'scaleY(1) translateY(0)',
    pointerEvents: 'auto',
  },
  dropdownClosed: {
    opacity: 0,
    transform: 'scaleY(0.95) translateY(-4px)',
    pointerEvents: 'none',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: 'var(--text-1)',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    borderBottom: '1px solid var(--bg-2)',
  },
  optionSelected: {
    color: 'var(--text-0)',
    fontWeight: 500,
    backgroundColor: 'var(--accent-subtle)',
  },
  optionHighlighted: {
    backgroundColor: 'var(--bg-4)',
  },
  checkmark: {
    flexShrink: 0,
    color: 'var(--accent)',
  },
};
