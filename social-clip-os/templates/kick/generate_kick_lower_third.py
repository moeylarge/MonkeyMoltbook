#!/usr/bin/env python3
from pathlib import Path
import argparse
import html

TEMPLATE_WIDTH = 1080
TEMPLATE_HEIGHT = 220
BAR_X = 40
BAR_Y = 140
BAR_W = 1000
BAR_H = 52
LOGO_BOX_X = 56
LOGO_BOX_Y = 88
LOGO_BOX_W = 120
LOGO_BOX_H = 120
KICK_TEXT_X = 198
KICK_TEXT_Y = 132
CLIPS_TEXT_X = 198
CLIPS_TEXT_Y = 180
HANDLE_Y = 132
URL_Y = 178
RIGHT_URL_X = 690


def build_svg(handle: str, url_text: str, logo_path: str = "preview/kick-logo.svg.png") -> str:
    safe_handle = html.escape(handle)
    safe_url = html.escape(url_text)
    safe_logo = html.escape(logo_path)
    return f'''<svg width="{TEMPLATE_WIDTH}" height="{TEMPLATE_HEIGHT}" viewBox="0 0 {TEMPLATE_WIDTH} {TEMPLATE_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="0" y="0" width="120%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0E0F12"/>
      <stop offset="100%" stop-color="#17191D"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#53FC18"/>
      <stop offset="100%" stop-color="#36C80A"/>
    </linearGradient>
  </defs>

  <g filter="url(#shadow)">
    <rect x="{BAR_X}" y="{BAR_Y}" width="{BAR_W}" height="{BAR_H}" rx="22" fill="url(#bar)"/>
    <rect x="{LOGO_BOX_X}" y="{LOGO_BOX_Y}" width="{LOGO_BOX_W}" height="{LOGO_BOX_H}" rx="26" fill="#101114"/>
    <rect x="{LOGO_BOX_X}" y="{LOGO_BOX_Y}" width="{LOGO_BOX_W}" height="{LOGO_BOX_H}" rx="26" stroke="#24282D" stroke-width="2"/>
    <circle cx="1002" cy="166" r="10" fill="url(#accent)"/>
  </g>

  <image href="{safe_logo}" x="72" y="104" width="88" height="88" preserveAspectRatio="xMidYMid meet"/>

  <text x="{KICK_TEXT_X}" y="{KICK_TEXT_Y}" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="800" letter-spacing="0.8">KICK</text>
  <text x="{CLIPS_TEXT_X}" y="{CLIPS_TEXT_Y}" fill="#53FC18" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" letter-spacing="0.8">CLIPS</text>
  <text x="{RIGHT_URL_X}" y="{URL_Y}" fill="#53FC18" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" text-anchor="end" letter-spacing="0.3">{safe_url}</text>
</svg>
'''


def main():
    parser = argparse.ArgumentParser(description="Generate a Kick lower-third overlay SVG.")
    parser.add_argument("handle", help="Streamer handle, e.g. Clavicular")
    parser.add_argument("--url", help="Full lower-third URL text. Defaults to kick.com/<handle>")
    parser.add_argument("--out", help="Output SVG path")
    args = parser.parse_args()

    handle = args.handle.strip().lstrip("@")
    url_text = args.url.strip() if args.url else f"kick.com/{handle}"
    out = Path(args.out) if args.out else Path(f"kick-lower-third-{handle.lower()}.svg")
    out.write_text(build_svg(handle, url_text), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
