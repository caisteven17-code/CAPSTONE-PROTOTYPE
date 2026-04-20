'use client';

import React, { useState } from 'react';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import { auth } from '../firebase';

interface LoginProps {
  onLogin: (role: 'bishop' | 'admin' | 'priest' | 'school' | 'seminary') => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Local authentication mock
      let displayName = email.split('@')[0];
      let role: any = 'priest';
      
      const lowerEmail = email.toLowerCase();
      
      // Predefined accounts for testing
      if (lowerEmail === 'bishop@diocese.com') {
        displayName = 'San Pablo Cathedral';
        role = 'bishop';
      } else if (lowerEmail === 'parish@church.com') {
        displayName = 'San Isidro Labrador (Biñan)';
        role = 'priest';
      } else if (lowerEmail === 'seminary@church.com') {
        displayName = "St. Peter's College Seminary";
        role = 'seminary';
      } else if (lowerEmail === 'school@church.com') {
        displayName = 'Liceo de San Pablo';
        role = 'school';
      } else {
        // Default role assignment based on email for other accounts
        if (lowerEmail.includes('bishop')) role = 'bishop';
        else if (lowerEmail.includes('admin') || lowerEmail.includes('diocese')) role = 'admin';
        else if (lowerEmail.includes('school')) role = 'school';
        else if (lowerEmail.includes('seminary')) role = 'seminary';
      }

      const user = {
        uid: Math.random().toString(36).substr(2, 9),
        email: email,
        displayName: displayName,
      };

      const userData = {
        ...user,
        role: role,
        status: 'active'
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));
      onLogin(role);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white font-sans overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 overflow-y-auto">
        
        {/* Header Section - Compact */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 flex-shrink-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-church-green leading-tight mb-3 sm:mb-4">
            Legacy of <span className="text-[#D4AF37]">Faith</span>,<br />
            Precision of <span className="text-[#D4AF37]">Data</span>.
          </h1>
          
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3">
            <div className="h-px bg-gray-300 w-16 sm:w-24"></div>
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.15em] text-gray-500 uppercase whitespace-nowrap">
              Accountability • Transparency
            </p>
            <div className="h-px bg-gray-300 w-16 sm:w-24"></div>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
            Diocese Financial Analytics System
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-church-green rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl flex-shrink-0">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-[#D4AF37] rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-1 sm:mb-2">Ecclesiastical Portal</h2>
            <p className="text-gray-400 text-xs sm:text-sm">The Diocese of San Pablo</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Credentials</p>
              
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-church-green-dark border border-church-green rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-church-green-dark border border-church-green rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              
              <div className="flex justify-end">
                <a href="#" className="text-xs sm:text-sm text-[#D4AF37] hover:text-[#B5952F] transition-colors">
                  Forgot Password?
                </a>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs sm:text-sm text-center">{error}</p>}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-[#1A1A1A] font-bold py-2.5 sm:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
            >
              {isLoading ? 'Processing...' : (
                <>
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  Login
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      {/* Footer - Sticky at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        <Footer />
      </div>
    </div>
  );
}

