# Unclaimed Stakes UI Update ✅

## Changes Made

Updated the Unclaimed Stakes page to match the visual style of the other screens (My Wins, Game History).

### Style Updates

#### 1. **Page Layout**
- Full-screen black background
- Centered content with max-width
- Absolute positioned "Back" button (top-left)
- Larger, more prominent header with icon

#### 2. **Header Styling**
- **Icon**: 💰 emoji floating above title
- **Title**: "Unclaimed Stakes" with purple neon glow effect
- **Animation**: Pulsing text-shadow effect (matches main title)
- **Subtitle**: Press Start 2P font with better spacing

#### 3. **Stake Cards**
- Changed from simple borders to **bold 3px purple borders**
- Dark background (`rgba(10, 10, 10, 0.8)`)
- **Top gradient bar** (purple to violet)
- **Grid layout** instead of vertical list (responsive)
- Enhanced hover effects:
  - Lift animation (`translateY(-4px)`)
  - Multiple glowing shadows
  - Border color change

#### 4. **Claim Button**
- **Gradient background** (purple to violet)
- Thicker borders (2px)
- **Ripple effect** on hover (expanding circle)
- Text-transform: uppercase
- Multiple shadow layers for depth
- Better disabled state styling

#### 5. **Empty/Error States**
- Dark cards with purple/red borders (3px)
- **Floating animation** for empty icon
- Larger icons (5rem)
- Better text hierarchy
- Glowing shadow effects

#### 6. **Count Badge**
- Inline-flex positioning
- Purple border with glow
- Cleaner badge styling

### Visual Consistency

Now matches:
- ✅ My Wins page layout and card style
- ✅ Game History border and shadow effects
- ✅ Welcome screen title animation
- ✅ Overall purple (#DA76EC) theme
- ✅ Press Start 2P font throughout
- ✅ Retro gaming aesthetic

### Key CSS Classes Updated
- `.unclaimed-stakes-container` - Full page layout
- `.header` - Title section with icon
- `.stake-card` - Individual stake cards
- `.btn-claim` - Claim refund button
- `.empty-state` - No stakes message
- `.error-state` - Error display

### Responsive Design
- Grid adapts to screen size
- Mobile-friendly card layout
- Proper spacing on all devices

---

**Status**: ✅ Complete
**Files Modified**: 2 files
- `src/styles/UnclaimedStakes.css`
- `src/components/UnclaimedStakes.tsx`
