use crate::error::PluginError;
use crate::gpl_shared::compose::{resolve_input_voter_weight, VoterWeightRecordBase};
use crate::gpl_shared::generic_voter_weight::GenericVoterWeight;
use crate::state::*;
use anchor_lang::prelude::*;
use std::cmp::max;

impl<'a> VoterWeightRecordBase<'a> for VoterWeightRecord {
    fn get_governing_token_mint(&'a self) -> &'a Pubkey {
        &self.governing_token_mint
    }

    fn get_governing_token_owner(&'a self) -> &'a Pubkey {
        &self.governing_token_owner
    }
}

/// Updates VoterWeightRecord to evaluate governance power for non voting use cases: CreateProposal, CreateGovernance etc...
/// This instruction updates VoterWeightRecord which is valid for the current Slot and the given target action only
/// and hence the instruction has to be executed inside the same transaction as the corresponding spl-gov instruction
#[derive(Accounts)]
#[instruction()]
pub struct UpdateVoterWeightRecord<'info> {
    /// The quadratic plugin Registrar
    pub registrar: Account<'info, Registrar>,

    /// An account that is either of type TokenOwnerRecordV2 or VoterWeightRecord
    /// depending on whether the registrar includes a predecessor or not
    /// CHECK: Checked in the code depending on the registrar
    #[account()]
    pub input_voter_weight: UncheckedAccount<'info>,

    #[account(
    mut,
    constraint = voter_weight_record.realm == registrar.realm
    @ PluginError::InvalidVoterWeightRecordRealm,

    constraint = voter_weight_record.governing_token_mint == registrar.governing_token_mint
    @ PluginError::InvalidVoterWeightRecordMint,
    )]
    pub voter_weight_record: Account<'info, VoterWeightRecord>,
}

/// Adapts the weight of from the predecessor
pub fn update_voter_weight_record(ctx: Context<UpdateVoterWeightRecord>) -> Result<()> {
    let voter_weight_record = &mut ctx.accounts.voter_weight_record;

    let input_voter_weight_account = ctx.accounts.input_voter_weight.to_account_info();

    let clone_record = voter_weight_record.clone();
    let input_voter_weight_record = resolve_input_voter_weight(
        &input_voter_weight_account,
        &clone_record,
        &ctx.accounts.registrar,
    )?;

    // 10 power for each token
    let output_voter_weight = input_voter_weight_record.get_voter_weight() * 10;

    msg!(
        "input weight: {}. output weight {}.",
        input_voter_weight_record.get_voter_weight(),
        output_voter_weight,
    );
    voter_weight_record.voter_weight = output_voter_weight;

    // If the input voter weight record has an expiry, use the max between that and the current slot
    // Otherwise use the current slot
    let current_slot = Clock::get()?.slot;
    voter_weight_record.voter_weight_expiry =
        input_voter_weight_record.get_voter_weight_expiry().map_or(
            Some(current_slot), // no previous expiry, use current slot
            |previous_expiry| Some(max(previous_expiry, current_slot)),
        );

    Ok(())
}
