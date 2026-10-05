<?php

namespace Prm\Security;

use Flarum\Api\Resource\ForumResource;
use Flarum\Api\Schema;
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

    (new Extend\ApiResource(ForumResource::class))
        ->fields(fn () => [
            Schema\Str::make('prmCaptchaProvider')
                ->get(fn () => resolve(Captcha::class)->provider()),
            Schema\Str::make('prmCaptchaSiteKey')
                ->get(fn () => resolve(Captcha::class)->siteKey()),
            Schema\Boolean::make('prmCaptchaOnLogin')
                ->get(fn () => resolve(Captcha::class)->enabledFor('login')),
            Schema\Boolean::make('prmCaptchaOnRegister')
                ->get(fn () => resolve(Captcha::class)->enabledFor('register')),
        ]),

    (new Extend\Validator(LogInValidator::class))
        ->configure(ConfigureLogInCaptcha::class),

    (new Extend\Event())
        ->listen(Saving::class, ValidateRegisterCaptcha::class),
];
