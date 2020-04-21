import nock from 'nock';
import { promises as fsPromises } from 'fs';
import path from 'path';
import os from 'os';
import debug from 'debug';
import pageLoader from '../src';
import 'axios-debug-log';

const log = debug('nock');

nock.disableNetConnect();

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const responseData = getFixturePath('testing-file.html');
const resultData = getFixturePath('changedUrls.html');
const domain = 'https://antonlettuce.github.io';

let tempDir;
let response;

beforeAll(async () => {
  tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  response = await fsPromises.readFile(responseData, 'utf-8');
});

describe('correct data test', () => {
  test('basic download', async () => {
    nock(domain)
      .get('/hexlet-basics/testing-file')
      .reply(200, response)
      .log((info) => log(info));
    nock(domain)
      .get('/assets/application.js')
      .reply(200, 'simplecode')
      .log((info) => log(info));
    nock(domain)
      .get('/actions/duplication.js')
      .reply(200, 'testcode')
      .log((info) => log(info));
    await pageLoader('https://antonlettuce.github.io/hexlet-basics/testing-file', tempDir);
    const downloadedFilePath = path.join(tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file.html');
    const assetsPath = path.join(tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file_files', 'assets-application.js');
    const result = await fsPromises.readFile(resultData, 'utf-8');
    const downloadedFile = await fsPromises.readFile(downloadedFilePath, 'utf-8');
    const assets = await fsPromises.readFile(assetsPath, 'utf-8');
    expect(downloadedFile).toEqual(result);
    expect(assets).toContain('simplecode');
  });
});

describe('error tests', () => {
  test('404 error', async () => {
    nock(domain)
      .get('/hexlet-basics/404testing-file')
      .reply(404)
      .log((info) => log(info));
    await expect(pageLoader('https://antonlettuce.github.io/hexlet-basics/404testing-file')).rejects.toThrow();
  });

  test('no output directory', async () => {
    await expect(pageLoader('https://antonlettuce.github.io/hexlet-basics/testing-file', '/nonexist')).rejects.toThrow();
  });
});
