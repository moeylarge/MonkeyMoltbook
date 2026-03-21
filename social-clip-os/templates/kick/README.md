# Kick lower-third template

Reusable lower-third pack for Social Clip OS clips.

## Files
- `kick-logo.svg` — source Kick wordmark/logo
- `preview/kick-logo.svg.png` — rasterized logo for template use
- `generate_kick_lower_third.py` — creates a streamer-specific lower-third SVG
- `kick-lower-third-clavicular.svg` — ready-to-use Clavicular template
- `preview/kick-lower-third-clavicular.svg.png` — rendered preview of the Clavicular lower-third

## Generate a new lower-third
```bash
cd social-clip-os/templates/kick
python3 generate_kick_lower_third.py Clavicular
python3 generate_kick_lower_third.py AdinRoss
python3 generate_kick_lower_third.py xQc --url kick.com/xqc
```

This writes an SVG like:
- `kick-lower-third-clavicular.svg`

## Render a PNG preview on macOS
```bash
qlmanage -t -s 1600 -o preview kick-lower-third-clavicular.svg >/dev/null 2>&1
```

That creates:
- `preview/kick-lower-third-clavicular.svg.png`

## Use in ffmpeg
Once you have a rendered PNG overlay, place it on the video like this:
```bash
ffmpeg -i input.mp4 -i preview/kick-lower-third-clavicular.svg.png \
  -filter_complex "[1:v]scale=1080:-1[ov];[0:v][ov]overlay=0:H-h:format=auto" \
  -c:a copy output-with-kick-branding.mp4
```

If the clip is not 1080px wide, scale the overlay to match the video width first.

## Notes
- The template is designed for bottom placement.
- The handle line is white.
- The `kick.com/<handle>` line is Kick green.
- Future clips can reuse the same style and just swap the handle/URL.
