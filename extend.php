<?php

namespace Prm\Security;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Extend;
use Flarum\Forum\LogInValidator;
use Flarum\User\Event\Saving;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js'),

    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\Settings())
        ->default('prm-security.provider', 'none')
        ->default('prm-security.site_key', '')
        ->default('prm-security.secret_key', '')
        ->default('prm-security.on_login', '1')
        ->default('prm-security.on_register', '1'),

    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attributes(function (ForumSerializer $serializer) {
            $captcha = resolve(Captcha::class);

            return [
                'prmCaptchaProvider' => $captcha->provider(),
                'prmCaptchaSiteKey' => $captcha->siteKey(),
                'prmCaptchaOnLogin' => $captcha->enabledFor('login'),
                'prmCaptchaOnRegister' => $captcha->enabledFor('register'),
            ];
        }),

    (new Extend\Validator(LogInValidator::class))
        ->configure(ConfigureLogInCaptcha::class),

    (new Extend\Event())
        ->listen(Saving::class, ValidateRegisterCaptcha::class),
];
