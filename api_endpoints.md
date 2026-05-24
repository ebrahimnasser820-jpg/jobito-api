# مسارات API لمنصة Jobito
الرابط الأساسي: `https://jobito-api-production.up.railway.app`

### 🔐 Auth & Users (المصادقة والمستخدمين)
- `POST https://jobito-api-production.up.railway.app/auth/register`
- `POST https://jobito-api-production.up.railway.app/auth/login`
- `POST https://jobito-api-production.up.railway.app/auth/verify-login`
- `POST https://jobito-api-production.up.railway.app/auth/send-phone-otp`
- `POST https://jobito-api-production.up.railway.app/auth/verify-phone`
- `POST https://jobito-api-production.up.railway.app/auth/register-company`
- `POST https://jobito-api-production.up.railway.app/auth/forgot-password`
- `POST https://jobito-api-production.up.railway.app/auth/reset-password`
- `GET https://jobito-api-production.up.railway.app/users`
- `GET https://jobito-api-production.up.railway.app/users/me`
- `PUT https://jobito-api-production.up.railway.app/users/me`
- `PATCH https://jobito-api-production.up.railway.app/users/me/theme`
- `PATCH https://jobito-api-production.up.railway.app/users/me/language`
- `PUT https://jobito-api-production.up.railway.app/users/me/password`
- `DELETE https://jobito-api-production.up.railway.app/users/me`
- `PATCH https://jobito-api-production.up.railway.app/users/me/cancel-deletion`
- `GET https://jobito-api-production.up.railway.app/users/me/deletion-status`

### 💼 Jobs (الوظائف)
- `POST https://jobito-api-production.up.railway.app/jobs`
- `GET https://jobito-api-production.up.railway.app/jobs`
- `GET https://jobito-api-production.up.railway.app/jobs/company/:companyId`
- `GET https://jobito-api-production.up.railway.app/jobs/applications/stats`
- `GET https://jobito-api-production.up.railway.app/jobs/:id`
- `PATCH https://jobito-api-production.up.railway.app/jobs/:id`
- `DELETE https://jobito-api-production.up.railway.app/jobs/:id`

### 📝 Applications (التقديم على الوظائف)
- `POST https://jobito-api-production.up.railway.app/applications`
- `GET https://jobito-api-production.up.railway.app/applications/my-applications`
- `GET https://jobito-api-production.up.railway.app/applications/job/:jobId`
- `GET https://jobito-api-production.up.railway.app/applications/:id`
- `PATCH https://jobito-api-production.up.railway.app/applications/:id/status`

### 🏢 Companies (الشركات)
- `GET https://jobito-api-production.up.railway.app/companies`
- `GET https://jobito-api-production.up.railway.app/companies/pending`
- `GET https://jobito-api-production.up.railway.app/companies/:id`
- `PATCH https://jobito-api-production.up.railway.app/companies/:id/status`

### 🔔 Notifications (الإشعارات)
- `POST https://jobito-api-production.up.railway.app/notifications/subscribe`
- `GET https://jobito-api-production.up.railway.app/notifications`
- `PATCH https://jobito-api-production.up.railway.app/notifications/:id/read`
- `PATCH https://jobito-api-production.up.railway.app/notifications/read-all`
- `DELETE https://jobito-api-production.up.railway.app/notifications/:id`

### 💬 Chat & AI (الدردشة والذكاء الاصطناعي)
- `GET https://jobito-api-production.up.railway.app/chat/rooms`
- `GET https://jobito-api-production.up.railway.app/chat/rooms/:roomId/messages`
- `POST https://jobito-api-production.up.railway.app/chat/rooms/:roomId/messages`
- `POST https://jobito-api-production.up.railway.app/ai-chatbot/chat`
- `GET https://jobito-api-production.up.railway.app/ai-chatbot/history/:userId`

### 🖼️ Images (الصور)
- `POST https://jobito-api-production.up.railway.app/images/upload`
- `PUT https://jobito-api-production.up.railway.app/images/profile`
- `PUT https://jobito-api-production.up.railway.app/images/banner`
- `GET https://jobito-api-production.up.railway.app/images/entity/:type/:id`
- `GET https://jobito-api-production.up.railway.app/images/profile/:userId`
- `DELETE https://jobito-api-production.up.railway.app/images/:imageId`

### ⭐ Favorites (المفضلة)
- `POST https://jobito-api-production.up.railway.app/favorites/toggle/:jobId`
- `GET https://jobito-api-production.up.railway.app/favorites`

### 🛠️ Admin & Ops (الإدارة والعمليات)
- `POST https://jobito-api-production.up.railway.app/admin/login`
- `POST https://jobito-api-production.up.railway.app/admin/setup`
- `GET https://jobito-api-production.up.railway.app/admin/dashboard/stats`
- `GET https://jobito-api-production.up.railway.app/admin/dashboard/charts`
- `GET https://jobito-api-production.up.railway.app/admin/staff`
- `GET https://jobito-api-production.up.railway.app/admin/activity-log`
- `GET https://jobito-api-production.up.railway.app/admin/ops-chart`
- `GET https://jobito-api-production.up.railway.app/admin/system-requests`
- `PATCH https://jobito-api-production.up.railway.app/admin/system-requests/:id`
- `GET https://jobito-api-production.up.railway.app/admin/ops/users`
- `GET https://jobito-api-production.up.railway.app/admin/ops/users/:id`
- `POST https://jobito-api-production.up.railway.app/admin/ops/users/action`
- `GET https://jobito-api-production.up.railway.app/admin/ops/companies`
- `GET https://jobito-api-production.up.railway.app/admin/ops/companies/pending`
- `POST https://jobito-api-production.up.railway.app/admin/ops/companies/review`
- `GET https://jobito-api-production.up.railway.app/admin/ops/criminal-records`
- `POST https://jobito-api-production.up.railway.app/admin/ops/criminal-records/review`
- `GET https://jobito-api-production.up.railway.app/admin/ops/support/tickets`
- `POST https://jobito-api-production.up.railway.app/admin/ops/support/tickets/:id/reply`
- `PATCH https://jobito-api-production.up.railway.app/admin/ops/support/tickets/:id/close`
- `GET https://jobito-api-production.up.railway.app/admin/ops/content/reported`
- `POST https://jobito-api-production.up.railway.app/admin/ops/content/review`

### 🌍 Translations (الترجمة)
- `GET https://jobito-api-production.up.railway.app/translations`
- `POST https://jobito-api-production.up.railway.app/translations/batch`

### 📊 Dashboard & Monitoring (المراقبة والإحصائيات)
- `POST https://jobito-api-production.up.railway.app/dashboard/stats`
- `POST https://jobito-api-production.up.railway.app/dashboard/applicants-summary`
- `POST https://jobito-api-production.up.railway.app/dashboard/job-updates`
- `POST https://jobito-api-production.up.railway.app/dashboard/job-listing-stats`
- `GET https://jobito-api-production.up.railway.app/monitoring/reports`
- `POST https://jobito-api-production.up.railway.app/monitoring/log`

### 📞 Support & Content (الدعم والمحتوى)
- `GET https://jobito-api-production.up.railway.app/support/help/categories`
- `GET https://jobito-api-production.up.railway.app/support/help/articles`
- `GET https://jobito-api-production.up.railway.app/support/help/articles/:id`
- `POST https://jobito-api-production.up.railway.app/support/contact`
- `GET https://jobito-api-production.up.railway.app/content/services`
- `GET https://jobito-api-production.up.railway.app/content/features`
- `GET https://jobito-api-production.up.railway.app/content/stats`
- `POST https://jobito-api-production.up.railway.app/content/reports`
