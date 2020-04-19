import axios from 'axios';
import { promises as fsPromises } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';
import makeClearName from './utils/name-cleaner';
import 'axios-debug-log';

const log = debug('page-loader');

const mapping = {
  link: 'href',
  script: 'src',
  img: 'src',
};

export default (url, dir = process.cwd()) => {
  const mainFileName = makeClearName(url);
  const mainFilePath = path.join(dir, mainFileName);

  let htmlData;

  log('start');
  return axios
    .get(url)
    .then((parsedData) => {
      htmlData = parsedData.data;
      return htmlData;
    })
    .then((final) => fsPromises.writeFile(`${mainFilePath}.html`, final))
    .then(() => log('main page downloaded'))
    .then(() => {
      const $ = cheerio.load(htmlData);
      const tagUrls = Object.keys(mapping).map((tag) => $(tag).map((i, el) => {
        const supportFileUrl = $(el).attr(mapping[tag]);
        return supportFileUrl;
      }).get()).flat().filter((url1) => !url1.includes('//'));
      log('support links are filtered');
      return tagUrls;
    })
    .then((tagUrls) => {
      if (tagUrls.length > 0) {
        const dirPath = path.join(`${mainFilePath}_files`);
        fsPromises.mkdir(dirPath);
        log('support directory created');
        return tagUrls;
      }
      return null;
    })
    .then((links) => {
      const newLinks = links.map((link) => {
        const supportFileLink = new URL(link, url);
        const supportFileName = makeClearName(link, url);
        const supportFilePath = path.join(`${mainFilePath}_files`, supportFileName);
        const newLocalLink = path.join(`${mainFileName}_files`, supportFileName);
        axios
          .get(supportFileLink.href)
          .then((parsedData) => parsedData.data)
          .then((data) => {
            fsPromises.writeFile(supportFilePath, data);
          });
        return newLocalLink;
      });
      log('support content dowloaded');
      return [links, newLinks];
    })
    .then((newUrls) => {
      const [oldLinks, newLinks] = newUrls;
      const newHtml = oldLinks
        .reduce((acc, val, index) => acc.replace(val, newLinks[index]), htmlData);
      log('links are rewrited');
      return newHtml;
    })
    .then((result) => {
      fsPromises.writeFile(`${mainFilePath}.html`, result);
      log('main file rewrited');
      return `${mainFileName}.html`;
    });
};
