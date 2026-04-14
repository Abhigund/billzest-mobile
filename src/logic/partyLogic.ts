import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partiesService } from '../supabase/partiesService';
import {
  partyBalanceService,
  CustomerFinancialSummary,
} from '../supabase/partyBalanceService';
import { Party } from '../types/domain';
import { useOrganization } from '../contexts/OrganizationContext';

export const CLIENT_QUERY_KEYS = {
  clients: (orgId: string) => ['parties', orgId, 'customers'],
  suppliers: (orgId: string) => ['parties', orgId, 'suppliers'],
  all: (orgId: string) => ['parties', orgId, 'all'],
  customerSummary: (orgId: string, clientId: string) => [
    'party-summary',
    orgId,
    clientId,
  ],
};

export const useClients = () => {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.clients(organizationId || ''),
    queryFn: () => partiesService.getParties(organizationId!, 'customer'),
    enabled: !!organizationId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });
};

export const useSuppliers = () => {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.suppliers(organizationId || ''),
    queryFn: () => partiesService.getParties(organizationId!, 'vendor'), // Matches 'vendor' or 'supplier' logic in db, assume vendor
    enabled: !!organizationId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });
};

export const useClientMutations = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  const createClient = useMutation({
    mutationFn: (
      client: Omit<
        Party,
        'id' | 'organization_id' | 'created_at' | 'updated_at'
      >,
    ) => partiesService.createParty(organizationId!, client),
    onSuccess: () => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: ['parties', organizationId],
        });
      }
    },
  });

  const updateClient = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Omit<Party, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
      >;
    }) => partiesService.updateParty(id, updates),
    onSuccess: () => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: ['parties', organizationId],
        });
      }
    },
  });

  const deleteClient = useMutation({
    mutationFn: (id: string) => partiesService.deleteParty(id),
    onSuccess: () => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: ['parties', organizationId],
        });
      }
    },
  });

  const recordPayment = useMutation({
    mutationFn: (payload: {
      party_id: string;
      amount: number;
      description: string;
      reference_number?: string;
    }) =>
      partyBalanceService.recordCreditTransaction(organizationId!, {
        ...payload,
        type: 'received',
      }),
    onSuccess: (_, variables) => {
      if (organizationId) {
        // Invalidate the generic parties list
        queryClient.invalidateQueries({
          queryKey: ['parties', organizationId],
        });
        // Invalidate the specific customer summary/balance
        queryClient.invalidateQueries({
          queryKey: CLIENT_QUERY_KEYS.customerSummary(
            organizationId,
            variables.party_id,
          ),
        });
      }
    },
  });

  return { createClient, updateClient, deleteClient, recordPayment };
};

export const useCustomerFinancialSummary = (clientId?: string) => {
  const { organizationId } = useOrganization();
  return useQuery<CustomerFinancialSummary>({
    queryKey: clientId
      ? CLIENT_QUERY_KEYS.customerSummary(organizationId || '', clientId)
      : ['party-summary', 'none'],
    queryFn: () =>
      organizationId && clientId
        ? partyBalanceService.getCustomerFinancialSummary(
            organizationId,
            clientId,
          )
        : Promise.resolve({
            totalBilled: 0,
            totalPaid: 0,
            outstanding: 0,
            orderCount: 0,
            lastOrderDate: null,
          }),
    enabled: !!organizationId && !!clientId,
  });
};

/**
 * Hook to fetch a single party's details by ID.
 */
export const useParty = (partyId?: string) => {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: ['party', organizationId, partyId],
    queryFn: () => (partyId ? partiesService.getPartyById(partyId) : null),
    enabled: !!organizationId && !!partyId,
  });
};

/**
 * Hook to fetch a customer's financial balance summary.
 * Alias for useCustomerFinancialSummary with a more descriptive name.
 */
export const usePartyBalance = (partyId?: string) => {
  return useCustomerFinancialSummary(partyId);
};

