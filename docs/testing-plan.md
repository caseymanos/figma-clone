# Testing & Evaluation Plan

## Current Status Check (MVP Requirements)

### ✅ Completed
1. **Basic canvas with pan/zoom** - Konva Stage with draggable + mouse wheel zoom
2. **At least one shape type** - Rectangle implemented
3. **User authentication** - GitHub, Google, and Email magic link support
4. **Deployed and publicly accessible** - Live on Vercel

### 🚧 In Progress
1. **Ability to create and move objects** - Create button exists, needs debugging
2. **Real-time sync between 2+ users** - Channels set up, needs verification
3. **Multiplayer cursors with name labels** - Presence channel implemented, needs testing
4. **Presence awareness** - Infrastructure ready, needs UI

---

## Testing Checklist

### Phase 1: Single User Functionality
- [ ] **Canvas Navigation**
  - [ ] Pan by dragging the stage
  - [ ] Zoom with mouse wheel (in/out)
  - [ ] Stage doesn't jitter or lag
  - [ ] Zoom centers on mouse position

- [ ] **Shape Creation**
  - [ ] Click "Add Rectangle" button
  - [ ] Rectangle appears on canvas
  - [ ] Rectangle has correct initial position (100, 100)
  - [ ] Rectangle has correct size (120x80)
  - [ ] Console shows "Rectangle added: ..." or error message

- [ ] **Shape Manipulation**
  - [ ] Click and drag rectangle
  - [ ] Rectangle follows mouse smoothly
  - [ ] Release updates position
  - [ ] Position persists after refresh

- [ ] **Authentication**
  - [ ] Can sign in with GitHub
  - [ ] Can sign in with Google
  - [ ] Can sign in with email magic link
  - [ ] Sign out works
  - [ ] Display name shows correctly

### Phase 2: Multi-User Collaboration (Critical)
**Setup**: Open 2 browser windows/incognito tabs, sign in as different users

- [ ] **Multiplayer Cursors**
  - [ ] User A sees User B's cursor
  - [ ] Cursor position updates in real-time (<50ms lag)
  - [ ] Cursor shows correct name label
  - [ ] Cursor color is distinct
  - [ ] Cursor disappears when user leaves

- [ ] **Real-Time Shape Sync**
  - [ ] User A creates rectangle → User B sees it instantly (<100ms)
  - [ ] User A drags shape → User B sees it move in real-time
  - [ ] User B drags same shape → both see smooth movement
  - [ ] No "rubber banding" or position conflicts

- [ ] **Presence Awareness**
  - [ ] Can see who is currently online
  - [ ] Count updates when users join/leave
  - [ ] Names displayed correctly

### Phase 3: Conflict Resolution & Edge Cases
- [ ] **Simultaneous Edits**
  - [ ] Both users drag different shapes simultaneously
  - [ ] Both users drag the SAME shape simultaneously
  - [ ] Last write wins (verify with updated_at)
  - [ ] No shapes get "stuck" or lost

- [ ] **Connection Issues**
  - [ ] User refreshes mid-edit → canvas state persists
  - [ ] User loses connection → shapes don't duplicate on reconnect
  - [ ] All users leave and return → work is still there
  - [ ] Network throttle (slow 3G) → still functional

- [ ] **Database/RLS**
  - [ ] Can only edit canvases you're a member of
  - [ ] Cannot see other users' private canvases
  - [ ] Canvas creator has proper permissions

### Phase 4: Performance Testing
- [ ] **FPS During Interactions**
  - [ ] Pan maintains 60 FPS
  - [ ] Zoom maintains 60 FPS
  - [ ] Drag maintains 60 FPS
  - [ ] Multiple simultaneous drags don't drop frames

- [ ] **Load Testing**
  - [ ] Create 50 rectangles → no slowdown
  - [ ] Create 100 rectangles → still smooth
  - [ ] 3 users editing simultaneously → no lag
  - [ ] 5 users editing simultaneously → acceptable performance

- [ ] **Sync Performance**
  - [ ] Shape updates propagate in <100ms
  - [ ] Cursor updates propagate in <50ms
  - [ ] Throttling works (not sending every frame)

---

## Debugging Current Issues

### Issue: "Add Rectangle" Not Working

**Diagnosis Steps**:
1. Open browser DevTools Console
2. Click "Add Rectangle"
3. Check for:
   - Alert with error message
   - Console log: "Rectangle added: ..." or "Failed to add rectangle: ..."
   - Network tab: POST request to Supabase
   - Any RLS policy errors

**Common Causes**:
- User is not a member of the canvas (RLS blocking)
- Canvas ID is invalid
- Network/connection issue
- Missing environment variables

**Fix Strategy**:
1. Navigate to home page
2. Click "Create new canvas" (ensures membership)
3. Try adding rectangle to YOUR canvas
4. If still fails, check Supabase logs

---

## Evaluation Against MVP Spec

### MVP Requirements Scoring

