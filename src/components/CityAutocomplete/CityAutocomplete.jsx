import { useEffect, useRef, useState } from 'react';
import { loadCities, searchCities } from '../../services/ibge';
import styles from './CityAutocomplete.module.css';

function CityAutocomplete({ value, onChange, placeholder = 'Digite sua cidade...', inputClassName = '' }) {
  const [cities, setCities] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [results, setResults] = useState([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadCities()
      .then((items) => { if (!cancelled) setCities(items); })
      .catch(() => { /* deixa o campo funcionar como texto livre */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleChange = (e) => {
    const next = e.target.value;
    onChange(next);
    const list = searchCities(cities, next);
    setResults(list);
    setHighlight(0);
    setOpen(list.length > 0);
  };

  const selectCity = (city) => {
    onChange(city.label);
    setOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectCity(results[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        type="text"
        className={inputClassName}
        value={value || ''}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={() => {
          if (value) {
            const list = searchCities(cities, value);
            setResults(list);
            setOpen(list.length > 0);
          }
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {open && results.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {results.map((c, i) => (
            <li
              key={c.label}
              className={`${styles.item} ${i === highlight ? styles.itemActive : ''}`}
              onMouseDown={(e) => { e.preventDefault(); selectCity(c); }}
              onMouseEnter={() => setHighlight(i)}
              role="option"
              aria-selected={i === highlight}
            >
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CityAutocomplete;
