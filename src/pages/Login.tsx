import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      await checkAuth();
      navigate('/dashboard');
    } catch (err: any) {
      setError('ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google দিয়ে লগইন করতে সমস্যা হয়েছে।');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full gov-card p-8 border-t-4 border-t-primary">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" alt="BD Gov Logo" className="w-16 h-16 opacity-90" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">লগইন করুন</h2>
          <p className="mt-2 text-sm text-gray-600">
            আপনার অ্যাকাউন্টে প্রবেশ করতে ইমেইল ও পাসওয়ার্ড দিন
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-gov-red text-gov-red px-4 py-3 rounded-sm flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-sm shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 mb-6 transition-colors"
        >
          {isGoogleLoading ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Google দিয়ে লগইন করুন
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">অথবা ইমেইল দিয়ে</span>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">ইমেইল ঠিকানা <span className="text-gov-red">*</span></label>
            <div className="mt-1">
              <input
                {...register('email', { required: 'ইমেইল আবশ্যক' })}
                type="email"
                className="gov-input"
              />
              {errors.email && <p className="mt-1 text-sm text-gov-red">{errors.email.message as string}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">পাসওয়ার্ড <span className="text-gov-red">*</span></label>
            <div className="mt-1">
              <input
                {...register('password', { required: 'পাসওয়ার্ড আবশ্যক' })}
                type="password"
                className="gov-input"
              />
              {errors.password && <p className="mt-1 text-sm text-gov-red">{errors.password.message as string}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded-sm"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                মনে রাখুন
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary-dark">
                পাসওয়ার্ড ভুলে গেছেন?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full gov-button flex justify-center py-2.5"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'লগইন করুন'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
            নতুন নিবন্ধন করুন
          </Link>
        </div>
        
        <div className="mt-6 flex items-start text-xs text-gray-500 bg-gray-50 p-3 rounded-sm border border-gray-200">
          <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400 mt-0.5" />
          <p>সতর্কতা: এটি একটি সুরক্ষিত সিস্টেম। অননুমোদিত অ্যাক্সেস আইনত দণ্ডনীয় অপরাধ।</p>
        </div>
      </div>
    </div>
  );
}
