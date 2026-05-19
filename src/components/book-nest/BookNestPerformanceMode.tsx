import { useEffect } from 'react'

const SCROLL_SETTLE_MS = 180

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

    let scrollTimer = 0
    let animationFrame = 0

    function clearScrolling() {
      body.classList.remove('is-scrolling')
    }

    function handleScroll() {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(() => {
          body.classList.add('is-scrolling')
          animationFrame = 0
        })
      }

      window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(clearScrolling, SCROLL_SETTLE_MS)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleScroll, { passive: true })
    window.addEventListener('touchmove', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('touchmove', handleScroll)
      window.clearTimeout(scrollTimer)
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
      body.classList.remove('is-scrolling')
      delete body.dataset.performance
    }
  }, [])

  return null
}
