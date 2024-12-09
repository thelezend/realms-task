# Realms Plugin Exercise

- [vote-boost-plugin](./vote-boost-plugin): The plugin program source code. Provides a 10x voting power boost for each governance token deposited.
- [create-dao](./create-dao/): TypeScript code utilizing [governance-idl-sdk](https://www.npmjs.com/package/governance-idl-sdk) to create a test Realm DAO.

## Plugin

The custom plugin is based on the [Quadratic Voting](https://github.com/Mythic-Project/governance-program-library/tree/master/programs/quadratic) example. Modifications include removing quadratic coefficient-related components and implementing a 10x voting power boost for each deposited token. This logic is implemented in the [update_voter_weight_record](./vote-boost-plugin/programs/vote-boost-plugin/src/instructions/update_voter_weight_record.rs#L57):

```rust
    // Apply 10x multiplier to each token
    let output_voter_weight = input_voter_weight_record.get_voter_weight() * 10;
```

Basic plugin tests are located in [vote-boost-plugin/tests/vote-boost-plugin.ts](./vote-boost-plugin/tests/vote-boost-plugin.ts).

## DAO Creation

The DAO creation process is implemented through a series of transactions, each containing specific instructions executed in sequence.

### Create Realm, Governance, and Plugin Registrar

1. createRealmIx
2. depositGovTokenIx
3. createGovernanceIx
4. createRegistrarIx

### Create Voter Weight Record

1. createVoterWeightRecordIx

### Create Proposal

1. updateVoterWeightRecordIx
2. createProposalIx
3. signOffProposalIx

### Cast Vote

1. updateVoterWeightRecordIx
2. castVoteIx
