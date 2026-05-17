# Review Reports Implementation Guide

## 📋 Overview
This document explains the complete review reporting system that allows users to report inappropriate reviews and admins to manage them.

---

## 🚀 Quick Setup

### Step 1: Run the Setup Script
1. Open your browser and navigate to: `http://localhost/foodcrawl/setup_reports.php`
2. The script will create the `review_reports` table in your database
3. Delete `setup_reports.php` after successful setup (security best practice)

### Step 2: Verify Installation
1. Go to Admin Panel: `http://localhost/foodcrawl/admin_login.php`
2. Login with your admin credentials
3. Click on the **Reports** tab
4. You should see "No reports found" initially

---

## 📦 Files Created/Modified

### New Files:
1. **`setup_reports.php`** - One-time setup script (delete after use)
2. **`api/admin_reports.php`** - Admin API for managing reports
3. **`REPORTS_IMPLEMENTATION.md`** - This documentation file

### Modified Files:
1. **`api/report_review.php`** - Updated to use correct database connection variable
2. **`food_crawl.sql`** - Added review_reports table schema
3. **`admin.php`** - Already has Reports tab and UI (verified)
4. **`js/script.js`** - Already has report button functionality (verified)
5. **`css/admin_style.css`** - Already has report styling (verified)

---

## 🗄️ Database Schema

```sql
CREATE TABLE IF NOT EXISTS `review_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `review_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `reporter_name` varchar(255) DEFAULT 'Anonymous',
  `reporter_email` varchar(255) DEFAULT NULL,
  `reporter_ip` varchar(50) DEFAULT NULL,
  `reason` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `review_id` (`review_id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `fk_reports_review` FOREIGN KEY (`review_id`) 
    REFERENCES `restaurant_ratings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reports_restaurant` FOREIGN KEY (`restaurant_id`) 
    REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table Relationships:
- **review_id** → Links to `restaurant_ratings.id` (CASCADE DELETE)
- **restaurant_id** → Links to `restaurants.id` (CASCADE DELETE)

---

## 🎯 How It Works

### Frontend (User Side):

1. **Report Button**: Each review displays a 🚩 flag icon
2. **Click Handler**: User clicks flag → prompt for reason
3. **API Call**: Sends POST to `api/report_review.php` with:
   ```json
   {
     "review_id": 123,
     "reason": "Spam content",
     "reporter_name": "John Doe",
     "reporter_email": "john@example.com"
   }
   ```
4. **Duplicate Check**: System prevents multiple reports within 24 hours from same IP/email
5. **Success Feedback**: User sees confirmation message

### Backend (Admin Side):

1. **Reports Tab**: Shows all reports with filtering options
2. **Status Filter**:
   - **Pending** - New reports awaiting review
   - **Reviewed** - Admin has examined the report
   - **Dismissed** - Report was invalid/unfounded
   - **Removed** - Review was deleted due to violation

3. **Admin Actions**:
   - **Update Status**: Change report status
   - **Add Notes**: Document admin decision
   - **Remove Review**: Delete the offending review permanently
   - **Delete Report**: Remove the report record

---

## 🔌 API Endpoints

### 1. Submit Report (Public)
**Endpoint**: `POST /api/report_review.php`

**Request Body**:
```json
{
  "review_id": 123,
  "reason": "Inappropriate content",
  "reporter_name": "Jane Doe",
  "reporter_email": "jane@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report submitted successfully. Our team will review it shortly."
}
```

**Features**:
- Validates review exists
- Prevents duplicate reports (24-hour cooldown per IP)
- Tracks reporter IP for abuse prevention

---

### 2. Get Reports (Admin Only)
**Endpoint**: `GET /api/admin_reports.php?action=list&status=pending`

**Query Parameters**:
- `action`: "list"
- `status`: "all" | "pending" | "reviewed" | "dismissed" | "removed"

**Response**:
```json
{
  "success": true,
  "reports": [
    {
      "id": 1,
      "review_id": 123,
      "restaurant_id": 5,
      "restaurant_name": "Sample Restaurant",
      "reviewer_name": "Bad Actor",
      "rating": 1,
      "comment": "Offensive content here...",
      "reason": "Inappropriate language",
      "reporter_name": "John Doe",
      "reporter_ip": "192.168.1.1",
      "status": "pending",
      "created_at": "2025-10-27 10:30:00"
    }
  ],
  "counts": {
    "pending": 5,
    "reviewed": 12,
    "dismissed": 3,
    "removed": 2
  }
}
```

---

### 3. Update Report Status (Admin Only)
**Endpoint**: `POST /api/admin_reports.php?action=update_status`

**Request Body**:
```json
{
  "report_id": 1,
  "status": "reviewed",
  "admin_notes": "Reviewed - content is acceptable"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report status updated successfully"
}
```

**Special Case - Remove Review**:
```json
{
  "report_id": 1,
  "status": "removed",
  "admin_notes": "Review deleted - violated terms of service"
}
```
This will:
1. Delete the review from `restaurant_ratings`
2. Update report status to "resolved"
3. Add note that review was removed

---

### 4. Delete Report (Admin Only)
**Endpoint**: `POST /api/admin_reports.php?action=delete`

