import app from 'flarum/admin/app';
import Extend from 'flarum/common/extenders';

function t(key) {
  return app.translator.trans('prm-security.admin.settings.' + key);
}

export default [
  new Extend.Admin()
    .setting(() => ({
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
    }))
    .setting(() => ({
      setting: 'prm-security.site_key',
      type: 'text',
      label: t('site_key_label'),
      help: t('site_key_help'),
    }))
    .setting(() => ({
      setting: 'prm-security.secret_key',
      type: 'text',
      label: t('secret_key_label'),
      help: t('secret_key_help'),
    }))
    .setting(() => ({
      setting: 'prm-security.on_register',
      type: 'boolean',
      label: t('on_register_label'),
    }))
    .setting(() => ({
      setting: 'prm-security.on_login',
      type: 'boolean',
      label: t('on_login_label'),
    })),
];
