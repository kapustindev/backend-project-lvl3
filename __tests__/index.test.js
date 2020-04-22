import nock from 'nock';
import { promises as fsPromises } from 'fs';
import path from 'path';
import os from 'os';
import pageLoader from '../src';
import 'axios-debug-log';


nock.disableNetConnect();

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);


describe('correct data test', () => {
  const responseData = getFixturePath('before.html');
  const resultData = getFixturePath('after.html');
  const site = new URL('https://antonlettuce.github.io/hexlet-basics/testing-file');
  const domain = site.origin;

  test('basic download', async () => {
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    const response = await fsPromises.readFile(responseData, 'utf-8');
    const expectedHtml = await fsPromises.readFile(resultData, 'utf-8');
    const downloadedFilePath = path.join(tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file.html');
    const assetPath = path.join(tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file_files', 'assets-application.js');

    nock(domain)
      .get(site.pathname)
      .reply(200, response)
      .log(console.log);
    nock(domain)
      .get('/assets/application.js')
      .reply(200, 'simplecode')
      .log(console.log);
    nock(domain)
      .get('/actions/duplication.js')
      .reply(200, 'testcode')
      .log(console.log);

    await pageLoader('https://antonlettuce.github.io/hexlet-basics/testing-file', tempDir);

    const actualHtml = await fsPromises.readFile(downloadedFilePath, 'utf-8');
    const asset = await fsPromises.readFile(assetPath, 'utf-8');

    expect(actualHtml).toEqual(expectedHtml);
    expect(asset).toContain('simplecode');
  });

  test('404 error', async () => {
    nock(domain)
      .get(site.pathname)
      .reply(404)
      .log(console.log);

    await expect(pageLoader('https://antonlettuce.github.io/hexlet-basics/testing-file')).rejects.toThrow();
  });

  test('no output directory', async () => {
    await expect(pageLoader('https://antonlettuce.github.io/hexlet-basics/testing-file', '/nonexist')).rejects.toThrow();
  });
});
