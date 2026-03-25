#!/usr/bin/env python3
import json
import os
import subprocess
import urllib.request
from pathlib import Path

SAMPLE_RATE = 48000
ROOT = Path("/Users/moey/.openclaw/workspace")
ENV_CANDIDATES = [
    ROOT / "friends-ai" / ".env",
]


def run(cmd, **kwargs):
    print("+", " ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True, **kwargs)


class VoiceProviderError(RuntimeError):
    pass


def load_env_fallbacks():
    for path in ENV_CANDIDATES:
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


class BaseVoiceProvider:
    name = "base"

    def synthesize(self, text: str, voice_config: dict, out_wav: Path):
        raise NotImplementedError


class MacSayProvider(BaseVoiceProvider):
    name = "say"

    def synthesize(self, text: str, voice_config: dict, out_wav: Path):
        voice_name = voice_config["voice"]
        rate = str(voice_config.get("tts_rate", 185))
        tmp_aiff = out_wav.with_suffix(".aiff")
        run(["say", "-v", voice_name, "-r", rate, "-o", str(tmp_aiff), text])
        run(["ffmpeg", "-y", "-i", str(tmp_aiff), "-ar", str(SAMPLE_RATE), "-ac", "1", str(out_wav)])
        tmp_aiff.unlink(missing_ok=True)


class OpenAITTSProvider(BaseVoiceProvider):
    name = "openai"

    def synthesize(self, text: str, voice_config: dict, out_wav: Path):
        load_env_fallbacks()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise VoiceProviderError("OPENAI_API_KEY is not set")
        raise VoiceProviderError("OpenAI TTS adapter scaffolded but not enabled yet on this host")


class ElevenLabsProvider(BaseVoiceProvider):
    name = "elevenlabs"

    def synthesize(self, text: str, voice_config: dict, out_wav: Path):
        load_env_fallbacks()
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise VoiceProviderError("ELEVENLABS_API_KEY is not set")

        voice_id = voice_config.get("voice_id")
        if not voice_id:
            raise VoiceProviderError("ElevenLabs voice_id is missing from voice config")

        model_id = voice_config.get("model_id", "eleven_flash_v2_5")
        output_format = voice_config.get("output_format", "mp3_44100_128")
        settings = voice_config.get("voice_settings", {
            "stability": 0.42,
            "similarity_boost": 0.72,
            "style": 0.18,
            "use_speaker_boost": True,
        })

        payload = {
            "text": text,
            "model_id": model_id,
            "output_format": output_format,
            "voice_settings": settings,
        }

        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            method="POST",
        )

        tmp_audio = out_wav.with_suffix(".mp3")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp, tmp_audio.open("wb") as f:
                f.write(resp.read())
        except Exception as e:
            raise VoiceProviderError(f"ElevenLabs request failed: {e}")

        run(["ffmpeg", "-y", "-i", str(tmp_audio), "-ar", str(SAMPLE_RATE), "-ac", "1", str(out_wav)])
        tmp_audio.unlink(missing_ok=True)


PROVIDERS = {
    "say": MacSayProvider,
    "openai": OpenAITTSProvider,
    "elevenlabs": ElevenLabsProvider,
}


def get_provider(name: str | None):
    provider_name = (name or "say").lower()
    cls = PROVIDERS.get(provider_name)
    if not cls:
        raise VoiceProviderError(f"Unknown voice provider: {provider_name}")
    return cls()
