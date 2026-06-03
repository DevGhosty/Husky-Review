import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useProfileSettings } from '../context/profile-settings-context';
import { filterUwMajors } from '../data/uw-majors';
import { cn } from '../lib/utils';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface MajorComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MajorCombobox({ id, value, onChange, placeholder, className }: MajorComboboxProps) {
  const { settings } = useProfileSettings();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(
    () => filterUwMajors(value, 8, settings.campus),
    [settings.campus, value],
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [value, open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function selectMajor(major: string) {
    onChange(major);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (!open || suggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectMajor(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showList = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label htmlFor={id}>Major</Label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('h-11 rounded-xl px-3', className)}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-card py-1 shadow-premium"
        >
          {suggestions.map((major, index) => (
            <li key={`${major}-${index}`} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/60',
                  index === activeIndex && 'bg-primary/10 text-primary',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectMajor(major)}
              >
                {major}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
