/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/vote_boost_plugin.json`.
 */
export type VoteBoostPlugin = {
  address: "77ZgVtaFYZE6aSnoFcrSuSadrADJPEQ8qDrmbGskuroE";
  metadata: {
    name: "voteBoostPlugin";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "configureRegistrar";
      discriminator: [252, 142, 240, 129, 235, 180, 14, 115];
      accounts: [
        {
          name: "registrar";
          writable: true;
        },
        {
          name: "realm";
          docs: [
            "An spl-governance Realm",
            "",
            "Realm is validated in the instruction:",
            "- Realm is owned by the governance_program_id",
            "- realm_authority is realm.authority",
            ""
          ];
        },
        {
          name: "realmAuthority";
          docs: ["realm_authority must sign and match Realm.authority"];
          signer: true;
        }
      ];
      args: [
        {
          name: "usePreviousVoterWeightPlugin";
          type: "bool";
        }
      ];
    },
    {
      name: "createRegistrar";
      discriminator: [132, 235, 36, 49, 139, 66, 202, 69];
      accounts: [
        {
          name: "registrar";
          docs: [
            "There can only be a single registrar per governance Realm and governing mint of the Realm"
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 101, 103, 105, 115, 116, 114, 97, 114];
              },
              {
                kind: "account";
                path: "realm";
              },
              {
                kind: "account";
                path: "governingTokenMint";
              }
            ];
          };
        },
        {
          name: "governanceProgramId";
          docs: [
            "The program id of the spl-governance program the realm belongs to"
          ];
        },
        {
          name: "realm";
          docs: [
            "An spl-governance Realm",
            "",
            "Realm is validated in the instruction:",
            "- Realm is owned by the governance_program_id",
            "- governing_token_mint must be the community or council mint",
            "- realm_authority is realm.authority",
            ""
          ];
        },
        {
          name: "governingTokenMint";
          docs: [
            "Either the realm community mint or the council mint.",
            "It must match Realm.community_mint or Realm.config.council_mint",
            "",
            "Note: Once the Civic Pass plugin is enabled the governing_token_mint is used only as identity",
            "for the voting population and the tokens of that are no longer used"
          ];
        },
        {
          name: "realmAuthority";
          docs: ["realm_authority must sign and match Realm.authority"];
          signer: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "usePreviousVoterWeightPlugin";
          type: "bool";
        }
      ];
    },
    {
      name: "createVoterWeightRecord";
      discriminator: [184, 249, 133, 178, 88, 152, 250, 186];
      accounts: [
        {
          name: "registrar";
        },
        {
          name: "voterWeightRecord";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  119,
                  101,
                  105,
                  103,
                  104,
                  116,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ];
              },
              {
                kind: "account";
                path: "registrar.realm";
                account: "registrar";
              },
              {
                kind: "account";
                path: "registrar.governing_token_mint";
                account: "registrar";
              },
              {
                kind: "arg";
                path: "governingTokenOwner";
              }
            ];
          };
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "governingTokenOwner";
          type: "pubkey";
        }
      ];
    },
    {
      name: "updateVoterWeightRecord";
      discriminator: [45, 185, 3, 36, 109, 190, 115, 169];
      accounts: [
        {
          name: "registrar";
          docs: ["The quadratic plugin Registrar"];
        },
        {
          name: "inputVoterWeight";
          docs: [
            "An account that is either of type TokenOwnerRecordV2 or VoterWeightRecord",
            "depending on whether the registrar includes a predecessor or not"
          ];
        },
        {
          name: "voterWeightRecord";
          writable: true;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "registrar";
      discriminator: [193, 202, 205, 51, 78, 168, 150, 128];
    },
    {
      name: "voterWeightRecord";
      discriminator: [46, 249, 155, 75, 153, 248, 116, 9];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "invalidPredecessorTokenOwnerRecord";
      msg: "Invalid TokenOwnerRecord as input voter weight (expecting TokenOwnerRecord V1 or V2)";
    },
    {
      code: 6001;
      name: "invalidPredecessorVoterWeightRecord";
      msg: "Invalid VoterWeightRecord as input voter weight (expecting VoterWeightRecord)";
    },
    {
      code: 6002;
      name: "invalidPredecessorVoterWeightRecordRealm";
      msg: "Invalid VoterWeightRecord realm for input voter weight";
    },
    {
      code: 6003;
      name: "invalidPredecessorVoterWeightRecordGovTokenMint";
      msg: "Invalid VoterWeightRecord governance token mint for input voter weight";
    },
    {
      code: 6004;
      name: "invalidPredecessorVoterWeightRecordGovTokenOwner";
      msg: "Invalid VoterWeightRecord governance token owner for input voter weight";
    },
    {
      code: 6005;
      name: "invalidVoterWeightRecordRealm";
      msg: "Invalid VoterWeightRecord realm";
    },
    {
      code: 6006;
      name: "invalidVoterWeightRecordMint";
      msg: "Invalid VoterWeightRecord mint";
    },
    {
      code: 6007;
      name: "missingPreviousVoterWeightPlugin";
      msg: "Previous voter weight plugin required but not provided";
    }
  ];
  types: [
    {
      name: "registrar";
      docs: [
        "Registrar which stores Quadratic voting configuration for the given Realm"
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "governanceProgramId";
            docs: ["spl-governance program the Realm belongs to"];
            type: "pubkey";
          },
          {
            name: "realm";
            docs: ["Realm of the Registrar"];
            type: "pubkey";
          },
          {
            name: "governingTokenMint";
            docs: [
              "Governing token mint the Registrar is for",
              "It can either be the Community or the Council mint of the Realm",
              "When the plugin is used the mint is only used as identity of the governing power (voting population)",
              "and the actual token of the mint is not used"
            ];
            type: "pubkey";
          },
          {
            name: "previousVoterWeightPluginProgramId";
            docs: [
              "If the plugin is one in a sequence, this is the previous plugin program ID",
              "If set, then update_voter_weight_record will expect a voter_weight_record owned by this program"
            ];
            type: {
              option: "pubkey";
            };
          },
          {
            name: "reserved";
            docs: ["Reserved for future upgrades"];
            type: {
              array: ["u8", 128];
            };
          }
        ];
      };
    },
    {
      name: "voterWeightAction";
      docs: [
        "VoterWeightAction enum as defined in spl-governance-addin-api",
        "It's redefined here for Anchor to export it to IDL"
      ];
      type: {
        kind: "enum";
        variants: [
          {
            name: "castVote";
          },
          {
            name: "commentProposal";
          },
          {
            name: "createGovernance";
          },
          {
            name: "createProposal";
          },
          {
            name: "signOffProposal";
          }
        ];
      };
    },
    {
      name: "voterWeightRecord";
      docs: [
        "VoterWeightRecord account as defined in spl-governance-addin-api",
        "It's redefined here without account_discriminator for Anchor to treat it as native account",
        "",
        "The account is used as an api interface to provide voting power to the governance program from external addin contracts"
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "realm";
            docs: ["The Realm the VoterWeightRecord belongs to"];
            type: "pubkey";
          },
          {
            name: "governingTokenMint";
            docs: [
              "Governing Token Mint the VoterWeightRecord is associated with",
              "Note: The addin can take deposits of any tokens and is not restricted to the community or council tokens only"
            ];
            type: "pubkey";
          },
          {
            name: "governingTokenOwner";
            docs: [
              "The owner of the governing token and voter",
              "This is the actual owner (voter) and corresponds to TokenOwnerRecord.governing_token_owner"
            ];
            type: "pubkey";
          },
          {
            name: "voterWeight";
            docs: [
              "Voter's weight",
              "The weight of the voter provided by the addin for the given realm, governing_token_mint and governing_token_owner (voter)"
            ];
            type: "u64";
          },
          {
            name: "voterWeightExpiry";
            docs: [
              "The slot when the voting weight expires",
              "It should be set to None if the weight never expires",
              "If the voter weight decays with time, for example for time locked based weights, then the expiry must be set",
              "As a common pattern Revise instruction to update the weight should be invoked before governance instruction within the same transaction",
              "and the expiry set to the current slot to provide up to date weight"
            ];
            type: {
              option: "u64";
            };
          },
          {
            name: "weightAction";
            docs: [
              "The governance action the voter's weight pertains to",
              "It allows to provided voter's weight specific to the particular action the weight is evaluated for",
              "When the action is provided then the governance program asserts the executing action is the same as specified by the addin"
            ];
            type: {
              option: {
                defined: {
                  name: "voterWeightAction";
                };
              };
            };
          },
          {
            name: "weightActionTarget";
            docs: [
              "The target the voter's weight  action pertains to",
              "It allows to provided voter's weight specific to the target the weight is evaluated for",
              "For example when addin supplies weight to vote on a particular proposal then it must specify the proposal as the action target",
              "When the target is provided then the governance program asserts the target is the same as specified by the addin"
            ];
            type: {
              option: "pubkey";
            };
          },
          {
            name: "reserved";
            docs: ["Reserved space for future versions"];
            type: {
              array: ["u8", 8];
            };
          }
        ];
      };
    }
  ];
  constants: [
    {
      name: "seed";
      type: "string";
      value: '"anchor"';
    }
  ];
};
