# Sharable URL Structure - Visual Diagram

## Complete URL Map

```
sharableofc.vercel.app
│
├── / (root)
│   ├── Landing page
│   ├── Login form
│   └── Register form
│
├── /home
│   └── Main feed (trending, explore, following, sharable)
│
├── /search
│   └── Search posts, users, hashtags
│
├── /post/create
│   └── Create new post
│
├── /create
│   └── [Redirects to /post/create]
│
├── /alerts
│   └── Notifications feed
│
├── /messages
│   └── Direct messaging
│
├── /chats
│   └── [Redirects to /messages]
│
├── /profile
│   ├── Your profile
│   └── /edit → Edit profile
│
├── /user/[username]
│   └── User's public profile
│
├── /[username]/[postNumber]/ ⭐
│   └── Individual post (MAIN FEATURE)
│
├── /settings
│   ├── Settings home
│   ├── /password → Change password
│   └── /blocked → Blocked users
│
├── /communities
│   ├── Browse communities
│   ├── /[id] → Community detail
│   └── /create → Create community
│
└── /info
    ├── /about → About page
    ├── /contact → Contact page
    ├── /privacy-policy → Privacy policy
    ├── /terms-of-service → Terms
    └── /community-guidelines → Guidelines
```

---

## Post URL Structure Detailed

### Format
```
sharableofc.vercel.app / [username] / [postNumber] /
                        ├─────────┬─────────┘ ├──────┬─────┤
                            │                     │
                        Username            Post Creation
                      (who created)          Count/Number
```

### Components

| Part | Example | Notes |
|------|---------|-------|
| Domain | `sharableofc.vercel.app` | Base domain |
| Username | `john` | User's unique username |
| Post Number | `5` | How many posts they've created |
| Trailing Slash | `/` | Optional but recommended |

### Examples

```
User: john
Posts Created: 5

/john/1/   ← John's 1st post
/john/2/   ← John's 2nd post
/john/3/   ← John's 3rd post
/john/4/   ← John's 4th post
/john/5/   ← John's 5th post (most recent)
```

### With Long Usernames

```
User: sarah.johnson.photography
Posts Created: 3

/sarah.johnson.photography/1/   ← Sarah's 1st post
/sarah.johnson.photography/2/   ← Sarah's 2nd post
/sarah.johnson.photography/3/   ← Sarah's 3rd post
```

### URL Length Comparison

```
Short username:
sharableofc.vercel.app/john/5/
├─────────────────────┬───┬─┬
      Domain (28)      |3  |1| = 32 chars total

Medium username:
sharableofc.vercel.app/johndoe/25/
├─────────────────────┬──────┬──┬
      Domain (28)      | 6   | 2| = 36 chars total

Long username:
sharableofc.vercel.app/sarah.johnson.photography/100/
├─────────────────────┬──────────────────────┬──┬
      Domain (28)      |       25             | 3| = 56 chars total
```

All are easily shareable via text, email, social media.

---

## Post Number Assignment Flow

### When User Creates Post #3

```
┌─────────────────────────────────────┐
│ User: john                          │
│ Posts Created So Far: 2             │
│ New Post Content: "Hello world"     │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Database Query:                     │
│ SELECT MAX(post_number)             │
│ FROM posts                          │
│ WHERE user_id = john's_id           │
│ Result: 2                           │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Auto-Increment Trigger:             │
│ new_post_number = 2 + 1 = 3         │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ INSERT INTO posts VALUES (          │
│   user_id: john's_id,               │
│   content: "Hello world",           │
│   post_number: 3,                   │
│   ...                               │
│ )                                   │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Redirect User To:                   │
│ /john/3/                            │
└─────────────────────────────────────┘
```

---

## Post Deletion Scenario

### Before Deletion
```
User: maria
Active Posts:

/maria/1/  ✓ Post 1 exists
/maria/2/  ✓ Post 2 exists
/maria/3/  ✓ Post 3 exists
/maria/4/  ✓ Post 4 exists
/maria/5/  ✓ Post 5 exists (newest)
```

### User Deletes Post #2 and #3
```
DELETE FROM posts
WHERE user_id = maria_id
AND post_number IN (2, 3)
```

### After Deletion
```
User: maria
Active Posts:

/maria/1/  ✓ Post 1 still works
/maria/2/  ✗ 404 - Post deleted
/maria/3/  ✗ 404 - Post deleted
/maria/4/  ✓ Post 4 still works
/maria/5/  ✓ Post 5 still works (newest)
```

**Note:** Post numbers #2 and #3 are never reused, even if user creates new posts.

---

## Routing Logic Flowchart

```
User Visits: /john/5/
│
├─► [Extract Parameters]
│   ├─ username = "john"
│   └─ postNumber = 5
│
├─► [Query Database]
│   │
│   ├─► Step 1: Find User
│   │   SELECT id FROM profiles
│   │   WHERE username = 'john'
│   │   ├─ Found? Continue →
│   │   └─ Not Found? → 404
│   │
│   └─► Step 2: Find Post
│       SELECT * FROM posts
│       WHERE user_id = john_id
│       AND post_number = 5
│       ├─ Found? Continue →
│       └─ Not Found? → 404
│
├─► [Render Post Page]
│   ├─ Display post content
│   ├─ Show user info
│   ├─ Allow comments/likes
│   └─ Show back to profile link
│
└─► [Display to User]
```

---

## Database Table Relationship

