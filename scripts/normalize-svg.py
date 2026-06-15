"""
Normalize SVG assets coming from Figma export.

Figma экспортирует SVG с проблемами:
- preserveAspectRatio="none" — растягивает под mask-area
- width="100%" height="100%" — нет intrinsic ratio
- style="display: block;", overflow="visible" — паразитное

Этот скрипт идёт по папке и приводит каждый .svg к нормальному виду:
- Удаляет preserveAspectRatio="none"
- Заменяет width="100%" / height="100%" на numeric values из viewBox
- Чистит лишние атрибуты

Usage:
    python normalize-svg.py path/to/folder
    python normalize-svg.py path/to/folder --dry-run

Output: report по каждому файлу (ok / changed / skipped).
"""
import sys
import os
import re
import argparse


def normalize_svg(path: str, dry_run: bool = False) -> tuple[bool, str]:
    """Returns (changed, info)."""
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    original = s

    m = re.search(r'viewBox="0 0 ([0-9.]+) ([0-9.]+)"', s)
    if not m:
        return (False, 'no viewBox — skipped')

    w, h = float(m.group(1)), float(m.group(2))

    # Удаляем preserveAspectRatio="none"
    s = re.sub(r'\s+preserveAspectRatio="none"', '', s)

    # Заменяем 100% width/height на численные
    s = re.sub(r'\bwidth="100%"', f'width="{w:g}"', s, count=1)
    s = re.sub(r'\bheight="100%"', f'height="{h:g}"', s, count=1)

    # Чистим паразитные атрибуты
    s = re.sub(r'\s+style="display:\s*block;?"', '', s)
    s = re.sub(r'\s+overflow="visible"', '', s)

    changed = s != original

    if changed and not dry_run:
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(s)

    info = f'{w:g}x{h:g}'
    if changed:
        info = ('would change: ' if dry_run else 'changed: ') + info
    else:
        info = 'unchanged: ' + info
    return (changed, info)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('path', help='SVG file or folder to normalize')
    parser.add_argument('--dry-run', action='store_true', help='Report without writing')
    args = parser.parse_args()

    paths: list[str] = []
    if os.path.isfile(args.path):
        paths = [args.path]
    elif os.path.isdir(args.path):
        for root, _, files in os.walk(args.path):
            for f in files:
                if f.endswith('.svg'):
                    paths.append(os.path.join(root, f))
    else:
        print(f'ERROR: {args.path} is not a file or folder', file=sys.stderr)
        return 1

    changed_count = 0
    for p in sorted(paths):
        changed, info = normalize_svg(p, dry_run=args.dry_run)
        marker = '~' if changed else ' '
        print(f'{marker} {os.path.basename(p):60s} {info}')
        if changed:
            changed_count += 1

    print(f'\nTotal: {len(paths)} files, {changed_count} changed' +
          (' (dry-run)' if args.dry_run else ''))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
