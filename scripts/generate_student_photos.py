#!/usr/bin/env python3
"""Generate student avatar photos from initials if not manually provided."""

import os
import re
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow not installed, skipping student photo generation.")
    sys.exit(0)

STUDENTS_YML = "_data/students.yml"
PHOTOS_DIR = "images/students"

COLORS = [
    "#4a90d9", "#e67e22", "#27ae60", "#8e44ad",
    "#c0392b", "#16a085", "#d35400", "#2980b9",
    "#f39c12", "#7f8c8d", "#2c3e50", "#e84393",
]

FONT_PATHS = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


def load_font(size):
    for path in FONT_PATHS:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def parse_students(yml_path):
    students = []
    if not os.path.exists(yml_path):
        return students
    with open(yml_path, "r", encoding="utf-8") as f:
        content = f.read()
    entries = re.split(r"\n- ", content)
    for entry in entries:
        if "name:" not in entry:
            continue
        name_match = re.search(r"name:\s*(.+)", entry)
        photo_match = re.search(r"photo:\s*(.+)", entry)
        if not name_match or not photo_match:
            continue
        name = name_match.group(1).strip()
        photo = photo_match.group(1).strip()
        students.append({"name": name, "photo": photo})
    return students


def get_surname_initial(name):
    # Format: "English Name (Chinese Name)"
    # English surname is the last word before "("
    en_name = name.split("(")[0].strip()
    parts = en_name.split()
    if len(parts) >= 2:
        return parts[-1][0].upper()
    elif parts:
        return parts[0][0].upper()
    return "?"


def generate_photo(photo_filename, letter, color):
    img = Image.new("RGB", (200, 200), color=color)
    draw = ImageDraw.Draw(img)
    font = load_font(100)
    bbox = draw.textbbox((0, 0), letter, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (200 - w) / 2 - bbox[0]
    y = (200 - h) / 2 - bbox[1]
    draw.text((x, y), letter, fill="white", font=font)
    path = os.path.join(PHOTOS_DIR, photo_filename)
    img.save(path)
    print(f"Generated {path} (letter: {letter})")


def main():
    os.makedirs(PHOTOS_DIR, exist_ok=True)
    students = parse_students(STUDENTS_YML)
    if not students:
        print("No students found.")
        return
    generated = 0
    for i, s in enumerate(students):
        photo_path = os.path.join(PHOTOS_DIR, s["photo"])
        if os.path.exists(photo_path):
            print(f"Skipping {s['photo']} (already exists)")
            continue
        letter = get_surname_initial(s["name"])
        color = COLORS[i % len(COLORS)]
        generate_photo(s["photo"], letter, color)
        generated += 1
    print(f"Done. Generated {generated} photo(s), skipped {len(students) - generated}.")


if __name__ == "__main__":
    main()
