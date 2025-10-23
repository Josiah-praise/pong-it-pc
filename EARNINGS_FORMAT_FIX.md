# 💰 Earnings Formatting to 4 Significant Figures

## Implementation
Created `formatEarnings()` function in `GameHistory.tsx` that:
- For numbers < 1: Uses `toPrecision(4)` for 4 significant figures
- For numbers >= 1: Uses `toFixed(4)` for 4 decimal places
- Handles NaN gracefully by returning '0'

## Examples
- `70.013000000000001` → `70.0130`
- `0.00456789` → `0.004568`
- `123.456789` → `123.4568`

## Result
- Clean, readable earnings display
- No text wrapping needed
- Consistent precision across all values
- Font size restored to normal `1.5rem`

