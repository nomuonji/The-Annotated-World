#!/usr/bin/env python3
"""Attempt source extraction DIRECTLY from YouTube. Never use transcript mirrors.

Example:
  python -m pip install -U "yt-dlp[default]" youtube-transcript-api
  python scripts/probe-youtube-direct.py 4YSXNotY8QU --output-dir ./private-source

All media/subtitles are temporary. Log only source evidence, hashes and failure summaries.
An audio sample proves access but DOES NOT count as a completed transcript.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

cli = argparse.ArgumentParser(description="Attempt ONLY direct source YouTube captions or audio")
cli.add_argument("video_id", nargs="?", default="4YSXNotY8QU")
cli.add_argument("--output-dir", type=Path, help="Optional LOCAL folder to retain acquired subtitle files outside the public repository")
options = cli.parse_args()
VIDEO_ID = options.video_id
if not re.fullmatch(r"[A-Za-z0-9_-]{11}", VIDEO_ID):
    raise SystemExit("Expected an exact eleven-character YouTube video ID")

URL = f"https://www.youtube.com/watch?v={VIDEO_ID}"
MAX_MESSAGE = 850


def log_result(method: str, result: str, detail: str = "") -> None:
    safe = re.sub(r"(?i)(cookie|authorization|token|password)\S*", "[REDACTED]", detail)
    print(f"{method}: {result} {safe[-MAX_MESSAGE:]}", flush=True)


def hash_file(filename: Path) -> str:
    digest = hashlib.sha256()
    with filename.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def evidence(method: str, language: str, filename: Path, count: int = 0) -> None:
    proof = {
        "provider": "youtube",
        "videoId": VIDEO_ID,
        "method": method,
        "language": language,
        "tool": "youtube-transcript-api" if "api" in filename.name else "yt-dlp",
        "capturedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "sha256": hash_file(filename),
        "bytes": filename.stat().st_size,
        "segments": count,
    }
    # A verified source proof; raw copyrighted captions are deliberately never in job logs.
    print("CAPTURE_EVIDENCE=" + json.dumps(proof, ensure_ascii=False), flush=True)
    if options.output_dir:
        options.output_dir.mkdir(parents=True, exist_ok=True)
        saved = options.output_dir / f"{VIDEO_ID}_{filename.name}"
        shutil.copy2(filename, saved)
        print("SOURCE_FILE_SAVED=" + str(saved), flush=True)


def api_captions(workdir: Path) -> bool:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        tracks = YouTubeTranscriptApi().list(VIDEO_ID)
        for kind in ("manual", "auto"):
            try:
                track = (tracks.find_manually_created_transcript(["en"]) if kind == "manual"
                         else tracks.find_generated_transcript(["en"]))
                items = track.fetch()
                segments = [{"start": x.start, "duration": x.duration, "text": x.text}
                            for x in items]
                if not segments:
                    continue
                outfile = workdir / "youtube_api_en.json"
                outfile.write_text(json.dumps(segments, ensure_ascii=False), encoding="utf-8")
                evidence("youtube-captions" if kind == "manual" else "youtube-auto-captions",
                         "en", outfile, len(segments))
                return True
            except Exception as e:
                log_result(f"youtube-transcript-api ({kind})", "failed", f"{type(e).__name__}: {e}")
        return False
    except Exception as e:
        log_result("youtube-transcript-api", "failed", f"{type(e).__name__}: {e}")
        return False


def run_dlp(label: str, args: list[str], seconds: int = 100) -> tuple[bool, str]:
    command = [sys.executable, "-m", "yt_dlp", "--ignore-config", "--no-playlist",
               "--no-playlist", "--socket-timeout", "15", "--retries", "1",
               "--js-runtimes", "node", *args, URL]
    try:
        p = subprocess.run(command, capture_output=True, text=True, timeout=seconds,
                           env={**os.environ, "PYTHONUNBUFFERED": "1"})
        combined = (p.stderr + "\n" + p.stdout).strip()
        log_result(label, f"exit={p.returncode}", combined)
        return p.returncode == 0, combined
    except subprocess.TimeoutExpired:
        log_result(label, "timeout", f"{seconds}s")
        return False, "timeout"
    except Exception as e:
        log_result(label, "failed", f"{type(e).__name__}: {e}")
        return False, str(e)


def ytdlp_captions(workdir: Path) -> bool:
    passed, _ = run_dlp("yt-dlp-caption", [
        "--skip-download", "--write-subs", "--write-auto-subs",
        "--sub-langs", "en,en.*", "--sub-format", "vtt/json3/srv3",
        "-o", str(workdir / "%(id)s.%(ext)s")
    ])
    files = sorted([*workdir.glob("*.vtt"), *workdir.glob("*.json3"), *workdir.glob("*.srv3")])
    files = [f for f in files if f.stat().st_size > 100]
    if files:
        preferred = files[0]
        language = "en"
        method = "youtube-auto-captions" if "auto" in preferred.name.lower() else "youtube-captions"
        evidence(method, language, preferred)
        return True
    if passed:
        log_result("yt-dlp-caption", "no-caption-file", "yt-dlp exited successfully but did not save captions")
    return False


def ytdlp_audio_sample(workdir: Path) -> bool:
    # A small sample tests source audio access; not enough to claim a full script exists.
    passed, _ = run_dlp("yt-dlp-audio-sample", [
        "--download-sections", "*00:00:08-00:00:28",
        "-f", "bestaudio/best", "-o", str(workdir / "youtube_audio.%(ext)s")
    ], seconds=140)
    files = [f for f in workdir.glob("youtube_audio.*") if f.stat().st_size > 1024]
    if passed and files:
        f = files[0]
        log_result("youtube-audio-sample", "retrieved",
                   f"sample_bytes={f.stat().st_size} sha256={hash_file(f)} (only a 20-second sample, not a transcript)")
        return True
    return False


def main() -> int:
    print("DIRECT_YOUTUBE_SOURCE=" + URL, flush=True)
    with tempfile.TemporaryDirectory(prefix="youtube-direct-") as root:
        wd = Path(root)
        if api_captions(wd) or ytdlp_captions(wd):
            print("DIRECT_CAPTIONS=SUCCESS", flush=True)
            return 0
        print("DIRECT_CAPTIONS=FAILED; trying a short direct source-audio sample", flush=True)
        if ytdlp_audio_sample(wd):
            print("DIRECT_AUDIO_SAMPLE=SUCCESS; FULL TRANSCRIPT NOT YET ACQUIRED", flush=True)
            return 2
        print("DIRECT_YOUTUBE_ACQUISITION=FAILED; NO SOURCE TEXT VERIFIED", flush=True)
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
