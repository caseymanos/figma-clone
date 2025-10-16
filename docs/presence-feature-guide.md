# Presence Awareness Feature Guide

## Quick Start

### 1. Run Database Migration
Execute the updated `supabase/schema.sql` in your Supabase SQL editor:
- Adds `status` and `last_seen` columns to profiles
- Creates `avatars` storage bucket with policies

### 2. Start Development Server
```bash
cd web
npm run dev
```

### 3. Open Canvas
- Navigate to a canvas
- Open in multiple browsers/windows to test

## Feature Walkthrough

### Presence Sidebar
**Location**: Fixed on the right side of the canvas

**Features**:
- 👥 Shows count of online users (excluding yourself)
- 📋 Lists all collaborators with:
  - Avatar (with colored border matching cursor)
  - Display name
  - Status indicator (🟢 online, 🟡 away, 🔴 busy)
  - Cursor color dot
- ↔️ Collapsible toggle button
- 🎭 Empty state when alone

**User Experience**:
- Smooth animations when users join/leave
- Real-time updates (1-2 second latency)
- Hover effects on user items
- Auto-scrolls when many users

### Profile Settings Modal
**Access**: Click "👤 Profile" button in header

**Capabilities**:
- **Avatar Upload**
  - Drag/drop or click to upload
  - Max 2MB, JPG/PNG supported
  - Instant preview
  - Stored in Supabase Storage
  
- **Display Name**
  - Free-form text input
  - Updates cursor labels immediately
  - Visible to all collaborators

- **Status Selection**
  - 🟢 Online: Actively working
  - 🟡 Away: Temporarily unavailable
  - 🔴 Busy: Do not disturb
  - Visual indicator in sidebar

- **Validation & Feedback**
  - Real-time error messages
  - Success confirmation
  - Loading states during save/upload

## Integration with Existing Features

### Cursor System
- Presence data shared between sidebar and cursors
- Cursor labels match sidebar display names
- Cursor colors match sidebar color dots
- Both systems stay perfectly synchronized

### Authentication
- Profile created automatically on sign-in
- OAuth avatars imported (GitHub, Google)
- Default status: "online"
- Display name from OAuth or email

## Technical Details

### State Management
```typescript
// Presence state store
usePresenceState()
  .users // Record of online users
  .addUser()
  .removeUser()
  .updateUser()
```

### Shared Hook
```typescript
// Use in any component
const { trackCursor } = usePresenceChannel({
  canvasId,
  onCursorUpdate: (cursors) => { /* handle */ }
})
```

### Components
```typescript
// Reusable avatar
<UserAvatar 
  displayName="John Doe"
  avatarUrl="/path/to/avatar.jpg"
  status="online"
  size="medium"
  cursorColor="#ef4444"
/>

// Sidebar
<PresenceSidebar currentUserId={userId} />

// Settings modal
<ProfileSettings onClose={() => {}} />
```

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [← Home]  Canvas: xyz...  [📋 Copy]  [👤 Profile] [Sign out]│
├─────────────────────────────────────────────────┬───────────┤
│                                                 │ [→]       │
│  Canvas Area                                    │ Online: 2 │
│  (Objects, Cursors, Tools)                      │           │
│                                                 │ ┌───────┐ │
│  [FPS: 60]                                      │ │ Avatar│ │
│                                                 │ │ Alice │ │
│                                                 │ │ 🟢 ●  │ │
│                                                 │ └───────┘ │
│                                                 │           │
│                                                 │ ┌───────┐ │
│                                                 │ │ Avatar│ │
│                                                 │ │ Bob   │ │
│                                                 │ │ 🔴 ●  │ │
│                                                 │ └───────┘ │
└─────────────────────────────────────────────────┴───────────┘
```

## User Flows

### New User Joins
1. User signs in → Profile created with OAuth data
2. User opens canvas → Presence channel subscription
3. Profile info broadcast → Other users see in sidebar
4. User moves mouse → Cursor appears for others
5. Display name shown in both cursor label and sidebar

### User Updates Profile
1. Click "Profile" button → Modal opens
2. Upload avatar → Stored in Supabase Storage
3. Update display name → Saved to database
4. Change status → Real-time broadcast
5. Others see updates within 1-2 seconds

### User Leaves
1. User closes tab/browser → Presence unsubscribe
2. Sidebar removes user within 5 seconds
3. Cursor disappears from canvas
4. `last_seen` timestamp updated in database

## Tips & Best Practices

### For Users
- **Keep names short**: Long names may truncate in sidebar
- **Upload high-quality avatars**: They'll be scaled down automatically
- **Set status appropriately**: Helps team know your availability
- **Collapse sidebar**: More canvas space when not needed

### For Developers
- **Monitor Supabase Storage**: Avatar files can accumulate
- **Check Realtime quotas**: Each user = 1 connection
- **Test with 5+ users**: Verify sidebar performance
- **Watch bundle size**: Consider code splitting for large teams

## Troubleshooting

### User Not Appearing in Sidebar
- Check Supabase Realtime is enabled for project
- Verify presence channel subscription successful
- Confirm user authenticated and profile exists
- Check browser console for errors

### Avatar Not Uploading
- Verify Supabase Storage bucket exists
- Check storage policies allow authenticated uploads
- Ensure file is <2MB and valid image format
- Check browser console for upload errors

### Outdated Information in Sidebar
- Refresh page to re-sync
- Check network connection stability
- Verify Supabase project not paused/rate-limited
- Check browser console for WebSocket errors

## Performance Considerations

### Expected Metrics
- **Sidebar render**: <50ms for 10 users
- **Avatar upload**: <2s for 500KB
- **Presence sync**: <200ms latency
- **No FPS impact**: Canvas stays at 60fps

### Optimization Tips
- Avatars cached by browser
- Zustand minimizes re-renders
- Cursor updates throttled (50ms)
- Konva layers isolated

## Future Enhancements

### Coming Soon
- [ ] Click user to follow their cursor
- [ ] Filter/search users in large sessions
- [ ] User roles displayed in sidebar
- [ ] Activity indicators (editing, idle)
- [ ] Compact sidebar mode (avatars only)

### Potential Features
- [ ] Direct messaging between users
- [ ] Presence history/analytics
- [ ] Custom status messages
- [ ] User groups/teams
- [ ] Video chat integration

## Feedback & Support

If you encounter issues or have suggestions:
1. Check this guide first
2. Review implementation summary in `/docs/presence-implementation-summary.md`
3. Check browser console for errors
4. Verify Supabase project configuration
5. Test in different browsers

---

**Version**: 1.0  
**Last Updated**: 2025-10-16  
**Compatibility**: React 19+, Supabase 2.75+, Konva 10+

