import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MailCheck, ShieldCheck, Users } from 'lucide-react'
import { adminApi } from '../../api/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Badge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { Pagination } from '../../components/ui/Pagination'
import { formatDate, getInitials } from '../../utils/format'

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminApi.users({ page, per_page: 20 }),
    placeholderData: (previous) => previous,
  })

  const users = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta

  const changePage = (nextPage) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage > 1) next.set('page', String(nextPage))
    else next.delete('page')
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <AdminPageHeader
        title="Pengguna"
        description="Daftar akun yang terdaftar di toko beserta perannya."
        action={
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-ink-500">
            <Users className="h-4 w-4 text-brand-600" />
            {meta ? `${meta.total} akun` : 'Memuat…'}
          </div>
        }
      />

      <div className="card-surface mt-6 overflow-hidden">
        {usersQuery.isError ? (
          <div className="p-5">
            <ErrorState message={usersQuery.error?.response?.data?.message} onRetry={() => usersQuery.refetch()} />
          </div>
        ) : usersQuery.isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={8} />
          </div>
        ) : users.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Users} title="Belum ada pengguna" description="Akun pelanggan akan muncul setelah registrasi." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-bold">Pengguna</th>
                  <th className="px-3 py-3 font-bold">Email</th>
                  <th className="px-3 py-3 font-bold">Peran</th>
                  <th className="px-5 py-3 text-right font-bold">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {getInitials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900">{user.name}</p>
                          <p className="text-[11px] text-ink-400">ID #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
                        <MailCheck className="h-3.5 w-3.5 text-ink-300" /> {user.email}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {user.role === 'admin' ? (
                        <Badge tone="bg-brand-50 text-brand-700 ring-brand-200">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge tone="bg-slate-100 text-slate-600 ring-slate-200">Pelanggan</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-ink-500">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Pagination page={meta?.page ?? page} totalPages={meta?.total_pages ?? 1} onChange={changePage} />
        {meta && meta.total > 0 && (
          <p className="text-xs text-ink-400">Menampilkan {users.length} dari {meta.total} pengguna</p>
        )}
      </div>
    </div>
  )
}
