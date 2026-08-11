import styles from '../Settings.module.css';
import CityAutocomplete from '../../../CityAutocomplete/CityAutocomplete';
import { Field, FormActions, SectionHeader } from '../Settings.ui';

export default function ProfilePanel({ profile, updateProfile, updateLocation, onLocationValidityChange, locationValid = true, isFreelancer, isSaving, dirty, profileCompletion, onSave, onCancel }) {
  return (
    <section className={styles.card}>
      <SectionHeader title="Dados Públicos" subtitle="Essas informações moldam sua presença na plataforma." extra={<span className={styles.inlineBadge}>{profileCompletion}% Completo</span>} />

      <div className={styles.formGrid}>
        <Field label="Nome">
          <input type="text" className={styles.input} value={profile.firstName} onChange={(e) => updateProfile('firstName', e.target.value)} />
        </Field>
        <Field label="Sobrenome">
          <input type="text" className={styles.input} value={profile.lastName} onChange={(e) => updateProfile('lastName', e.target.value)} />
        </Field>
        <Field label="Nome de Usuário (URL)" hint="Use letras e números, sem espaços." full>
          <div className={styles.inputWithPrefix}>
            <span className={styles.inputPrefix}>hivelancers.com/</span>
            <input type="text" className={styles.input} value={profile.username} placeholder="seuusuario" onChange={(e) => updateProfile('username', e.target.value.toLowerCase())} />
          </div>
        </Field>
        <Field label={isFreelancer ? 'Especialidade Principal (Título)' : 'Cargo ou Empresa'}>
          <input type="text" className={styles.input} value={profile.headline} placeholder="Ex: UX/UI Designer Senior" onChange={(e) => updateProfile('headline', e.target.value)} />
        </Field>
        <Field label="Website ou Link Externo">
          <input type="url" className={styles.input} value={profile.website} placeholder="https://..." onChange={(e) => updateProfile('website', e.target.value)} />
        </Field>
        <Field label="Localização">
          <CityAutocomplete
            value={profile.location}
            locationData={{
              city: profile.locationCity,
              state: profile.locationState,
              countryCode: profile.locationCountryCode,
            }}
            onChange={updateLocation}
            onValidityChange={onLocationValidityChange}
            placeholder="Sua cidade"
            inputClassName={styles.input}
          />
        </Field>
        <Field label="Biografia / Resumo" hint={`${(profile.bio || '').length}/280 caracteres`} full>
          <textarea className={styles.textarea} value={profile.bio} maxLength={280} rows={4} placeholder="Um resumo atrativo sobre sua trajetória..." onChange={(e) => updateProfile('bio', e.target.value)} />
        </Field>
      </div>

      <FormActions onSave={onSave} onCancel={onCancel} isSaving={isSaving} disabled={!dirty || !locationValid} />
    </section>
  );
}
