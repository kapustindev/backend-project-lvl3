import axios from 'axios';
import { promises as fsPromises } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import Listr from 'listr';
import debug from 'debug';
import { isLocal, makeMainSlug, makeAssetSlug } from './utils.js';

const log = debug('page-loader');

const mapping = {
  link: 'href',
  script: 'src',
  img: 'src',
};

export default (url, dir) => {
  const site = new URL(url);
  const mainFileName = makeMainSlug(site);
  const mainFilePath = path.join(dir, mainFileName);
  const assetsDir = `${mainFileName}_files`;
  const assetsDirPath = `${mainFilePath}_files`;

  const assetLinks = [];

  log('start');
  return axios
    .get(url)
    .then(({ data }) => {
      const $ = cheerio.load(data);
      Object.keys(mapping)
        .map((tag) => $(tag).filter((i, el) => $(el).attr(mapping[tag])).each((i, el) => {
          const assetFileUrl = $(el).attr(mapping[tag]);
          if (isLocal(assetFileUrl, site)) {
            const assetFileName = makeAssetSlug(assetFileUrl);
            const assetLocalPath = path.join(assetsDir, assetFileName);

            $(el).attr(mapping[tag], assetLocalPath);
            assetLinks.push({ name: assetFileName, link: assetFileUrl });
            log('changed from %o to %o', assetFileUrl, assetFileName);
          }
        }));
      return $.html();
    })
    .then((html) => fsPromises.writeFile(`${mainFilePath}.html`, html))
    .then(() => log('%o has been written', mainFileName))
    .then(() => fsPromises.mkdir(assetsDirPath))
    .then(() => log('created directory for assets: %o', assetsDirPath))
    .then(() => {
      const tasks = assetLinks.map(({ name, link }) => {
        const assetFileLink = new URL(link, url);
        const assetLocalPath = path.join(assetsDirPath, name);
        return {
          title: assetFileLink.href,
          task: () => axios
            .get(assetFileLink.href, { responseType: 'arraybuffer' })
            .then((response) => fsPromises.writeFile(assetLocalPath, response.data))
            .then(() => log('%o downloaded', name)),
        };
      });
      return new Listr(tasks, { concurrent: true, exitOnError: false }).run();
    });
};
