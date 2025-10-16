# Presence Feature Deployment Checklist

## Pre-Deployment Tasks

### 1. Database Migration ⚠️ **CRITICAL**
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy contents of `supabase/schema.sql`
- [ ] Execute migration (adds status fields + storage bucket)
- [ ] Verify migration successful (check profiles table schema)
- [ ] Confirm `avatars` bucket created in Storage section

### 2. Storage Configuration
- [ ] Navigate to Storage → Policies
- [ ] Verify 4 avatar policies exist:
  - Avatar images are publicly accessible (SELECT)
  - Authenticated users can upload avatars (INSERT)
  - Users can update their own avatars (UPDATE)
  - Users can delete their own avatars (DELETE)
- [ ] Test upload by uploading a test image to `avatars` bucket

### 3. Realtime Configuration
- [ ] Verify Realtime is enabled for your project
- [ ] Check presence channel quota (free tier: 200 concurrent)
- [ ] Monitor usage in Dashboard → Realtime section

## Build & Test

### 4. Local Testing
```bash
cd web
npm install  # Install any new dependencies
npm run build  # Verify builds successfully
npm run dev  # Start dev server
```

### 5. Feature Testing
- [ ] **Authentication**
  - [ ] Sign in with GitHub/Google
  - [ ] Verify profile created with OAuth data
  - [ ] Check display name and avatar populated

- [ ] **Presence Sidebar**
  - [ ] Open canvas in 2+ browsers
  - [ ] Verify users appear in sidebar
  - [ ] Check avatars display correctly
  - [ ] Confirm status indicators visible
  - [ ] Test sidebar collapse/expand
  - [ ] Verify empty state when alone

- [ ] **Profile Settings**
  - [ ] Open profile modal
  - [ ] Update display name → Save → Check sidebar
  - [ ] Upload avatar → Verify appears in sidebar
  - [ ] Change status → Check indicator color
  - [ ] Test validation (2MB limit, image only)

- [ ] **Cursor Integration**
  - [ ] Move mouse on canvas
  - [ ] Verify cursor label matches sidebar name
  - [ ] Check cursor color matches sidebar dot
  - [ ] Confirm both systems stay synced

- [ ] **Performance**
  - [ ] Check FPS stays at 60
  - [ ] Test with 3+ users
  - [ ] Monitor network tab (WebSocket stable)
  - [ ] Verify no console errors

## Deployment

### 6. Environment Variables
Verify these are set in your deployment platform (Vercel/Netlify):
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

### 7. Build for Production
```bash
cd web
npm run build
```

### 8. Deploy
- [ ] Push changes to Git repository
- [ ] Trigger deployment (or manual deploy)
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

### 9. Post-Deployment Verification
- [ ] Visit production URL
- [ ] Sign in and open canvas
- [ ] Test presence sidebar with multiple users
- [ ] Upload avatar in production
- [ ] Update profile and verify sync
- [ ] Check browser console for errors
- [ ] Verify Supabase usage metrics

## Monitoring

### 10. First 24 Hours
- [ ] Monitor Supabase Dashboard:
  - Database queries/sec
  - Storage usage (avatar uploads)
  - Realtime connections count
  - API error rates
- [ ] Check application logs for errors
- [ ] Gather user feedback on presence features
- [ ] Monitor performance metrics

### 11. Ongoing Maintenance
- [ ] Set up alerts for:
  - Storage quota threshold (80%)
  - Realtime connection limit
  - Database slow queries
  - High error rates
- [ ] Weekly review of avatar storage usage
- [ ] Monthly audit of inactive user data

## Rollback Plan

### If Issues Arise
1. **Presence sidebar not working**
   - Check Supabase Realtime is enabled
   - Verify environment variables set correctly
   - Check browser console for connection errors
   - Rollback: Comment out `<PresenceSidebar />` in CanvasRoute

2. **Avatar uploads failing**
   - Verify storage bucket exists
   - Check storage policies correct
   - Confirm environment variables
   - Rollback: Disable avatar upload UI in ProfileSettings

3. **Performance degradation**
   - Check Supabase metrics
   - Monitor network tab for issues
   - Verify Realtime connection count
   - Rollback: Disable presence channel subscription

4. **Full rollback**
   ```bash
   git revert HEAD  # Revert latest commits
   git push origin main
   ```

## Success Metrics

### Week 1 Goals
- [ ] 90%+ users see presence sidebar correctly
- [ ] Avatar upload success rate >95%
- [ ] No performance degradation (<5% FPS drop)
- [ ] Presence sync latency <500ms
- [ ] Zero critical errors in logs

### Month 1 Goals
- [ ] 50%+ users upload custom avatars
- [ ] Presence feature used in 80%+ sessions
- [ ] Profile settings opened by 60%+ users
- [ ] Average session with 2+ collaborators

## Documentation

### User-Facing
- [ ] Update README with new features
- [ ] Create video demo of presence system
- [ ] Add screenshots to documentation
- [ ] Write blog post announcing features

### Developer-Facing
- [ ] Document API endpoints used
- [ ] Add inline code comments
- [ ] Update architecture diagrams
- [ ] Create contribution guidelines

## Support Preparation

### Common Issues & Solutions
1. **"I don't see other users"**
   → Check internet connection, refresh page

2. **"My avatar didn't upload"**
   → Verify file size <2MB, try different image

3. **"Sidebar is in the way"**
   → Click arrow button to collapse sidebar

4. **"Display name not updating"**
   → Save changes in profile modal, refresh

### Support Resources
- [ ] Create FAQ section
- [ ] Set up user feedback form
- [ ] Prepare support email templates
- [ ] Train team on new features

---

## Sign-Off

**Completed By**: _______________  
**Date**: _______________  
**Production URL**: _______________  
**Notes**: _______________

---

**All checks passed?** ✅ You're ready to ship! 🚀

