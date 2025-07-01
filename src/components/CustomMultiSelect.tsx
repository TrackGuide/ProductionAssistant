
import React, { useState, useRef, useEffect } from 'react';
import styles from './CustomMultiSelect.module.css';

interface CustomMultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  allowCustom?: boolean;
  className?: string;
}

export const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  label,
  allowCustom = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customValue, setCustomValue] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) => opt.toLowerCase().includes(search.toLowerCase()) && !selected.includes(opt)
  );

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomValue('');
      setSearch('');
    }
  };

  return (
    <div className={`${styles.dropdown} ${className}`} ref={ref}>
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      <button
        type="button"
        className={styles.dropdownButton}
        onClick={() => setIsOpen((open) => !open)}
        tabIndex={0}
        onBlur={() => setIsOpen(false)}
      >
        {selected.length === 0 && <span className="text-gray-400">{placeholder}</span>}
        {selected.map((val) => (
          <span
            key={val}
            className={styles.pill}
            onClick={e => { e.stopPropagation(); }}
          >
            {val}
            <button
              type="button"
              className={styles.pillRemove}
              aria-label={`Remove ${val}`}
              onClick={e => {
                e.stopPropagation();
                onChange(selected.filter((v) => v !== val));
              }}
            >
              ×
            </button>
          </span>
        ))}
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className="p-2">
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search or add..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            {allowCustom && search && !options.includes(search) && !selected.includes(search) && (
              <button
                className={styles.addCustom}
                onClick={e => { e.preventDefault(); e.stopPropagation(); handleAddCustom(); }}
              >
                + Add "{search}"
              </button>
            )}
          </div>
          <ul>
            {filteredOptions.length === 0 && (
              <li className={styles.noOptions}>No options</li>
            )}
            {filteredOptions.map(opt => (
              <li key={opt} className={styles.option} onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => handleToggle(opt)}
                  className={styles.checkbox}
                />
                <span>{opt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
