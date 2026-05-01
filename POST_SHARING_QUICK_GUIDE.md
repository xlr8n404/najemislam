# Sharable Post Sharing - Quick Reference Guide

## Domain
**sharableofc.vercel.app**

## What Changed?

### Before (Old System)
Posts didn't have shareable, permanent URLs. Users couldn't easily share individual posts.

### After (New System)
Every post has a **permanent, unique, shareable URL** based on username and post creation number.

---

## Post URL Format

```
sharableofc.vercel.app/[username]/[postNumber]/
```

### Examples

| User | Posts Created | Post URL |
|------|---------------|----------|
| john | 1st, 2nd, 3rd | /john/1/, /john/2/, /john/3/ |
| sarah | 1st, 5th, 10th | /sarah/1/, /sarah/5/, /sarah/10/ |
| maria | 1st only | /maria/1/ |

---

## How Post Numbers Work

**Post numbers = How many posts you've created (sequential)**

- Your 1st post → `post_number = 1`
- Your 2nd post → `post_number = 2`
- Your 5th post → `post_number = 5`
- Your 100th post → `post_number = 100`

### Important: Post Numbers Never Change

Even if you delete posts, the numbers **stay the same**:

```
You create 5 posts:
/john/1/  ✓ Post 1
/john/2/  ✓ Post 2
/john/3/  ✓ Post 3
/john/4/  ✓ Post 4
/john/5/  ✓ Post 5

You delete posts 2 & 3:
/john/1/  ✓ Still accessible
/john/2/  ✗ Now shows 404 (deleted)
/john/3/  ✗ Now shows 404 (deleted)
/john/4/  ✓ Still accessible
/john/5/  ✓ Still accessible
```

---

## Sharing Posts

### How to Share a Post

1. **Create a post** at `/post/create`
2. **You get redirected** to `sharableofc.vercel.app/[your-username]/[post-number]/`
3. **Copy the URL** from browser address bar
4. **Share anywhere:**
   - Text message
   - Email
   - Social media
   - QR code
   - Chat apps

### Why This Is Great

✅ **Permanent** - URL stays valid even if you delete other posts  
✅ **Short** - Easy to remember and share  
✅ **Semantic** - Shows username and post order  
✅ **Works offline** - Just click the link later  
✅ **No special setup** - Automatic with every post  

---

## URL Examples in Real Life

### Short Username
```
sharableofc.vercel.app/john/1/        ← 29 characters
```

### Medium Username
```
sharableofc.vercel.app/johndoe123/42/  ← 38 characters
```

### Long Username
```
sharableofc.vercel.app/verylongusername/150/  ← 48 characters
```

### All are equally shareable and short enough for:
- SMS text (160 characters available)
- Social media bios
- Email signatures
- QR codes (encodes perfectly)
- Print materials

---

## All Available Routes

### Core Pages
```
/                           → Landing/Home (login/register)
/home                       → Main feed
/search                     → Search posts & users
/post/create                → Create new post
/create                     → Alias (redirects to /post/create)
/alerts                     → Notifications
/messages                   → Direct messages
/chats                      → Alias (redirects to /messages)
```

### User Profiles
```
/profile                    → Your profile
/profile/edit               → Edit your profile
/user/[username]            → Any user's profile
/[username]/[postNumber]/   → Individual post ⭐
```

### Settings
```
/settings                   → Settings home
/settings/password          → Change password
/settings/blocked           → Blocked users list
```

### Communities
```
/communities                → Browse communities
/communities/[id]           → Community detail & posts
/communities/create         → Create community
```

### Information
```
/about                      → About Sharable
/contact                    → Contact us
/privacy-policy             → Privacy policy
/terms-of-service          → Terms of service
/community-guidelines       → Community rules
```

---

## Developer Notes

### Database Structure
Posts are stored in the `posts` table with:
- `id` - Unique identifier
- `user_id` - Links to user who created it
- `post_number` - Sequential counter (auto-incremented)
- `content` - Text content
- `media_url` - Image/video URL
- `media_type` - 'image' or 'video'
- `created_at`, `updated_at` - Timestamps

### Auto-Increment Logic
PostgreSQL trigger automatically:
1. Finds MAX(post_number) for the user
2. Increments by 1
3. Assigns to new post

No manual numbering needed.

### Responsive Styling
URLs work perfectly on:
- Mobile phones ✓
- Tablets ✓
- Desktops ✓
- QR codes ✓

Text truncation for very long usernames on mobile.

---

## Testing

### Create & Share a Post
1. Go to `/post/create`
2. Write something
3. Click "Share"
4. You're redirected to your post URL
5. Copy and share the URL
6. Anyone can access it

### Test Deletion Behavior
1. Create 3 posts
2. Note the URLs: /you/1/, /you/2/, /you/3/
3. Delete /you/2/
4. Try accessing /you/1/, /you/2/, /you/3/
5. See how /you/2/ shows 404 but others work

### Test Mobile
- Open post URL on phone
- Verify it displays correctly
- Verify back button works
- Verify can navigate to profile

---

## FAQ

**Q: What if I delete a post?**  
A: The URL shows 404. The post_number stays reserved (never reused).

**Q: Can I change my username?**  
A: Post URLs use current username. Changing username will break old post URLs (can implement URL redirects if needed).

**Q: Are post numbers public?**  
A: Yes - they're visible in the URL. That's intentional (shows post order).

**Q: Can someone guess my post URLs?**  
A: No - they'd need to guess your username AND post number (low probability).

**Q: How many characters is a post URL?**  
A: Typically 30-50 characters depending on username length.

**Q: Do URLs work without trailing slash?**  
A: Yes - `/john/5` and `/john/5/` both work.

**Q: Can I share without creating an account?**  
A: No - must have an account to create and share posts.

**Q: Are URLs case-sensitive?**  
A: Yes - usernames are case-sensitive in the database.

---

## Summary

✅ Posts have **permanent, shareable URLs**  
✅ Format: `sharableofc.vercel.app/[username]/[postNumber]/`  
✅ Post numbers **never change** even after deletion  
✅ **Short, memorable, easy to share**  
✅ Works on **all devices and apps**  
✅ **No special setup** - automatic with every post  

**Ready to share!** 🚀
