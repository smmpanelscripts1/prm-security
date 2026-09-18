(function () {
var app = flarum.core.compat['admin/app'] || flarum.core.compat.app;

function t(key) {
  return app.translator.trans('prm-security.admin.settings.' + key);
}

app.initializers.add('prm-security', function () {
  app.extensionData
    .for('prm-security')
    .registerSetting({
      setting: 'prm-security.provider',
      type: 'select',
      label: t('provider_label'),
      help: t('provider_help'),
      options: {
        none: t('provider_none'),
        recaptcha_v2: t('provider_recaptcha'),
        hcaptcha: t('provider_hcaptcha'),
        turnstile: t('provider_turnstile'),
      },
      default: 'none',
    })
    .registerSetting({
      setting: 'prm-security.site_key',
      type: 'text',
      label: t('site_key_label'),
      help: t('site_key_help'),
    })
    .registerSetting({
      setting: 'prm-security.secret_key',
      type: 'text',
      label: t('secret_key_label'),
      help: t('secret_key_help'),
    })
    .registerSetting({
      setting: 'prm-security.on_register',
      type: 'boolean',
      label: t('on_register_label'),
    })
    .registerSetting({
      setting: 'prm-security.on_login',
      type: 'boolean',
      label: t('on_login_label'),
    });
});

module.exports = {};
})();
