import * as yup from 'yup';
import * as _ from 'lodash';
import i18next from 'i18next';

import resources from './locales/index.js';
import parseFeed from './parseFeed.js';
import parsePost from './parsePost.js';

import watchedState from './watchedState.js';

export default () => {
  const i18nextInstance = i18next.createInstance();
  const i18Promise = i18nextInstance
    .init({
      lng: 'ru',
      debug: true,
      resources,
    })
    .then(() => {
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

      const form = document.querySelector('form');

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
              if (!getPostLinkList(watchedState.postList).includes(postItem.link)) {
                watchedState.postList.push(postItem);
              }
            });
          });
      };

      const delay = () => {
        if (getUrlList(watchedState.feedList).length !== 0) {
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
