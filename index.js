#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { performStaticAnalysis, performFullAnalysis } from './lib/analyzer.js';

const program = new Command();

program
  .name('sec-npm')
  .description('The ultra-secure npm wrapper to prevent supply-chain attacks')
  .version('1.0.1');

function printResult(result, options) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { threshold = 50, force = false, detailed = false } = options;
  const isBlocked = result.finalScore > threshold && !force;

  if (result.status === 'SAFE' && result.finalScore === 0) {
    console.log(`${chalk.green.bold('[SAFE]:')} ${chalk.cyan(result.packageName)}@${result.version} passed all security checks.`);
    return false;
  }

  console.log(`\n${chalk.bold('Package:')} ${chalk.cyan(result.packageName)}`);
  console.log(`${chalk.bold('Version:')} ${result.version}`);
  console.log(chalk.gray(`-----------------------------------`));
  
  let scoreColor = chalk.green;
  if (result.finalScore > 30) scoreColor = chalk.yellow;
  if (result.finalScore > 60) scoreColor = chalk.red;

  console.log(`${chalk.bold('Risk Score:')} ${scoreColor(result.finalScore)} / 100`);
  console.log(`${chalk.bold('Status:')}     ${result.status === 'DANGER' ? chalk.bgRed.white.bold(' DANGER ') : (result.status === 'WARNING' ? chalk.bgYellow.black.bold(' WARNING ') : chalk.bgGreen.black.bold(' SAFE '))}`);
  console.log(chalk.gray(`-----------------------------------`));

  if (result.warnings && result.warnings.length > 0) {
    console.log(chalk.bgRed.white.bold('\n CRITICAL WARNINGS: '));
    result.warnings.forEach(w => {
      console.log(`  - ${chalk.red.bold(w.type)}: ${w.detail}`);
    });
  }

  if (result.suspiciousScripts.length > 0) {
    console.log(chalk.yellow(`\nInstallation Scripts Detected:`));
    result.suspiciousScripts.forEach(s => {
      console.log(`  - ${chalk.bold(s.name)}: ${chalk.italic(s.cmd)}`);
    });
  }

  if (result.deepStaticFindings && result.deepStaticFindings.length > 0) {
    if (detailed) {
      console.log(chalk.red(`\nDetailed Static Analysis Findings:`));
      result.deepStaticFindings.forEach(f => {
        console.log(`  [${chalk.bold(f.type)}] in ${chalk.blue(f.file)}: ${f.detail}`);
      });
    } else {
      const fileCount = new Set(result.deepStaticFindings.map(f => f.file)).size;
      console.log(chalk.yellow(`\nDeep Analysis: Found ${chalk.bold(result.deepStaticFindings.length)} AST anomalies in ${chalk.bold(fileCount)} files.`));
      console.log(chalk.gray(`   (Use -d for full file-by-file details)`));
    }
  }

  if (result.dynamicAnomalies && result.dynamicAnomalies.length > 0) {
    console.log(chalk.red(`\nDynamic Analysis Anomalies (Shadow Execution):`));
    result.dynamicAnomalies.forEach(a => {
      console.log(`  - ${chalk.yellow(a)}`);
    });
  }

  if (isBlocked) {
    console.log(`\n${chalk.bgRed.white.bold(' INSTALLATION BLOCKED ')}`);
    return true;
  } else {
    if (result.finalScore > threshold && force) {
      console.log(`\n${chalk.bgYellow.black.bold(' ⚠️  PROCEEDING WITH CAUTION ')} (Force override enabled)`);
    } else if (result.status === 'SAFE') {
      console.log(`\n${chalk.green.bold('This package appears to be safe.')}`);
    } else {
      console.log(`\n${chalk.yellow.bold('Recommendation:')} Manually review the summary above before installing.`);
    }
    return false;
  }
}

program
  .command('scan <packageName>')
  .description('Perform static analysis on a package')
  .action(async (packageName) => {
    try {
      const result = await performStaticAnalysis(packageName);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('check <packageName>')
  .description('Perform full security audit')
  .option('-d, --detailed', 'Show detailed file-by-file findings')
  .option('-t, --threshold <score>', 'Risk threshold (default: 50)', parseInt)
  .option('--json', 'Output in JSON format')
  .action(async (packageName, options) => {
    try {
      console.log(chalk.blue(`\nAuditing ${chalk.bold(packageName)}...`));
      const result = await performFullAnalysis(packageName);
      printResult(result, options);
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('i <packageName>')
  .alias('install')
  .description('Securely install a package')
  .option('-d, --detailed', 'Show detailed findings if audit flags issues')
  .option('-t, --threshold <score>', 'Risk threshold (default: 50)', parseInt)
  .option('-f, --force', 'Force install')
  .action(async (packageName, options) => {
    try {
      console.log(chalk.blue(`\nAuditing ${chalk.bold(packageName)}...`));
      const result = await performFullAnalysis(packageName);
      const isBlocked = printResult(result, options);

      if (isBlocked) {
        console.log(chalk.red('\nInstallation aborted. Use --force to override.'));
        process.exit(1);
      }

      console.log(chalk.green(`\nAudit passed. Installing ${packageName}...`));
      const npmInstall = spawn('npm', ['install', packageName], { stdio: 'inherit', shell: true });
      npmInstall.on('close', (code) => {
        if (code === 0) console.log(chalk.bgGreen.black.bold('\n Package installed successfully! '));
      });
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);