# 💰 Earnings Display Overflow Fix

## Issue
The earnings value in the stats card was overflowing horizontally when displaying very long decimal values (e.g., `70.013000000000001 PC`).

## Fix Applied
Updated `.stat-value` in `GameHistory.css`:
- Added `word-break: break-all` to allow breaking at any character
- Added `overflow-wrap: break-word` as fallback for better word wrapping
- Added `max-width: 100%` to respect container bounds
- Added `text-align: center` to keep centered alignment

For the earnings card specifically (`.stat-card.highlight .stat-value`):
- Reduced `font-size` from `1.5rem` to `1rem` for better fit
- Added `line-height: 1.4` for readability when text wraps

## Result
- Long earnings values now wrap properly within the card boundaries
- No horizontal overflow
- Maintains visual hierarchy and readability

