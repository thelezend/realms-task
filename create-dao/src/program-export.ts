import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";
import type { VoteBoostPlugin } from "../idl/vote_boost_plugin";
import VoteBoostPluginIDL from "../idl/vote_boost_plugin.json";

// The programId is imported from the program IDL.
export const VOTE_BOOST_PROGRAM_ID = new web3.PublicKey(
  VoteBoostPluginIDL.address
);

// This is a helper function to get the Vote Boost Anchor program.
export function getVoteBoostProgram(provider: AnchorProvider) {
  return new Program(VoteBoostPluginIDL as VoteBoostPlugin, provider);
}
