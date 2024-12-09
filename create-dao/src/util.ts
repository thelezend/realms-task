import {
  TransactionMessage,
  VersionedTransaction,
  type Connection,
  type Signer,
  type TransactionInstruction,
} from "@solana/web3.js";

export async function sendV0Transaction(
  connection: Connection,
  ixs: TransactionInstruction[],
  signers: Signer[]
) {
  const recentBlockhash = await connection.getLatestBlockhash({
    commitment: "confirmed",
  });

  const txMessage = new TransactionMessage({
    payerKey: signers[0].publicKey,
    instructions: ixs,
    recentBlockhash: recentBlockhash.blockhash,
  }).compileToV0Message();

  const tx = new VersionedTransaction(txMessage);
  tx.sign(signers);

  const sig = await connection.sendTransaction(tx, {
    preflightCommitment: "confirmed",
  });
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
