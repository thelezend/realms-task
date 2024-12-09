use anchor_lang::prelude::*;

#[error_code]
pub enum PluginError {
    #[msg("Invalid realm authority")]
    InvalidRealmAuthority,

    #[msg("Invalid VoterWeightRecord realm")]
    InvalidVoterWeightRecordRealm,

    #[msg("Invalid VoterWeightRecord mint")]
    InvalidVoterWeightRecordMint,

    #[msg("Previous voter weight plugin required but not provided")]
    MissingPreviousVoterWeightPlugin,

    #[msg("Invalid realm for the provided registrar")]
    InvalidRealmForRegistrar,
}
