#!/usr/bin/env python3
import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import wave
from pathlib import Path
from typing import Dict, List

from providers import VoiceProviderError, get_provider

ROOT = Path("/Users/moey/.openclaw/workspace")
ASSEMBLER_DIR = ROOT / "friends-ai" / "assembler"
TMP_DIR = ASSEMBLER_DIR / "tmp"
BUILD_DIR = ASSEMBLER_DIR / "build"
OUTPUT_DIR = ASSEMBLER_DIR / "output"
VOICES_DIR = ASSEMBLER_DIR / "voices"

TARGET_SIZE = "1080x1080"
TARGET_W = 1080
TARGET_H = 1080
FPS = 30
SAMPLE_RATE = 48000


def resolve_voice_provider_name(voice_config: dict | None, cli_provider: str | None) -> str:
    if cli_provider:
        return cli_provider
    if voice_config and voice_config.get("provider"):
        return voice_config["provider"]
    return "say"


def run(cmd, **kwargs):
    print("+", " ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True, **kwargs)


def run_capture(cmd):
    return subprocess.run(cmd, check=True, text=True, capture_output=True).stdout


def load_json(path: Path):
    with path.open() as f:
        return json.load(f)


def ensure_dirs():
    for path in [TMP_DIR, BUILD_DIR, OUTPUT_DIR, VOICES_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def ffprobe_duration(path: Path) -> float:
    out = run_capture([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path)
    ]).strip()
    return float(out)


def get_audio_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as wav:
        return wav.getnframes() / float(wav.getframerate())


def sanitize(text: str) -> str:
    safe = "".join(ch.lower() if ch.isalnum() else "-" for ch in text).strip("-")
    while "--" in safe:
        safe = safe.replace("--", "-")
    return safe[:80] or "line"


def generate_tts(line, voice_config: dict, out_wav: Path, provider_name: str | None = None):
    cfg = dict(voice_config)
    if line.get("tts_rate") and not cfg.get("tts_rate"):
        cfg["tts_rate"] = line["tts_rate"]
    provider = get_provider(resolve_voice_provider_name(cfg, provider_name))
    provider.synthesize(line["text"], cfg, out_wav)


def create_silence(path: Path, duration: float):
    run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SAMPLE_RATE}:cl=mono",
        "-t", f"{duration:.3f}", str(path)
    ])


def create_room_tone(path: Path, duration: float, volume: float = 0.018):
    run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"anoisesrc=color=pink:amplitude=0.08:sample_rate={SAMPLE_RATE}",
        "-t", f"{duration:.3f}",
        "-af", f"highpass=f=120,lowpass=f=1800,volume={volume}",
        "-ac", "1", str(path)
    ])


def build_ambience_track(episode: dict, audio_dir: Path, total_duration: float, clean_ambience: bool):
    ambience = episode.get("ambience")
    if not ambience:
        return None

    mode = ambience.get("mode", "file")
    ambience_path = audio_dir / "ambience.wav"

    if mode == "generated-room-tone":
        volume = float(ambience.get("volume", 0.018 if clean_ambience else 0.024))
        create_room_tone(ambience_path, total_duration, volume=volume)
        return ambience_path

    source = Path(ambience["source"])
    volume = str(ambience.get("volume", 0.025 if clean_ambience else 0.04))
    run([
        "ffmpeg", "-y", "-stream_loop", "-1", "-i", str(source), "-t", f"{total_duration:.3f}",
        "-af", f"volume={volume}", "-ar", str(SAMPLE_RATE), "-ac", "1", str(ambience_path)
    ])
    return ambience_path


def list_voices(_args):
    output = run_capture(["say", "-v", "?"])
    print(output)


def render_voice_samples(args):
    ensure_dirs()
    voice_map = load_json(Path(args.voice_map))
    episode = load_json(Path(args.episode))
    samples_dir = Path(args.out_dir) if args.out_dir else VOICES_DIR / "approval-samples"
    if samples_dir.exists():
        shutil.rmtree(samples_dir)
    samples_dir.mkdir(parents=True, exist_ok=True)

    characters = {}
    for line in episode["dialogue"]:
        characters.setdefault(line["character"], line)

    manifest = []
    for character, line in characters.items():
        voice_cfg = dict(voice_map["characters"][character])
        out_wav = samples_dir / f"{character.lower()}-{sanitize(line['text'])}.wav"
        generate_tts(line, voice_cfg, out_wav, args.provider)
        manifest.append({
            "character": character,
            "voice": voice_cfg.get("voice"),
            "provider": resolve_voice_provider_name(voice_cfg, args.provider),
            "sample_line": line["text"],
            "file": str(out_wav),
        })

    with (samples_dir / "manifest.json").open("w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Wrote voice approval samples to {samples_dir}")


