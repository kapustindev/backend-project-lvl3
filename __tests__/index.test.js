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
  const url = new URL('https://antonlettuce.github.io/hexlet-basics/testing-file');
  const domain = url.origin;

  test('basic download', async () => {
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    const response = await fsPromises.readFile(responseData, 'utf-8');

    nock(domain)
      .get(url.pathname)
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

    await pageLoader(url.href, tempDir);

    const expectedHtml = await fsPromises.readFile(resultData, 'utf-8');
    const downloadedFilePath = path.join(tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file.html');
    const actualHtml = await fsPromises.readFile(downloadedFilePath, 'utf-8');
    const assetPath = path.join(tempDir, 'antonlettuce-github-io-hexlet-basics-testing-file_files', 'assets-application.js');
    const asset = await fsPromises.readFile(assetPath, 'utf-8');

    expect(actualHtml).toEqual(expectedHtml);
    expect(asset).toContain('simplecode');
  });

  test('404 error', async () => {
    nock(domain)
      .get(url.pathname)
      .reply(404)
      .log(console.log);

    await expect(pageLoader(url.href)).rejects.toThrow();
  });

  test('no output directory', async () => {
    await expect(pageLoader(url.href, '/nonexist')).rejects.toThrow();
  });
});
