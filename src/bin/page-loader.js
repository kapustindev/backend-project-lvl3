#!/usr/bin/env node
import program from 'commander';
import { version } from '../../package.json';

program
  .version(version)
  .description('Downloads page from web with local paths')
  .arguments('<pageUrl>')
  .option('--output [localPath]', 'future path of downloaded page', process.cwd())
  .parse(process.argv);
