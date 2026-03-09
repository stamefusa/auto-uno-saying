import { useState } from 'react'
import { DEFAULT_PARAMS, type CardDetectParams } from '../lib/cardCounter'

const STORAGE_KEY = 'uno-detect-params'

function loadParams(): CardDetectParams {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_PARAMS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_PARAMS
}

export function usePersistedParams() {
  const [params, setParamsState] = useState<CardDetectParams>(loadParams)

  const setParams: typeof setParamsState = (update) => {
    setParamsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return [params, setParams] as const
}
