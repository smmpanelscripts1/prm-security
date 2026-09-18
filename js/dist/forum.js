(function () {
var app = flarum.core.compat['forum/app'] || flarum.core.compat.app;
var LogInModal = flarum.core.compat['forum/components/LogInModal'];
var SignUpModal = flarum.core.compat['forum/components/SignUpModal'];
var extend = (flarum.core.compat['common/extend'] || {}).extend;
var m = window.m;

var scriptState = {
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
  var p = provider();
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
  var p = provider();
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
  var src = scriptSrc();
  if (!src) {
    return;
  }
  scriptState.loading = true;
  window.prmCaptchaOnload = function () {
    scriptState.loaded = true;
    scriptState.loading = false;
    var q = scriptState.queue.slice();
    scriptState.queue = [];
    q.forEach(function (fn) {
      fn();
    });
  };
  var el = document.createElement('script');
  el.src = src;
  el.async = true;
  el.defer = true;
  document.head.appendChild(el);
}

function renderWidget(modal, host) {
  var sdk = api();
  if (!sdk || !host) {
    return;
  }
  host.innerHTML = '';
  var options = {
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
  var sdk = api();
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
  return m('div.Form-group.PrmCaptcha', [
    m('div.PrmCaptcha-slot', {
      oncreate: function (vnode) {
        loadSdk(function () {
          renderWidget(modal, vnode.dom);
        });
      },
      onremove: function () {
        modal.prmCaptchaToken = '';
        modal.prmCaptchaWidget = null;
      },
    }),
  ]);
}

app.initializers.add('prm-security', function () {
  extend(LogInModal.prototype, 'fields', function (items) {
    if (!enabled('login')) {
      return;
    }
    items.add('prm-captcha', captchaField(this), 5);
  });

  extend(LogInModal.prototype, 'loginParams', function (data) {
    if (!enabled('login')) {
      return;
    }
    data['prm-captcha-token'] = this.prmCaptchaToken || '';
  });

  extend(LogInModal.prototype, 'onerror', function () {
    resetWidget(this);
  });

  extend(SignUpModal.prototype, 'fields', function (items) {
    if (!enabled('register') || this.attrs.token) {
      return;
    }
    items.add('prm-captcha', captchaField(this), 5);
  });

  extend(SignUpModal.prototype, 'submitData', function (data) {
    if (!enabled('register') || this.attrs.token) {
      return;
    }
    data['prm-captcha-token'] = this.prmCaptchaToken || '';
  });

  extend(SignUpModal.prototype, 'onerror', function () {
    resetWidget(this);
  });
});

module.exports = {};
})();
