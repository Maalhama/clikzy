import { requireAdmin } from '@/lib/auth/adminCheck'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will redirect non-admins to /lobby
  await requireAdmin()

  return <>{children}</>
}
