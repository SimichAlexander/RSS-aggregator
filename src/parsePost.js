export default (data) => {
  const postItem = {};
  postItem.title = data.querySelector('title').textContent;
  postItem.description = data.querySelector('description').textContent;
  postItem.link = data.querySelector('link').textContent;
  return postItem;
};
