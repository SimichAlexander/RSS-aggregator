export default (data) => {
  const title = data.querySelector('title').textContent;
  const description = data.querySelector('description').textContent;
  const link = data.querySelector('link').textContent;
  return { title, description, link };
};
