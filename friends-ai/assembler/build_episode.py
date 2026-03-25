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


def generate_tts(line, voice_name: str, out_wav: Path):
    tmp_aiff = out_wav.with_suffix(".aiff")
    text = line["text"]
    rate = str(line.get("tts_rate", 185))
    run(["say", "-v", voice_name, "-r", rate, "-o", str(tmp_aiff), text])
    run([
        "ffmpeg", "-y", "-i", str(tmp_aiff),
        "-ar", str(SAMPLE_RATE), "-ac", "1", str(out_wav)
    ])
    tmp_aiff.unlink(missing_ok=True)


def create_silence(path: Path, duration: float):
    run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SAMPLE_RATE}:cl=mono",
        "-t", f"{duration:.3f}", str(path)
    ])


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
        voice_name = voice_map["characters"][character]["voice"]
        out_wav = samples_dir / f"{character.lower()}-{sanitize(line['text'])}.wav"
        generate_tts(line, voice_name, out_wav)
        manifest.append({
            "character": character,
            "voice": voice_name,
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
            line["tts_rate"] = option.get("tts_rate", line.get("tts_rate", 185))
            slug = sanitize(option["voice"])
            out_wav = char_dir / f"option-{idx}-{slug}.wav"
            generate_tts(line, option["voice"], out_wav)
            manifest.append({
                "character": character,
                "option": idx,
                "voice": option["voice"],
                "tts_rate": line["tts_rate"],
                "sample_line": line["text"],
                "file": str(out_wav),
            })

    with (out_dir / "manifest.json").open("w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Wrote audition pack to {out_dir}")


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
            generate_tts(merged_line, char_cfg["voice"], out_wav)
        else:
            continue
        audio_inputs.append({"line": line, "path": out_wav})

    segment_paths = []
    for shot in episode["shots"]:
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

    total_duration = sum(float(s["duration"]) for s in episode["shots"])

    ambience_path = None
    if episode.get("ambience"):
        source = Path(episode["ambience"]["source"])
        ambience_path = audio_dir / "ambience.wav"
        volume = str(episode["ambience"].get("volume", 0.16))
        run([
            "ffmpeg", "-y", "-stream_loop", "-1", "-i", str(source), "-t", f"{total_duration:.3f}",
            "-af", f"volume={volume}", "-ar", str(SAMPLE_RATE), "-ac", "1", str(ambience_path)
        ])

    mix_inputs = []
    filter_parts = []
    mix_labels = []

    if ambience_path and ambience_path.exists():
        mix_inputs += ["-i", str(ambience_path)]
        mix_labels.append("[0:a]")
        input_index = 1
    else:
        input_index = 0

    for item in audio_inputs:
        delay_ms = int(float(item["line"]["start"]) * 1000)
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

    out_path = Path(args.out) if args.out else OUTPUT_DIR / f"{episode['slug']}.mp4"
    run([
        "ffmpeg", "-y", "-i", str(video_no_audio), "-i", str(mixed_audio),
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-shortest", str(out_path)
    ])

    manifest = {
        "episode": episode["slug"],
        "output": str(out_path),
        "video_only": str(video_no_audio),
        "mixed_audio": str(mixed_audio),
        "tts": bool(args.tts),
        "voice_map": str(args.voice_map) if args.voice_map else None,
    }
    with (base / "manifest.json").open("w") as f:
        json.dump(manifest, f, indent=2)

    print(json.dumps(manifest, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Friends AI episode assembler")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list-voices", help="List macOS say voices")
    p_list.set_defaults(func=list_voices)

    p_samples = sub.add_parser("render-voice-samples", help="Render one approval sample per character")
    p_samples.add_argument("--episode", required=True)
    p_samples.add_argument("--voice-map", required=True)
    p_samples.add_argument("--out-dir")
    p_samples.set_defaults(func=render_voice_samples)

    p_auditions = sub.add_parser("render-voice-auditions", help="Render multiple voice options per character")
    p_auditions.add_argument("--episode", required=True)
    p_auditions.add_argument("--candidates", required=True)
    p_auditions.add_argument("--out-dir")
    p_auditions.set_defaults(func=render_voice_auditions)

    p_build = sub.add_parser("build", help="Build an episode")
    p_build.add_argument("--episode", required=True)
    p_build.add_argument("--voice-map")
    p_build.add_argument("--tts", action="store_true")
    p_build.add_argument("--out")
    p_build.set_defaults(func=build_episode)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
