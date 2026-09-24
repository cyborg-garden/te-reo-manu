# Te Reo Manu

Learn to speak the language of birds. A small five-level game built on real
Xeno-Canto recordings of tūī and other Aotearoa birds.

1. **Ko Wai?** — which bird is singing?
2. **Ngā Oro** — the five tūī syllable types, by ear
3. **E Whai Ake** — what does a tūī sing next?
4. **Waiata** — compose a phrase a tūī would find plausible
5. **Te Rohe** — read tūī dialect geography

Play it at https://cyborg.garden/games/te-reo-manu/

This game started as a tab inside
[Aotearoa Birdsong, Decoded](https://cyborg.garden/open-science/experiments/nz-birdsong/),
the research page it draws its data from. This repo is now its one source:
cyborg.garden pulls it through `games.sources.json`, and `meta.json` here
decides whether it is live.

## Run locally

Static files, no build, no dependencies:

    python3 -m http.server 8000

then open http://localhost:8000/. Progress is saved in the browser
(`localStorage`, key `reo-manu-progress`).

## Files

- `index.html` — page and styles
- `game.js` — the game (levels, questions, scoring)
- `audio/` — seven Xeno-Canto clips used in level 1
- `samples/` — syllable excerpts (`.wav`) and their spectrograms (`.png`) for levels 2 and 3
- `meta.json` — arcade card and publish status

## Credits

Recordings are from [Xeno-Canto](https://xeno-canto.org) and remain under
their recordists' licences (Creative Commons, typically non-commercial).
Recordists are credited in the page footer; each licence is on the
recording's Xeno-Canto page.

Te reo Māori translations are interpretive, not standardised ornithological
terminology.