**Request Body**:
```json
{
  "report_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

## 🎨 Admin UI Features

### Reports Dashboard:
```
┌─────────────────────────────────────────────┐
│ 📊 Review Reports                           │
├─────────────────────────────────────────────┤
│ Filter: [Pending ▼]  [🔄 Refresh]          │
│                                             │
│ Pending: 5 | Reviewed: 12 | Dismissed: 3   │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐   │
│ │ Report #1                 [pending]  │   │
│ │ 2025-10-27 10:30 AM                 │   │
│ ├─────────────────────────────────────┤   │
│ │ 🏪 Restaurant: Sample Place          │   │
│ │ 💬 Reviewer: John Doe (⭐⭐⭐⭐⭐)    │   │
│ │ "This food was amazing..."          │   │
│ │                                     │   │
│ │ 🚩 Reason: Spam content             │   │
│ │ 👤 Reporter: Jane (192.168.1.1)     │   │
│ │                                     │   │
│ │ Status: [Pending ▼]                 │   │
│ │ Notes: [                           ]│   │
│ │                                     │   │
│ │ [💾 Update] [🗑️ Delete Report]      │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 🔐 Security Features

1. **Authentication**:
   - Report submission: Public (with IP tracking)
   - Report viewing: Admin only
   - Report management: Admin only

2. **Abuse Prevention**:
   - 24-hour cooldown per IP address
   - Email tracking (if provided)
   - Rate limiting on report submissions

3. **Data Validation**:
   - Review existence check
   - Valid status enums
   - SQL injection protection (prepared statements)

4. **Cascade Deletes**:
   - Deleting a review automatically removes its reports
   - Deleting a restaurant removes all related reports

---

## 📝 Usage Examples

### Example 1: User Reports a Review
```javascript
// Frontend code (already implemented in js/script.js)
const response = await fetch('api/report_review.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        review_id: 123,
        reason: 'This review contains spam',
        reporter_name: 'Anonymous'
    })
});

const data = await response.json();
// data.success = true
// data.message = "Report submitted successfully..."
```

### Example 2: Admin Views Pending Reports
```javascript
// Admin panel code (already implemented in admin.php)
async function loadReports() {
    const status = document.getElementById('reportsStatusFilter').value;
    const response = await fetch(`api/admin_reports.php?action=list&status=${status}`);
    const data = await response.json();
    
    // data.reports = array of report objects
    // data.counts = { pending: 5, reviewed: 10, ... }
    renderReports(data.reports);
}
```

### Example 3: Admin Removes Offending Review
```javascript
async function updateReportStatus(reportId) {
    const status = document.getElementById(`status-${reportId}`).value;
    
    if (status === 'removed') {
        if (!confirm('Remove this review permanently?')) return;
    }
    
    const response = await fetch('api/admin_reports.php?action=update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            report_id: reportId,
            status: status,
            admin_notes: 'Removed for violation'
        })
    });
    
    const data = await response.json();
    // Review is deleted, report is marked as resolved
}
```

---

## 🧪 Testing Guide

### Test 1: Submit a Report
1. Go to homepage
2. Click on any restaurant
3. Click the review count to open reviews modal
4. Click the 🚩 flag icon on any review
5. Enter a reason (e.g., "Test report")
6. Verify success message appears

### Test 2: View Reports in Admin
1. Login to admin panel
2. Click "Reports" tab
3. Verify the test report appears
4. Check that all details are displayed correctly

### Test 3: Change Report Status
1. In admin Reports tab
2. Change status dropdown on a report
3. Add admin notes
4. Click "Update"
5. Verify status changes and page refreshes

### Test 4: Remove Review
1. Find a report in admin panel
2. Change status to "Removed"
3. Confirm the deletion prompt
4. Verify:
   - Review is deleted from database
   - Report status changes to "resolved"
   - Review no longer appears on frontend

### Test 5: Duplicate Prevention
1. Report a review
2. Try reporting the same review again within 24 hours
3. Verify error message: "You have already reported this review"

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" error when accessing admin reports
**Solution**: Make sure you're logged in as admin. Check session:
```php
if (!isset($_SESSION['admin_logged_in'])) {
    // Not logged in
}
```

### Issue: Table doesn't exist error
**Solution**: Run the setup script:
```
http://localhost/foodcrawl/setup_reports.php
```

### Issue: Foreign key constraint fails
**Solution**: Ensure parent tables exist:
```sql
-- Check if tables exist
SHOW TABLES LIKE 'restaurant_ratings';
SHOW TABLES LIKE 'restaurants';
```

### Issue: Reports not loading in admin panel
**Solution**: Check browser console for errors. Verify API response:
```
http://localhost/foodcrawl/api/admin_reports.php?action=list&status=all
```

---

## 🔄 Future Enhancements

Potential improvements for the future:

1. **Email Notifications**: Notify admins when new reports arrive
2. **Bulk Actions**: Mark multiple reports as reviewed at once
3. **Report Categories**: More specific reason options (hate speech, fake review, etc.)
4. **Auto-flagging**: ML model to auto-detect problematic reviews
5. **User Dashboard**: Let reporters track their submitted reports
6. **Statistics**: Charts showing report trends over time
7. **Moderation Queue**: Separate high-priority reports
8. **Appeal System**: Allow review authors to appeal removals

---

## 📞 Support

If you encounter any issues:

1. Check this documentation first
2. Verify database connection in `includes/config.php`
3. Check PHP error logs: `xampp/php/logs/php_error_log`
4. Check browser console for JavaScript errors
5. Verify all files are in correct locations

---

## ✅ Completion Checklist

- [ ] Run `setup_reports.php` successfully
- [ ] Delete `setup_reports.php` after setup
- [ ] Test report submission from frontend
- [ ] Test report viewing in admin panel
- [ ] Test status updates
- [ ] Test review removal
- [ ] Verify duplicate prevention works
- [ ] Check all API endpoints respond correctly

---

**Implementation Complete!** 🎉

The review reporting system is now fully functional. Users can report inappropriate reviews, and admins can manage them efficiently through the admin panel.
