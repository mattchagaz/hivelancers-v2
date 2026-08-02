import { FaPlus, FaMedal, FaTrash, FaFloppyDisk } from 'react-icons/fa6';
import styles from '../Admin.module.css';
import { slugify } from '../Admin.helpers';
import { useAdmin } from '../AdminContext';

export default function LevelsTab() {
  const {
    loadFreelancerLevels,
    levelsLoading,
    startNewLevel,
    freelancerLevels,
    selectedLevelId,
    setSelectedLevelId,
    levelDraft,
    updateLevelDraft,
    selectedLevel,
    removeLevel,
    levelSaving,
    saveLevel,
  } = useAdmin();

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.sectionKicker}>Confiança</span>
          <h3>Sistema geral de níveis e XP</h3>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.ghostButton} onClick={loadFreelancerLevels} disabled={levelsLoading}>
            {levelsLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button type="button" className={styles.primaryButton} onClick={startNewLevel}>
            <FaPlus /> Novo nível
          </button>
        </div>
      </div>

      <div className={styles.levelLayout}>
        <div className={styles.levelList}>
          {levelsLoading ? (
            <div className={styles.taxonomyEmpty}>Carregando níveis...</div>
          ) : freelancerLevels.length === 0 ? (
            <div className={styles.taxonomyEmpty}>Nenhum nível configurado.</div>
          ) : (
            freelancerLevels.map((level) => (
              <button
                key={level.id}
                type="button"
                className={`${styles.levelCard} ${selectedLevelId === level.id ? styles.levelCardActive : ''}`}
                onClick={() => setSelectedLevelId(level.id)}
              >
                <span className={styles.levelSwatch} style={{ background: level.badgeColor }} />
                <span>
                  <strong>Nível {level.levelNumber} · {level.name}</strong>
                  <small>
                    {level.audience === 'ALL' ? 'Todos' : level.audience === 'FREELANCER' ? 'Freelancers' : 'Clientes'} · {level.xpRequired} XP para liberar
                  </small>
                </span>
                <em className={`${styles.badge} ${styles[level.isActive ? 'success' : 'neutral']}`}>
                  {level.isActive ? 'Ativo' : 'Inativo'}
                </em>
              </button>
            ))
          )}
        </div>

        <aside className={styles.userEditor}>
          <div className={styles.userEditorHeader}>
            <div className={styles.userAvatar}><FaMedal /></div>
            <div>
              <span className={styles.sectionKicker}>{selectedLevelId === 'new' ? 'Novo nível' : 'Editor'}</span>
              <h4>{levelDraft.name || 'Nível da plataforma'}</h4>
              <p>Configure XP, audiência e recompensas exibidas ao usuário.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span>Audiência</span>
              <select value={levelDraft.audience} onChange={(event) => updateLevelDraft('audience', event.target.value)}>
                <option value="ALL">Todos</option>
                <option value="FREELANCER">Freelancers</option>
                <option value="CLIENT">Clientes</option>
              </select>
            </label>
            <label className={styles.formField}>
              <span>Número do nível</span>
              <input type="number" min="1" value={levelDraft.levelNumber} onChange={(event) => updateLevelDraft('levelNumber', event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Nome</span>
              <input value={levelDraft.name} onChange={(event) => updateLevelDraft('name', event.target.value)} placeholder="Nível 5" />
            </label>
            <label className={styles.formField}>
              <span>Slug</span>
              <input value={levelDraft.slug} onChange={(event) => updateLevelDraft('slug', slugify(event.target.value))} placeholder="nivel-5" />
            </label>
            <label className={styles.formField}>
              <span>XP necessário</span>
              <input type="number" min="0" value={levelDraft.xpRequired} onChange={(event) => updateLevelDraft('xpRequired', event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Ordem</span>
              <input type="number" min="0" value={levelDraft.position} onChange={(event) => updateLevelDraft('position', event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Cor do selo</span>
              <input type="color" value={levelDraft.badgeColor} onChange={(event) => updateLevelDraft('badgeColor', event.target.value)} />
            </label>
            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span>Descrição</span>
              <textarea rows={3} value={levelDraft.description} onChange={(event) => updateLevelDraft('description', event.target.value)} />
            </label>
            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span>Recompensas/benefícios, um por linha</span>
              <textarea rows={4} value={levelDraft.benefits} onChange={(event) => updateLevelDraft('benefits', event.target.value)} />
            </label>
          </div>

          <div className={styles.userSwitches}>
            <label>
              <input type="checkbox" checked={levelDraft.isActive} onChange={(event) => updateLevelDraft('isActive', event.target.checked)} />
              <span>Nível ativo</span>
            </label>
          </div>

          <div className={styles.editorActions}>
            {selectedLevel && (
              <button type="button" className={styles.dangerButton} onClick={removeLevel} disabled={levelSaving}>
                <FaTrash /> Excluir
              </button>
            )}
            <button type="button" className={styles.primaryButton} onClick={saveLevel} disabled={levelSaving}>
              <FaFloppyDisk /> {levelSaving ? 'Salvando...' : 'Salvar nível'}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
