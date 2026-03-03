# Synchronized Logging & Validation System Implementation

## Overview
This document outlines the comprehensive logging and validation system implemented across Crew-Web, Citizen-Web, and Admin-Web platforms to track issue lifecycles and enhance transparency.

---

## 1. Backend Implementation

### 1.1 Database Schema Updates

**File:** `backend/src/models/Issue.model.js`

Added `activityLog` array field to the Issue model with richer metadata:
```javascript
activityLog: [
  {
    status: String, // Status (pending, assigned, in_progress, resolved, rejected)
    changedBy: ObjectId, // Who made the change
    timestamp: Date, // When it occurred
    comment: String, // Resolution Plan or general note
    evidenceImages: [String], // Proof images (can be 0–3)
    rejectionReason: String, // If status is rejected
    crewNote: String, // Used on soft rejection to send issue back to pool
    relatedIssue: ObjectId, // Link to another issue if relevant
    isViewed: Boolean // Has citizen seen this update yet?
  }
]
```

### 1.2 Controller Updates

**File:** `backend/src/controllers/issue.controller.js`

#### Updated `updateIssueStatus`:
- Validates mandatory comment for `in_progress` status
- Validates mandatory evidence images (1‑3) for `resolved` status
- Enforces soft vs hard rejection logic with appropriate status and crew note requirements
- If soft‑rejected, clears assignment and returns issue to pending pool
- Uploads multiple evidence files to Cloudinary
- Builds log entries containing `evidenceImages`, `rejectionReason`, `crewNote`, `relatedIssue`
- Persists logs and updates `status` atomically

#### New `createIssue` enhancements:
- Accepts up to 3 images; uploads each to Cloudinary and stores URLs array
- Performs AI analysis on first image when available
- Updated route to use `upload.array("images", 3)`

#### New `getIssueDetail` Function:
- Retrieves full issue with activity log
- Populates crew member information
- Access control for citizens, crew, and admins

#### New `markLogsAsViewed` Function:
- Marks all activity logs as viewed for a citizen
- Ensures notification badge accuracy

#### Updated `getAllIssues`:
- Supports `excludeResolved` query parameter
- Filters out resolved/rejected issues when needed

#### New `getIssueDetail` Function:
- Retrieves full issue with activity log
- Populates crew member information
- Access control for citizens, crew, and admins

#### New `markLogsAsViewed` Function:
- Marks all activity logs as viewed for a citizen
- Ensures notification badge accuracy

#### Updated `getAllIssues`:
- Supports `excludeResolved` query parameter
- Filters out resolved/rejected issues when needed

### 1.3 API Routes

**File:** `backend/src/routes/issue.routes.js`

New endpoints:
- `GET /issues/:id/detail` - Get issue with full activity log
- `PUT /issues/:id/logs/viewed` - Mark logs as viewed (Citizen only)
- `GET /issues?excludeResolved=true` - Get unresolved issues (Admin)

Route ordering optimized to prevent conflicts with parameter parsing.

---

## 2. Crew-Web Implementation

### 2.1 Issue Status Update with Mandatory Inputs and Validation

**File:** `crew-web/src/pages/IssueDetail.jsx`

Features:
- Status buttons for *In Progress*, *Resolve* and *Reject* on the details page
- Modal dialog appears whenever additional information is required

- **For `in_progress`**:
  - Mandatory "Resolution Plan" textarea
  - Validation prevents submission without comment

- **For `resolved`**:
  - Upload up to **three** proof images
  - Client‑side compression keeps each file under ~1 MB
  - Previews with remove buttons
  - Validation requires at least one image

- **For `rejected`**:
  - Dropdown listing hard and soft rejection reasons
  - Soft reasons (e.g. "Insufficient Resources") prompt a required crew note field
  - Hard reasons behave like final rejections

- Approval flow automatically clears assignment for soft rejections
- Loading/spinner state during network calls and error messages displayed
- Handles navigation back to issue list after update

### 2.2 API Service Updates

**File:** `crew-web/src/services/api.js`

