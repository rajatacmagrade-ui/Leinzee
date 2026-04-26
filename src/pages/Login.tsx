import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

type Step = 'welcome' | 'profile' | 'instagram';

export default function Login() {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [instaUsername, setInstaUsername] = useState('');
  const [instaPassword, setInstaPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { instagramUser, setInstagramUser, updateProfile, stats } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is fully set up, go to main page
    if (instagramUser && stats.userName) {
      navigate('/add-reel');
    }
  }, [instagramUser, stats.userName, navigate]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    
    // Simulate Google OAuth Popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      'about:blank',
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (popup) {
      popup.document.write(`
        <body style="background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; height: 100vh; margin: 0;">
          <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" style="width: 48px; margin-bottom: 20px;">
          <h2 style="margin-bottom: 10px;">Sign in with Google</h2>
          <p style="color: #666; font-size: 14px; margin-bottom: 30px;">Choose an account to continue to Leinzeee</p>
          <div style="width: 300px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; background: #a3a6ff; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">U</div>
            <div>
              <div style="font-weight: bold; font-size: 14px;">User Account</div>
              <div style="color: #666; font-size: 12px;">user@gmail.com</div>
            </div>
          </div>
          <p style="font-size: 11px; color: #999; margin-top: 30px; text-align: center; padding: 0 40px;">To continue, Google will share your name, email address, language preference, and profile picture with Leinzeee.</p>
        </body>
      `);

      setTimeout(() => {
        popup.close();
        setIsLoading(false);
        // "Fetch" the name from the simulated Google account
        setName('Rajat'); // Simulated fetched name
        setStep('profile');
      }, 2000);
    } else {
      // Fallback if popup blocked
      setTimeout(() => {
        setIsLoading(false);
        setStep('profile');
      }, 1500);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gender) return;
    updateProfile({ name, gender });
    setStep('instagram');
  };

  const handleInstaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: instaUsername, password: instaPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');

      setInstagramUser(instaUsername);
      navigate('/add-reel');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 px-4 sm:px-0">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-12">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'welcome' ? 'w-8 bg-primary' : 'w-4 bg-outline-variant/30'}`} />
        <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'profile' ? 'w-8 bg-primary' : 'w-4 bg-outline-variant/30'}`} />
        <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'instagram' ? 'w-8 bg-primary' : 'w-4 bg-outline-variant/30'}`} />
      </div>

      <div className="bg-surface-container-high rounded-[2rem] p-8 border border-outline-variant/10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] relative overflow-hidden min-h-[480px] flex flex-col">
        {/* Abstract design elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/5 rounded-full blur-3xl animate-pulse" />

        {step === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-in">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 shadow-inner border border-primary/20">
              <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>waving_hand</span>
            </div>
            <h2 className="font-headline text-3xl font-black text-white tracking-tight mb-4">Welcome to <span className="text-primary">Leinzeee</span></h2>
            <p className="text-on-surface-variant mb-10 text-sm leading-relaxed max-w-[280px]">Your ultimate AI companion for reel content strategy and task management.</p>
            
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-neutral-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">sync</span>
              ) : (
                <>
                  <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-5 h-5" alt="Google" />
                  Continue with Google
                </>
              )}
            </button>
          </div>
        )}

        {step === 'profile' && (
          <div className="flex-1 animate-slide-in-right">
            <h2 className="font-headline text-2xl font-black text-white tracking-tight mb-2">Tell us about <span className="text-primary">you</span></h2>
            <p className="text-on-surface-variant text-xs mb-8">Personalize your Leinzeee experience.</p>
            
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Display Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant text-lg">person_edit</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-headline font-bold text-base outline-none transition-all"
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Gender Identity</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                        gender === g 
                        ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' 
                        : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!name || !gender}
                className="w-full py-4 bg-primary text-on-primary font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-8 flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>
          </div>
        )}

        {step === 'instagram' && (
          <div className="flex-1 animate-slide-in-right">
            <h2 className="font-headline text-2xl font-black text-white tracking-tight mb-2">Connect <span className="text-[#bc1888]">Instagram</span></h2>
            <p className="text-on-surface-variant text-xs mb-8">Link your account to enable AI metadata extraction.</p>

            <form onSubmit={handleInstaLogin} className="space-y-5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant text-lg">alternate_email</span>
                <input
                  type="text"
                  value={instaUsername}
                  onChange={(e) => setInstaUsername(e.target.value)}
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-body text-sm outline-none transition-all"
                  placeholder="Instagram Username"
                />
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant text-lg">lock</span>
                <input
                  type="password"
                  value={instaPassword}
                  onChange={(e) => setInstaPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-body text-sm outline-none transition-all"
                  placeholder="Password"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 animate-shake">
                  <span className="material-symbols-outlined text-error text-sm">warning</span>
                  <span className="text-error text-[10px] font-bold leading-tight">{error}</span>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                      <span>Linking Account...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                      <span>Finalize Setup</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/add-reel')}
                  className="w-full mt-4 py-2 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-relaxed">
        Leinzeee uses industry standard encryption to protect your data.
      </p>
    </div>
  );
}
