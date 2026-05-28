# 📄 دليل طلبات الـ POST البرمجية لمنصة Jobito (Postman API Payload Guide)

يحتوي هذا الملف على جميع مسارات **POST** النشطة والفعّالة في خادم النظام الخلفي (Backend)، مع تفصيل هيكل البيانات المطلوب (JSON Payload) لكل طلب ليتم نسخه مباشرة إلى برنامج **Postman** أو استخدامه في كود الـ **Flutter**.

---

## 1. مسارات الحسابات والمصادقة (Authentication & Account APIs)

### 1.1 تسجيل حساب جديد (Register)
* **المسار:** `/auth/register`
* **طريقة الطلب:** `POST`
* **الوصف:** إنشاء حساب مستخدم، شركة، أو طالب في النظام بوضع الانتظار لحين التفعيل.
* **جسم الطلب (JSON Payload):**
```json
{
  "email": "user.test@example.com",
  "password": "Password123!",
  "fullName": "محمد أحمد",
  "role": "user", // الخيارات المتاحة: 'user', 'company', 'student'
  "phone": "+966500000000" // اختياري
}
```

---

### 1.2 تفعيل الحساب برمز التحقق (Verify Email)
* **المسار:** `/auth/verify-email`
* **طريقة الطلب:** `POST`
* **الوصف:** تفعيل الحساب بعد إدخال الرمز المكون من 6 أرقام (OTP).
* **جسم الطلب (JSON Payload):**
```json
{
  "email": "user.test@example.com",
  "code": "123456"
}
```

---

### 1.3 تسجيل الدخول الموحد (Login)
* **المسار:** `/auth/login`
* **طريقة الطلب:** `POST`
* **الوصف:** تسجيل الدخول للباحثين، الشركات، والمدراء، واسترجاع توكن الـ JWT.
* **جسم الطلب (JSON Payload):**
```json
{
  "email": "user.test@example.com",
  "password": "Password123!"
}
```

---

### 1.4 التحقق برقم الهاتف عبر Firebase
* **المسار:** `/auth/verify-firebase-phone`
* **طريقة الطلب:** `POST`
* **الوصف:** تفعيل الحساب وتوثيق الهاتف عن طريق Firebase Token.
* **جسم الطلب (JSON Payload):**
```json
{
  "email": "user.test@example.com",
  "firebaseToken": "FIREBASE_ID_TOKEN_HERE"
}
```

---

### 1.5 إعادة إرسال رمز التحقق (Resend Code)
* **المسار:** `/auth/resend-code`
* **طريقة الطلب:** `POST`
* **الوصف:** إعادة إرسال كود الـ OTP للبريد الإلكتروني.
* **جسم الطلب (JSON Payload):**
```json
{
  "email": "user.test@example.com"
}
```

---

### 1.6 طلب استعادة كلمة المرور عند نسيانها (Forgot Password)
* **المسار:** `/auth/forgot-password`
* **طريقة الطلب:** `POST`
* **الوصف:** إرسال رمز استعادة الباسورد للبريد.
* **جسم الطلب (JSON Payload):**
```json
{
  "email": "user.test@example.com"
}
```

---

### 1.7 إعادة تعيين كلمة المرور الجديدة (Reset Password)
* **المسار:** `/auth/reset-password`
* **طريقة الطلب:** `POST`
* **الوصف:** تعيين كلمة مرور جديدة باستخدام الرمز المرسل.
* **جسم الطلب (JSON Payload):**
```json
{
  "email": "user.test@example.com",
  "code": "123456",
  "newPassword": "NewPassword123!"
}
```

---

### 1.8 تسجيل الدخول السريع عبر Google (Google Login)
* **المسار:** `/auth/google-login`
* **طريقة الطلب:** `POST`
* **الوصف:** تسجيل الدخول السريع أو إنشاء حساب بمجرد التوثيق مع جوجل.
* **جسم الطلب (JSON Payload):**
```json
{
  "token": "GOOGLE_ID_TOKEN_OR_ACCESS_TOKEN"
}
```

---

## 2. مسارات الشركات والوظائف (Companies & Jobs APIs)

### 2.1 إنشاء ملف تعريفي للشركة (Create Company Profile)
* **المسار:** `/companies`
* **طريقة الطلب:** `POST`
* **الحماية:** يتطلب توكن (`Bearer Token`)
* **جسم الطلب (JSON Payload):**
```json
{
  "name": "شركة الحلول الذكية",
  "description": "شركة رائدة في مجال تقنية المعلومات والحلول الذكية.",
  "address": "الرياض، المملكة العربية السعودية",
  "contactEmail": "info@smartsolutions.com",
  "phone": "+966512345678"
}
```

