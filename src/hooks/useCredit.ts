import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  creditService,
  CreateCreditTransactionDTO,
  CreditTransaction,
} from '../services/creditService';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  partyBalanceService,
  PartyLedgerSummary,
} from '../supabase/partyBalanceService';
import { PARTY_QUERY_KEYS } from '../logic/partyLogic';

export const useCreditTransactions = (partyId: string) => {
  const { organizationId } = useOrganization();
  return useQuery<CreditTransaction[]>({
    queryKey: ['credit_transactions', organizationId, partyId],
    queryFn: () => creditService.getTransactions(organizationId!, partyId),
    enabled: !!partyId && !!organizationId,
  });
};

export const useAddCreditTransaction = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (
      transaction: Omit<CreateCreditTransactionDTO, 'organization_id'>,
    ) => {
      if (!organizationId) throw new Error('Organization not set');

      return creditService.addTransaction({
        ...transaction,
        organization_id: organizationId,
      });
    },
    onSuccess: (_, variables) => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: ['credit_transactions', organizationId, variables.party_id],
        });
        // Invalidate party ledger
        queryClient.invalidateQueries({
          queryKey: ['party_ledger', organizationId, variables.party_id],
        });
        // Also invalidate party list to refresh balances
        queryClient.invalidateQueries({
          queryKey: PARTY_QUERY_KEYS.all(organizationId),
        });
        // Invalidate specific party detail if cached
        queryClient.invalidateQueries({
          queryKey: PARTY_QUERY_KEYS.detail(organizationId, variables.party_id),
        });
      }
      // Invalidate invoices/payments too as they are modified
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

export const usePartyLedger = (partyId: string) => {
  const { organizationId } = useOrganization();
  return useQuery<PartyLedgerSummary>({
    queryKey: ['party_ledger', organizationId, partyId],
    queryFn: () => partyBalanceService.getPartyLedger(organizationId!, partyId),
    enabled: !!partyId && !!organizationId,
  });
};
