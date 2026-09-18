<?php

namespace Prm\Security;

use Flarum\Foundation\ValidationException;
use Flarum\Settings\SettingsRepositoryInterface;
use Psr\Http\Message\ServerRequestInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

class Captcha
{
    public const NONE = 'none';
    public const RECAPTCHA = 'recaptcha_v2';
    public const HCAPTCHA = 'hcaptcha';
    public const TURNSTILE = 'turnstile';

    public function __construct(
        protected SettingsRepositoryInterface $settings,
        protected TranslatorInterface $translator
    ) {
    }

    public function provider(): string
    {
        $provider = (string) $this->settings->get('prm-security.provider', self::NONE);

        if (! in_array($provider, [self::RECAPTCHA, self::HCAPTCHA, self::TURNSTILE], true)) {
            return self::NONE;
        }

        if ($this->siteKey() === '' || $this->secretKey() === '') {
            return self::NONE;
        }

        return $provider;
    }

    public function siteKey(): string
    {
        return trim((string) $this->settings->get('prm-security.site_key', ''));
    }

    public function secretKey(): string
    {
        return trim((string) $this->settings->get('prm-security.secret_key', ''));
    }

    public function enabledFor(string $place): bool
    {
        if ($this->provider() === self::NONE) {
            return false;
        }

        $key = $place === 'login' ? 'prm-security.on_login' : 'prm-security.on_register';
        $value = $this->settings->get($key, '1');

        return $value === '1' || $value === 1 || $value === true;
    }

    public function assertValid(?string $token): void
    {
        if (! $this->verify($token)) {
            throw new ValidationException([
                'prm-captcha-token' => $this->translator->trans('prm-security.forum.invalid'),
            ]);
        }
    }

    public function verify(?string $token, ?string $ip = null): bool
    {
        $provider = $this->provider();

        if ($provider === self::NONE) {
            return true;
        }

        $token = trim((string) $token);

        if ($token === '') {
            return false;
        }

        $endpoint = match ($provider) {
            self::RECAPTCHA => 'https://www.google.com/recaptcha/api/siteverify',
            self::HCAPTCHA => 'https://hcaptcha.com/siteverify',
            self::TURNSTILE => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            default => '',
        };

        if ($endpoint === '') {
            return false;
        }

        if ($ip === null) {
            $ip = $this->requestIp();
        }

        $payload = [
            'secret' => $this->secretKey(),
            'response' => $token,
        ];

        if ($ip) {
            $payload['remoteip'] = $ip;
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => http_build_query($payload),
                'timeout' => 8,
                'ignore_errors' => true,
            ],
        ]);

        $raw = @file_get_contents($endpoint, false, $context);

        if (! is_string($raw) || $raw === '') {
            return false;
        }

        $json = json_decode($raw, true);

        return is_array($json) && ! empty($json['success']);
    }

    protected function requestIp(): ?string
    {
        try {
            $request = resolve(ServerRequestInterface::class);
        } catch (\Throwable $e) {
            return null;
        }

        if (! $request instanceof ServerRequestInterface) {
            return null;
        }

        $ip = $request->getAttribute('ipAddress');

        if (is_string($ip) && $ip !== '') {
            return $ip;
        }

        $params = $request->getServerParams();

        if (! empty($params['REMOTE_ADDR']) && is_string($params['REMOTE_ADDR'])) {
            return $params['REMOTE_ADDR'];
        }

        return null;
    }
}
