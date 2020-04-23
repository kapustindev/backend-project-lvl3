const slugMain = (url) => {
  const href = `${url.hostname}${url.pathname}`;
  return href.replace(/\W/g, '-');
};

const slugAsset = (url, base) => {
  const objURL = new URL(url, base);
  const supFile = objURL.pathname;
  return supFile.split('/').join('-').slice(1);
};

const isLocal = (filepath, mainUrl) => {
  const assetUrl = new URL(filepath, mainUrl.href);
  return filepath ? assetUrl.hostname === mainUrl.hostname : false;
};

export {
  slugMain,
  slugAsset,
  isLocal,
};
