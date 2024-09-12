import * as yup from 'yup';
import * as _ from 'lodash';
import i18next from 'i18next';

import resources from './locales/index.js';
import parseFeed from './parseFeed.js';
import parsePost from './parsePost.js';
import watcher from './watcher.js';

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
          active: [],
          modalList: [],
        },
        uiState: {
          posts: [],
        },
      };

      const elements = {
        form: document.querySelector('form'),
        input: document.querySelector('#url-input'),
        feedback: document.querySelector('.feedback'),
        feeds: document.querySelector('.feeds'),
        posts: document.querySelector('.posts'),
        feedsCardTitle: document.querySelector('.feeds .card-title'),
        ulElFeeds: document.querySelector('.feeds ul'),
        postsCardTitle: document.querySelector('.posts .card-title'),
        ulElPosts: document.querySelector('.posts ul'),
        modalTitle: document.querySelector('.modal-title'),
        modalBody: document.querySelector('.modal-body'),
        fullArticle: document.querySelector('.full-article'),
      };

      const watchedState = watcher(elements, state, i18nextInstance);
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
          const schema = yup.string().url().required().notOneOf(getUrlList(watchedState.feedList));
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
            watchedState.form.status = 'valid';
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

      elements.form.addEventListener('submit', (e) => {
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
              if (!getPostLinkList(watchedState.postList).includes(postItem.link)) {
                watchedState.postList.push(postItem);
              }
            });
          });
      };

      const delay = () => {
        if (watchedState.feedList.length !== 0) {
          getUrlList(watchedState.feedList).forEach((item) => {
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