def render_voice_auditions(args):
    ensure_dirs()
    candidates = load_json(Path(args.candidates))
    episode = load_json(Path(args.episode))
    out_dir = Path(args.out_dir) if args.out_dir else VOICES_DIR / "auditions-v2"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    first_lines = {}
    for line in episode["dialogue"]:
        first_lines.setdefault(line["character"], line)

    manifest = []
    for character, options in candidates["characters"].items():
        char_dir = out_dir / character.lower()
        char_dir.mkdir(parents=True, exist_ok=True)
        line = dict(first_lines[character])
        for idx, option in enumerate(options, start=1):
            option_cfg = dict(option)
            line["tts_rate"] = option_cfg.get("tts_rate", line.get("tts_rate", 185))
            slug = sanitize(option_cfg["voice"])
            out_wav = char_dir / f"option-{idx}-{slug}.wav"
            generate_tts(line, option_cfg, out_wav, args.provider)
            manifest.append({
                "character": character,
                "option": idx,
                "voice": option_cfg["voice"],
                "provider": resolve_voice_provider_name(option_cfg, args.provider),
                "tts_rate": line["tts_rate"],
                "sample_line": line["text"],
                "file": str(out_wav),
            })

    with (out_dir / "manifest.json").open("w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Wrote audition pack to {out_dir}")


def format_srt_time(seconds: float) -> str:
    ms = max(0, int(round(seconds * 1000)))
    h = ms // 3600000
    ms %= 3600000
    m = ms // 60000
    ms %= 60000
    s = ms // 1000
    ms %= 1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def normalize_dialogue_timeline(shots: List[dict], dialogue: List[dict], audio_inputs: List[dict], auto_retime: bool) -> List[dict]:
    shots_by_id: Dict[str, dict] = {shot["id"]: shot for shot in shots}
    shot_offsets = {}
    cursor = 0.0
    for shot in shots:
        shot_offsets[shot["id"]] = cursor
        cursor += float(shot["duration"])

    dialogue = [dict(item) for item in dialogue]
    audio_by_text = {(item["line"]["character"], item["line"]["text"]): item for item in audio_inputs}

    if auto_retime:
        grouped: Dict[str, List[dict]] = {}
        for item in dialogue:
            grouped.setdefault(item["shot_id"], []).append(item)

        min_gap = 0.35
        head_pad = 0.6
        tail_pad = 0.9
        for shot in shots:
            items = grouped.get(shot["id"], [])
            if not items:
                continue
            local_cursor = head_pad
            for item in items:
                key = (item["character"], item["text"])
                dur = get_audio_duration(audio_by_text[key]["path"])
                item["start"] = shot_offsets[shot["id"]] + local_cursor
                item["end"] = item["start"] + dur
                local_cursor += dur + min_gap
            required = local_cursor - min_gap + tail_pad
            if required > float(shot["duration"]):
                shot["duration"] = round(required, 3)

        shot_offsets = {}
        cursor = 0.0
        for shot in shots:
            shot_offsets[shot["id"]] = cursor
            cursor += float(shot["duration"])

        for item in dialogue:
            local = item["start"] - shot_offsets.get(item["shot_id"], 0)
            item["start"] = shot_offsets[item["shot_id"]] + max(local, 0)
            key = (item["character"], item["text"])
            dur = get_audio_duration(audio_by_text[key]["path"])
            item["end"] = item["start"] + dur
    else:
        for item in dialogue:
            key = (item["character"], item["text"])
            dur = get_audio_duration(audio_by_text[key]["path"])
            item["end"] = float(item["start"]) + dur

    return dialogue


def write_srt(path: Path, dialogue: List[dict]):
    with path.open("w") as f:
        for idx, item in enumerate(dialogue, start=1):
            f.write(f"{idx}\n")
            f.write(f"{format_srt_time(item['start'])} --> {format_srt_time(item['end'])}\n")
            f.write(f"{item['character']}: {item['text']}\n\n")