Updated `updateIssueStatus` signature to accept an options object:
```javascript
updateIssueStatus(id, status, {
  comment,
  evidenceFiles,      // array of File objects
  rejectionReason,
  crewNote,
  relatedIssue
})
```
- Automatically builds `FormData` when files or additional fields are present
- Supports up to 3 evidence files under the same key `evidence`
- Maintains simple JSON body when only status/comment is required

---

### 2.2 API Service Updates

**File:** `crew-web/src/services/api.js`

Updated `updateIssueStatus` function:
```javascript
updateIssueStatus(id, status, comment, evidenceImage)
```
- Accepts optional comment and evidenceImage
- Sends as base64 encoded data for images

---

## 3. Citizen-Web Implementation

### 3.1 Report Issue Page

**File:** `citizen-web/src/pages/ReportIssue.jsx`

Features:
- Location picker implemented with Leaflet map (click to drop marker)
- Accepts **up to three images** (camera/gallery) with drag‑and‑drop support
- Client‑side compression via `browser-image-compression` to keep uploads <1 MB
- Image previews with remove buttons and grid layout
- `capture="environment"` attribute allows opening device camera on mobile
- Multipart form submission matching updated backend route

### 3.2 Logs Page

**File:** `citizen-web/src/pages/Logs.jsx`

Features:
- **Timeline View**:
  - Shows all lifecycle events (Created, Assigned, In-Progress, Resolved, Rejected)
  - Color-coded status indicators for each event type
  - Chronological ordering with creation at top

- **Activity Display**:
  - Shows crew member name who made the change
  - Displays Resolution Plan comment for `in_progress` entries
  - Displays multiple proof images for `resolved` entries (carousel/grid)
  - Highlights rejection reasons and crew notes when provided
  - Shows timestamp for each event

- **Unviewed Log Badge**:
  - Each issue card shows count of logs not yet viewed by citizen
  - Badge updates in real time and clears on view

- **Responsive Design**:
  - Grid layout for issue list
  - Card-based UI matching existing components
  - Full-screen timeline view

### 3.3 Navigation Bar Updates

**File:** `citizen-web/src/components/Navbar.jsx`

Updates:
- Added History icon import from lucide-react
- New "Logs" navigation link
- **Notification Badge**:
  - Real-time badge showing unviewed log count
  - Badge updates every 30 seconds via polling
  - Auto-clears when navigating to Logs tab
  - Works on both desktop and mobile navigation

### 3.4 Routing

**File:** `citizen-web/src/App.jsx`

- Added Logs route: `/logs`
- Protected with authentication
- Lazy loaded via component import

### 3.5 API Service Updates

**File:** `citizen-web/src/services/api.js`

New functions:
```javascript
getIssueDetail(issueId)      // Get issue with full activity log
markLogsAsViewed(issueId)    // Mark logs as viewed
```

---

## 4. Admin-Web Implementation

### 4.1 Issues to Assign Filtering

**File:** `admin-web/src/pages/AllIssues.jsx`

Features:
- **Tab Navigation**:
  - "Issues to Assign" tab: Shows pending/assigned issues (excludes resolved/rejected)
  - "Completed/Archived" tab: Shows resolved/rejected issues
  - Tab count indicators
  
- **Resolved Issue Filtering**:
  - Resolved issues automatically excluded from assignment queue
  - Cannot be reassigned from "To Assign" view
  - Viewable in separate "Completed" tab for reference

- **Enhanced UI**:
  - Visual distinction between unresolved and completed issues
  - Status badges with appropriate colors
  - Left border accent for completed issues

### 4.2 API Service Updates

**File:** `admin-web/src/services/api.js`

Updated `getAllIssues` function:
```javascript
getAllIssues(token, excludeResolved = false)
```
- Optional parameter to exclude resolved issues
- Maintains backward compatibility

New `getResolvedIssues` function:
- Supporting function for resolved/archived issues

---

## 5. Data Flow Architecture

```
Crew Updates Issue Status
          ↓
Validation (comment/image required)
          ↓
Activity Log Entry Created
          ↓
Issue Status Updated
          ↓
Backend Response with Updated Issue
          ↓
Citizen Notified (icon badge)
          ↓
Citizen Navigates to Logs
          ↓
Activity Log Marked as Viewed
          ↓
Badge Clears
```

---

