<?php

namespace Prm\Security;

use Flarum\User\Event\Saving;
use Illuminate\Support\Arr;

class ValidateRegisterCaptcha
{
    public function __construct(protected Captcha $captcha)
    {
    }

    public function handle(Saving $event): void
    {
        if ($event->user->exists || ! $event->actor->isGuest()) {
            return;
        }

        if (! $this->captcha->enabledFor('register')) {
            return;
        }

        if (Arr::get($event->data, 'attributes.token')) {
            return;
        }

        $this->captcha->assertValid(Arr::get($event->data, 'attributes.prm-captcha-token'));
    }
}
