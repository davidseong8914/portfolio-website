#!/usr/bin/env python3
"""Make the site's images and videos web-sized, and point the pages at the optimised copies.

Usage (from anywhere):  python3 tools/optimize_media.py

Add a project the normal way, referencing the original photo/video straight from its folder:
    <video src="projects/newbot/demo.mov" autoplay muted loop playsinline></video>
    <img src="projects/newbot/photo.JPG" alt="">
then run this script. It finds every <img>/<video> on the site that doesn't already point into
media/, and for each one:
  - images -> WebP, resized for where they're shown (cards 800px, carousel 1200px, pages 1600px)
  - videos -> H.264 (plays in every browser), long side <= 960px, <= 30fps, no audio, + JPEG poster
  - rewrites the tag to use the copy, adds width/height (so the page doesn't jump while loading),
    lazy-loads images, and swaps a video's `autoplay` for data-autoplay + preload="none" so
    script.js only plays it while it's on screen.

Originals are never modified or deleted; copies go to media/img and media/video. Safe to re-run:
tags that already point into media/ are left alone.

Needs ffmpeg, ffprobe and cwebp (brew install ffmpeg webp) plus macOS's built-in sips.
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import unquote

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_IMG, OUT_VID = "media/img", "media/video"
# Pages with their own bespoke design and media handling.
SKIP_PAGES = {"projects/pestroleum.html", "projects/yc-blocks.html"}
# Image width by the container it sits in; anything else (detail-page figures) gets DEFAULT_WIDTH.
ROLE_WIDTH = [("site-logo", 160), ("hero-portrait", 800), ("card-media", 800), ("shot-media", 900), ("phone", 800), ("slide-media", 1200)]
DEFAULT_WIDTH = 1600
# Above-the-fold images that shouldn't be lazy-loaded.
EAGER = ("site-logo", "hero-portrait", "frame--hero")
ROTATE = {3: 180, 6: 90, 8: 270}  # EXIF orientation -> clockwise degrees
VIDEO_LONG_SIDE, VIDEO_CRF, POSTER_LONG_SIDE = 960, 30, 640

ATTR_RE = re.compile(r"""([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?""")
TAG_RE = re.compile(r"<(img|video)\b([^>]*?)(/?)>", re.S)

img_cache, vid_cache = {}, {}


def run(*cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(" ".join(cmd) + "\n" + r.stderr)
    return r.stdout


def slug(path):
    return re.sub(r"[^a-z0-9]+", "-", os.path.splitext(path)[0].lower()).strip("-")


def fit_long_side(n):
    return f"scale=w='if(gt(iw,ih),min({n},iw),-2)':h='if(gt(iw,ih),-2,min({n},ih))'"


def image_info(path):
    out = run("sips", "-g", "pixelWidth", "-g", "pixelHeight", "-g", "orientation", path)
    w = int(re.search(r"pixelWidth: (\d+)", out).group(1))
    h = int(re.search(r"pixelHeight: (\d+)", out).group(1))
    o = re.search(r"orientation: (\d+)", out)
    o = int(o.group(1)) if o else 1
    return (h, w, o) if o in (5, 6, 7, 8) else (w, h, o)


def optimize_image(src, width, tmp):
    if (src, width) in img_cache:
        return img_cache[(src, width)]
    w, h, orient = image_info(src)
    result = (src, w, h)
    if w > width or os.path.getsize(src) > 200_000:
        tw = min(w, width)
        th = round(h * tw / w)
        out = f"{OUT_IMG}/{slug(src)}-{tw}.webp"
        if not os.path.exists(out):
            os.makedirs(OUT_IMG, exist_ok=True)
            inp = src
            if orient in ROTATE:  # cwebp ignores EXIF orientation, so bake it in first
                inp = os.path.join(tmp, os.path.basename(src))
                run("sips", "-r", str(ROTATE[orient]), src, "--out", inp)
            run("cwebp", "-quiet", "-q", "80", "-m", "6", "-resize", str(tw), "0", inp, "-o", out)
        if os.path.getsize(out) < os.path.getsize(src):
            result = (out, tw, th)
            print(f"image  {os.path.getsize(src) / 1e6:6.2f} MB -> {os.path.getsize(out) / 1e6:5.2f} MB  {src}")
        else:
            os.remove(out)
    img_cache[(src, width)] = result
    return result


def optimize_video(src):
    if src in vid_cache:
        return vid_cache[src]
    out, poster = f"{OUT_VID}/{slug(src)}.mp4", f"{OUT_VID}/{slug(src)}.jpg"
    os.makedirs(OUT_VID, exist_ok=True)
    if not os.path.exists(out):
        run("ffmpeg", "-v", "error", "-y", "-i", src, "-an", "-vf", fit_long_side(VIDEO_LONG_SIDE),
            "-c:v", "libx264", "-preset", "slow", "-crf", str(VIDEO_CRF), "-pix_fmt", "yuv420p",
            "-fpsmax", "30", "-movflags", "+faststart", out)
        print(f"video  {os.path.getsize(src) / 1e6:6.2f} MB -> {os.path.getsize(out) / 1e6:5.2f} MB  {src}")
    if not os.path.exists(poster):
        run("ffmpeg", "-v", "error", "-y", "-ss", "0.3", "-i", out, "-frames:v", "1",
            "-vf", fit_long_side(POSTER_LONG_SIDE), "-q:v", "4", poster)
    # The copy is already rotated upright, so its stream size is its display size.
    j = json.loads(run("ffprobe", "-v", "error", "-print_format", "json", "-show_streams", out))
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    vid_cache[src] = (out, poster, v["width"], v["height"])
    return vid_cache[src]


def parse_attrs(s):
    return [(m.group(1), next((g for g in m.groups()[1:] if g is not None), None)) for m in ATTR_RE.finditer(s)]


def render(tag, attrs, slash):
    body = " ".join(k if v is None else f'{k}="{v}"' for k, v in attrs)
    return f"<{tag} {body}{' /' if slash else ''}>"


def rewrite(page, tmp):
    html = open(page, encoding="utf-8").read()

    def sub(m):
        tag, attrs, slash = m.group(1), parse_attrs(m.group(2)), m.group(3)
        d = dict(attrs)
        src = d.get("src", "")
        if not src or re.match(r"(https?:|data:)", src) or src.startswith(("media/", "../media/")) or "leaves/" in src:
            return m.group(0)
        path = os.path.normpath(os.path.join(os.path.dirname(page), unquote(src)))
        if not os.path.exists(path):
            print(f"MISSING  {page}: {src}")
            return m.group(0)
        before = html[max(0, m.start() - 400):m.start()]
        ctx = " ".join(re.findall(r'class="([^"]*)"', before)[-1:] + [d.get("class") or ""])
        rel = lambda p: os.path.relpath(p, os.path.dirname(page) or ".")
        drop = {"src", "width", "height", "loading", "decoding", "poster", "preload", "autoplay"}
        keep = [(k, v) for k, v in attrs if k not in drop]
        if tag == "img":
            width = next((w for role, w in ROLE_WIDTH if role in ctx), DEFAULT_WIDTH)
            new, w, h = optimize_image(path, width, tmp)
            extra = [] if any(e in ctx for e in EAGER) else [("loading", "lazy"), ("decoding", "async")]
            new_src = rel(new) if new != path else src
            return render("img", [("src", new_src)] + keep + [("width", str(w)), ("height", str(h))] + extra, slash)
        out, poster, w, h = optimize_video(path)
        auto = [("data-autoplay", None)] if "autoplay" in d else []
        return render("video", [("src", rel(out)), ("poster", rel(poster)), ("width", str(w)), ("height", str(h))]
                      + keep + [("preload", "none")] + auto, slash)

    new_html = TAG_RE.sub(sub, html)
    if new_html != html:
        open(page, "w", encoding="utf-8").write(new_html)
        print(f"updated  {page}")


def main():
    missing = [t for t in ("ffmpeg", "ffprobe", "cwebp", "sips") if not shutil.which(t)]
    if missing:
        sys.exit(f"Missing tools: {', '.join(missing)}. Install with: brew install ffmpeg webp")
    os.chdir(REPO)
    pages = ["index.html", "projects.html", "contact.html"] + sorted(
        p for p in glob.glob("projects/*.html") if p not in SKIP_PAGES and os.path.getsize(p) > 0)
    with tempfile.TemporaryDirectory() as tmp:
        for page in pages:
            rewrite(page, tmp)
    print("done")


if __name__ == "__main__":
    main()