## 6. Validation Rules

### For `in_progress` Status:
- ✅ Resolution Plan comment is **MANDATORY**
- ✅ Must be non-empty string
- ❌ Status change blocked if validation fails

### For `resolved` Status:
- ✅ Evidence image upload is **MANDATORY**
- ✅ Must be valid image file
- ❌ Status change blocked if validation fails

### For `rejected` Status:
- ✅ No mandatory inputs
- ✅ Can be updated without additional data

---

## 7. UI/UX Consistency

### Design System Applied:
- ✅ Tailwind CSS for responsive design
- ✅ Lucide React icons for consistency
- ✅ Color scheme matching existing platforms
- ✅ Modal dialogs for mandatory inputs
- ✅ Badge indicators for notifications
- ✅ Timeline layout for logs
- ✅ Status color coding across all platforms

### Responsive Breakpoints:
- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly buttons and inputs

---

## 8. Database Changes Summary

### Issue Model:
- Added `activityLog` array field
- Maintains backward compatibility
- No migration required (will be empty for existing issues)

### Example Activity Log Entry:
```javascript
{
  status: "in_progress",
  changedBy: ObjectId("user_id"),
  timestamp: ISODate("2024-03-02T10:30:00Z"),
  comment: "We will start by clearing the debris and assessing structural damage",
  isViewed: false
}
```

---

## 9. API Endpoints Summary

### Backend

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| GET | `/issues?excludeResolved=true` | Yes | admin | Get unresolved issues |
| GET | `/issues/my` | Yes | citizen | Get citizen's issues |
| GET | `/issues/assigned` | Yes | crew | Get assigned issues |
| GET | `/issues/:id/detail` | Yes | all | Get issue with activity log |
| PUT | `/issues/:id/status` | Yes | crew | Update status with validation |
| PUT | `/issues/:id/logs/viewed` | Yes | citizen | Mark logs as viewed |
| PUT | `/issues/:id/assign` | Yes | admin | Assign issue to crew |

---

## 10. Testing Checklist

- [ ] **Backend Validation**
  - [ ] Reject in_progress without comment
  - [ ] Reject resolved without image
  - [ ] Accept valid status updates
  - [ ] Activity log entries created correctly

- [ ] **Crew-Web**
  - [ ] Modal appears on in_progress/resolved click
  - [ ] Comment textarea validation works
  - [ ] Image upload works (drag & drop, file picker)
  - [ ] Status updates with payload sent correctly

- [ ] **Citizen-Web**
  - [ ] Logs page displays all events
  - [ ] Timeline shows correct order
  - [ ] Comments display for in_progress
  - [ ] Images display for resolved
  - [ ] Notification badge appears
  - [ ] Badge clears after viewing
  - [ ] Mobile responsiveness

- [ ] **Admin-Web**
  - [ ] "Issues to Assign" excludes resolved
  - [ ] "Completed" tab shows resolved/rejected
  - [ ] Tab counts accurate
  - [ ] Can switch between tabs

---

## 11. Performance Considerations

- Notification badge updates every 30 seconds (configurable)
- Activity log populated on-demand via `/detail` endpoint
- Efficient MongoDB queries with proper indexing
- No N+1 queries with proper populate() calls

---

## 12. Security & Authorization

- ✅ Endpoint protection with `protect` middleware
- ✅ Role-based access control (citizen, crew, admin)
- ✅ Only assigned crew can update issue status
- ✅ Only issue reporter (citizen) can view/clear logs
- ✅ Admin access for full visibility

---

## 13. Future Enhancements

- [ ] Real-time notifications via WebSocket
- [ ] Email notifications for log events
- [ ] Custom alert rules based on urgency
- [ ] Log export functionality (PDF/CSV)
- [ ] Activity analytics dashboard
- [ ] Attachment storage for evidence files
- [ ] Automated status transitions based on conditions

---

## 14. Known Limitations

- Image evidence stored as base64 (consider cloud storage for large files)
- Notification badge refresh is polling-based (consider WebSocket for real-time)
- Activity log size unbounded (consider archival for old issues)

---

## Implementation Status: ✅ COMPLETE

All core requirements have been implemented and integrated across all three platforms.

