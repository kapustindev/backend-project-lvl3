import nock from 'nock';
import { promises as fsPromises } from 'fs';
import path from 'path';
import os from 'os';
import pageLoader from '../src';

nock.disableNetConnect();

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

let tempDir;

test('make file', async () => {
  const beforeFixturePath = getFixturePath('testing-file.html');
  tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  const before = await fsPromises.readFile(beforeFixturePath, 'utf-8');
  nock(/antonlettuce\.github\.io/)
    .get('/hexlet-basics/testing-file')
    .reply(200, before);
  nock(/antonlettuce\.github\.io/)
    .get('/assets/application.js')
    .reply(200, 'simplecode');
  nock(/antonlettuce\.github\.io/)
    .get('/actions/duplication.js')
    .reply(200, 'testcode');
  await pageLoader('https://antonlettuce.github.io/hexlet-basics/testing-file', tempDir);
  const downloadedFilePath = path.join(process.cwd(), tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file.html');
  const supportFilesPath = path.join(process.cwd(), tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file_files');
  const newFile = await fsPromises.readFile(downloadedFilePath, 'utf-8');
  const supportFiles = await fsPromises.readdir(supportFilesPath);
  expect(newFile).toContain('antonlettuce-github-io-hexlet-basics-testing-file_files/actions-duplication.js');
  expect(newFile).toContain('antonlettuce-github-io-hexlet-basics-testing-file_files/assets-application.js');
  expect(supportFiles).toEqual(['actions-duplication.js', 'assets-application.js']);
});

afterEach(async () => {
  const firstDir = tempDir.split(path.sep).filter((el) => el)[0];
  const removeDir = path.join(process.cwd(), firstDir);
  await fsPromises.rmdir(removeDir, { recursive: true });
});
