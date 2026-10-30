# Public source and license register

| Source | Intended use | License / limitation |
|---|---|---|
| https://api.scvd.dev/findings | Public finding metadata for SWC-107, SWC-105 and SWC-101 | SCVD declares its dataset CC0 and API source MIT. Treat findings as candidates; verify original report and code. |
| https://github.com/Truscova/scvd | SCVD schema, API contract and provenance | MIT source; dataset license declared separately as CC0. |
| https://github.com/smartbugs/smartbugs-curated | Curated Solidity vulnerability cases | Repository metadata lists Apache-2.0, but individual contracts retain original licenses. Do not redistribute source blindly. |
| https://github.com/DependableSystemsLab/SolidiFI-benchmark | Injected-vulnerability benchmark cases | Repository code/material MIT; original contracts retain their licenses. Label injected cases as injected, not real-world exploits. |
| https://docs.solidity.org/en/latest/security-considerations.html | Reentrancy, CEI and arithmetic semantics | Official Solidity documentation. Pin compiler version and exact section. |
| https://docs.openzeppelin.com/contracts/5.x/access-control | Ownership and role administration | Official OpenZeppelin documentation. Distinguish intended privileged administration from missing authorization. |
| https://scs.owasp.org/SCWE/ | Weakness taxonomy | Use exact weakness entry and evidence conditions. |
| https://github.com/crytic/slither/wiki/Detector-Documentation | Detector semantics and known limitations | A detector warning is a lead, not proof of exploitability. Record detector and Slither version. |

## Provenance rules

Every reviewed case should retain an immutable report/code URL, finding ID, SWC/CWE label where supported, repository commit and file/line, compiler and dependency versions, case origin (real-world / curated / injected / negative control), reviewer and review date, exploit preconditions, impact, and rationale.

Telegraph's evaluation-pool API treats llm, synthetic, generated, and model provenance as unverified even when a URL is supplied. This project must never label AI-generated material as human. Only a real person who independently verifies the source, code path, exploit preconditions, impact and preference judgment may submit it with human provenance.
