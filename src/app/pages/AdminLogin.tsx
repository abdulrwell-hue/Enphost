import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Camera, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/admin', { replace: true })
    })
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setLoading(false)
    } else {
      navigate('/admin', { replace: true })
    }
  }

  return (
    <div
      className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#d4af37] to-[#f4d799] rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-[#d4af37]/30">
            <Camera className="w-8 h-8 text-[#0a0a0f]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Enphost</h1>
          <p className="text-gray-400 mt-1 text-sm">لوحة التحكم</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a24] border border-[#d4af37]/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2">تسجيل الدخول</h2>
          <p className="text-gray-400 text-sm mb-8">أدخل بياناتك للوصول إلى لوحة التحكم</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  dir="ltr"
                  className="w-full bg-[#0f0f16] border border-[#d4af37]/20 rounded-xl pr-10 pl-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/60 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0f0f16] border border-[#d4af37]/20 rounded-xl pr-10 pl-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#d4af37]/30 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0a0a0f]/40 border-t-[#0a0a0f] rounded-full animate-spin" />
                  جاري الدخول...
                </span>
              ) : (
                'دخول'
              )}
            </button>
          </form>
        </div>

        {/* Back to site link */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-500 hover:text-[#d4af37] text-sm transition-colors">
            ← العودة إلى الموقع
          </a>
        </div>
      </div>
    </div>
  )
}
