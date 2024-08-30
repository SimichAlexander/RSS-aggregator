import * as yup from 'yup';
import * as _ from 'lodash';
import onChange from 'on-change';
import uniqueId from 'lodash';
import isEmpty from 'lodash/isEmpty.js';
import i18next from 'i18next';

import resources from './locales/index.js';
import parseFeed from './parseFeed.js';
import parsePost from './parsePost.js';

export default async () => {
  const renderPosts = (title, description, href) => {
    const idData = uniqueId();
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    const aEl = document.createElement('a');
    aEl.classList.add('fw-bold');
    aEl.setAttribute('href', href);
    aEl.setAttribute('target', '_blank');
    aEl.setAttribute('rel', 'noopener noreferrer');
    aEl.setAttribute('data-id', idData);
    aEl.textContent = title;
    aEl.addEventListener('click', (e) => {
      aEl.classList.remove('fw-bold');
      aEl.classList.add('fw-normal', 'link-secondary');
    });

    const btnEl = document.createElement('button');
    btnEl.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    btnEl.setAttribute('type', 'button');
    btnEl.setAttribute('data-bs-toggle', 'modal');
    btnEl.setAttribute('data-bs-target', '#modal');
    btnEl.setAttribute('data-id', idData);
    btnEl.textContent = i18nextInstance.t('viewing');
    btnEl.addEventListener('click', (e) => {
      aEl.classList.remove('fw-bold');
      aEl.classList.add('fw-normal', 'link-secondary');
      const elId = btnEl.getAttribute('data-id');
      const modalTitle = document.querySelector('.modal-title');
      modalTitle.textContent = document.querySelector(`a[data-id="${elId}"]`).textContent;

      const modalBody = document.querySelector('.modal-body');
      modalBody.textContent = state.form.descriptionList[elId].description;

      const fullArticle = document.querySelector('.full-article');
      fullArticle.setAttribute('href', state.form.descriptionList[elId].link);
    });
    state.form.descriptionList[idData] = { description, link: href };
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

  const getURL = (url) => {
    return `https://allorigins.hexlet.app/get?disableCache=true&url=` + `${encodeURIComponent(url)}`;
  };

  const queryFunc = (url) => {
    fetch(getURL(url))
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error('Network response was not ok.');
      })
      .then((data) => {
        const feedItem = parseFeed(data.contents);
        if (feedItem.rss) {
          watchedState.form.status = 'valid';
          watchedState.form.message = i18nextInstance.t('success');
          state.form.urlList.push(url);
          watchedState.feedList.push(feedItem);
          feedItem.items.forEach((item) => {
            const postItem = parsePost(item);
            state.form.postLinkList.push(postItem.link);
            watchedState.postList.push(postItem);
          });
        } else {
          watchedState.form.status = 'invalid';
          watchedState.form.message = i18nextInstance.t('validityRss');
        }
      })
      .catch(() => {
        watchedState.form.message = i18nextInstance.t('networkError');
      });
  };

  const delayQueryFunc = (url) => {
    fetch(getURL(url))
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error('Network response was not ok.');
      })
      .then((data) => {
        const feedItem = parseFeed(data.contents);
        feedItem.items.forEach((item) => {
          const postItem = parsePost(item);
          if (!state.form.postLinkList.includes(postItem.link)) {
            state.form.postLinkList.push(postItem.link);
            watchedState.postList.push(postItem);
          }
        });
      });
  };

  const delay = () => {
    if (state.form.urlList.length !== 0) {
      state.form.urlList.forEach((item) => {
        delayQueryFunc(item);
      });
    }
    setTimeout(() => {
      delay();
    }, 5000);
  };

  // yup.setLocale({
  //   string: {
  //     required: 'Не должно быть пустым',
  //     default: '?????????',
  //   },
  // });

  const schema = yup.string().url().required();

  const validate = (fields) => {
    try {
      schema.validateSync(fields, { abortEarly: false }); // notOneOf проверка на дубликат (не разобрался)
      return {};
    } catch (e) {
      console.log(e.errors);
      return e;
    }
  };

  const i18nextInstance = i18next.createInstance(); // заменить на промисы (не разобрался)
  await i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  });

  const state = {
    form: {
      status: '',
      urlList: [], // убрать
      postLinkList: [], // убрать

      descriptionList: {},
      message: '',
    },
    feedList: [],
    postList: [],
    modal: {},
    // В слое ui нужно как-то отслеживать нажата ли ссылка и делать ее серой если да
    uiState: {
      // accordion: [
      //   { companyId: 1, visibility: 'hidden' },
      //   { companyId: 2, visibility: 'shown' },
      //   { companyId: 3, visibility: 'hidden' },
      // ],
    },
  };

  const form = document.querySelector('form');

  const input = document.querySelector('#url-input');
  const feedback = document.querySelector('.feedback');

  const feeds = document.querySelector('.feeds');
  const feedsCardTitle = feeds.querySelector('.card-title');
  const ulElFeeds = feeds.querySelector('ul');

  const posts = document.querySelector('.posts');
  const postsCardTitle = posts.querySelector('.card-title');
  const ulElPosts = posts.querySelector('ul');

  const watchedState = onChange(state, (path, value) => {
    // в отдельный файл
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
      const feedItem = value[value.length - 1]; // const feedItem = state.feedList[state.feedList.length - 1];
      ulElFeeds.prepend(renderFeed(feedItem.title, feedItem.description));
    }
    if (path === 'postList') {
      const postItem = value[value.length - 1]; // const postItem = state.postList[state.postList.length - 1];
      ulElPosts.prepend(renderPosts(postItem.title, postItem.description, postItem.link));
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    if (isEmpty(validate(url))) {
      if (!state.form.urlList.includes(url)) {
        queryFunc(url);
      } else {
        watchedState.form.status = 'invalid';
        watchedState.form.message = i18nextInstance.t('duplicate');
      }
    } else {
      watchedState.form.status = 'invalid';
      watchedState.form.message = i18nextInstance.t('validityUrl');
    }
  });

  setTimeout(() => {
    delay();
  }, 5000);
};
