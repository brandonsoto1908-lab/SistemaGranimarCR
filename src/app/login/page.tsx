"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
    } else {
      const data = await res.json()
      setError(data?.message || 'Error de autenticación')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4 text-center">Iniciar sesión</h2>
        <form onSubmit={submit}>
          <label className="block text-sm text-gray-600 mb-2">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            autoFocus
          />
          {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
          <button className="w-full btn btn-primary" disabled={loading}>
            {loading ? 'Validando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
