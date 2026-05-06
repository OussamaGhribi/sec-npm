import path from 'path';
import fs from 'fs';
import { fetchPackageMetadata } from './fetcher.js';
import { downloadPackageTarball } from './downloader.js';
import { extractTarball } from './extractor.js';
import { scanDirectory } from './staticScanner.js';
import { runInShadowSandbox } from './safeRunner.js';
import { checkTyposquatting } from './typoChecker.js';

function checkDangerousPatterns(cmd) {
  const dangerousPatterns = ['eval', 'child_process', 'fs.writeFile', 'exec', 'spawn'];
  return dangerousPatterns.filter(pat => cmd.includes(pat));
}

export async function performStaticAnalysis(packageName) {
  let metadata, latestVersion, tarballUrl, pkgJson;
  let isLocal = false;

  if (fs.existsSync(packageName) && fs.statSync(packageName).isDirectory()) {
    isLocal = true;
    const localPkgJsonPath = path.join(packageName, 'package.json');
    if (!fs.existsSync(localPkgJsonPath)) {
      throw new Error('Local directory does not contain a package.json file.');
    }
    pkgJson = JSON.parse(fs.readFileSync(localPkgJsonPath, 'utf8'));
    latestVersion = pkgJson.version;
    metadata = { versions: { [latestVersion]: pkgJson } };
    tarballUrl = null;
  } else {
    const fetched = await fetchPackageMetadata(packageName);
    metadata = fetched.metadata;
    latestVersion = fetched.latestVersion;
    tarballUrl = fetched.tarballUrl;
    pkgJson = metadata.versions[latestVersion];
  }

  const scripts = pkgJson.scripts || {};
  let score = 0;
  const suspiciousScripts = [];
  const warnings = [];

  if (!isLocal) {
    const typoWarnings = checkTyposquatting(packageName);
    if (typoWarnings.length > 0) {
      score += 50; 
      warnings.push(...typoWarnings);
    }

    const allVersions = Object.keys(metadata.versions);
    if (allVersions.length > 1) {
      const previousVersion = allVersions[allVersions.indexOf(latestVersion) - 1];
      const prevPkgJson = metadata.versions[previousVersion];
      const prevScripts = prevPkgJson.scripts || {};

      const latestHasScripts = scripts.postinstall || scripts.preinstall || scripts.install;
      const prevHasScripts = prevScripts.postinstall || prevScripts.preinstall || prevScripts.install;

      if (latestHasScripts && !prevHasScripts) {
        score += 40;
        warnings.push({
          type: 'Sudden Script Addition',
          detail: `The latest version (${latestVersion}) added installation scripts, but the previous version (${previousVersion}) had none.`
        });
      }
    }
  }

  const DANGER_HOOKS = [
    'preinstall', 'install', 'postinstall', 
    'prepare', 'prepublish', 'prepublishOnly', 
    'prepack', 'postpack', 
    'preuninstall', 'uninstall', 'postuninstall'
  ];

  for (const [name, cmd] of Object.entries(scripts)) {
    if (DANGER_HOOKS.includes(name)) {
      const dangerous = checkDangerousPatterns(cmd);
      suspiciousScripts.push({ name, cmd, dangerous });
      score += 40;
      if (dangerous.length > 0) score += 20;
    }
  }

  return {
    packageName,
    version: latestVersion,
    tarballUrl,
    staticScore: Math.min(100, score),
    suspiciousScripts,
    warnings,
    pkgJson,
    isLocal
  };
}

export async function performFullAnalysis(packageName) {
  const staticResults = await performStaticAnalysis(packageName);
  
  const rootDir = process.cwd();
  const sandboxDir = path.join(rootDir, 'sandbox');
  const tarPath = path.join(sandboxDir, 'package.tgz');
  const extractPath = isLocalPath(packageName) ? path.resolve(packageName) : path.join(sandboxDir, 'package');

  function isLocalPath(p) {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  }

  if (!staticResults.isLocal) {
    if (!fs.existsSync(sandboxDir)) fs.mkdirSync(sandboxDir, { recursive: true });
    if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true });
    await downloadPackageTarball(staticResults.tarballUrl, tarPath);
    await extractTarball(tarPath, extractPath);
  }

  try {
    const astFindings = await scanDirectory(extractPath);
    let dynamicAnomalies = [];
    let instantBlock = false;

    const scriptsToRun = staticResults.suspiciousScripts;

    for (const script of scriptsToRun) {
      if (script.cmd.includes('node ')) {
        const scriptFile = script.cmd.split('node ')[1].split(' ')[0];
        const scriptPath = path.join(extractPath, scriptFile);
        if (fs.existsSync(scriptPath)) {
          const content = fs.readFileSync(scriptPath, 'utf8');
          const anomalies = await runInShadowSandbox(content);
          dynamicAnomalies = dynamicAnomalies.concat(anomalies);
          
          if (anomalies.some(a => a.includes('HONEY-TRAP'))) {
            instantBlock = true;
          }
        }
      }
    }

    let finalScore = (Math.min(100, staticResults.staticScore + (astFindings.length * 15)) * 0.5) + 
                     (Math.min(100, dynamicAnomalies.length * 20) * 0.5);

    if (instantBlock || staticResults.warnings.some(w => w.type === 'Typosquatting')) {
      finalScore = 100;
    }

    return {
      ...staticResults,
      deepStaticFindings: astFindings,
      dynamicAnomalies,
      finalScore: Math.round(finalScore),
      status: finalScore > 50 ? 'DANGER' : (finalScore > 25 ? 'WARNING' : 'SAFE')
    };
  } finally {
    if (!staticResults.isLocal && fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  }
}