#!/usr/bin/env node

import { PushChain } from '@pushchain/core';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, toUtf8Bytes } from 'ethers';

const USAGE = `Usage:
  node scripts/grant-powerup-roles-universal.mjs --contract <address> --signer <address> --admin-key <privateKey> [--rpc <rpcUrl>] [--network <pushNetwork>]

Defaults:
  rpcUrl   = https://evm.rpc-testnet-donut-node1.push.org/
  network  = testnet

Example:
  node scripts/grant-powerup-roles-universal.mjs \\
    --contract 0xC76375B72D719a1F7C54114aa7943889bc27c33A \\
    --signer   0xa5526DF9eB2016D3624B4DC36a91608797B5b6d5 \\
    --admin-key 0x...`;

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const value = args[i + 1];

    if (!key.startsWith('--')) continue;
    if (!value || value.startsWith('--')) {
      console.error(`Missing value for ${key}`);
      console.error(USAGE);
      process.exit(1);
    }

    switch (key) {
      case '--contract':
        parsed.contract = value;
        break;
      case '--signer':
        parsed.signer = value;
        break;
      case '--admin-key':
        parsed.adminKey = value;
        break;
      case '--rpc':
        parsed.rpc = value;
        break;
      case '--network':
        parsed.network = value.toLowerCase();
        break;
      default:
        console.warn(`Ignoring unknown argument: ${key}`);
    }

    i += 1;
  }

  parsed.contract ||= process.env.POWERUP_CONTRACT_ADDRESS;
  parsed.signer ||= process.env.POWERUP_SIGNER_ADDRESS;
  parsed.adminKey ||= process.env.POWERUP_ADMIN_PRIVATE_KEY;
  parsed.rpc ||= process.env.POWERUP_RPC_URL || 'https://evm.rpc-testnet-donut-node1.push.org/';
  parsed.network ||= process.env.PUSHCHAIN_NETWORK || 'testnet';

  if (!parsed.contract || !parsed.signer || !parsed.adminKey) {
    console.error('Missing required parameters.');
    console.error(USAGE);
    process.exit(1);
  }

  return parsed;
}

function resolveNetwork(network) {
  switch (network) {
    case 'mainnet':
      return PushChain.CONSTANTS.PUSH_NETWORK.MAINNET;
    case 'devnet':
    case 'dev':
      return PushChain.CONSTANTS.PUSH_NETWORK.DEVNET;
    case 'testnet':
    default:
      return PushChain.CONSTANTS.PUSH_NETWORK.TESTNET;
  }
}

function encodeGrantRole(role, signer) {
  return PushChain.utils.helpers.encodeTxData({
    abi: [
      {
        type: 'function',
        name: 'grantRole',
        stateMutability: 'nonpayable',
        inputs: [
          { internalType: 'bytes32', name: 'role', type: 'bytes32' },
          { internalType: 'address', name: 'account', type: 'address' },
        ],
        outputs: [],
      },
    ],
    functionName: 'grantRole',
    args: [role, signer],
  });
}

async function sendGrant(pushChainClient, to, role, signer, label) {
  const data = encodeGrantRole(role, signer);

  console.log(`⏳ Granting ${label}...`);
  const txResponse = await pushChainClient.universal.sendTransaction({
    to,
    data,
    value: 0n,
  });

  console.log(`   ↳ submitted tx: ${txResponse.hash}`);
  const receipt = await txResponse.wait(1);
  console.log(`✅ ${label} granted in block ${receipt.blockNumber}`);
}

async function main() {
  const { contract, signer, adminKey, rpc, network } = parseArgs();

  console.log('🚀 Granting power-up roles via universal tx');
  console.log(`   Contract: ${contract}`);
  console.log(`   Signer:   ${signer}`);
  console.log(`   AdminPK:  ${adminKey.slice(0, 8)}…`);
  console.log(`   RPC:      ${rpc}`);
  console.log(`   Network:  ${network}`);

  const account = privateKeyToAccount(adminKey);
  const walletClient = createWalletClient({
    account,
    transport: http(rpc),
  });

  const universalSigner = await PushChain.utils.signer.toUniversal(walletClient);
  const pushChainClient = await PushChain.initialize(universalSigner, {
    network: resolveNetwork(network),
  });

  const MINTER_ROLE = keccak256(toUtf8Bytes('MINTER_ROLE'));
  const GAME_ROLE = keccak256(toUtf8Bytes('GAME_ROLE'));

  await sendGrant(pushChainClient, contract, MINTER_ROLE, signer, 'MINTER_ROLE');
  await sendGrant(pushChainClient, contract, GAME_ROLE, signer, 'GAME_ROLE');

  console.log('🎉 All roles granted successfully');
}

main().catch((error) => {
  console.error('❌ Failed to grant roles:', error);
  process.exit(1);
});
