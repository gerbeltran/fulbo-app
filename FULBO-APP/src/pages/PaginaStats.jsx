export default function PaginaStats() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-6xl mb-4">📊</div>
      <h2
        className="font-semibold text-[#e0e6f0] mb-2 uppercase tracking-widest"
        style={{ fontSize: '13px' }}
      >
        Estadísticas
      </h2>
      <p className="text-[#6b7a8d] text-sm">
        Próximamente: goleadores, partidos jugados y MVPs ganados.
      </p>
    </div>
  )
}