| Requirement | Status | Notes |
|------------|--------|-------|
| Basic canvas with pan/zoom | ✅ | Working |
| One shape type (rectangle) | 🟡 | Exists, creation needs debug |
| Create and move objects | 🟡 | Move works, create needs fix |
| Real-time sync 2+ users | 🟡 | Infrastructure ready, needs testing |
| Multiplayer cursors + labels | 🟡 | Implemented, needs verification |
| Presence awareness | 🔴 | Backend ready, UI missing |
| User authentication | ✅ | GitHub/Google/Email working |
| Deployed & accessible | ✅ | Live on Vercel |

**Legend**: ✅ Complete | 🟡 Partial | 🔴 Not started

### Critical Path to MVP Pass

**Priority 1 (Must Have - 2 hours)**:
1. Fix "Add Rectangle" button
2. Verify real-time sync with 2 browsers
3. Test multiplayer cursors visibility
4. Basic presence UI (online count)

**Priority 2 (Should Have - 1 hour)**:
5. Test shape drag sync between users
6. Verify persistence (refresh test)
7. Basic conflict resolution verification

**Priority 3 (Nice to Have - 1 hour)**:
8. Presence list with names
9. Performance optimization
10. Better error handling

---

## Test Scenarios (Copy-Paste Ready)

### Scenario 1: Basic Collaboration
```
1. User A: Create canvas, add rectangle, drag it around
2. User B: Join same canvas (share URL)
3. User B: Should see User A's cursor + rectangle
4. User A: Create another rectangle
5. User B: Should see new rectangle appear instantly
6. User B: Drag one of the rectangles
7. User A: Should see it move in real-time
```

### Scenario 2: Conflict Resolution
```
1. Both users grab the same rectangle
2. User A drags to (200, 200)
3. User B drags to (300, 300)
4. Release simultaneously
5. Expected: One position wins (last write)
6. Verify: No duplicate shapes, no lost shapes
```

### Scenario 3: Persistence
```
1. Create 3 rectangles
2. Drag them to different positions
3. Hard refresh browser (Cmd+Shift+R)
4. Expected: All 3 rectangles in same positions
5. Try in second browser
6. Expected: Same 3 rectangles visible
```

### Scenario 4: Performance
```
1. Create 20 rectangles rapidly
2. Pan and zoom around
3. Expected: Smooth 60 FPS
4. Drag multiple shapes
5. Expected: No lag or stutter
```

---

## Metrics to Track

### Quantitative
- **Latency**: Time from action → seen by other user
- **FPS**: Frames per second during interactions
- **Shape Count**: Max shapes before slowdown
- **User Count**: Max concurrent users supported
- **Error Rate**: Failed syncs / total syncs

### Qualitative
- **Smoothness**: Does it "feel" responsive?
- **Reliability**: Can you trust the sync?
- **UX**: Is it clear what's happening?

---

## Known Issues & Fixes

### Issue 1: React Error #185 (Maximum Update Depth)
- **Status**: ✅ FIXED
- **Solution**: Memoized handlers, stabilized refs, guarded state updates

### Issue 2: Add Rectangle Not Working
- **Status**: 🔍 DEBUGGING
- **Next Step**: Check error message in deployed app

### Issue 3: Stage Position Controlled Loop
- **Status**: ✅ FIXED
- **Solution**: Made Stage position uncontrolled

---

## Post-MVP Enhancements

Once MVP is solid, consider:
1. **More shapes**: Circle, text, line
2. **Selection**: Multi-select with shift-click
3. **Undo/Redo**: Command history
4. **Layers panel**: Z-index management
5. **Color picker**: Custom colors
6. **Export**: Download canvas as PNG/SVG
7. **Share**: Public links, permissions
8. **AI Agent**: Natural language shape creation

---

## Success Criteria

### MVP Pass Requirements
✅ All 8 MVP checkboxes must be green  
✅ 2-browser test shows real-time sync  
✅ Shapes persist through refresh  
✅ No console errors during normal use  
✅ Deployed app is publicly accessible  

### Demo Readiness
✅ Can demo live in under 2 minutes  
✅ Multiplayer works reliably  
✅ No embarrassing bugs  
✅ Performance is acceptable  

---

## Next Immediate Steps

1. **[NOW]** Hard refresh deployed app and try "Add Rectangle"
2. **[NOW]** Copy any error message from console/alert
3. **[5 min]** Fix RLS/canvas membership issue if needed
4. **[10 min]** Open 2 browsers, test real-time sync
5. **[10 min]** Verify cursors are visible and moving
6. **[15 min]** Run through all Phase 2 tests
7. **[30 min]** Document any remaining issues
8. **[1 hour]** Fix critical blockers
9. **[15 min]** Final smoke test with fresh browsers

---

## Testing Tools

- **Browser DevTools Console**: Check errors, logs
- **Network Tab**: Monitor Supabase requests
- **Performance Tab**: Measure FPS
- **React DevTools**: Check re-renders
- **Multiple Browsers**: Chrome + Firefox for cross-browser testing
- **Incognito Mode**: Test different users easily
- **Network Throttling**: Simulate slow connections

---

## Contact for Help

If stuck:
1. Check Supabase logs (Dashboard → Logs)
2. Check Vercel deployment logs
3. Review RLS policies in Supabase SQL editor
4. Test locally first (`npm run dev`)

