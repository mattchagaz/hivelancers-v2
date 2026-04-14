import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { FaArrowLeft, FaEnvelopeOpenText } from 'react-icons/fa';
import styles from './VerifyOtp.module.css';
import { verifyOtp, resendOtp } from '../../../services/auth';
import { useAuth } from '../../../contexts/AuthContext';
import { nextRouteAfterAuth } from '../../../utils/authFlow';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function VerifyOtp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const { setUser } = useAuth();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error('Sessão expirada. Faça o cadastro novamente.');
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const submitCode = async (code) => {
    setIsLoading(true);
    try {
      const data = await verifyOtp({ email, code });
      if (data.user) setUser(data.user);
      toast.success('E-mail verificado! Redirecionando...');
      setTimeout(() => navigate(nextRouteAfterAuth(data.user)), 800);
    } catch (err) {
      toast.error(err.message);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== '') && !isLoading) {
      submitCode(next.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[nextIndex]?.focus();
    if (pasted.length === OTP_LENGTH) submitCode(pasted);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      toast.error('Digite os 6 dígitos do código.');
      return;
    }
    submitCode(code);
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await resendOtp(email);
      toast.success('Novo código enviado para seu e-mail.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(b.length, 2))}${c}`);

  return (
    <div className={styles.page}>
      <div className={styles.brandSide}>
        <div className={styles.brandContent}>
          <div className={styles.logoMark}>H</div>
          <h1 className={styles.brandTitle}>Hivelancers</h1>
          <p className={styles.brandTagline}>
            Falta pouco! Confirme seu e-mail para liberar o acesso à plataforma.
          </p>
          <div className={styles.infoCard}>
            <FaEnvelopeOpenText className={styles.infoIcon} />
            <div>
              <span className={styles.infoTitle}>Por que verificar?</span>
              <span className={styles.infoDesc}>
                Garantimos que sua conta é legítima e protegemos seus dados.
              </span>
            </div>
          </div>
        </div>
        <div className={styles.brandDecor} />
        <div className={styles.brandDecor2} />
      </div>

      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Verifique seu e-mail</h2>
            <p className={styles.formSubtitle}>
              Enviamos um código de 6 dígitos para <strong>{maskedEmail}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.otpGroup} onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  className={styles.otpInput}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                />
              ))}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading || digits.some((d) => !d)}
            >
              {isLoading ? <span className={styles.spinner} /> : 'Verificar código'}
            </button>

            <div className={styles.resendRow}>
              <span className={styles.resendText}>Não recebeu o código?</span>
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
              >
                {cooldown > 0
                  ? `Reenviar em ${cooldown}s`
                  : isResending
                  ? 'Enviando...'
                  : 'Reenviar código'}
              </button>
            </div>
          </form>

          <Link to="/signup" className={styles.backLink}>
            <FaArrowLeft className={styles.backIcon} />
            Voltar ao cadastro
          </Link>
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default VerifyOtp;
