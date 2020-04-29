#!/usr/bin/env node
import program from 'commander';
import { version } from '../../package.json';
import downloadPage from '..';

program
  .version(version)
  .description('Downloads page from web with local paths')
  .arguments('<pageUrl>')
  .option('--output [directory]', 'output dir', process.cwd())
  .action((pageUrl) => {
    downloadPage(pageUrl, program.output)
      .then((path) => {
        console.log(`Saved succesfully as ${path}!`);
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  })
  .parse(process.argv);
