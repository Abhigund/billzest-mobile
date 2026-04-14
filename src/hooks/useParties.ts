import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partiesService } from '../supabase/partiesService';
import { Party } from '../types/domain';
import { useOrganization } from '../contexts/OrganizationContext';
import { PARTY_QUERY_KEYS } from '../logic/partyLogic';

export const useParties = (type?: Party['type']) => {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: PARTY_QUERY_KEYS.list(organizationId || '', type),
    queryFn: () => partiesService.getParties(organizationId!, type),
    enabled: !!organizationId,
  });
};

export const usePartyMutations = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  const createParty = useMutation({
    mutationFn: (
      input: Omit<
        Party,
        'id' | 'created_at' | 'updated_at' | 'organization_id'
      >,
    ) => {
      if (!organizationId) throw new Error('No organization context');
      return partiesService.createParty(organizationId, input);
    },
    onSuccess: () => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: PARTY_QUERY_KEYS.all(organizationId),
        });
      }
    },
  });

  const updateParty = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Party> }) => {
      if (!organizationId) throw new Error('No organization context');
      return partiesService.updateParty(id, updates);
    },
    onSuccess: (data) => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: PARTY_QUERY_KEYS.all(organizationId),
        });
        queryClient.invalidateQueries({
          queryKey: PARTY_QUERY_KEYS.detail(organizationId, data.id),
        });
      }
    },
  });

  const deleteParty = useMutation({
    mutationFn: partiesService.deleteParty,
    onSuccess: (_, id) => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: PARTY_QUERY_KEYS.all(organizationId),
        });
        queryClient.invalidateQueries({
          queryKey: PARTY_QUERY_KEYS.detail(organizationId, id),
        });
      }
    },
  });

  return {
    createParty,
    updateParty,
    deleteParty,
  };
};
