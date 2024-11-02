import { createClient, newSignatureProvider } from 'postchain-client';
import dotenv from 'dotenv';

dotenv.config();

const rods = [
  {
    name: 'Basic Rod',
    description: 'A basic fishing rod',
    image: 'https://cdn-icons-png.flaticon.com/512/6171/6171741.png',
  },
];

const fishes = [
  {
    name: 'Basic Fish',
    description: 'A basic fish',
    image: 'https://cdn-icons-png.flaticon.com/512/3075/3075494.png',
  },
];

const armors = [
  {
    name: 'Basic Armor',
    slot: 'chest',
    description: 'A basic armor',
    image: 'https://cdn-icons-png.flaticon.com/512/674/674203.png',
    weight: 5,
    defense: 5,
  },
  {
    name: 'Luxury Armor',
    slot: 'chest',
    description: 'A luxury armor',
    image: 'https://cdn-icons-png.flaticon.com/512/1907/1907813.png',
    weight: 3,
    defense: 10,
  },
];

const weapons = [
  {
    name: 'Basic Weapon',
    slot: 'weapon',
    description: 'A basic weapon',
    image: 'https://cdn-icons-png.flaticon.com/512/8615/8615992.png',
    weight: 5,
    damage: 5,
  },
  {
    name: 'Luxury Weapon',
    slot: 'weapon',
    description: 'A luxury weapon',
    image: 'https://cdn-icons-png.flaticon.com/512/993/993619.png',
    weight: 3,
    damage: 10,
  },
];

async function main() {
  const client = await createClient({
    directoryNodeUrlPool: process.env.NEXT_PUBLIC_DIRECTORY_NODE_URL_POOL,
    blockchainRid: process.env.NEXT_PUBLIC_BLOCKCHAIN_RID,
  });

  const privKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privKey) {
    throw new Error('ADMIN_PRIVATE_KEY is not set');
  }

  const signatureProvider = newSignatureProvider({ privKey });

  await client.signAndSendUniqueTransaction({
    operations: rods.map((d) => ({
      name: 'fishing.define_fishing_rod',
      args: [d.name, d.description, d.image],
    })),
    signers: [signatureProvider.pubKey],
  }, signatureProvider);

  console.log('Fishing rods defined');

  await client.signAndSendUniqueTransaction({
    operations: fishes.map((d) => ({
      name: 'fishing.define_fish',
      args: [d.name, d.description, d.image],
    })),
    signers: [signatureProvider.pubKey],
  }, signatureProvider);

  console.log('Fishes defined');

  await client.signAndSendUniqueTransaction({
    operations: armors.map((d) => ({
      name: 'equipments.register_armor',
      args: [d.name, d.slot, d.image, d.description, d.weight, d.defense],
    })),
    signers: [signatureProvider.pubKey],
  }, signatureProvider);

  console.log('Armors defined');

  await client.signAndSendUniqueTransaction({
    operations: weapons.map((d) => ({
      name: 'equipments.register_weapon',
      args: [d.name, d.slot, d.image, d.description, d.weight, d.damage],
    })),
    signers: [signatureProvider.pubKey],
  }, signatureProvider);

  console.log('Weapons defined');
}

main();
