import { useEffect } from 'react'

export function BookNestPerformanceMode() {
  useEffect(() => {
    const body = document.body
    const navigatorWithMemory = navigator as Navigator & {
      deviceMemory?: number
    }
    const lowPowerDevice =
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigatorWithMemory.deviceMemory && navigatorWithMemory.deviceMemory <= 4) ||
      window.matchMedia('(pointer: coarse)').matches

    body.dataset.performance = lowPowerDevice ? 'reduced' : 'standard'

    return () => {
      delete body.dataset.performance
    }
  }, [])

  return null
}
