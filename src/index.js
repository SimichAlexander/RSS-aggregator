import './styles.scss';
import 'bootstrap';

import * as yup from 'yup';
import onChange from 'on-change';
import keyBy from 'lodash/keyBy.js';
import isEmpty from 'lodash/isEmpty.js';
import i18next from 'i18next';

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
        validity: 'Ссылка должна быть валидным URL',
      },
    },
  },
});

const state = {
  form: {
    state: '',
    url: '',
    list: [],
    error: '',
  },
};

const schema = yup.string().required().url();

const input = document.querySelector('#url-input');
const feedback = document.querySelector('.feedback');

const watchedState = onChange(state, (path, value) => {
  if (path === 'form.state') {
    if (value === 'valid') {
      input.classList.remove('is-invalid');
      feedback.classList.add('text-success');
      feedback.classList.remove('text-danger');
    } else {
      input.classList.add('is-invalid');
      feedback.classList.remove('text-success');
      feedback.classList.add('text-danger');
    }
  }
  if (path === 'form.error') {
    feedback.textContent = value;
  }
});

const form = document.querySelector('form');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const url = formData.get('url');

  state.form.url = url;
  console.log(state);
  if (isEmpty(validate(state.form.url))) {
    if (!state.form.list.includes(state.form.url)) {
      watchedState.form.state = 'valid';
      watchedState.form.error = i18nextInstance.t('success');
      form.reset();
      input.focus();
      state.form.list.push(watchedState.form.url);
    } else {
      watchedState.form.state = 'invalid';
      watchedState.form.error = i18nextInstance.t('duplicate');
    }
  } else {
    watchedState.form.state = 'invalid';
    watchedState.form.error = i18nextInstance.t('validity');
  }
});
