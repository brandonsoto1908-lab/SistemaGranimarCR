"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGate() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/status')
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          setAuthenticated(!!data.authenticated)
        } else {
          setAuthenticated(false)
        }
      } catch (err) {
        setAuthenticated(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        setAuthenticated(true)
        setPassword('')
        // reload to ensure any server-rendered parts update
        router.refresh()
      } else {
        const data = await res.json()
        setError(data?.message || 'Error de autenticación')
      }
    } catch (err) {
      setError('Error de red')
    }

    setLoading(false)
  }

  // While we don't know auth status, render nothing (avoid flicker)
  if (authenticated === null) return null

  if (authenticated) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-3 text-center">Ingrese la contraseña</h2>
        <form onSubmit={submit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            autoFocus
          />
          {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="w-full btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Validando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
