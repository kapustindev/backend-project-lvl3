import axios from 'axios';
import { promises as fsPromises } from 'fs';
import path from 'path';

const makeClearName = (url) => {
  const myUrl = new URL(url);
  const urlWithoutProtocol = `${myUrl.host}${myUrl.pathname}`;
  const charsForFilter = ['.', '/'];
  const filteredChars = urlWithoutProtocol.split('').map((char) => {
    if (charsForFilter.includes(char)) {
      return '-';
    }
    return char;
  });
  const newName = filteredChars.join('');
  return `${newName}.html`;
};

export default (url, dir) => {
  const newName = makeClearName(url);
  const newPath = path.join(dir, newName);
  return axios
    .get(url)
    .then((parsedData) => parsedData.data)
    .then((final) => fsPromises.access(dir)
      .then(() => fsPromises.writeFile(newPath, final))
      .catch(() => fsPromises.mkdir(`.${dir}`, { recursive: true })
        .then(() => fsPromises.writeFile(`.${newPath}`, final))))
    .catch(console.log);
};
