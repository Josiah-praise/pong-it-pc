# 🐛 Debug: Blank Screen on /unclaimed-stakes

## ✅ Fixes Applied

1. **Fixed hook inconsistency** in `usePushContract.ts`:
   - Changed `usePushChainContext()` to `usePushChain()` 
   - Fixed transaction method to use `encodeTxData` like other hooks

2. **Verified files exist**:
   - ✅ `UnclaimedStakes.tsx` exists
   - ✅ `UnclaimedStakes.css` exists
   - ✅ Route configured in `App.tsx`
   - ✅ Build succeeds without errors

## 🔍 Debugging Steps

### Step 1: Check Browser Console
Open the browser console (F12) and look for:
- Any JavaScript errors
- Failed network requests
- Component rendering errors

Common errors to look for:
```
- Cannot read property 'X' of undefined
- Module not found
- Unexpected token
- Failed to fetch
```

### Step 2: Test Component Isolation

Create a minimal test by temporarily simplifying the component.

**Option A: Add console logs**

In `UnclaimedStakes.tsx`, add at the top of the component:

```typescript
const UnclaimedStakes: FC = () => {
  console.log('🎯 UnclaimedStakes component rendering...');
  
  const navigate = useNavigate();
  console.log('✅ useNavigate hook loaded');
  
  const { connectionStatus } = usePushWalletContext();
  console.log('✅ usePushWalletContext hook loaded, status:', connectionStatus);
  
  const { pushChainClient } = usePushChainClient();
  console.log('✅ usePushChainClient hook loaded, client:', !!pushChainClient);
  
  // ... rest of component
```

**Option B: Create a minimal version**

Temporarily replace the content with:

```typescript
const UnclaimedStakes: FC = () => {
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h1>Unclaimed Stakes Test</h1>
      <p>If you see this, routing works!</p>
    </div>
  );
};
```

### Step 3: Check if Hooks are Initialized

The blank screen might be caused by:
1. **Push Chain not initialized**: The component uses `usePushChainClient()`
2. **Router not initialized**: Using `useNavigate()`
3. **Hook dependency issue**: Missing provider wrapper

**Verify providers are wrapping the app** in `main.tsx`:

```typescript
<PushChainProviders config={walletConfig}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</PushChainProviders>
```

### Step 4: Check Network Requests

When the page loads, check Network tab for:
- `GET /games/abandoned-stakes/:address` - Should return 200 or 404
- Backend URL should be correct

### Step 5: Test with Wallet Connected

The component shows different states based on wallet connection:
1. **Not connected**: Should show "Wallet Not Connected" message
2. **Connected**: Should fetch and display stakes

Try:
1. Navigate to `/unclaimed-stakes` WITHOUT wallet connected
2. Should see: "🔌 Wallet Not Connected"

If you see nothing, it's a rendering issue, not a logic issue.

## 🔧 Quick Fixes to Try

### Fix 1: Add Error Boundary

Wrap the route in App.tsx with an error boundary:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

<Route
  path="/unclaimed-stakes"
  element={
    <ErrorBoundary fallback={<div>Error loading page</div>}>
      <UnclaimedStakes />
    </ErrorBoundary>
  }
/>
```

### Fix 2: Check CSS is loading

Add this at the top of `UnclaimedStakes.tsx`:

```typescript
console.log('🎨 CSS file path:', '../styles/UnclaimedStakes.css');
```

And in the component, add a test style:

```typescript
return (
  <div className="unclaimed-stakes-container" style={{ background: 'red', minHeight: '100vh' }}>
    <h1 style={{ color: 'white' }}>TEST</h1>
    {/* rest of component */}
  </div>
);
```

If you see red background, CSS is loading but hidden.
If you see nothing, component isn't rendering at all.

### Fix 3: Simplify Component Temporarily

Comment out all hooks except basic ones:

```typescript
const UnclaimedStakes: FC = () => {
  const navigate = useNavigate();
  // const { connectionStatus } = usePushWalletContext();
  // const { pushChainClient } = usePushChainClient();
  
  return (
    <div className="unclaimed-stakes-container">
      <h1>Unclaimed Stakes</h1>
      <button onClick={() => navigate('/')}>Back</button>
    </div>
  );
};
```

Gradually add back hooks one by one to find which one causes the issue.

## 🎯 Most Likely Causes

Based on "blank screen" with no errors:

1. **CSS Issue**: Component renders but is invisible
   - Background color same as text color
   - Position: absolute taking it off-screen
   - Display: none somewhere

2. **Hook Error**: Component crashes silently
   - Missing provider wrapper
   - Push Chain client not initialized
   - Hook import path wrong

3. **Conditional Rendering**: Component returns null
   - Check all `if (!x) return` statements
   - Currently has early return for `!isConnected`

## 📝 Expected Console Output (Working)

When component loads successfully, you should see:

```
🎯 UnclaimedStakes component rendering...
✅ useNavigate hook loaded
✅ usePushWalletContext hook loaded, status: connected
✅ usePushChainClient hook loaded, client: true
Loading abandoned stakes...
Received abandoned stakes: { games: [...], pagination: {...} }
```

## 🆘 If Still Blank After All Fixes

1. Share browser console output (F12 → Console tab)
2. Share network requests (F12 → Network tab)
3. Check if other pages work (`/`, `/my-wins`, `/game-history`)
4. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. Clear browser cache and reload

---

## ✅ Quick Test Command

Run dev server and check console:

```bash
cd push-chain-frontend
npm run dev
```

Then navigate to: `http://localhost:5173/unclaimed-stakes`

Open console (F12) and look for any red error messages.

