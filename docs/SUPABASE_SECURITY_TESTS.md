# Supabase Security Verification Matrix

## RLS identities

Create two disposable test accounts, User A and User B. Confirm age and the current consent version for each account.

| Test | Actor | Operation | Required result |
|---|---|---|---|
| RLS-01 | Anonymous | Read active case and sides | Allowed |
| RLS-02 | Anonymous | Read profiles or submissions | Denied |
| RLS-03 | User A | Read User A profile | Allowed |
| RLS-04 | User A | Read User B profile | Denied |
| RLS-05 | User A | Update User A alias/age confirmation | Allowed |
| RLS-06 | User A | Insert consent for User A | Allowed |
| RLS-07 | User A | Insert consent for User B | Denied |
| RLS-08 | User A | Read User B submission | Denied |
| RLS-09 | User A | Read User B verdict or scores | Denied |
| RLS-10 | User A | Directly insert a submission or verdict | Denied |
| RLS-11 | User A | Block User B | Allowed |
| RLS-12 | User A | Delete User B’s block relation | Denied |
| RLS-13 | User A | Read usage ledger or audit log | Denied |
| RLS-14 | Edge Function | Claim and finalize User A verdict | Allowed with valid JWT/consent/quota |
| RLS-15 | Edge Function | Fourth successful verdict in one UTC day | Denied with quota error |

No backend gate passes until all fifteen tests have recorded evidence.
