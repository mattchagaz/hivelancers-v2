import {
  FaUsers,
  FaTrash,
  FaFloppyDisk,
  FaClock,
  FaInbox,
  FaShieldHalved,
  FaCircleCheck,
  FaUserCheck,
  FaBolt,
} from 'react-icons/fa6';
import styles from '../Admin.module.css';
import {
  formatDate,
  toUserName,
  USER_TYPE_LABEL,
  getStatusTone,
  ACTIVITY_LABEL,
  getIdentityTone,
  getIdentityStatus,
  IDENTITY_STATUS_LABEL,
} from '../Admin.helpers';
import { useAdmin } from '../AdminContext';

export default function UsersTab() {
  const {
    userAccountState,
    setUserAccountState,
    setUserStatusFilter,
    setUserTypeFilter,
    setSelectedUserId,
    saveUser,
    selectedUser,
    userSaving,
    usersTotal,
    deletedUsersStats,
    usersStats,
    userStatusFilter,
    userTypeFilter,
    usersLoading,
    adminUsers,
    selectedUserId,
    toggleAdmin,
    openIdentityModal,
    userDraft,
    updateUserDraft,
    currentUser,
  } = useAdmin();

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.sectionKicker}>Usuários</span>
          <h3>
            {userAccountState === 'deleted'
              ? 'Contas excluídas e anonimizadas'
              : 'Contas reais da plataforma'}
          </h3>
          <p className={styles.panelDescription}>
            {userAccountState === 'deleted'
              ? 'Registros mínimos preservados exclusivamente para integridade operacional e auditoria.'
              : 'Gerencie perfis, permissões e verificações das contas em operação.'}
          </p>
        </div>
        <div className={styles.buttonGroup}>
          <div className={styles.accountViewSwitch} aria-label="Visualização de contas">
            <button
              type="button"
              className={`${styles.accountViewButton} ${userAccountState === 'active' ? styles.accountViewButtonActive : ''}`}
              onClick={() => {
                setUserAccountState('active');
                setUserStatusFilter('all');
                setUserTypeFilter('');
              }}
            >
              <FaUsers /> Contas ativas
            </button>
            <button
              type="button"
              className={`${styles.accountViewButton} ${userAccountState === 'deleted' ? styles.accountViewButtonActive : ''}`}
              onClick={() => {
                setUserAccountState('deleted');
                setUserStatusFilter('all');
                setUserTypeFilter('');
                setSelectedUserId('');
              }}
            >
              <FaTrash /> Excluídas
            </button>
          </div>
          {userAccountState === 'active' && (
            <button type="button" className={styles.primaryButton} onClick={saveUser} disabled={!selectedUser || userSaving}>
              <FaFloppyDisk /> {userSaving ? 'Salvando...' : 'Salvar usuário'}
            </button>
          )}
        </div>
      </div>

      <div className={styles.userStats}>
        {userAccountState === 'deleted' ? (
          <>
            <div className={styles.taxonomyStat}>
              <FaTrash />
              <span>Total excluído</span>
              <strong>{usersTotal}</strong>
            </div>
            <div className={styles.taxonomyStat}>
              <FaClock />
              <span>Com histórico vinculado</span>
              <strong>{deletedUsersStats.withHistory}</strong>
            </div>
            <div className={styles.taxonomyStat}>
              <FaInbox />
              <span>Pedidos preservados</span>
              <strong>{deletedUsersStats.orders}</strong>
            </div>
            <div className={styles.taxonomyStat}>
              <FaShieldHalved />
              <span>Dados pessoais</span>
              <strong>Anonimizados</strong>
            </div>
          </>
        ) : (
          <>
            <div className={styles.taxonomyStat}>
              <FaUsers />
              <span>Total filtrado</span>
              <strong>{usersTotal}</strong>
            </div>
            <div className={styles.taxonomyStat}>
              <FaCircleCheck />
              <span>Ativos</span>
              <strong>{usersStats.active}</strong>
            </div>
            <div className={styles.taxonomyStat}>
              <FaUserCheck />
              <span>Identidade verificada</span>
              <strong>{usersStats.identityVerified}</strong>
            </div>
            <div className={styles.taxonomyStat}>
              <FaBolt />
              <span>Freelancers / Clientes</span>
              <strong>{usersStats.freelancers}/{usersStats.clients}</strong>
            </div>
          </>
        )}
      </div>

      {userAccountState === 'active' ? (
        <div className={styles.userFilters}>
          <select value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)}>
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="verified">Email verificado</option>
            <option value="unverified">Email pendente</option>
            <option value="identity_verified">Identidade verificada</option>
            <option value="identity_pending">Identidade em análise</option>
            <option value="identity_rejected">Identidade recusada</option>
            <option value="admin">Admins</option>
          </select>
          <select value={userTypeFilter} onChange={(event) => setUserTypeFilter(event.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="FREELANCER">Freelancers</option>
            <option value="CLIENT">Clientes</option>
          </select>
        </div>
      ) : (
        <div className={styles.deletedUsersNotice}>
          <FaShieldHalved />
          <span>
            Dados de identificação não são exibidos. O acesso a estes registros deve ser usado somente para auditoria.
          </span>
        </div>
      )}

      <div className={`${styles.userManagementGrid} ${userAccountState === 'deleted' ? styles.deletedUsersGrid : ''}`}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              {userAccountState === 'deleted' ? (
                <tr>
                  <th>Registro</th>
                  <th>Excluída em</th>
                  <th>Histórico preservado</th>
                  <th>Estado</th>
                </tr>
              ) : (
                <tr>
                  <th>Usuário</th>
                  <th>Tipo</th>
                  <th>Atividade</th>
                  <th>Identidade</th>
                  <th>Uso</th>
                  <th>Admin</th>
                  <th>Ações</th>
                </tr>
              )}
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={userAccountState === 'deleted' ? 4 : 7}>Carregando usuários...</td>
                </tr>
              ) : adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={userAccountState === 'deleted' ? 4 : 7}>
                    {userAccountState === 'deleted'
                      ? 'Nenhuma conta excluída encontrada.'
                      : 'Nenhum usuário encontrado.'}
                  </td>
                </tr>
              ) : userAccountState === 'deleted' ? (
                adminUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>Conta excluída</strong>
                      <span>ID: {user.id}</span>
                    </td>
                    <td>
                      <strong>{formatDate(user.deletedAt)}</strong>
                      <span>Exclusão solicitada pelo titular</span>
                    </td>
                    <td>
                      <strong>{user.counts?.orders || 0} pedidos</strong>
                      <span>
                        {user.counts?.services || 0} serviços · {user.counts?.messages || 0} mensagens
                      </span>
                    </td>
                    <td>
                      <em className={`${styles.badge} ${styles.neutral}`}>Anonimizada</em>
                      <span>Fora da visão operacional</span>
                    </td>
                  </tr>
                ))
              ) : (
                adminUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={selectedUserId === user.id ? styles.tableRowActive : ''}
                  >
                    <td>
                      <strong>{toUserName(user)}</strong>
                      <span>{user.email} · @{user.username || 'sem username'}</span>
                      <span>ID: {user.id}</span>
                    </td>
                    <td>
                      <em className={`${styles.badge} ${styles[user.userType ? 'neutral' : 'warning']}`}>
                        {USER_TYPE_LABEL[user.userType] || 'Sem tipo'}
                      </em>
                    </td>
                    <td>
                      <em className={`${styles.badge} ${styles[getStatusTone(ACTIVITY_LABEL[user.activityStatus] || 'Inativo')]}`}>
                        {ACTIVITY_LABEL[user.activityStatus] || 'Inativo'}
                      </em>
                      <span>Último acesso: {formatDate(user.lastSeenAt)}</span>
                    </td>
                    <td>
                      <em className={`${styles.badge} ${styles[getIdentityTone(getIdentityStatus(user))]}`}>
                        {IDENTITY_STATUS_LABEL[getIdentityStatus(user)] || 'Não iniciada'}
                      </em>
                      <span>{user.identityVerifiedAt ? `Aprovada em ${formatDate(user.identityVerifiedAt)}` : 'Sem aprovação'}</span>
                    </td>
                    <td>
                      <strong>{user.counts?.services || 0} serviços</strong>
                      <span>{user.counts?.orders || 0} pedidos · {user.counts?.messages || 0} msgs</span>
                    </td>
                    <td>
                      <label className={styles.adminToggle}>
                        <input
                          type="checkbox"
                          checked={Boolean(user.isAdmin)}
                          onChange={() => toggleAdmin(user)}
                          disabled={userSaving}
                        />
                        <span>{user.isAdmin ? 'Admin' : 'Usuário'}</span>
                      </label>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" onClick={() => setSelectedUserId(user.id)}>Editar</button>
                        <button type="button" onClick={() => openIdentityModal(user)} disabled={!user.accountVerification}>
                          Verificação
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {userAccountState === 'active' && (
          <aside className={styles.userEditor}>
          {selectedUser ? (
            <>
              <div className={styles.userEditorHeader}>
                <div className={styles.userAvatar}>
                  {toUserName(selectedUser).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className={styles.sectionKicker}>Editor</span>
                  <h4>{toUserName(selectedUser)}</h4>
                  <p>{selectedUser.email}</p>
                  <p>ID: {selectedUser.id}</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>Nome</span>
                  <input value={userDraft.firstName} onChange={(event) => updateUserDraft('firstName', event.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span>Sobrenome</span>
                  <input value={userDraft.lastName} onChange={(event) => updateUserDraft('lastName', event.target.value)} />
                </label>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Email</span>
                  <input value={userDraft.email} onChange={(event) => updateUserDraft('email', event.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span>Telefone</span>
                  <input value={userDraft.phone} onChange={(event) => updateUserDraft('phone', event.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span>Username</span>
                  <input value={userDraft.username} onChange={(event) => updateUserDraft('username', event.target.value.toLowerCase())} />
                </label>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Headline</span>
                  <input value={userDraft.headline} onChange={(event) => updateUserDraft('headline', event.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span>Localização</span>
                  <input value={userDraft.location} onChange={(event) => updateUserDraft('location', event.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span>Tipo de conta</span>
                  <select value={userDraft.userType} onChange={(event) => updateUserDraft('userType', event.target.value)}>
                    <option value="">Sem tipo</option>
                    <option value="FREELANCER">Freelancer</option>
                    <option value="CLIENT">Cliente</option>
                  </select>
                </label>
              </div>

              <div className={styles.userSwitches}>
                <label>
                  <input
                    type="checkbox"
                    checked={userDraft.isAdmin}
                    onChange={(event) => updateUserDraft('isAdmin', event.target.checked)}
                    disabled={selectedUser?.id === currentUser?.id}
                  />
                  <span>Administrador</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={userDraft.emailVerified}
                    onChange={(event) => updateUserDraft('emailVerified', event.target.checked)}
                  />
                  <span>Email verificado</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={userDraft.onboarded}
                    onChange={(event) => updateUserDraft('onboarded', event.target.checked)}
                  />
                  <span>Onboarding concluído</span>
                </label>
              </div>

              {selectedUser?.id === currentUser?.id && (
                <p className={styles.userPermissionNote}>
                  Você não pode remover o próprio acesso administrativo. Promova outra conta e use essa conta para alterar a sua permissão.
                </p>
              )}

              <button type="button" className={styles.primaryButton} onClick={saveUser} disabled={userSaving}>
                <FaFloppyDisk /> {userSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </>
          ) : (
            <div className={styles.taxonomyEmpty}>
              Selecione um usuário para editar permissões, perfil e estado da conta.
            </div>
          )}
          </aside>
        )}
      </div>
    </section>
  );
}
