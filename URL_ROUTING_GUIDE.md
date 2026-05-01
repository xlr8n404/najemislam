# Sharable App - URL Routing Guide

## Overview
All URLs are based on the domain: **sharableofc.vercel.app**

## Core Routes

### Authentication & Landing
- **sharableofc.vercel.app/** - Landing page with login/register options
- **sharableofc.vercel.app/login** - Login form (handled in root page)
- **sharableofc.vercel.app/register** - Registration form (handled in root page)

### Main Features
- **sharableofc.vercel.app/home** - Main feed (trending, explore, following, communities, sharable feeds)
- **sharableofc.vercel.app/search** - Search for posts, users, and hashtags
- **sharableofc.vercel.app/create** - Create a new post (redirects to /post/create)
- **sharableofc.vercel.app/post/create** - Post creation page with media upload
- **sharableofc.vercel.app/alerts** - Notifications/alerts feed

### Messaging
- **sharableofc.vercel.app/messages** - Direct messages/conversations
- **sharableofc.vercel.app/chats** - Alias for messages (redirects to /messages)

### User Profiles
- **sharableofc.vercel.app/profile** - Current user's profile
- **sharableofc.vercel.app/profile/edit** - Edit user profile
- **sharableofc.vercel.app/user/[username]** - Any user's public profile

### User Settings
- **sharableofc.vercel.app/settings** - Settings home
- **sharableofc.vercel.app/settings/password** - Change password
- **sharableofc.vercel.app/settings/blocked** - Blocked users list

### Communities
- **sharableofc.vercel.app/communities** - Browse communities
- **sharableofc.vercel.app/communities/[id]** - Community details and feed
- **sharableofc.vercel.app/communities/create** - Create a new community

### Legal & Info
- **sharableofc.vercel.app/about** - About page
- **sharableofc.vercel.app/contact** - Contact page
- **sharableofc.vercel.app/privacy-policy** - Privacy policy
- **sharableofc.vercel.app/terms-of-service** - Terms of service
- **sharableofc.vercel.app/community-guidelines** - Community guidelines

## Post Sharing & Viewing

### Post URL Pattern
Posts are accessed via a unique URL based on the **username and post creation number**:

```
sharableofc.vercel.app/[username]/[postNumber]/
```

### How Post Numbers Work

**Post Number = Sequential creation order** (not ID, not timestamp)

When a user creates their first post → post_number = 1
When they create their second post → post_number = 2
When they create their third post → post_number = 3
And so on...

### Post Number Persistence

**Important:** Post numbers **DO NOT change** even if previous posts are deleted.

**Example Scenario:**
- User "john" creates 5 posts (post_number: 1, 2, 3, 4, 5)
- User deletes posts #2 and #3
- The remaining posts still have post_number: 1, 4, 5
- The links remain the same: /john/1/, /john/4/, /john/5/
- Posts #2 and #3 are gone (404 when accessed)

### Example Post URLs

```
sharableofc.vercel.app/john/1/          → John's 1st post
sharableofc.vercel.app/john/5/          → John's 5th post (even if #2-4 deleted)
sharableofc.vercel.app/sarah/1/         → Sarah's 1st post
sharableofc.vercel.app/maria/12/        → Maria's 12th post
```

## URL Characteristics

### Short URLs
- Maximum 50 characters typical for most posts
- Very shareable via text, QR codes, social media

### Long Usernames
- URLs scale with username length
- Example: `/verylongusernamehere/150/` works perfectly fine
- URL styling adapts responsively on mobile and desktop

### Special Features
- Post URLs work with and without trailing slash
- URLs are case-sensitive (matching the database username)
- Direct access to specific posts from shared links
- Back navigation to user profile from post

## Implementation Details

### Database Schema
The `posts` table includes:
- `id` (UUID) - Unique post identifier
- `user_id` (UUID) - Foreign key to profiles table
- `post_number` (INTEGER) - Auto-incrementing sequence per user
- `content` (TEXT) - Post text content
- `media_url` (TEXT) - Primary media file URL
- `media_type` (TEXT) - 'image' or 'video'
- `created_at`, `updated_at` - Timestamps

### Auto-Incrementing Logic
A PostgreSQL trigger automatically increments `post_number` for each new post:
```sql
-- Trigger automatically calculates:
post_number = MAX(post_number) + 1 for that user_id
```

### Routing Architecture
- Uses Next.js 16 App Router
- Dynamic routes: `src/app/[username]/[postNumber]/page.tsx`
- Server-side profile lookup by username
- Client-side post fetching by user_id + post_number

## Responsive Design

All routes are fully responsive and optimized for:
- Mobile phones (360px - 480px)
- Tablets (768px - 1024px)
- Desktops (1440px+)

### Post Links Styling
- Scales smoothly for any username length
- Text truncation for very long usernames on mobile
- Full URLs visible on desktop

## Testing URLs

To test the post URL system:

1. **Create a post** at `/post/create`
2. **Note the post_number** returned after creation
3. **Access via:** `sharableofc.vercel.app/[your-username]/[post-number]/`
4. **Share the link** - works instantly
5. **Delete earlier posts** - the post URL remains valid

## Mobile Optimization

All URLs work seamlessly on mobile:
- Deep linking works with app forwarding
- QR codes encode full URLs
- Share sheets preserve URLs correctly
- Back button works intuitively

## Error Handling

- **404 Page:** Displays when post doesn't exist or was deleted
- **Invalid Username:** Redirects or shows error message
- **Invalid Post Number:** Shows 404 with "Post not found" message
- **Deleted Post:** Returns 404 (post_number remains reserved)
