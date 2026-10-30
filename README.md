# Keypath 🎹

### Learn the song. See the note. Find it on the piano.

Starting piano can feel like learning three things at once: the song, the sheet music, and where your fingers go. **Keypath brings those pieces together** so beginners can start with a familiar melody, follow simple number cues, and gradually connect every note to the staff and the keyboard.

Choose a song, slow it down, and practise one note at a time. No piano experience needed.

## How it works

1. **Choose a melody.** Browse ten familiar traditional and public-domain songs across beginner-friendly levels and lengths.
2. **See the same notes three ways.** Each melody is shown as a traditional treble staff, number notation, and piano keys. They all come from the same note sequence, so the views stay in sync.
3. **Learn at your pace.** Listen to the melody, change its tempo, jump to any note, or select a short section to repeat.
4. **Play it yourself.** Tap the on-screen keys or use your computer keyboard. Play-along mode waits for the next note and gives you feedback.
5. **Build a practice habit.** Your profile tracks song progress, completed songs, practice time, active days, and your streak.

Use **Full screen** beside the piano to bring the staff, number notes, section controls, keyboard, and playback controls together in a focused practice view.

## What you can do

- Explore **Home**, **Song library**, and **How it works** pages.
- Start with a short guided lesson that connects a number, a staff note, and a piano key.
- Tap a note on the staff or a number below it to jump straight to that part of the song.
- Select a note range and loop it until it feels comfortable.
- Adjust playback from **50 to 130 BPM**, including while a song is playing.
- Practise with the clickable keyboard, computer-keyboard shortcuts, or play-along mode.
- Filter songs by level or length and see a suggested next song.
- Edit your profile and review a year-style practice calendar and daily streak.

## Try the computer keyboard

The shortcut row plays the notes from middle C through the next C:

| Piano note | Computer key |
|---|---|
| C4 (middle C) | `A` |
| C♯4 | `W` |
| D4 | `S` |
| D♯4 | `E` |
| E4 | `D` |
| F4 | `F` |
| F♯4 | `T` |
| G4 | `G` |
| G♯4 | `Y` |
| A4 | `H` |
| A♯4 | `U` |
| B4 | `J` |
| C5 | `K` |

You can also click or tap any on-screen piano key.

## Run it on your Mac

You’ll need [Node.js](https://nodejs.org/) and [Visual Studio Code](https://code.visualstudio.com/).

1. Open the `piano prototype` folder in VS Code.
2. Choose **Terminal → New Terminal**.
3. Install the dependencies:

   ```bash
   npm install
   ```

4. Start the local site:

   ```bash
   npm run dev
   ```

5. Open the address Vite prints in the terminal, usually [http://localhost:5173](http://localhost:5173).

Press **Control+C** in the terminal to stop the development server.

Other useful commands:

```bash
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build locally
```

## Your practice data

Keypath saves your profile and practice progress in your browser on this device. There are no accounts or cloud sync yet, so that information does not follow you to another browser or computer. The app does not need an API key or an external music service.

## Built with

React · TypeScript · Vite · Lucide icons · Web Audio API

## A note about the music

Keypath is an early learning prototype. Its piano uses simple synthesized tones, and the displayed sheet is a simplified treble-clef melody rather than engraved, publication-ready notation. Songs use a C-major number system where **C = 1, D = 2, E = 3, F = 4, G = 5, A = 6, and B = 7**. The app does not listen to an external piano or recognize acoustic notes.
