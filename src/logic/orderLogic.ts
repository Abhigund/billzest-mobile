import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ordersService,
  OrderWithParty,
  OrderWithItems,
  CreateOrderPayload,
  UpdateOrderPayload,
} from '../supabase/ordersService';
import { paymentsService } from '../supabase/paymentsService';
import { useOrganization } from '../contexts/OrganizationContext';

export const ORDER_QUERY_KEYS = {
  list: (orgId: string, search?: string, status?: string) => [
    'orders',
    orgId,
    { search, status },
  ],
  detail: (orgId: string, id: string) => ['order', orgId, id],
};

export const useOrders = (search?: string, status?: string) => {
  const { organizationId } = useOrganization();
  return useQuery<OrderWithParty[]>({
    queryKey: ORDER_QUERY_KEYS.list(organizationId || '', search, status),
    queryFn: () =>
      ordersService.listOrders(organizationId!, { search, status }),
    enabled: !!organizationId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });
};

export const useOrderDetail = (id?: string) => {
  const { organizationId } = useOrganization();
  return useQuery<OrderWithItems | null>({
    queryKey: id
      ? ORDER_QUERY_KEYS.detail(organizationId || '', id)
      : ['order', 'none'],
    queryFn: () =>
      id ? ordersService.getOrderById(id) : Promise.resolve(null),
    enabled: !!organizationId && !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      ordersService.createOrder(organizationId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock decreased
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrderPayload) =>
      ordersService.updateOrder(payload.orderId, payload.order, payload.items),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string; status: string }) =>
      ordersService.updateOrderStatus(params.orderId, params.status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
};

export const useRecordOrderPayment = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      orderId: string;
      amount: number;
      paymentMethod?: string;
    }) => {
      const payment = await paymentsService.createPayment({
        organization_id: organizationId!,
        order_id: params.orderId,
        amount: params.amount,
        payment_method: params.paymentMethod || 'cash',
        payment_flow: 'IN',
        reference_type: 'ORDER',
        reference_id: params.orderId,
      });

      await ordersService.updateOrderStatus(params.orderId, 'paid');
      return payment;
    },
    onSuccess: (_payment, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['party-summary'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: (id: string) => ordersService.cancelOrder(organizationId!, id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock restored
    },
  });
};
