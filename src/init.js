import * as yup from 'yup';
import * as _ from 'lodash';
import i18next from 'i18next';

import resources from './locales/index.js';
import parseFeed from './parseFeed.js';
import parsePost from './parsePost.js';
import watcher from './watcher.js';
import locale from './locales/locale.js';

const getURL = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

const getUrlList = (feedList) => feedList.map((feedItem) => feedItem.url);

const getPostLinkList = (postList) => postList.map((postItem) => postItem.link);

export default () => {
  const i18nextInstance = i18next.createInstance();
  const i18Promise = i18nextInstance
    .init({
      lng: 'ru',
      debug: true,
      resources,
    })
    .then(() => {
      const initState = {
        form: {
          status: '',
          messageKey: '',
        },
        feedList: [],
        postList: [],
        modalWindow: {
          active: '',
        },
        uiState: {
          posts: [],
        },
      };

      const elements = {
        form: document.querySelector('.rss-form'),
        input: document.querySelector('#url-input'),
        feedback: document.querySelector('.feedback'),
        feedsCardTitle: document.querySelector('.feeds .card-title'),
        ulElFeeds: document.querySelector('.feeds ul'),
        postsCardTitle: document.querySelector('.posts .card-title'),
        ulElPosts: document.querySelector('.posts ul'),
        modalTitle: document.querySelector('.modal-title'),
        modalBody: document.querySelector('.modal-body'),
        fullArticle: document.querySelector('.full-article'),
      };

      const watchedState = watcher(elements, initState, i18nextInstance);
      yup.setLocale(locale);

      const validateURL = (fields, callback) => {
        const schema = yup.string().url().required().notOneOf(getUrlList(watchedState.feedList));
        schema
          .validate(fields, { abortEarly: false })
          .then(() => {
            callback({});
          })
          .catch((e) => {
            callback(e);
          });
      };

      const fetchPosts = (url) => {
        fetch(getURL(url))
          .then((response) => {
            if (response.ok) return response.json();
            throw new Error('Network response was not ok.');
          })
          .then((data) => {
            const feedItem = parseFeed(data.contents);
            if (feedItem.isRss) {
              watchedState.form.status = 'valid';
              watchedState.form.messageKey = 'success';

              feedItem.url = url;
              watchedState.feedList.push(feedItem);
              feedItem.items.forEach((item) => {
                const id = _.uniqueId();
                const postItem = parsePost(item);
                watchedState.postList.push({ id, ...postItem });
              });
            } else {
              watchedState.form.status = 'invalid';
              watchedState.form.messageKey = 'notRss';
            }
          })
          .catch(() => {
            watchedState.form.messageKey = 'networkError';
          });
      };

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');
        validateURL(url, (res) => {
          if (_.isEmpty(res)) {
            fetchPosts(url);
          } else {
            watchedState.form.messageKey = res.errors[0].key;
            watchedState.form.status = 'invalid';
          }
        });
      });

      elements.ulElPosts.addEventListener('click', (e) => {
        if (!('id' in e.target.dataset)) {
          return;
        }
        const { id } = e.target.dataset;

        if (!watchedState.uiState.posts.includes(id)) {
          watchedState.uiState.posts.push(id);
        }

        if (e.target.classList.contains('btn')) {
          watchedState.modalWindow.active = id;
        }
      });

      const fetchNewPosts = (url) => {
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
                const id = _.uniqueId();
                watchedState.postList.push({ id, ...postItem });
              }
            });
          });
      };

      const delay = () => {
        if (watchedState.feedList.length !== 0) {
          getUrlList(watchedState.feedList).forEach((item) => {
            fetchNewPosts(item);
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
