import nock from 'nock';
import { promises as fsPromises } from 'fs';
import path from 'path';
import os from 'os';
import pageLoader from '../src';

nock.disableNetConnect();

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const beforeFixturePath = getFixturePath('testing-file.html');

let tempDir;
let before;

beforeAll(async () => {
  tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  before = await fsPromises.readFile(beforeFixturePath, 'utf-8');
  nock(/antonlettuce\.github\.io/)
    .get('/hexlet-basics/testing-file')
    .reply(200, before);
  nock(/antonlettuce\.github\.io/)
    .get('/assets/application.js')
    .reply(200, 'simplecode');
  nock(/antonlettuce\.github\.io/)
    .get('/actions/duplication.js')
    .reply(200, 'testcode');
  nock(/antonlettuce\.github\.io/)
    .get('/hexlet-basics/404testing-file')
    .reply(404);
});

test('basic download', async () => {
  await pageLoader('https://antonlettuce.github.io/hexlet-basics/testing-file', tempDir);
  const downloadedFilePath = path.join(tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file.html');
  const supportFilesPath = path.join(tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file_files');
  const newFile = await fsPromises.readFile(downloadedFilePath, 'utf-8');
  const supportFiles = await fsPromises.readdir(supportFilesPath);
  expect(newFile).toContain('antonlettuce-github-io-hexlet-basics-testing-file_files/actions-duplication.js');
  expect(newFile).toContain('antonlettuce-github-io-hexlet-basics-testing-file_files/assets-application.js');
  expect(supportFiles).toEqual(['actions-duplication.js', 'assets-application.js']);
});

test('404 error', async () => {
  await expect(pageLoader('https://antonlettuce.github.io/hexlet-basics/404testing-file')).rejects.toThrow();
});

test('no output directory', async () => {
  await expect(pageLoader('https://antonlettuce.github.io/hexlet-basics/testing-file', '/nonexist')).rejects.toThrow();
});
