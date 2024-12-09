import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { SplGovernance, type GovernanceConfig } from "governance-idl-sdk";
import { COMMUNITY_MINT, GOVERNANCE_PROGRAM_ID } from "./constants";
import {
  getVoteBoostProgram as getPluginProgram,
  VOTE_BOOST_PROGRAM_ID as PLUGIN_PROGRAM_ID,
} from "./program-export";
import { sendV0Transaction } from "./util";
import devWalletKey from "/Users/navaneeth/.config/solana/id.json";

const realmName = "Lezend's Test DAO";

const wallet = Keypair.fromSecretKey(Uint8Array.from(devWalletKey));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(wallet),
  {
    commitment: "confirmed",
  }
);
const pluginProgram = getPluginProgram(provider);

const splGovernance = new SplGovernance(connection);
const governingToken = COMMUNITY_MINT;
const governingTokenAta = getAssociatedTokenAddressSync(
  governingToken,
  wallet.publicKey
);
const DISABLED_VOTER_WEIGHT = new anchor.BN("1");
const proposalSeed = Keypair.generate().publicKey;

// PDAs & Accounts
const realmId = splGovernance.pda.realmAccount({ name: realmName }).publicKey;
const governanceId = splGovernance.pda.governanceAccount({
  realmAccount: realmId,
  seed: realmId,
}).publicKey;
const tokenOwnerRecordAccount = splGovernance.pda.tokenOwnerRecordAccount({
  realmAccount: realmId,
  governingTokenMintAccount: governingToken,
  governingTokenOwner: wallet.publicKey,
}).publicKey;
const [registrar] = PublicKey.findProgramAddressSync(
  [Buffer.from("registrar"), realmId.toBuffer(), governingToken.toBuffer()],
  PLUGIN_PROGRAM_ID
);
const [voterWeightRecordPubkey] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("voter-weight-record"),
    realmId.toBuffer(),
    governingToken.toBuffer(),
    wallet.publicKey.toBuffer(),
  ],
  PLUGIN_PROGRAM_ID
);
const proposalId = splGovernance.pda.proposalAccount({
  governanceAccount: governanceId,
  governingTokenMint: governingToken,
  proposalSeed,
}).publicKey;

async function main() {
  try {
    let ixs = [];
    ixs.push(await createRealmIx());
    ixs.push(await depositGovTokenIx());
    ixs.push(await createGovernanceIx());
    ixs.push(await createRegistrarIx());
    let tx = await sendV0Transaction(connection, ixs, [wallet]);
    console.log(
      `✅ ${realmName} & Governance created! Transaction Signature: ${tx}`
    );
  } catch (error) {
    console.error("Error creating Realm & Governance");
    throw error;
  }

  try {
    let ixs = [];
    ixs.push(await createVoterWeightRecordIx());
    let tx = await sendV0Transaction(connection, ixs, [wallet]);
    console.log(`✅ Registrar created Transaction Signature: ${tx}`);
  } catch (error) {
    console.error("Error creating Registrar");
    throw error;
  }

  try {
    let ixs = [];
    ixs.push(await updateVoterWeightRecordIx());
    ixs.push(await createProposalIx());
    ixs.push(await signOffProposalIx());
    let tx = await sendV0Transaction(connection, ixs, [wallet]);
    console.log(`✅ Proposal created! Transaction Signature: ${tx}`);
  } catch (error) {
    console.error("Error creating Proposal:", error);
  }

  try {
    let ixs = [];
    ixs.push(await updateVoterWeightRecordIx());
    ixs.push(await castVoteIx());
    let tx = await sendV0Transaction(connection, ixs, [wallet]);
    console.log(`✅ Vote cast! Transaction Signature: ${tx}`);
  } catch (error) {
    console.error("Error casting vote:", error);
  }
}

async function createRealmIx() {
  return await splGovernance.createRealmInstruction(
    realmName,
    governingToken,
    DISABLED_VOTER_WEIGHT,
    wallet.publicKey,
    undefined,
    undefined,
    undefined,
    undefined,
    pluginProgram.programId
  );
}

async function depositGovTokenIx() {
  return await splGovernance.depositGoverningTokensInstruction(
    realmId,
    governingToken,
    governingTokenAta,
    wallet.publicKey,
    wallet.publicKey,
    wallet.publicKey,
    1 * 10 ** 6
  );
}

async function createGovernanceIx() {
  // Governance Config
  const governanceConfig: GovernanceConfig = {
    communityVoteThreshold: { yesVotePercentage: [60] },
    minCommunityWeightToCreateProposal: DISABLED_VOTER_WEIGHT,
    minTransactionHoldUpTime: 0,
    // In seconds == 1 day, max time for approving transactions
    votingBaseTime: 86400,
    communityVoteTipping: { disabled: {} },
    // Approval quorum 60% = 2 of 3 to approve transactions
    councilVoteThreshold: { disabled: {} },
    councilVetoVoteThreshold: { disabled: {} },
    // Anybody from the multisig can propose transactions
    minCouncilWeightToCreateProposal: 1,
    councilVoteTipping: { disabled: {} },
    communityVetoVoteThreshold: { disabled: {} },
    votingCoolOffTime: 0,
    depositExemptProposalCount: 254,
  };

  return await splGovernance.createGovernanceInstruction(
    governanceConfig,
    realmId,
    wallet.publicKey,
    undefined,
    wallet.publicKey,
    realmId
  );
}

async function createProposalIx() {
  return await splGovernance.createProposalInstruction(
    "Test Proposal",
    "",
    { choiceType: "single", multiChoiceOptions: null },
    ["Approve"],
    true,
    realmId,
    governanceId,
    tokenOwnerRecordAccount,
    governingToken,
    wallet.publicKey,
    wallet.publicKey,
    proposalSeed,
    voterWeightRecordPubkey
  );
}

async function signOffProposalIx() {
  return await splGovernance.signOffProposalInstruction(
    realmId,
    governanceId,
    proposalId,
    wallet.publicKey,
    tokenOwnerRecordAccount
  );
}

async function createRegistrarIx() {
  return await pluginProgram.methods
    .createRegistrar(false)
    .accountsStrict({
      registrar,
      governanceProgramId: GOVERNANCE_PROGRAM_ID,
      realm: realmId,
      governingTokenMint: governingToken,
      realmAuthority: wallet.publicKey,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

async function createVoterWeightRecordIx() {
  return await pluginProgram.methods
    .createVoterWeightRecord(wallet.publicKey)
    .accountsStrict({
      registrar,
      voterWeightRecord: voterWeightRecordPubkey,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

async function updateVoterWeightRecordIx() {
  return await pluginProgram.methods
    .updateVoterWeightRecord()
    .accountsStrict({
      registrar,
      voterWeightRecord: voterWeightRecordPubkey,
      inputVoterWeight: tokenOwnerRecordAccount,
    })
    .instruction();
}

async function castVoteIx() {
  return await splGovernance.castVoteInstruction(
    { approve: [[{ rank: 0, weightPercentage: 100 }]] },
    realmId,
    governanceId,
    proposalId,
    tokenOwnerRecordAccount,
    tokenOwnerRecordAccount,
    wallet.publicKey,
    governingToken,
    wallet.publicKey,
    voterWeightRecordPubkey
  );
}

main();