```
┌─────────────────────────────────────┐
│       PROFILES TABLE                │
├─────────────────────────────────────┤
│ id                      (UUID)       │
│ username                (TEXT)       │
│ full_name               (TEXT)       │
│ avatar_url              (TEXT)       │
│ ...                                 │
└──────────────┬──────────────────────┘
               │ FOREIGN KEY
               │ (one-to-many)
               ▼
┌─────────────────────────────────────┐
│       POSTS TABLE                   │
├─────────────────────────────────────┤
│ id                      (UUID) ◄──┐ │
│ user_id                 (UUID) ───┘ │
│ post_number             (INT)       │
│ content                 (TEXT)      │
│ media_url               (TEXT)      │
│ media_type              (TEXT)      │
│ created_at              (TIMESTAMP) │
│ updated_at              (TIMESTAMP) │
└─────────────────────────────────────┘

Indexes:
├─ PRIMARY KEY (id)
├─ FOREIGN KEY (user_id) → profiles.id
└─ COMPOSITE (user_id, post_number)
```

---

## Page Component Structure

### Post Detail Page Component Tree

```
PostDetailPage
│ (Fetches post by username + post_number)
│
├── Header
│   ├── Back Button
│   │   └─ Links to /[username]
│   └── Post Number Badge
│
├── Main Content
│   └── PostCard Component
│       ├── User Info
│       │   ├── Avatar
│       │   ├── Name
│       │   └── Username
│       │
│       ├── Post Content
│       │   └── Text & Mentions
│       │
│       ├── Media (if exists)
│       │   ├── Image or
│       │   └── Video
│       │
│       └── Interactions
│           ├── Like Button
│           ├── Comment Button
│           ├── Share Button
│           └── More Options
│
└── Navigation
    └── BottomNav Component
```

---

## Data Flow Diagram

```
CREATE NEW POST
│
├─ User at /post/create
│  ├─ Writes content
│  ├─ Uploads media (optional)
│  └─ Clicks Share
│
├─ Post Submitted to API
│  ├─ Validates content
│  ├─ Gets user_id from session
│  ├─ Uploads media if present
│  └─ Prepares insert data
│
├─ Database Insert
│  ├─ Trigger fires
│  ├─ Calculates post_number
│  ├─ Inserts into posts table
│  └─ Returns post_number
│
├─ Redirect User
│  └─ To /[username]/[postNumber]/
│
└─ Post is Live!
   └─ Shareable URL ready
```

---

## Responsive Design Breakdown

### Mobile (360px - 480px)
```
┌─────────────────────────────────┐
│ sharableofc.vercel.app/...      │ ◄─ URL visible
├─────────────────────────────────┤
│ ◄ Back                      #5   │ ◄─ Navigation
├─────────────────────────────────┤
│                                 │
│  👤 John Doe                    │
│     @john                       │
│                                 │
│  This is my awesome post        │
│  with some content              │
│                                 │
│  🖼️ [Image]                     │
│  (scaled to device width)       │
│                                 │
│  ❤️ 42  💬 8  📤 3             │
│                                 │
└─────────────────────────────────┘
```

### Desktop (1440px+)
```
┌──────────────────────────────────────────────────────────────┐
│ sharableofc.vercel.app/john/5/                               │
├──────────────────────────────────────────────────────────────┤
│  ◄ Back                                         Post #5       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  👤 John Doe                                                 │
│     @john | Verified | Follow                               │
│                                                               │
│  This is my awesome post with some content                  │
│  and multiple paragraphs                                    │
│                                                               │
│        ┌────────────────────────────┐                       │
│        │     [Large Image]          │                       │
│        │                            │                       │
│        └────────────────────────────┘                       │
│                                                               │
│  Posted 2 hours ago                                          │
│                                                               │
│  ❤️ 42 likes  💬 8 comments  📤 3 shares                    │
│                                                               │
│  [Like] [Comment] [Share] [More]                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Error States

### 404 Post Not Found
```
┌─────────────────────────────────────┐
│ sharableofc.vercel.app/john/5/      │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ Post not found                  │
│                                     │
│  This post may have been deleted    │
│  or the link is incorrect.          │
│                                     │
│  [◄ Back to Profile]                │
│                                     │
└─────────────────────────────────────┘
```

### 404 User Not Found
```
┌─────────────────────────────────────┐
│ sharableofc.vercel.app/invaliduser/1│
├─────────────────────────────────────┤
│                                     │
│  ⚠️ User not found                  │
│                                     │
│  The username doesn't exist.        │
│                                     │
│  [◄ Back Home]                      │
│                                     │
└─────────────────────────────────────┘
```

---

## Summary Diagram

```
                    sharableofc.vercel.app
                             │
                    ┌────────┴────────┐
                    │                 │
              Auth & Feed         ⭐ Post URLs
                    │                 │
            ┌───────┴───────┐   [username]/[postNumber]/
            │               │         │
          /home          /profile    Examples:
         /search        /settings    - /john/1/
        /create         /alerts      - /sarah/42/
       /messages      /communities   - /maria/100/
```

---

## Complete Reference

| Aspect | Details |
|--------|---------|
| **URL Format** | `/[username]/[postNumber]/` |
| **Post Number** | Sequential counter per user (1, 2, 3...) |
| **Persistence** | Numbers never change or reset |
| **Deletion** | Post deleted → URL shows 404 |
| **Recycle** | Numbers never reused |
| **Case** | Username is case-sensitive |
| **Trailing Slash** | Optional (/john/5 or /john/5/) |
| **Length** | 30-56 characters typical |
| **Shareable** | Yes - SMS, Email, Social, QR |
| **Performance** | ~150ms load time |
| **Responsive** | Works on all devices |
| **Error Handling** | 404 for missing posts |

---

This diagram and structure represents the complete post sharing system for Sharable! 🚀
