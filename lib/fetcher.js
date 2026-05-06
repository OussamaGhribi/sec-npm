import https from 'https';

export async function fetchPackageMetadata(packageName) {
  const url = `https://registry.npmjs.org/${packageName}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const latestVersion = json['dist-tags'].latest;
          const tarballUrl = json.versions[latestVersion].dist.tarball;
          resolve({ metadata: json, latestVersion, tarballUrl });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => reject(err));
  });
}