import onChange from 'on-change';

export default (elements, initState, i18nextInstance) => {
  const {
    form,
    input,
    feedback,
    feedsCardTitle,
    postsCardTitle,
    ulElFeeds,
    ulElPosts,
    modalTitle,
    modalBody,
    fullArticle,
  } = elements;

  const renderPost = () => {
    const postItem = initState.postList[initState.postList.length - 1];
    const { id, title, link } = postItem;

    const liEl = document.createElement('li');
    liEl.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );
    const aEl = document.createElement('a');
    aEl.classList.add('fw-bold');
    aEl.setAttribute('href', link);
    aEl.setAttribute('target', '_blank');
    aEl.setAttribute('rel', 'noopener noreferrer');
    aEl.setAttribute('data-id', id);
    aEl.textContent = title;

    const btnEl = document.createElement('button');
    btnEl.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    btnEl.setAttribute('type', 'button');
    btnEl.setAttribute('data-bs-toggle', 'modal');
    btnEl.setAttribute('data-bs-target', '#modal');
    btnEl.setAttribute('data-id', id);
    btnEl.textContent = i18nextInstance.t('viewing');
    liEl.append(aEl, btnEl);

    ulElPosts.prepend(liEl);
  };

  const renderFeed = () => {
    const feedItem = initState.feedList[initState.feedList.length - 1];
    const { title, description } = feedItem;

    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item', 'border-0', 'border-end-0');
    const h3El = document.createElement('h3');
    h3El.classList.add('h6', 'm-0');
    h3El.textContent = title;
    const pEl = document.createElement('p');
    pEl.classList.add('m-0', 'small', 'text-black-50');
    pEl.textContent = description;
    liEl.append(h3El, pEl);
    ulElFeeds.prepend(liEl);
  };

  const watchedState = onChange(initState, (path, value) => {
    if (path === 'form.status') {
      if (value === 'valid') {
        form.reset();
        input.focus();
        input.classList.remove('is-invalid');

        feedback.classList.add('text-success');
        feedback.classList.remove('text-danger');

        feedsCardTitle.textContent = 'Фиды';
        postsCardTitle.textContent = 'Посты';
      } else {
        input.classList.add('is-invalid');
        feedback.classList.remove('text-success');
        feedback.classList.add('text-danger');
      }
    }
    if (path === 'form.message') {
      feedback.textContent = value;
    }
    if (path === 'feedList') {
      renderFeed();
    }
    if (path === 'postList') {
      renderPost();
    }

    if (path === 'uiState.posts') {
      const id = initState.uiState.posts[initState.uiState.posts.length - 1];
      const aEl = document.querySelector(`a[data-id="${id}"]`);
      aEl.classList.remove('fw-bold');
      aEl.classList.add('fw-normal', 'link-secondary');
    }

    if (path === 'modalWindow.active') {
      const id = value;
      const post = initState.postList.find((item) => item.id === id);
      modalTitle.textContent = post.title;
      modalBody.textContent = post.description;
      fullArticle.setAttribute('href', post.link);
    }
  });

  return watchedState;
};
