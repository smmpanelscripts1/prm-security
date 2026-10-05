import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';

const scriptState = {
  loading: false,
  loaded: false,
  queue: [],
};

function provider() {
  return app.forum.attribute('prmCaptchaProvider') || 'none';
}

function siteKey() {
  return app.forum.attribute('prmCaptchaSiteKey') || '';
}

function enabled(place) {
  if (provider() === 'none' || !siteKey()) {
    return false;
  }
  if (place === 'login') {
    return !!app.forum.attribute('prmCaptchaOnLogin');
  }
  return !!app.forum.attribute('prmCaptchaOnRegister');
}

function api() {
  const p = provider();
  if (p === 'recaptcha_v2') {
    return window.grecaptcha;
  }
  if (p === 'hcaptcha') {
    return window.hcaptcha;
  }
  if (p === 'turnstile') {
    return window.turnstile;
  }
  return null;
}

function scriptSrc() {
  const p = provider();
  if (p === 'recaptcha_v2') {
    return 'https://www.google.com/recaptcha/api.js?onload=prmCaptchaOnload&render=explicit';
  }
  if (p === 'hcaptcha') {
    return 'https://js.hcaptcha.com/1/api.js?onload=prmCaptchaOnload&render=explicit';
  }
  if (p === 'turnstile') {
    return 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=prmCaptchaOnload&render=explicit';
  }
  return '';
}

function loadSdk(done) {
  if (api()) {
    scriptState.loaded = true;
    done();
    return;
  }
  scriptState.queue.push(done);
  if (scriptState.loading) {
    return;
  }
  const src = scriptSrc();
  if (!src) {
    return;
  }
  scriptState.loading = true;
  window.prmCaptchaOnload = function () {
    scriptState.loaded = true;
    scriptState.loading = false;
    const q = scriptState.queue.slice();
    scriptState.queue = [];
    q.forEach((fn) => fn());
  };
  const el = document.createElement('script');
  el.src = src;
  el.async = true;
  el.defer = true;
  document.head.appendChild(el);
}

function renderWidget(modal, host) {
  const sdk = api();
  if (!sdk || !host) {
    return;
  }
  host.innerHTML = '';
  const options = {
    sitekey: siteKey(),
    theme: 'dark',
    callback: function (token) {
      modal.prmCaptchaToken = token;
    },
    'expired-callback': function () {
      modal.prmCaptchaToken = '';
    },
    'error-callback': function () {
      modal.prmCaptchaToken = '';
    },
  };
  try {
    modal.prmCaptchaWidget = sdk.render(host, options);
    modal.prmCaptchaToken = '';
  } catch (e) {
    modal.prmCaptchaWidget = null;
  }
}

function resetWidget(modal) {
  modal.prmCaptchaToken = '';
  const sdk = api();
  if (!sdk || modal.prmCaptchaWidget == null) {
    return;
  }
  try {
    if (typeof sdk.reset === 'function') {
      sdk.reset(modal.prmCaptchaWidget);
    }
  } catch (e) {}
}

function captchaField(modal) {
  return (
    <div className="Form-group PrmCaptcha">
      <div
        className="PrmCaptcha-slot"
        oncreate={(vnode) => {
          loadSdk(() => renderWidget(modal, vnode.dom));
        }}
        onremove={() => {
          modal.prmCaptchaToken = '';
          modal.prmCaptchaWidget = null;
        }}
      />
    </div>
  );
}

app.initializers.add('prm-security', () => {
  extend('flarum/forum/components/LogInModal', 'fields', function (items) {
    if (!enabled('login')) {
      return;
    }
    items.add('prm-captcha', captchaField(this), 5);
  });

  extend('flarum/forum/components/LogInModal', 'loginParams', function (data) {
    if (!enabled('login')) {
      return;
    }
    data['prm-captcha-token'] = this.prmCaptchaToken || '';
  });

  extend('flarum/forum/components/LogInModal', 'onerror', function () {
    resetWidget(this);
  });

  extend('flarum/forum/components/SignUpModal', 'fields', function (items) {
    if (!enabled('register') || this.attrs.token) {
      return;
    }
    items.add('prm-captcha', captchaField(this), 5);
  });

  extend('flarum/forum/components/SignUpModal', 'submitData', function (data) {
    if (!enabled('register') || this.attrs.token) {
      return;
    }
    data['prm-captcha-token'] = this.prmCaptchaToken || '';
  });

  extend('flarum/forum/components/SignUpModal', 'onerror', function () {
    resetWidget(this);
  });
});
