export default (url, base = url) => {
  const objURL = new URL(url, base);
  if (url !== base) {
    const supFile = objURL.pathname;
    return supFile.split('/').join('-').slice(1);
  }
  const urlPath = objURL.pathname.length === 1 ? '' : objURL.pathname;
  const href = `${objURL.hostname}${urlPath}`;
  const finalName = href.replace(/[^a-zA-Z0-9]+/g, '-');
  return finalName;
};
