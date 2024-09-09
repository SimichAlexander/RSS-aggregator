import * as yup from 'yup';
import * as _ from 'lodash';
import i18next from 'i18next';
import onChange from 'on-change';

import resources from './locales/index.js';
import parseFeed from './parseFeed.js';
import parsePost from './parsePost.js';

export default () => {
  const i18nextInstance = i18next.createInstance();
  const i18Promise = i18nextInstance
    .init({
      lng: 'ru',
      debug: true,
      resources,
    })
    .then(() => {
      const state = {
        form: {
          status: '',
          message: '',
        },
        feedList: [],
        postList: [],
        modalWindow: {
          active: '',
          modalList: {},
        },
        uiState: {
          posts: [],
        },
      };

      const input = document.querySelector('#url-input');
      const feedback = document.querySelector('.feedback');

      const feeds = document.querySelector('.feeds');
      const feedsCardTitle = feeds.querySelector('.card-title');
      const ulElFeeds = feeds.querySelector('ul');

      const posts = document.querySelector('.posts');
      const postsCardTitle = posts.querySelector('.card-title');
      const ulElPosts = posts.querySelector('ul');

      const form = document.querySelector('form');

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
          const feedItem = value[value.length - 1];
          // const feedItem = state.feedList[state.feedList.length - 1];
          ulElFeeds.prepend(renderFeed(feedItem.title, feedItem.description));
        }
        if (path === 'postList') {
          const postItem = value[value.length - 1];
          // const postItem = state.postList[state.postList.length - 1];
          ulElPosts.prepend(renderPost(postItem.title, postItem.description, postItem.link));
        }

        if (path === 'uiState.posts') {
          const link = value[value.length - 1];
          const aEl = document.querySelector(`a[href="${link}"]`);
          aEl.classList.remove('fw-bold');
          aEl.classList.add('fw-normal', 'link-secondary');
        }

        if (path === 'modalWindow.active') {
          const elId = value;

          const modalTitle = document.querySelector('.modal-title');
          modalTitle.textContent = state.modalWindow.modalList[elId].title;

          const modalBody = document.querySelector('.modal-body');
          modalBody.textContent = state.modalWindow.modalList[elId].description;

          const fullArticle = document.querySelector('.full-article');
          fullArticle.setAttribute('href', state.modalWindow.modalList[elId].link);
        }
      });

      const getURL = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

      const getUrlList = (feedList) => feedList.map((feedItem) => feedItem.url);

      const getPostLinkList = (postList) => postList.map((postItem) => postItem.link);

      yup.setLocale({
        string: {
          url: () => {
            watchedState.form.message = i18nextInstance.t('validityUrl');
            watchedState.form.status = 'invalid';
          },
        },
        mixed: {
          required: () => {
            watchedState.form.message = i18nextInstance.t('empty');
            watchedState.form.status = 'invalid';
          },
          notOneOf: () => {
            watchedState.form.message = i18nextInstance.t('duplicate');
            watchedState.form.status = 'invalid';
          },
        },
      });

      const validate = (fields) => {
        try {
          const schema = yup.string().url().required().notOneOf(getUrlList(state.feedList));
          // перенес сюда, чтобы getUrlList(state.feedList) каждый раз брался актуальный
          schema.validateSync(fields, { abortEarly: false });
          return {};
        } catch (e) {
          return e;
        }
      };

      const queryFunc = (url) => {
        fetch(getURL(url))
          .then((response) => {
            if (response.ok) return response.json();
            throw new Error('Network response was not ok.');
          })
          .then((data) => {
            const feedItem = parseFeed(data.contents);
            if (feedItem.isRss) {
              watchedState.form.status = 'valid';
              watchedState.form.message = i18nextInstance.t('success');
              feedItem.url = url;
              watchedState.feedList.push(feedItem);
              feedItem.items.forEach((item) => {
                const postItem = parsePost(item);
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

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');
        if (_.isEmpty(validate(url))) {
          queryFunc(url);
        }
      });

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
              if (!getPostLinkList(state.postList).includes(postItem.link)) {
                watchedState.postList.push(postItem);
              }
            });
          });
      };

      const delay = () => {
        if (getUrlList(state.feedList).length !== 0) {
          getUrlList(state.feedList).forEach((item) => {
            delayQueryFunc(item);
          });
        }
        setTimeout(() => {
          delay();
        }, 5000);
      };

      setTimeout(() => {
        delay();
      }, 5000);
    });
  return i18Promise;
};
