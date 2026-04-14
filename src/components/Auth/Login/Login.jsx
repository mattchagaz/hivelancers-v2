import { useState } from 'react';
import { toast, Toaster } from 'sonner';
import styles from './Login.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { resendOtp } from '../../../services/auth';
import { nextRouteAfterAuth } from '../../../utils/authFlow';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await login({ email: email.trim().toLowerCase(), password });
      toast.success('Login realizado com sucesso!');
      navigate(nextRouteAfterAuth(data.user));
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        const normalized = email.trim().toLowerCase();
        toast.message('E-mail ainda não verificado. Enviamos um novo código...');
        try { await resendOtp(normalized); } catch { /* ignore */ }
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(normalized)}`);
        }, 800);
      } else {
        toast.error(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Lado esquerdo — branding */}
      <div className={styles.brandSide}>
        <div className={styles.brandContent}>
          <div className={styles.logoMark}>H</div>
          <h1 className={styles.brandTitle}>Hivelancers</h1>
          <p className={styles.brandTagline}>
            Conectando talentos a oportunidades. Sua próxima grande conquista começa aqui.
          </p>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>2.5k+</span>
              <span className={styles.statLabel}>Freelancers</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>800+</span>
              <span className={styles.statLabel}>Projetos</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>98%</span>
              <span className={styles.statLabel}>Satisfação</span>
            </div>
          </div>
        </div>
        <div className={styles.brandDecor} />
        <div className={styles.brandDecor2} />
      </div>

      {/* Lado direito — formulário */}
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Bem-vindo de volta</h2>
            <p className={styles.formSubtitle}>Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">E-mail</label>
              <div className={styles.inputWrapper}>
                <FaEnvelope className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="password">Senha</label>
                <Link className={styles.forgotLink} to="/forget-password">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className={styles.inputWrapper}>
                <FaLock className={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.spinner} />
              ) : (
                'Entrar'
              )}
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>ou</span>
              <span className={styles.dividerLine} />
            </div>

            <button type="button" className={styles.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>
          </form>

          <p className={styles.footerText}>
            Não tem uma conta?{' '}
            <Link className={styles.footerLink} to="/signup">
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default Login;