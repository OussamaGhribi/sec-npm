# 🛡️ sec-npm

<p align="center">
  <img src="https://raw.githubusercontent.com/OussamaGhribi/sec-npm/main/imgs/logo.png" width="200" alt="sec-npm Logo" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/sec-npm">
    <img src="https://img.shields.io/npm/v/sec-npm?style=for-the-badge&color=blue" alt="NPM Version" />
  </a>
  <a href="https://github.com/OussamaGhribi/sec-npm/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/OussamaGhribi/sec-npm?style=for-the-badge&color=green" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/Security-Zero--Trust-red?style=for-the-badge" alt="Security Mode" />
</p>

<p align="center">
  <b>The ultra-secure npm wrapper designed to stop supply-chain attacks in their tracks.</b>
  <br>
  <a href="https://www.npmjs.com/package/sec-npm">View on NPM Registry</a>
</p>

---

`sec-npm` is a Zero-Trust security layer for your Node.js development environment. It audits every package before installation using **Deep AST Analysis** and **Shadow Execution**, ensuring that malicious code never touches your machine.

> [!IMPORTANT]
> **Why sec-npm?** Standard tools like `npm audit` only find *known* vulnerabilities. `sec-npm` is built to detect **Zero-Day Hijacks** and **Malicious Meta-data** by simulating execution in a deceptive sandbox.

---

## 📸 In Action

### 1. The Interrogation (Security Check)
`sec-npm` performs a high-fidelity audit of the package metadata and source code without executing it on your host.
<p align="center">
  <img src="https://raw.githubusercontent.com/OussamaGhribi/sec-npm/main/imgs/sec-npm-check.png" width="800" alt="Security Check Demo" />
</p>

### 2. Sleek Developer Experience
If a package is safe, the tool stays out of your way with a clean, one-line confirmation.
<p align="center">
  <img src="https://raw.githubusercontent.com/OussamaGhribi/sec-npm/main/imgs/sec-npm-good.png" width="800" alt="Success Install Demo" />
</p>

### 3. The "Nuclear Block" (Attack Detection)
When malware is detected (e.g., Honey-Trap triggers or Typosquatting), `sec-npm` kills the process and protects your credentials.
<p align="center">
  <img src="https://raw.githubusercontent.com/OussamaGhribi/sec-npm/main/imgs/sec-npm-danger.png" width="800" alt="Danger Block Demo" />
</p>

---

## ✨ Features that Defend

### 🎭 Shadow Execution Sandbox
Unlike heavy Docker containers, `sec-npm` uses a high-fidelity **Shadow Environment** built on ES6 Proxies. It "simulates" the installation process in milliseconds, trapping and blocking all dangerous system calls.

### 🪤 Active Defense (Honey-Traps)
The sandbox is populated with decoy files (fake SSH keys, `.env` files). If a malicious script even *tries* to read these, the tool triggers a critical alert and blocks the install.

### 🔍 Deep AST De-obfuscation
Attackers often hide their intent using string math (e.g., `'ch' + 'ild_p' + 'rocess'`). Our scanner parses the **Abstract Syntax Tree (AST)** to "solve" these concatenations and reveal hidden malicious intent.

### 🕒 Time-Travel Analysis
`sec-npm` compares the latest version of a package with its history. A sudden addition of a `postinstall` script in a package that was historically "clean" is flagged as a **High-Probability Hijack**.

---

## 🛠️ Usage

### 1. Secure Installation
Use this as a drop-in replacement for `npm install`.
```bash
sec-npm i <package-name>
```

### 2. Deep Security Audit
Audit a package (Static + Dynamic) without installing. Use `-d` for a full breakdown.
```bash
sec-npm check <package-name> -d
```

### 3. Quick Scan
Rapid static metadata scan.
```bash
sec-npm scan <package-name>
```

---

## ⚖️ Comparison

| Feature | Standard NPM | sec-npm |
| :--- | :---: | :---: |
| **Known Vulnerabilities** | ✅ | ✅ |
| **Zero-Day Detection** | ❌ | ✅ |
| **Shadow Execution** | ❌ | ✅ |
| **Typosquatting Shield** | ❌ | ✅ |
| **Honey-Trap Deception** | ❌ | ✅ |
| **Overhead** | None | Minimal (< 1s) |

---

<p align="center">
  <b>Don't just install. Secure.</b>
</p>
