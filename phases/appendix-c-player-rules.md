# Appendix C: Player rules

Players can **walk, run, jump, look around, open stations and register**, and nothing else. The island is a website, not a sandbox: every rule keeps visitors from getting lost, trapped, or into a broken state.

| # | Players can't | Why | How it's enforced | Phase | How to try to break it |
|---|---|---|---|---|---|
| 1 | Break or place blocks | Paths and stations stay intact for everyone | No block-editing code exists; terrain mesh is static | 1 | Click/hold on blocks; nothing changes |
| 2 | Leave the island or swim out | Nothing out there; easy to get lost | Invisible shoreline ring collider; below y = −5 respawn at the dock | 2 | Sprint into the sea from every side; teleport outside with `?debug` |
| 3 | Fly, double-jump, climb trees/roofs/clock tower | Get stuck on props or see unfinished model backs | One jump clears exactly one block; tall props have smooth vertical colliders 3+ blocks above their top; no fly mode | 2 | Spam jump against every tree and prop; jump from slabs |
| 4 | Walk through walls or props | Breaks the look; can trap them inside a model | Every prop has a collider; spawn, stand points and teleport targets tested to be open space | 2–3 | Walk into every prop at sprint; teleport to every station |
| 5 | Move faster than a sprint | Overshoots stations; motion sickness | Walk/sprint speed capped (`maxVelLimit`, `sprintMult`) | 2 | Diagonal + sprint + jump; measure speed in `?debug` |
| 6 | Move while a panel is open, a field has focus, the tour plays, or the portal transition runs | Typing "w" would walk them away; camera fights the animation | `selectControlsDisabled` → `disableControl`; typing guard on focusin/focusout; global keys ignore typing targets | 2–3 | Type "wasd 123" in the team-name field; press keys during tour/portal |
| 7 | Open two panels at once | Confuses keyboard and screen-reader users | `open()` replaces the current section | 3 | Click a station while another panel is open; press 1 then 2 quickly |
| 8 | Open a station from far away with E | Prompt and panel wouldn't match what they see | E only acts on `nearbyStation`; hotbar is the long-distance shortcut | 3 | Press E everywhere outside zones |
| 9 | Lose unsaved registration details by fast-travelling | Teams would retype members | "Leave registration?" guard on hotbar/Esc/close + sessionStorage draft | 5 | Half-fill the form, press 4, Esc, click another station, reload |
| 10 | Register after the deadline, twice with one email, or faster than the rate limit | Fairness and spam protection | DB function + unique indexes + Postgres rate limit; portal turns grey after deadline | 5 | Register after `closes_at` on staging; reuse an email in different case; hammer submit |
| 11 | Push the camera underground, through the island or too far away | Camera inside terrain shows the world from below | Camera distance and pitch limits; camera collision pulls in | 2 | Drag the camera down hard next to cliffs and walls; pinch out fully |
| 12 | Change anything other visitors see | No moderation needed | No chat, signs, or user-generated content in the world | 1 | — |
| 13 | Get trapped by mouse or keyboard | Locked cursor or keys with no way out | No pointer lock; Esc always closes the panel; R respawns; stuck detector hints R | 2 | Get wedged between props; press R |
| 14 | Pinch-zoom the page while in 3D | Pinch should zoom the camera | `touch-action: none` on the canvas only; 2D page keeps normal zoom | 0, 6 | Pinch on the canvas vs. on a panel vs. on `/2d` |
| 15 | Hear sound they didn't ask for | Autoplay annoys people at events and in class | Sound off by default; toggle persisted | 6 | Fresh browser profile; click around; silence |
| 16 | Trigger a panel by an object other than the player (**Added**) | Physics glitches opening panels | Sensors check `rigidBodyObject.name === 'player'` | 3 | Drop a debug physics box into a zone |
| 17 | Be auto-walked into a wall forever (**Added**) | Hotbar travel could get stuck | Waypoint travel + 4 s timeout → teleport; any movement key cancels | 3 | Block the path with a debug box, then use the hotbar |

**Playtest ritual** at the end of Phases 2, 3 and 5: two people spend 15 minutes each trying to break every row. Log each failure as a GitHub issue labelled `player-rule`.
