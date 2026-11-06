# Animations: GSAP icon and Start animation (6 Nov 2026)

Commit `285a90b` on main. Previous field-border change: `6dd87f1`.

## What changed

- **Layout, Default tab:** the Animation group is gone.
- **Header:** a third icon, far right, "GSAP animations". It shows only while the GSAP setting (Interactions and Animations settings, `enqueue_gsap`) is on. It opens a stacked list of GSAP animations, the same `animation` attribute and `data-animate` values as before.
- **Interactions:** the Animate action (a GSAP preset) is now **Start animation**, with 34 normal animations named as Bricks names them (fade, slide, zoom, rotate, flip, bounce, pulse, flash, shake X and Y, swing, wobble, heart beat), duration and delay in ms (default 1000 and 0, clamped 0 to 10000). Names with "In" start hidden and show when they run (Bricks' rule).
- **Runtime:** `includes/blocks/assets/interactions.js` runs Start animation with the Web Animations API. No GSAP.
- **GSAP loading:** the blocks no longer enqueue their own copy of GSAP. The features file (`includes/features/interactions.php`) loads it once when the setting is on; before, the page had two copies.
- **Presets:** five `scrub` values from snn-brx added (`scrub:true`, `scrub:1`, `scrub:2`, `scrub:4`, `scrub:8`). The rest of the snn-brx lists were already in `animation-presets.php`.

## Bricks reference

- `LOCAL_SITES/bricks.local/wp-content/themes/bricks/includes/interactions.php`: triggers, actions, the `startAnimation` fields.
- `includes/setup.php` (about line 1243): the animation types.
- `assets/js/frontend.js` (about lines 10396 and 11084 to 11380): the runner, including the hidden-on-load rule for "In" names.

## Tests

- `layout-blocks-test.php`: 228 of 228 (373 presets; GSAP setting on and off; Start animation sanitising and render).
- `block-tools-test.php`: 37 of 37.
- `functional.php`: 56 of 56.

## Browser checks on blocks.local (draft page 1059, "ANIM TEST 6 Nov")

- Header: three icons with GSAP on, two with it off. No Animation group on the Default tab.
- Start animation on page load: runs. On click (pulse): plays. On entering the viewport (fade-in left, placed below the fold): opacity 0 and hidden until scrolled in, then runs to opacity 1.
- GSAP on: one copy of gsap and of gsap-data-animate on the page. GSAP off: no `data-animate` written, no GSAP scripts.

Screenshots: `docs/research/animations-screens-2026-11-06/`.

## Not done

- Bricks' other triggers (animation end, scroll, AJAX, form, filter) and other actions.
- The other 65 Bricks animation names.
- The snn-brx text effects (glitch, RGB shift, rainbow, warp, slit scan, pixelate, wavevy): shader effects, not data-animate.
- Reduced motion: the runtime does not read `prefers-reduced-motion` yet.
- A short flash on slow pages before the script hides "In" animations. Bricks puts that rule in the page.
- Old Animate interactions are dropped on save.

## Rollback

`git revert 285a90b` on main, only after the user says so.
