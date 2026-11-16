# SMART_CONTRACT_AUDIT evaluation coverage

The evaluator scores whole miner responses. A strong response distinguishes confirmed vulnerabilities from suspicious patterns, states evidence, explains exploit preconditions, calibrates severity, and identifies limitations.

## Positive coverage

| Family | Required cases |
|---|---|
| Reentrancy | Ether withdrawal; state update after external call; cross-function; cross-contract; ERC-777/ERC-1363 hooks; read-only reentrancy; token callbacks; proxy/delegatecall context; reentrancy guard scope; invariant-specific exploitability |
| Access control | Missing owner/role check; unprotected mint/burn; privileged pause; role-admin misconfiguration; public initializer; repeatable initializer; UUPS upgrade authorization; proxy implementation initialization; tx.origin; indirect privileged call path |
| Arithmetic | Pre-0.8 wraparound; explicit unchecked; assembly arithmetic; narrowing casts; signed/unsigned conversion; multiplication-before-division; decimal scaling; share/asset rounding; accumulator bounds; unchecked loop arithmetic |

## Negative and boundary controls

- Solidity >=0.8 checked arithmetic is not an overflow finding by itself; require a demonstrated unchecked, assembly, cast/truncation or other arithmetic path.
- Checks-Effects-Interactions must be checked across every relevant path, including cross-function and cross-contract state.
- A reentrancy guard on one entry point does not prove all entry points or external dependencies are protected.
- onlyOwner or role modifiers are not a vulnerability merely because a privileged account exists; inspect who can acquire or administer the role.
- Proxy implementation code and proxy storage/call context must not be conflated.
- A selector in bytecode does not prove dispatch reachability, semantics, authorization or exploitability.
- Dead or unreachable code is not a live exploit without a reachable path.
- A static-analysis warning is not automatically a confirmed vulnerability or severity rating.
- Missing source, incomplete bytecode or unresolved dependencies must produce an explicit inconclusive result, not a clean bill of health.

## Preferred-answer rubric

1. Verdict: confirmed, likely, suspicious, no finding in reviewed scope, or inconclusive.
2. Location: contract, function, line range or bytecode evidence.
3. Mechanism: exact control/data flow and violated invariant.
4. Preconditions: attacker capability, state setup and reachable call sequence.
5. Impact: affected assets, authority or availability; justify severity.
6. Remediation: concrete mitigation and upgrade/migration caveats.
7. Confidence and limitations: compiler assumptions, source completeness, proxy context and unresolved dependencies.

Rejected answers must be plausible and address the same prompt, but contain a specific technical error. Avoid generic stock negatives such as looks safe.
