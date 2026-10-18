# Self-hosted typefaces

## Pretendard Variable

Original, unmodified WOFF2 from the official `orioncactus/pretendard` repository:
https://github.com/orioncactus/pretendard/tree/main/packages/pretendard/dist/web/variable/woff2

Copyright and SIL OFL 1.1: `Pretendard-LICENSE.txt`.
Used for body copy, controls, amounts, dates and progress labels.

## Chaepium Editorial Regular

A renamed, static weight-400 Korean/Latin WOFF2 subset of Noto Serif KR, obtained from the official Google Fonts distribution:
https://github.com/google/fonts/tree/main/ofl/notoserifkr

Original file: `NotoSerifKR[wght].ttf`. Copyright and SIL OFL 1.1: `NotoSerifKR-OFL.txt`.

Converted with fontTools (variable instancer and subset) and Brotli. Family renamed to `Chaepium Editorial`; original copyright and license metadata retained. Included ranges: U+0000–024F, U+1100–11FF, U+2000–206F, U+3000–303F, U+3130–318F, U+A960–A97F, U+AC00–D7AF, U+D7B0–D7FF and U+FF00–FFEF. Other characters use system fallback fonts.

Used only for short editorial headings. MaruBuri was considered, but its official distribution was inaccessible in this environment; the implemented title font is Noto Serif KR, not MaruBuri. Both web fonts are hosted in this repository and use `font-display: swap`.
