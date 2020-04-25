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
  const mainSlug = makeMainSlug(site);

  const mainFileName = `${mainSlug}.html`;
  const mainFilePath = path.join(dir, mainFileName);
  const assetsDirName = `${mainSlug}_files`;
  const assetsDirPath = path.join(dir, assetsDirName);

  const assetLinks = [];
  let html;

  log('start');
  return axios
    .get(url)
    .then(({ data }) => {
      const $ = cheerio.load(data);
      Object.keys(mapping)
        .map((tag) => $(tag).filter((i, el) => $(el).attr(mapping[tag])).each((i, el) => {
          const assetFileUrl = $(el).attr(mapping[tag]);

          if (isLocal(assetFileUrl, site)) {
            const assetSlug = makeAssetSlug(assetFileUrl);
            const assetLocalPath = path.join(assetsDirName, assetSlug);

            $(el).attr(mapping[tag], assetLocalPath);
            assetLinks.push({ name: assetSlug, link: assetFileUrl });
            log('changed from %o to %o', assetFileUrl, assetSlug);
          }
        }));
      html = $.html();
      return html;
    })
    .then(() => fsPromises.writeFile(mainFilePath, html))
    .then(() => log('%o has been written', mainSlug))
    .then(() => fsPromises.mkdir(assetsDirPath))
    .then(() => log('created directory for assets: %o', assetsDirPath))
    .then(() => {
      const tasks = assetLinks.map(({ name, link }) => {
        const assetFileLink = new URL(link, url);
        const assetAbsolutePath = path.join(assetsDirPath, name);
        return {
          title: assetFileLink.href,
          task: () => axios
            .get(assetFileLink.href, { responseType: 'arraybuffer' })
            .then(({ data }) => fsPromises.writeFile(assetAbsolutePath, data))
            .then(() => log('%o downloaded', name)),
        };
      });
      return new Listr(tasks, { concurrent: true, exitOnError: false }).run();
    });
};
