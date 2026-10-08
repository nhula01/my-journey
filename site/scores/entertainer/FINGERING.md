# Fingering guidance

The bundled `fingered-galloway.pdf` is Scott Joplin's original score annotated
by Roger Galloway, published on IMSLP on March 23, 2023. The edition is licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
[Source listing](https://imslp.org/wiki/The_Entertainer_(Joplin,_Scott)).

`piano-fingering.js` transcribes the two opening measures for each hand and
selected fingerings at the first A-section opening and the two ascending
right-hand figures in the first B section (performed measures 39–40). These were visually checked
against this scan and matched by pitch and beat to the bundled Mutopia MIDI.
This transcription is a derivative under CC BY-SA 4.0, credited to Galloway.
Numbers on other notes are generated suggestions, not Galloway's annotations.
The original PDF remains unchanged. The editor also suggests some different
hand distributions later in the piece; these have not been applied to the MIDI.

The planner considers consecutive single notes and chords together, preserves
finger assignments for overlapping held notes, and uses the selected reach.
It generates a full-score plan before filtering a practice section or voice,
so changing a practice section does not reassign the same notes. A shape that
exceeds the reach, requires more than five fingers or conflicts with held notes
gets a review message rather than an impossible assignment. Generated advice
is not teacher-verified and can be adjusted to the player's hands.

The hand coach names the current keys and fingers and previews a position move
up to two beats ahead. MIDI and microphone input assess pitch, not finger usage.
