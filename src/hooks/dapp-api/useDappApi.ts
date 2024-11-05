import { useChromia } from '@/lib/chromia-connect/chromia-context';
import { nop, op } from '@chromia/ft4';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BaseToken, FishingRod, Pfp } from './types';
import { convertIpfsToGatewayUrl } from '@/lib/utils';
import { createMegaYoursClient, performCrossChainTransfer } from '@megayours/sdk';
import { createClient, FailoverStrategy } from 'postchain-client';

export function useEquippedPfp() {
  const { chromiaSession, chromiaClient, authStatus } = useChromia();

  return useQuery({
    queryKey: ['get_equipped_pfp'],
    queryFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      const pfp = await chromiaSession.query<Pfp>('pfps.get_equipped', {
        account_id: chromiaSession.account.id,
      });

      console.log(`equipped for account ${chromiaSession.account.id.toString('hex')}:`, pfp);

      if (!pfp) return null;
      
      return {
        ...pfp,
        image: convertIpfsToGatewayUrl(pfp.image)
      };
    },
    enabled: Boolean(chromiaClient) && Boolean(chromiaSession) && authStatus === 'connected',
  });
}

export function useAllPfps() {
  const { chromiaSession, chromiaClient, authStatus } = useChromia();

  return useQuery({
    queryKey: ['all_pfps'],
    queryFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      const avatars = await chromiaSession.query<Pfp[]>('pfps.get_all', {
        account_id: chromiaSession.account.id,
      });
      
      return avatars.map(avatar => ({
        ...avatar,
        image: convertIpfsToGatewayUrl(avatar.image)
      }));
    },
    enabled: Boolean(chromiaClient) && Boolean(chromiaSession) && authStatus === 'connected',
  });
}

export function useAllFishingRods() {
  const { chromiaSession, chromiaClient, authStatus } = useChromia();

  return useQuery({
    queryKey: ['all_fishing_rods'],
    queryFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      const rods = await chromiaSession.query<Pfp[]>('fishing.get_rods', {
        account_id: chromiaSession.account.id,
      });
      
      return rods.map(rod => ({
        ...rod,
        image: convertIpfsToGatewayUrl(rod.image)
      }));
    },
    enabled: Boolean(chromiaClient) && Boolean(chromiaSession) && authStatus === 'connected',
  });
}

export function useEquippedFishingRod() {
  const { chromiaSession, chromiaClient, authStatus } = useChromia();

  return useQuery({
    queryKey: ['equipped_fishing_rod'],
    queryFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      const rod = await chromiaSession.query<FishingRod>('fishing.get_equipped_fishing_rod', {
        account_id: chromiaSession.account.id,
      });

      if (!rod) return null;

      return {
        ...rod,
        image: convertIpfsToGatewayUrl(rod.image)
      };
    },
    enabled: Boolean(chromiaClient) && Boolean(chromiaSession) && authStatus === 'connected',
  });
}

export type InventoryItem = BaseToken & {
  amount: number;
}

export function useCaughtFishes() {
  const { chromiaSession, chromiaClient, authStatus } = useChromia();

  return useQuery({
    queryKey: ['caught_fishes'],
    queryFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      const fishes = await chromiaSession.query<InventoryItem[]>('fishing.get_caught_fishes', {
        account_id: chromiaSession.account.id,
      });

      return fishes.map(fish => ({
        ...fish,
        image: convertIpfsToGatewayUrl(fish.image)
      }));
    },
    enabled: Boolean(chromiaClient) && Boolean(chromiaSession) && authStatus === 'connected',
  });
}

export function useBuyFishingRod() {
  const { chromiaSession, chromiaClient } = useChromia();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      await chromiaSession.transactionBuilder()
        .add(op('fishing.buy_fishing_rod', "Basic Rod"))
        .add(nop())
        .buildAndSend();
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful mutation
      queryClient.invalidateQueries({ queryKey: ['all_fishing_rods'] });
    },
  });
}

export function useEquipFishingRod() {
  const { chromiaSession, chromiaClient } = useChromia();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ project, collection, id }: { project: string, collection: string, id: number }) => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      await chromiaSession.transactionBuilder()
        .add(op('fishing.equip_fishing_rod', project, collection, id))
        .add(nop())
        .buildAndSend();
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful mutation
      queryClient.invalidateQueries({ queryKey: ['all_fishing_rods', 'equipped_fishing_rod'] });
    },
  });
}

export function useUnequipFishingRod() {
  const { chromiaSession, chromiaClient } = useChromia();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      await chromiaSession.transactionBuilder()
        .add(op('fishing.unequip_fishing_rod'))
        .add(nop())
        .buildAndSend();
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful mutation
      queryClient.invalidateQueries({ queryKey: ['all_fishing_rods', 'equipped_fishing_rod'] });
    },
  });
}

export function usePullFishingRod() {
  const { chromiaSession, chromiaClient } = useChromia();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      await chromiaSession.transactionBuilder()
        .add(op('fishing.pull'))
        .add(nop())
        .buildAndSend();
    },
    onSuccess: () => {
      // Force refetch all relevant queries after successful pull
      queryClient.invalidateQueries({ 
        queryKey: ['caught_fishes'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: ['armor'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: ['weapons'],
        refetchType: 'active',
      });
    },
  });
}

export type Equipment = BaseToken & {
  slot: string;
  weight: number;
  description: string;
}

export type Armor = Equipment & {
  defense: number;
}

export type Weapon = Equipment & {
  damage: number;
}

export function useArmor(slot: string = 'all') {
  const { chromiaSession, chromiaClient, authStatus } = useChromia();

  return useQuery({
    queryKey: ['armor', slot],
    queryFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      const armor = await chromiaSession.query<Armor[]>('equipments.get_armor', {
        account_id: chromiaSession.account.id,
        slot
      });
      
      return armor.map(piece => ({
        ...piece,
        image: convertIpfsToGatewayUrl(piece.image)
      }));
    },
    enabled: Boolean(chromiaClient) && Boolean(chromiaSession) && authStatus === 'connected',
  });
}

export function useWeapons() {
  const { chromiaSession, chromiaClient, authStatus } = useChromia();

  return useQuery({
    queryKey: ['weapons'],
    queryFn: async () => {
      if (!chromiaClient || !chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      const weapons = await chromiaSession.query<Weapon[]>('equipments.get_weapon', {
        account_id: chromiaSession.account.id
      });
      
      return weapons.map(weapon => ({
        ...weapon,
        image: convertIpfsToGatewayUrl(weapon.image)
      }));
    },
    enabled: Boolean(chromiaClient) && Boolean(chromiaSession) && authStatus === 'connected',
  });
}


export function useCrosschainTransfer() {
  const { chromiaSession } = useChromia();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ project, collection, id, amount }: { project: string, collection: string, id: number, amount: number }) => {
      if (!chromiaSession) {
        throw new Error('Not connected to Chromia');
      }

      const megaClient = createMegaYoursClient(chromiaSession);

      const targetChain = await createClient({
        directoryNodeUrlPool: process.env.NEXT_PUBLIC_DIRECTORY_NODE_URL_POOL,
        blockchainRid: process.env.NEXT_PUBLIC_BATTLE_DAPP_BLOCKCHAIN_RID,
        failOverConfig: {
          attemptsPerEndpoint: 20,
          strategy: FailoverStrategy.TryNextOnError,
        }
      });

      await megaClient.transferCrosschain(targetChain, chromiaSession.account.id, project, collection, id, amount);
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful mutation
      queryClient.invalidateQueries({ 
        queryKey: [
          'armor',
          'weapons'
        ] 
      });
    },
  });
}