---

### 2.2 نشر وظيفة جديدة (Create Job)
* **المسار:** `/jobs`
* **طريقة الطلب:** `POST`
* **الحماية:** يتطلب توكن شركة (`Bearer Token`)
* **جسم الطلب (JSON Payload):**
```json
{
  "title": "مطور فلاتر محترف (Flutter Developer)",
  "description": "مطلوب مطور تطبيقات فلاتر ذو خبرة لا تقل عن سنتين للعمل على مشروع ريادي.",
  "requirements": "خبرة مع Dart & Flutter، استخدام State Management مثل Bloc أو Provider، وربط APIs.",
  "location": "الرياض (أو عن بعد)",
  "salary": 8000,
  "experienceRequired": 2,
  "skills": ["Flutter", "Dart", "REST API", "Git"]
}
```

---

### 2.3 تسجيل مشاهدة للوظيفة (Track Job View)
* **المسار:** `/jobs/:id/view`
* **طريقة الطلب:** `POST`
* **الوصف:** تسجيل زيارة للوظيفة لغرض الإحصاءات والتحليل.
* **جسم الطلب (JSON Payload):**
```json
{
  "sessionId": "random-session-uuid-12345"
}
```

---

## 3. مسارات التقديم على الوظائف (Applications APIs)

### 3.1 التقديم على وظيفة معينة (Apply for a Job)
* **المسار:** `/applications`
* **طريقة الطلب:** `POST`
* **الحماية:** يتطلب توكن مستخدم (`Bearer Token`)
* **جسم الطلب (JSON Payload):**
```json
{
  "job_id": 1, // معرف الوظيفة الرقمي
  "portfolioUrl": "https://github.com/myportfolio", // اختياري
  "coverLetter": "أتقدم لهذه الوظيفة لما أملكه من مهارات تناسب متطلباتكم المذكورة...",
  "resumeUrl": "https://res.cloudinary.com/cvs/my-cv.pdf"
}
```

---

## 4. مسارات الدردشة والرسائل المباشرة (Chat APIs)

### 4.1 إرسال رسالة نصية مباشرة (Send Message)
* **المسار:** `/chat/p2p`
* **طريقة الطلب:** `POST`
* **الوصف:** إرسال رسالة نصية ثنائية في الشات المباشر.
* **جسم الطلب (JSON Payload):**
```json
{
  "senderId": "user-uuid-1111",
  "recipientId": "user-uuid-2222",
  "content": "مرحباً، هل يمكننا الاستفسار بخصوص الوظيفة المعروضة؟",
  "type": "text" // أو 'image', 'audio'
}
```

---

## 5. مسارات الذكاء الاصطناعي (AI APIs)

### 5.1 تحليل وحساب توافق السيرة الذاتية (Score CV with AI)
* **المسار:** `/ai/score-cv`
* **طريقة الطلب:** `POST`
* **الوصف:** يقوم الذكاء الاصطناعي بمقارنة مهاراتك مع متطلبات الوظيفة وإعطائك نسبة توافق.
* **جسم الطلب (JSON Payload):**
```json
{
  "userSkills": ["Flutter", "Dart", "Firebase"],
  "userBio": "مطور تطبيقات واجهات أمامية بخبرة سنتين في فلاتر وتكامل قواعد البيانات.",
  "jobTitle": "مطور فلاتر محترف",
  "jobDescription": "نبحث عن مطور تطبيقات فلاتر متمكن من التعامل مع قواعد البيانات وبناء واجهات متميزة."
}
```

---

### 5.2 توليد وصف وظيفي بالذكاء الاصطناعي (Generate Job Description)
* **المسار:** `/ai/generate-job-desc`
* **طريقة الطلب:** `POST`
* **الوصف:** إنشاء وصف وظيفي احترافي جذاب بناءً على معطيات بسيطة.
* **جسم الطلب (JSON Payload):**
```json
{
  "title": "مطور Node.js",
  "category": "برمجة وتطوير",
  "experience": "خبرة 3 سنوات",
  "location": "الرياض"
}
```

---

## 6. مسارات الإشعارات والـ Push Notifications

### 6.1 تسجيل جهاز لاستقبال الإشعارات (Register FCM Token)
* **المسار:** `/push/register/fcm`
* **طريقة الطلب:** `POST`
* **جسم الطلب (JSON Payload):**
```json
{
  "userId": "user-uuid-12345",
  "deviceToken": "FCM_TOKEN_FROM_FIREBASE_HERE",
  "deviceName": "Samsung Galaxy S22 / iPhone 13"
}
```
