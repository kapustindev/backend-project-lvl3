import nock from 'nock';
import { promises as fsPromises } from 'fs';
import path from 'path';
import os from 'os';
import pageLoader from '..';

nock.disableNetConnect();

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

test('make file', async () => {
  const tempDir = os.tmpdir();
  const fixturePath = getFixturePath('testing-file.html');
  const result = await fsPromises.readFile(fixturePath, 'utf-8');
  const data = '<html>\n<head>Testing</head>\n</html>\n';
  nock(/antonlettuce\.github\.io/)
    .get('/hexlet-basics/testing-file')
    .reply(200, data);
  await pageLoader('https://antonlettuce.github.io/hexlet-basics/testing-file', tempDir);
  const downloadedFilePath = path.join(tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file.html');
  const newFile = await fsPromises.readFile(downloadedFilePath, 'utf-8');
  expect(newFile).toEqual(result);
});