def build_episode(args):
    ensure_dirs()
    episode = load_json(Path(args.episode))
    voice_map = load_json(Path(args.voice_map)) if args.voice_map else None
    base = BUILD_DIR / episode["slug"]
    if base.exists():
        shutil.rmtree(base)
    segments_dir = base / "segments"
    audio_dir = base / "audio"
    segments_dir.mkdir(parents=True, exist_ok=True)
    audio_dir.mkdir(parents=True, exist_ok=True)

    audio_inputs = []
    for idx, line in enumerate(episode.get("dialogue", []), start=1):
        char_cfg = (voice_map or {}).get("characters", {}).get(line["character"], {})
        source = line.get("audio_file")
        if source:
            src_path = Path(source)
            out_wav = audio_dir / f"{idx:02d}-{line['character'].lower()}-{sanitize(line['text'])}.wav"
            run(["ffmpeg", "-y", "-i", str(src_path), "-ar", str(SAMPLE_RATE), "-ac", "1", str(out_wav)])
        elif args.tts:
            if not char_cfg.get("voice"):
                raise SystemExit(f"No voice configured for {line['character']}")
            out_wav = audio_dir / f"{idx:02d}-{line['character'].lower()}-{sanitize(line['text'])}.wav"
            merged_line = dict(line)
            if char_cfg.get("tts_rate"):
                merged_line["tts_rate"] = char_cfg["tts_rate"]
            try:
                generate_tts(merged_line, char_cfg, out_wav, args.provider)
            except VoiceProviderError as e:
                raise SystemExit(f"TTS provider error for {line['character']}: {e}")
        else:
            continue
        audio_inputs.append({"line": line, "path": out_wav})

    shots = [dict(shot) for shot in episode["shots"]]
    dialogue_timeline = normalize_dialogue_timeline(shots, episode.get("dialogue", []), audio_inputs, args.auto_retime)

    segment_paths = []
    for shot in shots:
        segment_path = segments_dir / f"{shot['id']}.mp4"
        duration = float(shot["duration"])
        input_path = Path(shot["source"])
        kind = shot["type"]
        zoom = shot.get("zoom", "none")
        if kind == "video":
            vf = f"scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=decrease,pad={TARGET_W}:{TARGET_H}:(ow-iw)/2:(oh-ih)/2:black,fps={FPS},format=yuv420p"
            run([
                "ffmpeg", "-y", "-i", str(input_path), "-an",
                "-vf", vf,
                "-t", f"{duration:.3f}",
                "-r", str(FPS),
                str(segment_path)
            ])
        elif kind == "image":
            if zoom == "slow-in":
                zexpr = "1.0+0.0008*on"
            elif zoom == "micro-in":
                zexpr = "1.0+0.0004*on"
            else:
                zexpr = "1.0"
            frames = math.ceil(duration * FPS)
            vf = (
                f"scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=increase,"
                f"crop={TARGET_W}:{TARGET_H},"
                f"zoompan=z={zexpr}:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d={frames}:s={TARGET_SIZE}:fps={FPS},"
                f"format=yuv420p"
            )
            run([
                "ffmpeg", "-y", "-loop", "1", "-i", str(input_path),
                "-vf", vf,
                "-t", f"{duration:.3f}",
                "-r", str(FPS),
                str(segment_path)
            ])
        else:
            raise SystemExit(f"Unsupported shot type: {kind}")
        segment_paths.append(segment_path)

    concat_txt = base / "concat.txt"
    with concat_txt.open("w") as f:
        for path in segment_paths:
            f.write(f"file '{path}'\n")

    video_no_audio = base / f"{episode['slug']}-video-only.mp4"
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", str(video_no_audio)
    ])

    total_duration = sum(float(s["duration"]) for s in shots)

    ambience_path = build_ambience_track(episode, audio_dir, total_duration, args.clean_ambience)

    mix_inputs = []
    filter_parts = []
    mix_labels = []

    if ambience_path and ambience_path.exists():
        mix_inputs += ["-i", str(ambience_path)]
        mix_labels.append("[0:a]")
        input_index = 1
    else:
        input_index = 0

    timeline_by_key = {(item['character'], item['text']): item for item in dialogue_timeline}
    for item in audio_inputs:
        line_timing = timeline_by_key[(item['line']['character'], item['line']['text'])]
        delay_ms = int(float(line_timing["start"]) * 1000)
        mix_inputs += ["-i", str(item["path"])]
        label = f"[{input_index}:a]"
        out_label = f"[a{input_index}]"
        gain = item["line"].get("volume", 1.0)
        filter_parts.append(f"{label}adelay={delay_ms}|{delay_ms},volume={gain}{out_label}")
        mix_labels.append(out_label)
        input_index += 1

    mixed_audio = base / f"{episode['slug']}-mix.wav"
    if mix_labels:
        filter_parts.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:normalize=0[aout]")
        run([
            "ffmpeg", "-y", *mix_inputs,
            "-filter_complex", ";".join(filter_parts),
            "-map", "[aout]", "-t", f"{total_duration:.3f}",
            "-ar", str(SAMPLE_RATE), "-ac", "1", str(mixed_audio)
        ])
    else:
        create_silence(mixed_audio, total_duration)

    srt_path = base / f"{episode['slug']}.srt"
    write_srt(srt_path, dialogue_timeline)

    out_path = Path(args.out) if args.out else OUTPUT_DIR / f"{episode['slug']}.mp4"
    subtitle_burned = False
    if args.burn_subtitles:
        subtitled_video = base / f"{episode['slug']}-subtitled.mp4"
        try:
            run([
                "ffmpeg", "-y", "-i", str(video_no_audio),
                "-vf", f"subtitles=filename={srt_path.name}",
                str(subtitled_video)
            ], cwd=str(base))
            final_video_input = subtitled_video
            subtitle_burned = True
        except subprocess.CalledProcessError:
            print("WARNING: ffmpeg subtitles filter unavailable; exporting sidecar SRT only")
            final_video_input = video_no_audio
    else:
        final_video_input = video_no_audio

    run([
        "ffmpeg", "-y", "-i", str(final_video_input), "-i", str(mixed_audio),
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-shortest", str(out_path)
    ])

    manifest = {
        "episode": episode["slug"],
        "output": str(out_path),
        "video_only": str(video_no_audio),
        "mixed_audio": str(mixed_audio),
        "subtitles": str(srt_path),
        "tts": bool(args.tts),
        "voice_provider": args.provider or "config/default",
        "auto_retime": bool(args.auto_retime),
        "burn_subtitles_requested": bool(args.burn_subtitles),
        "burn_subtitles_succeeded": subtitle_burned,
        "voice_map": str(args.voice_map) if args.voice_map else None,
    }
    with (base / "manifest.json").open("w") as f:
        json.dump(manifest, f, indent=2)

    print(json.dumps(manifest, indent=2))


