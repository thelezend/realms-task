pub mod constants;
pub mod error;
pub mod gpl_shared;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("77ZgVtaFYZE6aSnoFcrSuSadrADJPEQ8qDrmbGskuroE");

#[program]
pub mod vote_boost_plugin {
    use super::*;

    pub fn create_registrar(
        ctx: Context<CreateRegistrar>,
        use_previous_voter_weight_plugin: bool,
    ) -> Result<()> {
        instructions::create_registrar(ctx, use_previous_voter_weight_plugin)
    }

    pub fn create_voter_weight_record(
        ctx: Context<CreateVoterWeightRecord>,
        governing_token_owner: Pubkey,
    ) -> Result<()> {
        instructions::create_voter_weight_record(ctx, governing_token_owner)
    }

    pub fn update_voter_weight_record(ctx: Context<UpdateVoterWeightRecord>) -> Result<()> {
        instructions::update_voter_weight_record(ctx)
    }
}
