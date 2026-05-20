import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Still checking — show nothing to avoid flash
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in — redirect to login
  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
