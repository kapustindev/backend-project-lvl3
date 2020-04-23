import axios from 'axios';
import { promises as fsPromises } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import Listr from 'listr';
import debug from 'debug';
import { isLocal, slugMain, slugAsset } from './utils.js';

const log = debug('page-loader');

const mapping = {
  link: 'href',
  script: 'src',
  img: 'src',
};

export default (url, dir) => {
  const site = new URL(url);
  const mainFileName = slugMain(site);
  const mainFilePath = path.join(dir, mainFileName);
  const assetsDirPath = path.join(`${mainFilePath}_files`);

  let htmlData;
  const assetLinks = [];

  log('start');
  return axios
    .get(url)
    .then(({ data }) => {
      const $ = cheerio.load(data);
      Object.keys(mapping).forEach((tag) => $(tag).each((i, el) => {
        const assetFileUrl = $(el).attr(mapping[tag]);
        if (isLocal(assetFileUrl, site)) {
          const assetFileName = slugAsset(assetFileUrl, site.href);
          const newLocalLink = path.join(`${mainFileName}_files`, assetFileName);
          $(el).attr(mapping[tag], newLocalLink);
          assetLinks.push([assetFileUrl, assetFileName]);
        }
      }));
      htmlData = $.html();
    })
    .then(() => log('assets links are changed'))
    .then(() => fsPromises.mkdir(assetsDirPath))
    .then(() => log('assets directory created'))
    .then(() => {
      const newListrLinks = assetLinks.map((assetFile) => {
        const [link, name] = assetFile;
        const assetFileLink = new URL(link, url);
        const assetFilePath = path.join(`${mainFilePath}_files`, name);
        return {
          title: assetFileLink.href,
          task: () => axios
            .get(assetFileLink.href, { responseType: 'arraybuffer' })
            .then((response) => {
              fsPromises.writeFile(assetFilePath, response.data);
            }),
        };
      });
      new Listr(newListrLinks, { concurrent: true, exitOnError: false }).run();
    })
    .then(() => log('assets dowloaded'))
    .then(() => {
      fsPromises.writeFile(`${mainFilePath}.html`, htmlData)
        .then(() => log('main file has been written'));
      return `${mainFileName}.html`;
    });
};
