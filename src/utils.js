const makeMainSlug = (url) => {
  const href = `${url.hostname}${url.pathname}`;
  return href.replace(/\W/g, '-');
};

const makeAssetSlug = (url) => {
  const changedUrl = url.replace(/\//g, '-');
  return changedUrl[0] === '-' ? changedUrl.slice(1) : changedUrl;
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
