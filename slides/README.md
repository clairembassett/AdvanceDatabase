# Visual lecture decks

Open [the lecture index](index.html), choose a lecture, and put the audience
window on the projector. Each deck contains **60 minutes of teaching**.
The scheduled ten-minute quizzes are additional. There are no decks for labs,
breaks, workshops, or student presentations. Lecture 7 is the Thursday lecture
after Reading Days.

Each scene has a timed teaching script, a prediction or discussion prompt,
an expected answer, and a sequence of animation builds. Definitions are brief.
Diagram labels, data, and formulas provide the remaining on-screen text.

## Presenting from a tablet

Use landscape orientation. Tap the pen to open the drawing tools. The pen,
highlighter, eraser, and laser pointer work on the slide itself. Use a stylus
or a finger. Once the ink layer detects a stylus, it ignores finger touches
until the page reloads to reduce accidental palm marks. Browser and hardware
palm rejection still vary.

Writing mode disables swipe navigation. Use the arrow buttons to change
builds or slides while writing. Close the drawing tools to resume swiping.
The controls appear when you touch the screen and fade when idle.

Ink stays with its slide, including when you return to it. It saves in this
browser's local storage when available. Undo restores the previous ink action,
including a clear. Ink is local to the tablet and browser, not part of the
repository. It is not synced to another device. Full screen uses the browser's
fullscreen API where supported.

## Presenter notes

Tap the presenter icon (or press **N**) to open a separate instructor window.
Keep that window off the projector. It shows the current build, next scene,
planned minute range, a lecture clock, source links, and teaching notes.
Lecture 5 shows one main idea and the instruction for the current animation
step. Expand **Expected answer** after asking the class, or **All animation
steps** to see the full sequence. Its reading-section links point to the
matching explanation in the lecture text.
Its navigation controls also operate the audience window. You can draw or use
the laser pointer on the presenter preview and see the marks on the audience
slide in real time. Both views must run in the same browser on the same device.
Allow pop-ups if
needed. Start the clock when teaching begins; it does not run during a quiz
unless you start it then.

On a tablet that mirrors its entire screen, switching to the presenter window
will also show the notes on the projector. In that setup, keep the audience
view open and use the teaching guide on another device or as a printout.
Each deck's presenter view links to a printable full teaching guide. It can
also be opened by adding `?guide=1` to the deck address.

## Controls

| Key | Action |
| --- | --- |
| Right arrow / Space | Next animation build, then next slide |
| Left arrow | Previous build |
| Page Down / Page Up | Next / previous slide |
| R | Reset the current scene |
| A | Play or pause the current animation |
| D / H / E | Pen / highlighter / eraser |
| L | Laser pointer |
| U / C | Undo ink / clear this slide's ink |
| N | Separate presenter window |
| O | Slide overview |
| F | Full screen |
| B | Blank or restore the audience screen |
| Escape | Exit drawing tools or close a dialog |
| ? | Show controls |

Animation playback stops at the end of a scene so discussion time remains
under your control. Each step also works without animation when reduced
motion is enabled in the device settings.

## Files and maintenance

`lecture-NN.html` loads the player and its assigned deck bundle. The bundles
in `decks/` contain the teaching content and editable SVG diagrams. Shared
files in `_shared/` provide layout, animation, navigation, notes, and drawing.
Everything uses ordinary HTML, CSS, and JavaScript. There is no build step,
font download, account, or network dependency. The original lecture readings
remain available alongside the decks.

Run `node scripts/validate_slides.mjs` from the repository root to check all
scenes, timing, definitions, drawing keys, and estimated text bounds.
