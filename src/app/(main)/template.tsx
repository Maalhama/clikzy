// Transition d'entrée entre les pages (main) — CSS pur, zéro JS.
export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}
