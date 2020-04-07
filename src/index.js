import axios from 'axios';
import { promises as fsPromises } from 'fs';
import path from 'path';
import cheerio from 'cheerio';

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
  return href.replace(/[^a-zA-Z0-9]+/g, '-');
};

export default (url, dir = process.cwd()) => {
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
      .then(() => fsPromises.writeFile(`${mainFilePath}.html`, final))
      .catch(() => fsPromises.mkdir(`.${dir}`, { recursive: true })
        .then(() => fsPromises.writeFile(`.${mainFilePath}.html`, final))))
    .then(() => {
      const $ = cheerio.load(htmlData);
      const tagUrls = Object.keys(mapping).map((tag) => $(tag).map((i, el) => {
        const supportFileUrl = $(el).attr(mapping[tag]);
        return supportFileUrl;
      }).get()).flat().filter((url1) => !url1.includes('//'));
      return tagUrls;
    })
    .then((tagUrls) => {
      if (tagUrls.length > 0) {
        let dirPath;
        if (dir !== process.cwd()) {
          dirPath = path.join(`.${dir}`, `${mainFileName}_files`);
        } else {
          dirPath = `${mainFileName}_files`;
        }
        fsPromises.mkdir(dirPath);
        return tagUrls;
      }
      return null;
    })
    .then((links) => {
      const newLinks = links.map((link) => {
        const supportFileLink = new URL(link, url);
        const supportFileName = makeClearName(link, base);
        let supportFilePath = path.join(`${mainFileName}_files`, supportFileName);
        if (dir !== process.cwd()) {
          supportFilePath = path.join(`.${dir}`, `${mainFileName}_files`, supportFileName);
        }
        axios
          .get(supportFileLink.href)
          .then((parsedData) => parsedData.data)
          .then((data) => {
            fsPromises.writeFile(supportFilePath, data);
          });
        return supportFilePath;
      });
      return [links, newLinks];
    })
    .then((newUrls) => {
      const [oldLinks, newLinks] = newUrls;
      const newHtml = oldLinks
        .reduce((acc, val, index) => acc.replace(val, newLinks[index]), htmlData);
      return newHtml;
    })
    .then((result) => {
      const newMainFilePath = dir === process.cwd() ? `${mainFilePath}.html` : `.${mainFilePath}.html`;
      fsPromises.writeFile(newMainFilePath, result);
    })
    .catch(() => console.log('There is no local files to download'));
};
