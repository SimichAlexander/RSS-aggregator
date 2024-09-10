import onChange from 'on-change';

export default (elements, state, i18nextInstance) => {
  const renderPost = (title, description, link) => {
    const idData = _.uniqueId();
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
    aEl.setAttribute('data-id', idData);
    aEl.textContent = title;
    aEl.addEventListener('click', () => {
      if (!state.uiState.posts.includes(link)) {
        watchedState.uiState.posts.push(link);
      }
    });

    const btnEl = document.createElement('button');
    btnEl.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    btnEl.setAttribute('type', 'button');
    btnEl.setAttribute('data-bs-toggle', 'modal');
    btnEl.setAttribute('data-bs-target', '#modal');
    btnEl.setAttribute('data-id', idData);
    btnEl.textContent = i18nextInstance.t('viewing');
    state.modalWindow.modalList[idData] = { title, description, link };
    btnEl.addEventListener('click', (event) => {
      if (!state.uiState.posts.includes(link)) {
        watchedState.uiState.posts.push(link);
      }
      watchedState.modalWindow.active = event.target.getAttribute('data-id');
    });
    liEl.append(aEl, btnEl);
    return liEl;
  };

  const renderFeed = (title, description) => {
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item', 'border-0', 'border-end-0');
    const h3El = document.createElement('h3');
    h3El.classList.add('h6', 'm-0');
    h3El.textContent = title;
    const pEl = document.createElement('p');
    pEl.classList.add('m-0', 'small', 'text-black-50');
    pEl.textContent = description;
    liEl.append(h3El, pEl);
    return liEl;
  };

  const watchedState = onChange(state, (path, value) => {
    if (path === 'form.status') {
      if (value === 'valid') {
        elements.form.reset();
        elements.input.focus();

        elements.input.classList.remove('is-invalid');
        elements.feedback.classList.add('text-success');
        elements.feedback.classList.remove('text-danger');
        elements.feedsCardTitle.textContent = 'Фиды';
        elements.postsCardTitle.textContent = 'Посты';
      } else {
        elements.input.classList.add('is-invalid');
        elements.feedback.classList.remove('text-success');
        elements.feedback.classList.add('text-danger');
      }
    }
    if (path === 'form.message') {
      elements.feedback.textContent = value;
    }
    if (path === 'feedList') {
      const feedItem = value[value.length - 1];
      elements.ulElFeeds.prepend(renderFeed(feedItem.title, feedItem.description));
    }
    if (path === 'postList') {
      const postItem = value[value.length - 1];
      elements.ulElPosts.prepend(renderPost(postItem.title, postItem.description, postItem.link));
    }

    if (path === 'uiState.posts') {
      const link = value[value.length - 1];
      const aEl = document.querySelector(`a[href="${link}"]`);
      aEl.classList.remove('fw-bold');
      aEl.classList.add('fw-normal', 'link-secondary');
    }

    if (path === 'modalWindow.active') {
      const elId = value;
      elements.modalTitle.textContent = state.modalWindow.modalList[elId].title;
      elements.modalBody.textContent = state.modalWindow.modalList[elId].description;
      elements.fullArticle.setAttribute('href', state.modalWindow.modalList[elId].link);
    }
  });

  return watchedState;
};
