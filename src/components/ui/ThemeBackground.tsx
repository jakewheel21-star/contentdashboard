'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from './ThemeProvider'

function MatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF'
    let cols: number[] = []
    let raf: number

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      cols = Array.from({ length: Math.floor(canvas!.width / 20) }, () => Math.random() * canvas!.height)
    }

    function tick() {
      ctx!.fillStyle = 'rgba(0,13,2,0.06)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
      ctx!.fillStyle = '#00ff41'
      ctx!.font = '14px monospace'
      for (let i = 0; i < cols.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        ctx!.fillText(char, i * 20, cols[i])
        if (cols[i] > canvas!.height && Math.random() > 0.975) {
          cols[i] = 0
        } else {
          cols[i] += 20
        }
      }
      raf = requestAnimationFrame(tick)
    }

    resize()
    tick()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.75 }} />
}

export default function ThemeBackground() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>

      {theme === 'light' && (
        <div style={{
          position: 'absolute', top: '-20%', right: '-15%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
          animation: 'orb-float 16s ease-in-out infinite',
        }} />
      )}

      {theme === 'aurora' && <>
        <div style={{
          position: 'absolute', top: '-30%', left: '-20%',
          width: '80vw', height: '80vw', borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, rgba(139,92,246,0.5), rgba(59,130,246,0.25), transparent 65%)',
          filter: 'blur(65px)',
          animation: 'aurora-shift 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-25%', right: '-15%',
          width: '65vw', height: '65vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.3), rgba(99,102,241,0.2), transparent 65%)',
          filter: 'blur(70px)',
          animation: 'aurora-shift 28s ease-in-out infinite reverse',
        }} />
      </>}

      {theme === 'neon' && <>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
          backgroundImage: 'linear-gradient(rgba(6,182,212,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.07) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'neon-grid-scroll 10s linear infinite',
        }} />
        <div style={{
          position: 'absolute', top: '-20%', right: '-20%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.18), rgba(236,72,153,0.12), transparent 65%)',
          filter: 'blur(55px)',
          animation: 'neon-pulse 7s ease-in-out infinite',
        }} />
      </>}

      {theme === 'ocean' && <>
        <div style={{
          position: 'absolute', top: '-25%', left: '-10%',
          width: '70vw', height: '70vw',
          background: 'radial-gradient(circle, rgba(13,148,136,0.32), rgba(6,182,212,0.18), transparent 65%)',
          filter: 'blur(55px)',
          animation: 'ocean-blob 20s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30%', right: '-15%',
          width: '65vw', height: '65vw',
          background: 'radial-gradient(circle, rgba(8,145,178,0.28), rgba(99,102,241,0.15), transparent 65%)',
          filter: 'blur(60px)',
          animation: 'ocean-blob 26s ease-in-out infinite reverse',
        }} />
      </>}

      {theme === 'matrix' && <MatrixCanvas />}

      {theme === 'synthwave' && <>
        <div style={{
          position: 'absolute', top: '-40%', left: '50%',
          width: '120vw', height: '80vw', borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(255,80,200,0.55) 0%, rgba(160,40,220,0.4) 30%, rgba(80,0,160,0.25) 55%, transparent 75%)',
          filter: 'blur(50px)',
          animation: 'synthwave-shift 24s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: '100%', height: '55%',
          backgroundImage: [
            'repeating-linear-gradient(0deg, rgba(255,100,200,0.14) 0px, transparent 1px, transparent 20px, rgba(255,100,200,0.08) 21px, transparent 22px, transparent 50px, rgba(255,100,200,0.05) 51px, transparent 52px, transparent 90px, rgba(255,100,200,0.04) 91px, transparent 92px, transparent 140px)',
            'repeating-linear-gradient(90deg, rgba(255,100,200,0.06) 0px, transparent 1px, transparent 60px)',
          ].join(', '),
          animation: 'synthwave-grid 5s linear infinite',
        }} />
      </>}

      {theme === 'galaxy' && <>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
          backgroundImage: [
            'radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.7) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 28% 72%, rgba(255,255,255,0.5) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 45% 35%, rgba(255,255,255,0.8) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 62% 88%, rgba(255,255,255,0.4) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 78% 12%, rgba(255,255,255,0.7) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 88% 55%, rgba(255,255,255,0.5) 0%, transparent 100%)',
            'radial-gradient(1.5px 1.5px at 5% 60%, rgba(255,255,255,0.6) 0%, transparent 100%)',
            'radial-gradient(1.5px 1.5px at 35% 5%, rgba(255,255,255,0.5) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 55% 50%, rgba(200,180,255,0.6) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 72% 40%, rgba(200,180,255,0.4) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 92% 80%, rgba(255,255,255,0.6) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 18% 92%, rgba(255,255,255,0.4) 0%, transparent 100%)',
            'radial-gradient(2px 2px at 50% 22%, rgba(255,255,255,0.9) 0%, transparent 100%)',
            'radial-gradient(1px 1px at 82% 68%, rgba(200,180,255,0.5) 0%, transparent 100%)',
          ].join(', '),
          animation: 'galaxy-drift 80s linear infinite',
        }} />
        <div style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '75vw', height: '75vw', borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 50%, rgba(139,92,246,0.35) 0%, rgba(59,7,100,0.25) 35%, rgba(30,27,75,0.15) 60%, transparent 75%)',
          filter: 'blur(70px)',
          animation: 'galaxy-nebula 32s ease-in-out infinite',
        }} />
      </>}

    </div>
  )
}
