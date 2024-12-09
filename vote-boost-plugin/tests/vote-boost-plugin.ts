import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createMint,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { GovernanceConfig, SplGovernance } from "governance-idl-sdk";
import { VoteBoostPlugin } from "../target/types/vote_boost_plugin";

describe("vote-boost-plugin", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = anchor.Wallet.local();

  const pluginProgram = anchor.workspace
    .VoteBoostPlugin as Program<VoteBoostPlugin>;

  const connection = pluginProgram.provider.connection;

  const governanceProgramId = new PublicKey(
    "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
  );
  const DISABLED_VOTER_WEIGHT = new anchor.BN("1");

  const splGovernance = new SplGovernance(connection);

  let governingToken: PublicKey;
  let realmId: PublicKey;
  let governanceId: PublicKey;
  let registrar: PublicKey;
  let proposalId: PublicKey;
  let tokenOwnerRecordAccount: PublicKey;
  let voterWeightRecordPubkey: PublicKey;
  const proposalSeed = Keypair.generate().publicKey;

  before(async () => {
    governingToken = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      0
    );
  });

  it("Create Realm", async () => {
    const realName = "Test Realm";

    realmId = splGovernance.pda.realmAccount({ name: realName }).publicKey;
    const createRealmIx = await splGovernance.createRealmInstruction(
      realName,
      governingToken,
      DISABLED_VOTER_WEIGHT,
      wallet.publicKey,
      undefined,
      undefined,
      undefined,
      undefined,
      pluginProgram.programId
    );
    const createRealmTxSig = await createAndConfirmTransaction(
      connection,
      [createRealmIx],
      wallet.payer
    );
    console.log(`✅ Realm created! Transaction Signature: ${createRealmTxSig}`);
  });

  it("Create Governance", async () => {
    // Deposit Governing Token for each signer
    const depositGovTokenIx =
      await splGovernance.depositGoverningTokensInstruction(
        realmId,
        governingToken,
        governingToken,
        wallet.publicKey,
        wallet.publicKey,
        wallet.publicKey,
        1
      );
    const depositGovTokenTxSig = await createAndConfirmTransaction(
      connection,
      [depositGovTokenIx],
      wallet.payer
    );
    console.log(
      `✅ Governing Token Deposited! Transaction Signature: ${depositGovTokenTxSig}`
    );

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

    governanceId = splGovernance.pda.governanceAccount({
      realmAccount: realmId,
      seed: realmId,
    }).publicKey;

    const createGovernanceIx = await splGovernance.createGovernanceInstruction(
      governanceConfig,
      realmId,
      wallet.publicKey,
      undefined,
      wallet.publicKey,
      realmId
    );

    const createGovernanceTxSig = await createAndConfirmTransaction(
      connection,
      [createGovernanceIx],
      wallet.payer
    );
    console.log(
      `✅ Governance created! Transaction Signature: ${createGovernanceTxSig}`
    );
  });

  it("Create registrar", async () => {
    [registrar] = PublicKey.findProgramAddressSync(
      [Buffer.from("registrar"), realmId.toBuffer(), governingToken.toBuffer()],
      pluginProgram.programId
    );

    const registrarTx = await pluginProgram.methods
      .createRegistrar(false)
      .accountsStrict({
        registrar,
        governanceProgramId,
        realm: realmId,
        governingTokenMint: governingToken,
        realmAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed" });

    console.log(`✅ Registrar created! Transaction Signature: ${registrarTx}`);
  });

  it("Create voter weight record", async () => {
    const voterWeightRecordTx = await pluginProgram.methods
      .createVoterWeightRecord(wallet.publicKey)
      .accounts({
        registrar,
      })
      .rpc({ commitment: "confirmed" });

    console.log(
      `✅ Voter Weight Record created! Transaction Signature: ${voterWeightRecordTx}`
    );
  });

  it("Create proposal", async () => {
    proposalId = splGovernance.pda.proposalAccount({
      governanceAccount: governanceId,
      governingTokenMint: governingToken,
      proposalSeed,
    }).publicKey;

    tokenOwnerRecordAccount = splGovernance.pda.tokenOwnerRecordAccount({
      realmAccount: realmId,
      governingTokenMintAccount: governingToken,
      governingTokenOwner: wallet.publicKey,
    }).publicKey;

    [voterWeightRecordPubkey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("voter-weight-record"),
        realmId.toBuffer(),
        governingToken.toBuffer(),
        wallet.publicKey.toBuffer(),
      ],
      pluginProgram.programId
    );

    const createProposalIx = await splGovernance.createProposalInstruction(
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

    const signOffProposalIx = await splGovernance.signOffProposalInstruction(
      realmId,
      governanceId,
      proposalId,
      wallet.publicKey,
      tokenOwnerRecordAccount
    );

    const updateVoterWeightRecordIx = await pluginProgram.methods
      .updateVoterWeightRecord()
      .accountsStrict({
        registrar,
        voterWeightRecord: voterWeightRecordPubkey,
        inputVoterWeight: tokenOwnerRecordAccount,
      })
      .instruction();

    const ixs = [
      updateVoterWeightRecordIx,
      createProposalIx,
      signOffProposalIx,
    ];

    const createProposalSig = await createAndConfirmTransaction(
      connection,
      ixs,
      wallet.payer
    );
    console.log(
      `✅ Proposal created! Transaction Signature: ${createProposalSig}`
    );
  });

  it("Cast vote", async () => {
    const castVoteIx = await splGovernance.castVoteInstruction(
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

    const castVoteSig = await createAndConfirmTransaction(
      connection,
      [castVoteIx],
      wallet.payer
    );
    console.log(`✅ Vote cast! Transaction Signature: ${castVoteSig}`);
  });
});

async function createAndConfirmTransaction(
  connection: Connection,
  ixs: TransactionInstruction[],
  payer: Signer
) {
  const recentBlockhash = await connection.getLatestBlockhash({
    commitment: "confirmed",
  });

  const txMessage = new TransactionMessage({
    payerKey: payer.publicKey,
    instructions: ixs,
    recentBlockhash: recentBlockhash.blockhash,
  }).compileToV0Message();

  const tx = new VersionedTransaction(txMessage);
  tx.sign([payer]);

  const sig = await connection.sendTransaction(tx);

  await connection.confirmTransaction(
    {
      signature: sig,
      blockhash: recentBlockhash.blockhash,
      lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
    },
    "confirmed"
  );

  return sig;
}

async function airdropSol(
  connection: Connection,
  wallet: Signer,
  amount: number
) {
  const tx = await connection.requestAirdrop(
    wallet.publicKey,
    amount * LAMPORTS_PER_SOL
  );

  await connection.confirmTransaction(tx);
}
