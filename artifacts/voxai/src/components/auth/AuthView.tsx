import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

interface AuthViewProps {
  initialMode?: 'login' | 'signup';
  onBack?: () => void;
}

export default function AuthView({ initialMode = 'login', onBack }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (signUpError) throw signUpError;

        // If Supabase requires email confirmation, session is null after signUp.
        // Immediately sign in so the user lands on the chat page right away.
        if (!signUpData.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            setSuccess('Account created! Please check your email to confirm before signing in.');
            return;
          }
        }
      } else if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });
        if (resetError) throw resetError;
        setSuccess('Password reset link sent to your email.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password';
  const subtitle =
    mode === 'login'
      ? 'Sign in to continue to Vx'
      : mode === 'signup'
        ? 'Get started with Vx for free'
        : 'Enter your email to receive a reset link';

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      {/* Top bar with back button */}
      {onBack && (
        <div className="px-4 pt-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
              <Sparkles size={24} className="text-white" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-black text-center mb-1">{title}</h1>
          <p className="text-sm text-gray-400 text-center mb-8">{subtitle}</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-black placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-black placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-white text-[15px] text-black placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-[15px] font-medium transition-all ${
                loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  {mode === 'login'
                    ? 'Signing in...'
                    : mode === 'signup'
                      ? 'Creating account...'
                      : 'Sending...'}
                </span>
              ) : mode === 'login' ? (
                'Sign in'
              ) : mode === 'signup' ? (
                'Create account'
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-gray-500 hover:text-black transition-colors"
                >
                  Forgot password?
                </button>
                <p className="text-sm text-gray-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-black font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-black font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-400">Vx &middot; Premium AI Platform</p>
      </div>
    </div>
  );
}
