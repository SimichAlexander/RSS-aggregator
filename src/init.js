import './styles.scss';
import 'bootstrap';

import * as yup from 'yup';
import * as _ from 'lodash';
import onChange from 'on-change';
import keyBy from 'lodash/keyBy.js';
import uniqueId from 'lodash';
import isEmpty from 'lodash/isEmpty.js';
import i18next from 'i18next';

export default async () => {
  const createPostsElement = (title, description, href) => {
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

  const createFeedsElement = (title, description) => {
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
  const queryFunc = (url) => {
    fetch(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error('Network response was not ok.');
      })
      .then((data) => {
        const textFile = parserFunc(data.contents);
        if (textFile.querySelector('title') !== null) {
          watchedState.form.feedList.push(textFile);

          const items = textFile.querySelectorAll('item');
          items.forEach((item) => {
            if (!state.form.postLinkList.includes(item.querySelector('link').textContent)) {
              const link = item.querySelector('link').textContent;
              state.form.postLinkList.push(link);
              watchedState.form.postList.push(item);
            }
          });
        } else {
          watchedState.form.state = 'invalid';
          watchedState.form.message = i18nextInstance.t('validityRss');
        }
      });
  };

  const delayQueryFunc = (url) => {
    fetch(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error('Network response was not ok.');
      })
      .then((data) => {
        const textFile = parserFunc(data.contents);
        const items = textFile.querySelectorAll('item');
        items.forEach((item) => {
          if (!state.form.postLinkList.includes(item.querySelector('link').textContent)) {
            const link = item.querySelector('link').textContent;
            state.form.postLinkList.push(link);
            watchedState.form.postList.push(item);
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

  const parserFunc = (data) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'application/xml');
    return xmlDoc;
  };

  const validate = (fields) => {
    try {
      schema.validateSync(fields, { abortEarly: false });
      return {};
    } catch (e) {
      return keyBy(e.inner, 'path');
    }
  };

  const i18nextInstance = i18next.createInstance();
  await i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru: {
        translation: {
          success: 'RSS успешно загружен',
          duplicate: 'RSS уже существует',
          // empty: 'Не должно быть пустым', // Форма и так не даёт отправить пустое поле
          validityUrl: 'Ссылка должна быть валидным URL',
          validityRss: 'Ресурс не содержит валидный RSS',
          viewing: 'Просмотр', // (!) надо как-то обработать
          networkError: 'Ошибка сети', // (!) надо как-то обработать
        },
      },
    },
  });

  const state = {
    form: {
      state: '',
      currentUrl: '',
      urlList: [],
      feedList: [],
      postList: [],
      postLinkList: [],
      descriptionList: {},
      message: '',
    },
  };

  const schema = yup.string().required().url();

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
    if (path === 'form.state') {
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
    if (path === 'form.feedList') {
      const textFile = state.form.feedList[state.form.feedList.length - 1];
      ulElFeeds.prepend(createFeedsElement(textFile.querySelector('title').textContent, textFile.querySelector('description').textContent));
    }
    if (path === 'form.postList') {
      const item = state.form.postList[state.form.postList.length - 1];

      ulElPosts.prepend(
        createPostsElement(
          item.querySelector('title').textContent,
          item.querySelector('description').textContent,
          item.querySelector('link').textContent
        )
      );
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');

    state.form.currentUrl = url;
    if (isEmpty(validate(state.form.currentUrl))) {
      if (!state.form.urlList.includes(state.form.currentUrl)) {
        watchedState.form.state = 'valid';
        watchedState.form.message = i18nextInstance.t('success');
        state.form.urlList.push(state.form.currentUrl);
        queryFunc(state.form.currentUrl);
      } else {
        watchedState.form.state = 'invalid';
        watchedState.form.message = i18nextInstance.t('duplicate');
      }
    } else {
      watchedState.form.state = 'invalid';
      watchedState.form.message = i18nextInstance.t('validityUrl');
    }
  });

  setTimeout(() => {
    delay();
  }, 5000);
};
