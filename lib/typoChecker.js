function getLevenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[len1][len2];
}

const POPULAR_PACKAGES = [
  'react', 'react-dom', 'lodash', 'axios', 'express', 'chalk', 'commander',
  'moment', 'dotenv', 'typescript', 'jest', 'next', 'vue', 'angular',
  'jquery', 'async', 'request', 'debug', 'uuid', 'bluebird', 'underscore',
  'mkdirp', 'minimist', 'webpack', 'babel-core', 'babel-loader', 'fs-extra'
];

export function checkTyposquatting(packageName) {
  const warnings = [];
  
  for (const popular of POPULAR_PACKAGES) {
    if (packageName === popular) continue;
    
    const distance = getLevenshteinDistance(packageName, popular);
    
    if (distance > 0 && distance <= 2) {
      warnings.push({
        type: 'Potential Typosquatting',
        target: popular,
        distance: distance,
        detail: `The package name "${packageName}" is extremely similar to "${popular}". Please verify you intended to install this specific package.`
      });
    }
  }
  
  return warnings;
}
