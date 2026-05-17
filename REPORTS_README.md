# Review Reports Feature - Implementation Guide

## Overview
This feature allows users to report inappropriate reviews, and admins can manage these reports from the admin panel.

## Database Setup

### Step 1: Run the SQL Script
Execute the SQL file `review_reports_table.sql` in your phpMyAdmin or MySQL client to create the necessary table.

**Quick Steps:**
1. Open phpMyAdmin
2. Select your `food_crawl` database
3. Go to the SQL tab
4. Copy and paste the contents of `review_reports_table.sql`
5. Click "Go" to execute

### Alternative: Manual Table Creation
If you prefer, you can manually create the table using the SQL provided in `review_reports_table.sql`.

## Features Implemented

### Frontend (User Side)
- **Report Button**: Each review has a flag button that allows users to report it
- **Report Submission**: Users can provide a reason for reporting
- **Confirmation**: Users receive feedback when a report is submitted
- **Duplicate Prevention**: Users cannot report the same review multiple times within 24 hours

### Backend (API)
- **`api/report_review.php`**: Handles report submissions
  - Validates review ID
  - Checks for duplicate reports (same IP within 24 hours)
  - Stores report with reason and reporter information
  
- **`api/admin_reports.php`**: Admin-only API for managing reports
  - List all reports with filtering by status
  - Update report status (pending → reviewed → dismissed/removed)
  - Add admin notes to reports
  - Delete reports
  - Automatically removes reviews when status is set to "removed"

### Admin Panel
- **New "Reports" Tab**: Located between "Manage Restaurants" and "Statistics"
- **Filter by Status**: View all, pending, reviewed, dismissed, or removed reports
- **Report Details**:
  - Report ID and timestamp
  - Restaurant name
  - Original review content (rating, comment, reviewer name)
  - Report reason
  - Reporter information (name/anonymous + IP address)
  - Current status
  - Admin notes
- **Actions**:
  - Change status (Pending → Reviewed → Dismissed/Removed)
  - Add admin notes
  - Update report
  - Delete report
  - Remove review (sets status to "removed" and deletes the actual review)

## Report Statuses

1. **Pending**: New report, needs review
2. **Reviewed**: Admin has reviewed the report
3. **Dismissed**: Report was reviewed but no action taken
4. **Removed**: Report was valid, review has been removed

## File Structure

```
foodcrawl/
├── api/
│   ├── report_review.php          # User report submission endpoint
│   └── admin_reports.php          # Admin reports management endpoint
├── css/
│   └── admin_style.css            # Added reports section styles
├── js/
│   └── script.js                  # Updated report button functionality
├── admin.php                       # Added Reports tab and functionality
├── review_reports_table.sql       # Database table creation script
└── REPORTS_README.md              # This file
```

## Usage

### For Users:
1. Open a restaurant's reviews modal
2. Click the flag icon (🚩) on any review
3. Enter a reason for reporting (optional)
4. Confirm submission
5. Receive success notification

### For Admins:
1. Log in to admin panel
2. Click on "Reports" tab in the sidebar
3. Filter reports by status if needed
4. Review each report's details
5. Take action:
   - Change status to "Reviewed" after reviewing
   - Dismiss if no action needed
   - Remove review if it violates guidelines
   - Add admin notes for record keeping
6. Click "Update" to save changes

## Security Features

- **Admin Authentication**: Only logged-in admins can access reports
- **IP Tracking**: Reporter IP is logged for abuse prevention
- **Duplicate Prevention**: Users can't spam reports for the same review
- **Foreign Key Constraints**: Reports are automatically deleted if the associated review or restaurant is deleted

## Database Schema

### `review_reports` Table
- `id`: Primary key
- `review_id`: Foreign key to restaurant_ratings
- `restaurant_id`: Foreign key to restaurants
- `reason`: Report reason (text)
- `reporter_name`: Name of reporter (default: 'Anonymous')
- `reporter_ip`: Reporter's IP address
- `status`: enum('pending', 'reviewed', 'dismissed', 'removed')
- `admin_notes`: Admin's notes on the report
- `created_at`: Report submission timestamp
- `updated_at`: Last update timestamp

## Testing Checklist

- [ ] Database table created successfully
- [ ] Users can submit reports from review modal
- [ ] Duplicate reports are prevented
- [ ] Reports appear in admin panel
- [ ] Status filtering works correctly
- [ ] Admin can update report status
- [ ] Admin can add notes
- [ ] Setting status to "removed" deletes the review
- [ ] Admin can delete reports
- [ ] Statistics counters update correctly

## Troubleshooting

**Problem**: Reports not appearing in admin panel
- **Solution**: Check that the table was created correctly and that you're logged in as admin

**Problem**: "Database error occurred" when submitting report
- **Solution**: Verify database connection in `includes/config.php` and check error logs

**Problem**: Can't update report status
- **Solution**: Ensure you're logged in as admin and check browser console for errors

## Future Enhancements

- Email notifications to admins when new reports are submitted
- Auto-flag reviews with certain keywords
- Batch actions (mark multiple reports as reviewed/dismissed)
- Report analytics and trends
- User reputation system based on report history

## Support

For issues or questions, check:
1. Browser console for JavaScript errors
2. PHP error logs for backend issues
3. Database query logs for SQL issues
