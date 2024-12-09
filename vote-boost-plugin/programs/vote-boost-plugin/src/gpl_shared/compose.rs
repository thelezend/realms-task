use crate::gpl_shared::{
    error::VoterWeightError,
    generic_voter_weight::{GenericVoterWeight, GenericVoterWeightEnum},
};
use anchor_lang::prelude::{Account, Pubkey};
use anchor_lang::{
    error, prelude::AccountInfo, require_eq, AccountDeserialize, AccountSerialize, Owner, Result,
};
use spl_governance::state::token_owner_record::get_token_owner_record_data_for_realm_and_governing_mint;
use spl_governance_tools::account::get_account_data;

pub trait RegistrarBase<'a> {
    fn get_realm(&'a self) -> &'a Pubkey;
    fn get_governance_program_id(&'a self) -> &'a Pubkey;
    fn get_governing_token_mint(&'a self) -> &'a Pubkey;
    fn get_previous_voter_weight_plugin_program_id(&'a self) -> &'a Option<Pubkey>;
}

pub trait VoterWeightRecordBase<'a> {
    fn get_governing_token_mint(&'a self) -> &'a Pubkey;
    fn get_governing_token_owner(&'a self) -> &'a Pubkey;
}

/// Attempt to parse the input account as a VoterWeightRecord or a TokenOwnerRecordV2
pub fn resolve_input_voter_weight<
    'a,
    R: RegistrarBase<'a> + AccountSerialize + AccountDeserialize + Owner + Clone,
    V: VoterWeightRecordBase<'a> + AccountSerialize + AccountDeserialize + Owner + Clone,
>(
    input_account: &'a AccountInfo,
    voter_weight_record_to_update: &'a Account<V>,
    registrar: &'a Account<R>,
) -> Result<GenericVoterWeightEnum> {
    let predecessor_generic_voter_weight_record =
        get_generic_voter_weight_record_data(input_account, registrar)?;

    // ensure that the correct governance token mint is used
    require_eq!(
        voter_weight_record_to_update.get_governing_token_mint(),
        &predecessor_generic_voter_weight_record.get_governing_token_mint(),
        VoterWeightError::InvalidPredecessorVoterWeightRecordGovTokenMint
    );

    // Ensure that the correct governance token owner is used
    require_eq!(
        voter_weight_record_to_update.get_governing_token_owner(),
        &predecessor_generic_voter_weight_record.get_governing_token_owner(),
        VoterWeightError::InvalidPredecessorVoterWeightRecordGovTokenOwner
    );

    // Ensure that the realm matches the current realm
    require_eq!(
        registrar.get_realm(),
        &predecessor_generic_voter_weight_record.get_realm(),
        VoterWeightError::InvalidPredecessorVoterWeightRecordRealm
    );

    Ok(predecessor_generic_voter_weight_record)
}

fn get_generic_voter_weight_record_data<
    'a,
    R: RegistrarBase<'a> + AccountSerialize + AccountDeserialize + Owner + Clone,
>(
    input_account: &'a AccountInfo,
    registrar: &'a Account<R>,
) -> Result<GenericVoterWeightEnum> {
    match registrar.get_previous_voter_weight_plugin_program_id() {
        None => {
            // If there is no predecessor plugin registrar, then the input account must be a TokenOwnerRecordV2
            let record = get_token_owner_record_data_for_realm_and_governing_mint(
                registrar.get_governance_program_id(),
                input_account,
                registrar.get_realm(),
                registrar.get_governing_token_mint(),
            )
            .map_err(|_| error!(VoterWeightError::InvalidPredecessorTokenOwnerRecord))?;

            Ok(GenericVoterWeightEnum::TokenOwnerRecord(record))
        }
        Some(predecessor) => {
            // If there is a predecessor plugin registrar, then the input account must be a VoterWeightRecord
            let record: spl_governance_addin_api::voter_weight::VoterWeightRecord =
                get_account_data(predecessor, input_account)
                    .map_err(|_| error!(VoterWeightError::InvalidPredecessorVoterWeightRecord))?;

            Ok(GenericVoterWeightEnum::VoterWeightRecord(record))
        }
    }
}
