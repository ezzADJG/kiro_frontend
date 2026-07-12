import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { Agencia } from '@/types/shipping'

export function useAgencias() {
  const [agencias, setAgencias] = useState<Agencia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const agenciasRef = ref(db, 'agencia_shalom')
    const unsub = onValue(agenciasRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, Agencia>
        setAgencias(Object.values(data))
      } else {
        setAgencias([])
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { agencias, loading }
}
