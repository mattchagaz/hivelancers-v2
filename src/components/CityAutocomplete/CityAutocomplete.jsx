import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaCheck, FaLocationCrosshairs, FaLocationDot, FaSpinner } from 'react-icons/fa6';
import { loadCities, searchCities } from '../../services/ibge';
import { detectCurrentCity } from '../../services/geolocation';
import styles from './CityAutocomplete.module.css';

function CityAutocomplete({
  value,
  locationData,
  onChange,
  onValidityChange,
  placeholder = 'Digite sua cidade...',
  inputClassName = '',
}) {
  const listboxId = useId();
  const [cities, setCities] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [results, setResults] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [confirmed, setConfirmed] = useState(true);
  const [locating, setLocating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [detectedAutomatically, setDetectedAutomatically] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadCities()
      .then((items) => {
        if (cancelled) return;
        setCities(items);
        setLoadStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setLoadStatus('error');
        setFeedback('A lista de cidades está indisponível. Você ainda pode preencher manualmente.');
        setConfirmed(true);
        onValidityChange?.(true);
      });
    return () => { cancelled = true; };
  }, [onValidityChange]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      const clickedField = wrapRef.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);
      if (!clickedField && !clickedDropdown) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (!open || loadStatus !== 'ready' || (value || '').trim().length < 2) return;
    setResults(searchCities(cities, value));
  }, [cities, loadStatus, open, value]);

  useLayoutEffect(() => {
    if (!open || !inputRef.current) return undefined;

    const updatePosition = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, results.length]);

  const emitLocation = (label, details) => {
    onChange(label, details);
    setConfirmed(true);
    setFeedback('Cidade confirmada.');
    onValidityChange?.(true);
  };

  const handleChange = (event) => {
    const next = event.target.value;
    const list = searchCities(cities, next);
    const isEmpty = next.trim() === '';
    const acceptsFreeText = loadStatus === 'error';

    onChange(next, null);
    setResults(list);
    setHighlight(0);
    setOpen(next.trim().length >= 2 && loadStatus !== 'error');
    setConfirmed(isEmpty || acceptsFreeText);
    setDetectedAutomatically(false);
    setFeedback(
      isEmpty || acceptsFreeText
        ? ''
        : 'Selecione uma cidade da lista para confirmar a localização.'
    );
    onValidityChange?.(isEmpty || acceptsFreeText);
  };

  const selectCity = (city) => {
    emitLocation(city.label, {
      city: city.city,
      state: city.state,
      countryCode: city.countryCode,
      latitude: null,
      longitude: null,
    });
    setOpen(false);
    setResults([]);
    setDetectedAutomatically(false);
  };

  const handleUseCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    setOpen(false);
    setFeedback('Detectando sua cidade…');
    try {
      const detected = await detectCurrentCity();
      emitLocation(detected.label, detected);
      setDetectedAutomatically(true);
    } catch (error) {
      setFeedback(error.message || 'Não foi possível detectar sua localização.');
    } finally {
      setLocating(false);
    }
  };

  const handleKeyDown = (event) => {
    if (!open || results.length === 0) {
      if (event.key === 'Escape') setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectCity(results[highlight]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const helperTone = feedback && !confirmed && !locating ? styles.feedbackWarning : '';
  const hasStructuredLocation = Boolean(locationData?.city);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.inputWrap}>
        <FaLocationDot className={styles.inputIcon} aria-hidden="true" />
        <input
          type="text"
          ref={inputRef}
          className={`${inputClassName} ${styles.input}`.trim()}
          value={value || ''}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={() => {
            if ((value || '').trim().length < 2 || loadStatus === 'error') return;
            const list = searchCities(cities, value);
            setResults(list);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={!confirmed}
        />
        {loadStatus === 'loading' && <FaSpinner className={styles.loadingIcon} aria-label="Carregando cidades" />}
        {confirmed && value && loadStatus !== 'loading' && <FaCheck className={styles.confirmedIcon} aria-label="Cidade confirmada" />}
        {open && dropdownPosition && createPortal(
          <div ref={dropdownRef} className={styles.dropdown} style={dropdownPosition}>
            {results.length > 0 ? (
              <ul id={listboxId} className={styles.list} role="listbox">
                {results.map((city, index) => (
                  <li
                    key={city.id}
                    className={`${styles.item} ${index === highlight ? styles.itemActive : ''}`}
                    onMouseDown={(event) => { event.preventDefault(); selectCity(city); }}
                    onMouseEnter={() => setHighlight(index)}
                    role="option"
                    aria-selected={index === highlight}
                  >
                    <span className={styles.cityPin}><FaLocationDot /></span>
                    <span className={styles.cityName}>{city.city}</span>
                    <span className={styles.cityState}>{city.state}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>Nenhuma cidade brasileira encontrada.</div>
            )}
            <div className={styles.source}>Dados de municípios: IBGE</div>
          </div>,
          document.body
        )}
      </div>

      <div className={styles.metaRow}>
        <span className={`${styles.feedback} ${helperTone}`} aria-live="polite">
          {feedback || (hasStructuredLocation ? 'Cidade e estado salvos no perfil.' : 'Digite ao menos 2 letras e escolha uma sugestão.')}
        </span>
        <button
          type="button"
          className={styles.locateButton}
          onClick={handleUseCurrentLocation}
          disabled={locating}
        >
          {locating ? <FaSpinner className={styles.spin} /> : <FaLocationCrosshairs />}
          {locating ? 'Detectando…' : 'Usar minha localização'}
        </button>
      </div>

      {detectedAutomatically && (
        <p className={styles.privacyNote}>
          Localização aproximada, obtida com sua permissão. Coordenadas não aparecem no perfil público.
        </p>
      )}
    </div>
  );
}

export default CityAutocomplete;
