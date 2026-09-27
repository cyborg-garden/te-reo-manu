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

## Controls

- **Mouse / touch** — click or tap.
- **Keyboard** — arrow keys move the focus ring to the nearest choice in that
  direction; Enter or Space chooses. Choosing an answer moves the ring to
  Check, so it plays as choose, Enter, Enter. Backspace takes the last token
  off a Waiata phrase; with nothing to take off it stays put, and on other
  screens it jumps to the level row. Choosing the level you are partway
  through from there (by key or pad) goes back to your question instead of
  restarting it.
- **Gamepad (website)** — d-pad or left stick moves, A chooses, B goes back
  (same as Backspace).
- **xbox50 console** (`/cart/…`) — the game does not read the gamepad
  itself; the console shell turns the stick into arrow keys and the button
  into keys. A tap of either button (A and B both count, so the one-button
  homebrew stick works) chooses; a hold of about half a second is back; a
  hold of 2.5 s leaves the game.
- On the website the arrows and Space scroll the page as usual until you
  engage the game with the keyboard: press Enter (the ring appears on Begin,
  or on the current question), or Tab into it. Clicking with the mouse does not take over the
  arrows. Once you are steering, the arrows belong to the game.

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
