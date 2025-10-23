# ⏱️ Pause Countdown Fix

## Improvements
1. **Live countdown on pause banner**
   - Added `pauseCountdown` state and timer to update every second.
   - Pause modal now shows `Resuming in X seconds...` with pluralisation handling.

2. **Automatic resume after 10 seconds**
   - `gameResumed` socket event clears pause state and resets countdown so the game resumes smoothly.

## Technical Notes
- Added `pauseCountdown` state with a `useEffect` timer decrement.
- Updated `gamePaused` and `gameResumed` socket handlers to initialise/reset countdown.
- Updated pause modal to display the countdown value.

