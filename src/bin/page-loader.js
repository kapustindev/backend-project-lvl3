#!/usr/bin/env node
import program from 'commander';
import process from 'process';
import { version } from '../../package.json';
import downloadPage from '..';

program
  .version(version)
  .description('Downloads page from web with local paths')
  .arguments('<pageUrl>')
  .option('--output [localPath]', 'future path of downloaded page', process.cwd())
  .action((pageUrl) => {
    downloadPage(pageUrl, program.output)
      .then((filename) => {
        console.log(`${pageUrl} saved as ${filename}`);
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  })
  .parse(process.argv);
