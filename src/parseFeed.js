export default (data) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(data, 'application/xml');
  const feedItem = {};
  feedItem.rss = xmlDoc.querySelector('rss') !== null;
  if (feedItem.rss) {
    feedItem.title = xmlDoc.querySelector('title').textContent;
    feedItem.description = xmlDoc.querySelector('description').textContent;
    feedItem.items = xmlDoc.querySelectorAll('item');
  }
  return feedItem;
};
