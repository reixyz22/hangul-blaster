"""Cut Noto Sans KR down to the glyphs this game can actually paint.

The full family is ~450 KB of split woff2 chunks on a page that shows at most a
few hundred Hangul glyphs, and the stylesheet carrying its @font-face rules is
render-blocking. Subsetting it to the exact character set turns that into one
file of a few tens of KB.

Run it after changing the level pools or any Korean string in `src/`:

    pip install fonttools brotli
    curl -L -o NotoSansKR.ttf \
      "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf"
    python scripts/subset-font.py NotoSansKR.ttf

The source font is not committed; the subset in src/fonts/ is.
"""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = SRC / "fonts" / "noto-sans-kr-subset.woff2"

# Syllable composition, mirroring src/lib/levels.ts.
INITIALS = list("ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ")
VOWELS = list("ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ")
FINALS = [""] + list("ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ")

HANGUL = re.compile(r"[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-퟿]")


def compose(initial: str, vowel: str, final: str = "") -> str:
    index = (INITIALS.index(initial) * 21 + VOWELS.index(vowel)) * 28 + FINALS.index(final)
    return chr(0xAC00 + index)


def array_from_levels(name: str) -> list[str]:
    """Read one of the pool arrays out of levels.ts so the two cannot drift."""
    source = (SRC / "lib" / "levels.ts").read_text(encoding="utf-8")
    match = re.search(rf"const {name} = \[(.*?)\];", source, re.S)
    if not match:
        raise SystemExit(f"Could not find {name} in src/lib/levels.ts")
    return re.findall(r'"(.+?)"', match.group(1))


def characters() -> set[str]:
    chars: set[str] = set()

    # Every Korean character written literally anywhere in the source.
    for path in SRC.rglob("*.ts*"):
        chars.update(HANGUL.findall(path.read_text(encoding="utf-8")))

    # Every syllable block level 6 can generate.
    for initial in array_from_levels("SYLLABLE_INITIALS"):
        for vowel in array_from_levels("SYLLABLE_VOWELS"):
            chars.add(compose(initial, vowel))
    for initial in array_from_levels("BATCHIM_INITIALS"):
        for vowel in array_from_levels("BATCHIM_VOWELS"):
            for final in array_from_levels("BATCHIM_FINALS"):
                chars.add(compose(initial, vowel, final))

    return chars


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: python scripts/subset-font.py <NotoSansKR[wght].ttf>")

    chars = characters()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = "".join(sorted(chars))

    subprocess.run(
        [
            sys.executable,
            "-m",
            "fontTools.subset",
            sys.argv[1],
            f"--text={text}",
            "--flavor=woff2",
            "--layout-features=*",
            "--no-hinting",
            "--desubroutinize",
            f"--output-file={OUT}",
        ],
        check=True,
    )
    print(f"{len(chars)} glyphs -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
