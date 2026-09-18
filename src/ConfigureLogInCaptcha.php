<?php

namespace Prm\Security;

use Flarum\Foundation\AbstractValidator;
use Illuminate\Validation\Validator;

class ConfigureLogInCaptcha
{
    public function __construct(protected Captcha $captcha)
    {
    }

    public function __invoke(AbstractValidator $flarumValidator, Validator $validator): void
    {
        if (! $this->captcha->enabledFor('login')) {
            return;
        }

        $validator->addRules([
            'prm-captcha-token' => ['nullable', 'string'],
        ]);

        $captcha = $this->captcha;

        $validator->after(function (Validator $validator) use ($captcha) {
            $token = (string) ($validator->getData()['prm-captcha-token'] ?? '');

            if (! $captcha->verify($token)) {
                $validator->errors()->add(
                    'prm-captcha-token',
                    resolve(\Symfony\Contracts\Translation\TranslatorInterface::class)->trans('prm-security.forum.invalid')
                );
            }
        });
    }
}
