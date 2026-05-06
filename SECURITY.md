# 🛡️ sec-npm: The Future of Supply Chain Defense

## 1. The Genesis: Why We Built This
The modern JavaScript ecosystem is built on trust, but that trust is being weaponized. High-profile incidents like the **Axios metadata hijacking** and the **UA-Parser-JS malware injection** proved that the standard `npm install` is a wide-open door for attackers.

Current security tools (like `npm audit`) only look for *known* vulnerabilities in older versions. They are useless against **Zero-Day Hijacks**—where a hacker takes over a popular package and injects malware into a brand-new version.

**sec-npm** was built to solve this. It is a Zero-Trust wrapper that treats every package as potentially malicious until it survives our multi-layered security gauntlet.

---

## 2. Under the Hood: The Security Gauntlet
`sec-npm` does not just "scan" code; it subjects it to a four-stage behavioral analysis before it ever touches your system.

### Phase 1: The Similarity Engine (Typosquatting Protection)
**The Attack:** An attacker publishes `axois` or `react-domm`, hoping a tired developer will make a typo.
**The Defense:** Using the **Levenshtein Distance** algorithm, `sec-npm` calculates the "Visual DNA" of the package name. If it is 95% similar to a top-tier package but isn't the real thing, the tool triggers a **Critical Block**. 

### Phase 2: Deep AST De-obfuscation (Static Analysis)
**The Attack:** Attackers hide their intent using string concatenation (e.g., `'ch' + 'ild_process'`) or Hex/Base64 encoding to bypass simple text scanners.
**The Defense:** We don't read the package as text; we read it as an **Abstract Syntax Tree (AST)**.
*   **Constant Folding:** Our scanner "solves" string math on the fly to reveal hidden keywords.
*   **Entropy Analysis:** We calculate the Shannon Entropy of every string. If a string is too "random," it's flagged as an encrypted payload.
*   **Capability Mapping:** We map every system call (`fs`, `net`, `crypto`) to ensure a simple UI library isn't trying to open a raw TCP socket.

### Phase 3: Time-Travel Analysis (Differential Check)
**The Attack:** A trusted package with 10 million downloads is hijacked. The new version adds a malicious `postinstall` script.
**The Defense:** `sec-npm` fetches the **previous version's metadata** and compares the footprints. If a package that has been "silent" for 5 years suddenly adds an installation script, it is flagged as a **High-Probability Hijack**.

### Phase 4: Shadow Execution (The "Honey-Trap" Sandbox)
**The Attack:** Malware detects it's being scanned (evasion) or tries to steal SSH keys during installation.
**The Defense:** This is the "Nuclear" feature. Instead of heavy Docker containers, we use a **High-Fidelity Shadow Sandbox** built on ES6 Proxies.
*   **Active Deception:** We populate the sandbox with **Honey-Traps** (fake `.env` files, decoy SSH keys).
*   **Real-Time Trapping:** Every system call is intercepted by a "Trap." If the malware tries to read our decoy SSH key, it's caught red-handed.
*   **Zero Host Exposure:** No code is ever executed on your OS. It is "simulated" in a virtual environment where the hacker has zero power.

---

## 3. Benefits: Why `sec-npm` Wins
| Feature | Traditional NPM | `sec-npm` |
| :--- | :--- | :--- |
| **Isolation** | None | **Shadow Execution** |
| **Zero-Day Hijacks** | Vulnerable | **Caught by Time-Travel** |
| **Typosquatting** | Vulnerable | **Blocked by Similarity Engine** |
| **Obfuscated Malware** | Missed | **Resolved by AST Scanner** |
| **Speed** | Fast | **Near-Instant (No Docker)** |
| **Cleanup** | Manual | **Automatic Atomic Wipe** |

---

## 4. Technical Specifications
*   **Language:** Node.js (ES Modules)
*   **Engine:** `node:vm` + `Proxy` Traps
*   **AST Parser:** `acorn` + `acorn-walk`
*   **Analysis Depth:** Recursive Directory Scanning
*   **Safety Boundary:** Logical Sandbox with Host Module Virtualization

---

## 5. Final Verdict
`sec-npm` turns the "Installer" from a liability into a **Security Sentry**. By the time you see the "✨ Package installed successfully" message, that code has been interrogated, simulated, and verified across four dimensions of security.

**In the world of supply-chain attacks, don't just install. Secure.**