def build_batch(args):
    ensure_dirs()
    batch = load_json(Path(args.batch))
    results = []

    class BuildArgs:
        pass

    for job in batch.get("jobs", []):
        job_args = BuildArgs()
        job_args.episode = job["episode"]
        job_args.voice_map = job.get("voice_map")
        job_args.tts = job.get("tts", False)
        job_args.auto_retime = job.get("auto_retime", False)
        job_args.clean_ambience = job.get("clean_ambience", False)
        job_args.burn_subtitles = job.get("burn_subtitles", False)
        job_args.out = job.get("out")
        print(f"=== Building batch job: {job_args.episode} ===")
        build_episode(job_args)
        episode = load_json(Path(job_args.episode))
        results.append({
            "episode": episode["slug"],
            "output": job_args.out or str(OUTPUT_DIR / f"{episode['slug']}.mp4")
        })

    print(json.dumps({"jobs": results}, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Friends AI episode assembler")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list-voices", help="List macOS say voices")
    p_list.set_defaults(func=list_voices)

    p_samples = sub.add_parser("render-voice-samples", help="Render one approval sample per character")
    p_samples.add_argument("--episode", required=True)
    p_samples.add_argument("--voice-map", required=True)
    p_samples.add_argument("--provider")
    p_samples.add_argument("--out-dir")
    p_samples.set_defaults(func=render_voice_samples)

    p_auditions = sub.add_parser("render-voice-auditions", help="Render multiple voice options per character")
    p_auditions.add_argument("--episode", required=True)
    p_auditions.add_argument("--candidates", required=True)
    p_auditions.add_argument("--provider")
    p_auditions.add_argument("--out-dir")
    p_auditions.set_defaults(func=render_voice_auditions)

    p_build = sub.add_parser("build", help="Build an episode")
    p_build.add_argument("--episode", required=True)
    p_build.add_argument("--voice-map")
    p_build.add_argument("--provider")
    p_build.add_argument("--tts", action="store_true")
    p_build.add_argument("--auto-retime", action="store_true")
    p_build.add_argument("--clean-ambience", action="store_true")
    p_build.add_argument("--burn-subtitles", action="store_true")
    p_build.add_argument("--out")
    p_build.set_defaults(func=build_episode)

    p_batch = sub.add_parser("build-batch", help="Build a queue of episodes from one batch file")
    p_batch.add_argument("--batch", required=True)
    p_batch.set_defaults(func=build_batch)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
