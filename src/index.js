import axios from 'axios';
import { promises as fsPromises } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';
import 'axios-debug-log';

const log = debug('page-loader');

const mapping = {
  link: 'href',
  script: 'src',
  img: 'src',
};

const makeClearName = (url, base = url) => {
  const objURL = new URL(url, base);
  if (url !== base) {
    const supFile = objURL.pathname;
    return supFile.split('/').join('-').slice(1);
  }
  const urlPath = objURL.pathname.length === 1 ? '' : objURL.pathname;
  const href = `${objURL.hostname}${urlPath}`;
  const finalName = href.replace(/[^a-zA-Z0-9]+/g, '-');
  return finalName;
};

export default (url, dir = process.cwd()) => {
  log('app start');
  const base = url;
  const mainFileName = makeClearName(url);
  const mainFilePath = path.join(dir, mainFileName);
  let htmlData;
  return axios
    .get(url)
    .then((parsedData) => {
      htmlData = parsedData.data;
      return htmlData;
    })
    .then((final) => fsPromises.access(dir)
      .then(() => fsPromises.writeFile(`.${mainFilePath}.html`, final))
      .catch(() => fsPromises.mkdir(`.${dir}`, { recursive: true })
        .then(() => fsPromises.writeFile(`.${mainFilePath}.html`, final))))
    .then(() => {
      const $ = cheerio.load(htmlData);
      log('getting all links of support files');
      const tagUrls = Object.keys(mapping).map((tag) => $(tag).map((i, el) => {
        const supportFileUrl = $(el).attr(mapping[tag]);
        return supportFileUrl;
      }).get()).flat().filter((url1) => !url1.includes('//'));
      return tagUrls;
    })
    .then((tagUrls) => {
      if (tagUrls.length > 0) {
        log('making directory for support files');
        let dirPath;
        if (dir !== process.cwd()) {
          dirPath = path.join(`.${dir}`, `${mainFileName}_files`);
        } else {
          dirPath = `${mainFileName}_files`;
        }
        fsPromises.mkdir(dirPath);
        log('directory for support files is created');
        return tagUrls;
      }
      return null;
    })
    .then((links) => {
      log('downloading content of support files');
      const newLinks = links.map((link) => {
        const supportFileLink = new URL(link, url);
        const supportFileName = makeClearName(link, base);
        let supportFilePath = path.join(`${mainFileName}_files`, supportFileName);
        const finalPath = supportFilePath;
        if (dir !== process.cwd()) {
          supportFilePath = path.join(`.${dir}`, `${mainFileName}_files`, supportFileName);
        }
        axios
          .get(supportFileLink.href)
          .then((parsedData) => parsedData.data)
          .then((data) => {
            fsPromises.writeFile(supportFilePath, data);
          });
        return finalPath;
      });
      log('all content has been dowloaded');
      return [links, newLinks];
    })
    .then((newUrls) => {
      const [oldLinks, newLinks] = newUrls;
      log('changing old paths for new');
      const newHtml = oldLinks
        .reduce((acc, val, index) => acc.replace(val, newLinks[index]), htmlData);
      log('paths are changed');
      return newHtml;
    })
    .then((result) => {
      const newMainFilePath = dir === process.cwd() ? `${mainFilePath}.html` : `.${mainFilePath}.html`;
      log('rewriting main content');
      fsPromises.writeFile(newMainFilePath, result);
      log('rewrited');
    })
    .catch(() => log('There is no local files to download'));
};
