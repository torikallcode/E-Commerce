import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export function useMe() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const setUser = useAuthStore((state) => state.setUser)

  const query = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: Boolean(accessToken),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (query.data?.data) {
      setUser(query.data.data)
    }
  }, [query.data, setUser])

  return query
}
