#!/usr/bin/env python3
import os
import subprocess
from pathlib import Path

SAMPLE_RATE = 48000


def run(cmd, **kwargs):
    print("+", " ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True, **kwargs)


class VoiceProviderError(RuntimeError):
    pass


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
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise VoiceProviderError("OPENAI_API_KEY is not set")
        raise VoiceProviderError("OpenAI TTS adapter scaffolded but not enabled yet on this host")


class ElevenLabsProvider(BaseVoiceProvider):
    name = "elevenlabs"

    def synthesize(self, text: str, voice_config: dict, out_wav: Path):
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise VoiceProviderError("ELEVENLABS_API_KEY is not set")
        raise VoiceProviderError("ElevenLabs adapter scaffolded but not enabled yet on this host")


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
