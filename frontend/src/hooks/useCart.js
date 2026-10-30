import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { cartApi } from '../api/cart'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { getErrorMessage } from '../utils/errors'

export function useCart() {
  const accessToken = useAuthStore((state) => state.accessToken)
  return useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    enabled: Boolean(accessToken),
    staleTime: 30 * 1000,
  })
}

export function useCartCount() {
  const { data } = useCart()
  return data?.data?.item_count ?? 0
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const accessToken = useAuthStore((state) => state.accessToken)

  const mutation = useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Produk ditambahkan ke keranjang')
    },
    onError: (error) => {
      if (!accessToken) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)
        return
      }
      toast.error(getErrorMessage(error))
    },
  })

  return {
    ...mutation,
    addToCart: (payload, options) => {
      if (!accessToken) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)
        return
      }
      mutation.mutate(payload, options)
    },
  }
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, quantity }) => cartApi.updateItem(productId, quantity),
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previous = queryClient.getQueryData(['cart'])
      queryClient.setQueryData(['cart'], (old) => {
        if (!old?.data?.items) return old
        const items = old.data.items.map((item) =>
          item.product_id === productId ? { ...item, quantity, subtotal: item.price * quantity } : item,
        )
        return {
          ...old,
          data: {
            ...old.data,
            items,
            item_count: items.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          },
        }
      })
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['cart'], context.previous)
      toast.error(getErrorMessage(error))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId) => cartApi.removeItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Item dihapus dari keranjang')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
