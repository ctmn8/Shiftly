'use client'
export default function Aurora() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="absolute rounded-full"
        style={{
          width: 750, height: 650,
          background: 'radial-gradient(ellipse, rgba(232,160,32,0.09) 0%, transparent 70%)',
          filter: 'blur(90px)',
          top: -280, left: -180,
          animation: 'aurora1 22s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          background: 'radial-gradient(ellipse, rgba(240,112,48,0.06) 0%, transparent 70%)',
          filter: 'blur(90px)',
          bottom: -180, right: -120,
          animation: 'aurora2 28s ease-in-out infinite alternate',
        }}
      />
      <style>{`
        @keyframes aurora1 { to { transform: translate(90px,130px) scale(1.08); } }
        @keyframes aurora2 { to { transform: translate(-70px,-90px) scale(0.92); } }
      `}</style>
    </div>
  )
}
