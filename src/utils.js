import { trim } from 'lodash';

const makeMainSlug = (url) => {
  const href = `${url.hostname}${url.pathname}`;
  return trim(href.replace(/\W/g, '-'), '-');
};

const makeAssetSlug = (url) => {
  const changedUrl = url.replace(/\//g, '-');
  return trim(changedUrl, '-');
};

const isLocal = (filepath, mainUrl) => {
  const assetUrl = new URL(filepath, mainUrl);
  return assetUrl.origin === mainUrl.origin;
};

export {
  makeMainSlug,
  makeAssetSlug,
  isLocal,
};
