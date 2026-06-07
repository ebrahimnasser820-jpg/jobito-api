# 📄 توثيق واجهات برمجة التطبيقات النشطة والفعّالة (Backend API Endpoints)

يحتوي هذا الدليل على **جميع مسارات واجهات برمجة التطبيقات (API Endpoints) النشطة والفعّالة فعلياً** في خادم النظام الخلفي (Backend) لمنصة **Jobito**. تم توثيق جميع المسارات مصنفة حسب الوحدات البرمجية والوظائف، وهي مهيأة بالكامل وجاهزة للنقل المباشر لتقرير/كتاب مشروع التخرج الخاص بك.

* **الرابط الأساسي للخادم (Base URL):** `https://jobito-api-production.up.railway.app`
* **بروتوكول التحقق (Auth Protocol):** جميع المسارات المحمية تتطلب إرسال رمز تسجيل الدخول كـ `Bearer Token` في رأس الطلب (`Authorization: Bearer <JWT_TOKEN>`).

---

## 1. مسارات المصادقة والحسابات (Authentication & Account APIs)

تتعامل هذه المجموعة مع تسجيل المستخدمين، وتأكيد الهويات، وتأمين عمليات الدخول بمختلف الطرق:

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | تسجيل حساب جديد في المنصة بوضع الانتظار لحين التفعيل. | `fullName`, `email`, `password`, `role`, `phone` |
| **POST** | `/api/auth/login` | تسجيل الدخول الموحد (مستخدمين، شركات، مدراء) وإصدار رمز JWT. | `email`, `password` |
| **POST** | `/api/auth/verify-email` | التحقق من الحساب وتفعيله باستخدام رمز الـ OTP المرسل للإيميل. | `email`, `code` |
| **GET** | `/api/auth/verify-link` | التحقق التلقائي عند الضغط على رابط تفعيل الحساب في البريد الإلكتروني. | استعلامات الرابط (`email`, `code`) |
| **POST** | `/api/auth/verify-firebase-phone` | التحقق وتفعيل الحساب باستخدام رقم الهاتف عبر رمز التحقق من Firebase. | `email`, `firebaseToken` |
| **POST** | `/api/auth/resend-code` | إعادة إرسال رمز التفعيل OTP الجديد للبريد الإلكتروني. | `email` |
| **POST** | `/api/auth/forgot-password` | إرسال رمز استعادة كلمة المرور عند نسيانها للبريد الإلكتروني. | `email` |
| **POST** | `/api/auth/reset-password` | إعادة تعيين كلمة مرور جديدة باستخدام رمز الاستعادة المرسل. | `email`, `code`, `new_password` |
| **POST** | `/api/auth/reset-password-google` | إعادة تعيين كلمة مرور جديدة بعد التحقق المسبق من حساب جوجل. | `googleToken`, `new_password` |
| **POST** | `/api/auth/google-login` | تسجيل الدخول أو إنشاء حساب سريع وتلقائي بالمنصة عبر حساب جوجل. | `token` |
| **POST** | `/api/auth/link-google` | ربط حساب جوجل الشخصي بالحساب الحالي النشط (يتطلب تسجيل دخول). | `googleToken` |
| **POST** | `/api/auth/refresh-token` | تحديث رمز تسجيل الدخول JWT الحالي وتمديد الجلسة دون تسجيل خروج. | يتطلب الرمز القديم برأس الطلب |
| **POST** | `/api/auth/upload-document` | رفع مستندات التفعيل (السجل التجاري، الهوية، شهادات المهن الحرة). | رفع ملف (`file`) كـ `Multipart FormData` |

---

## 2. مسارات إدارة المستخدمين وملفاتهم الشخصية (User Profile APIs)

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/users/me` | جلب تفاصيل الملف الشخصي الكامل للمستخدم الحالي (بيانات أساسية وسيرة ذاتية). | يتطلب تسجيل دخول |
| **PUT** | `/api/users/me` | تحديث تفاصيل الملف الشخصي (الاسم، المهارات، النبذة الشخصية، التعليم، والخبرات). | الحقول المراد تحديثها |
| **PATCH** | `/api/users/me/theme` | تغيير المظهر المفضل للمنصة للمستخدم الحالي (مظهر داكن / مظهر فاتح). | `theme` (قيمتها: `light` أو `dark`) |
| **PATCH** | `/api/users/me/language` | تغيير اللغة المفضلة لواجهة المستخدم (عربي / إنجليزي). | `language` (قيمتها: `ar` أو `en`) |
| **PUT** | `/api/users/me/password` | تغيير كلمة المرور للمستخدم الحالي بعد مطابقة وتأكيد القديمة. | `oldPassword`, `newPassword` |
| **DELETE** | `/api/users/me` | تقديم طلب رسمي لحذف وإلغاء الحساب وجدولته للحذف الفعلي بعد 7 أيام. | يتطلب تسجيل دخول |
| **PATCH** | `/api/users/me/cancel-deletion` | إلغاء طلب حذف الحساب واسترجاع الحساب لوضعه الطبيعي النشط. | يتطلب تسجيل دخول |
| **GET** | `/api/users/me/deletion-status` | الاستعلام عن حالة الحذف والمدة المتبقية باليوم والساعة قبل الحذف النهائي. | يتطلب تسجيل دخول |

---

## 3. مسارات الشركات والملفات التعريفية لها (Company Profile APIs)

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/companies` | عرض قائمة الشركات المسجلة بالمنصة مع دعم التصفح والبحث الذكي. | عوامل تصفية اختيارية (`Query Filters`) |
| **GET** | `/api/companies/:id` | جلب وعرض تفاصيل شركة محددة باستخدام معرّفها الرقمي الفريد. | معرّف الشركة بالرابط (`id`) |
| **POST** | `/api/companies` | إنشاء وتأسيس ملف تعريفي جديد للشركة (خاص بالمسؤولين أو الحسابات المسجلة). | بيانات الشركة التعاقدية والتأسيسية |
| **PATCH** | `/api/companies/:id` | تحديث بيانات وتفاصيل ملف الشركة التعريفي باستخدام معرف الشركة الرقمي. | البيانات والمستندات المراد تحديثها |
| **GET** | `/api/companies/my/profile` | جلب الملف التعريفي للشركة المرتبطة مباشرة بحساب المستخدم الحالي. | يتطلب تسجيل دخول شركة |
| **PATCH** | `/api/companies/my/profile` | تحديث بيانات الشركة للمستخدم الحالي أو إنشائه تلقائياً في حال عدم وجوده. | بيانات ملف الشركة المحدثة |
| **GET** | `/api/companies/my/dashboard-summary`| جلب ملخص لوحة التحكم لأرباب الأعمال (إجمالي الوظائف والمتقدمين ونسب القبول). | يتطلب تسجيل دخول شركة |
| **GET** | `/api/companies/:id/statistics` | جلب بيانات المشاهدات وإحصاءات التقديم لمدد زمنية محددة لعرض الرسوم البيانية. | معرّف الشركة، بارامتر الفترة (`period`) |

---

## 4. مسارات الوظائف والبحث الفعّال (Jobs & Search APIs)

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/jobs` | جلب وتصفح قائمة الوظائف المنشورة مع تصفية متقدمة (الموقع، الراتب، والتصنيف). | عوامل تصفية اختيارية بالرابط |
| **GET** | `/api/jobs/categories` | جلب وتصفح جميع تصنيفات الوظائف المتوفرة بالمنصة لعرضها بالقوائم. | لا يوجد |
| **GET** | `/api/jobs/nearby` | البحث عن الوظائف القريبة جغرافياً من موقع الباحث بالاعتماد على إحداثيات GPS. | إحداثيات الموقع ونصف القطر بالرابط |
| **GET** | `/api/jobs/:id` | عرض التفاصيل الكاملة لوظيفة معينة مع متطلباتها وتفاصيل الناشر. | معرّف الوظيفة بالرابط (`id`) |
| **GET** | `/api/jobs/similar/:id` | جلب قائمة الوظائف الشبيهة بالوظيفة المعروضة بناءً على التصنيف والمهارات. | معرّف الوظيفة بالرابط (`id`) |
| **POST** | `/api/jobs` | نشر وإعلان وظيفة جديدة على المنصة (متاح للشركات والمهنيين الأحرار). | بيانات وتفاصيل الوظيفة والشروط والمهارات |
| **POST** | `/api/jobs/bulk` | نشر مجموعة من الوظائف دفعة واحدة بسجل واحد (للتغذية المكثفة والشركات الكبرى).| مصفوفة من كائنات الوظائف |
| **PATCH** | `/api/jobs/:id` | تعديل وتحديث بيانات وظيفة منشورة مسبقاً (مسموح لصاحب الوظيفة فقط). | البيانات والمعدلات الجديدة |
| **DELETE** | `/api/jobs/:id` | حذف وإلغاء إعلان الوظيفة المنشورة نهائياً من قاعدة البيانات. | معرّف الوظيفة بالرابط (`id`) |
| **POST** | `/api/jobs/:id/view` | تسجيل زيارة ومشاهدة جديدة للإعلان لحساب تفاعلات ونسب قراءات الوظيفة. | معرف الجلسة (`sessionId`) بالـ Body |
| **GET** | `/api/jobs/:id/analytics` | جلب تحليلات وإحصاءات تفصيلية تفاعلية حول الوظيفة والجمهور المستهدف. | معرّف الوظيفة بالرابط |

---

## 5. مسارات التقديم على الوظائف (Job Application APIs)

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/applications` | التقديم على وظيفة معينة وإرسال ملفات السيرة الذاتية وخطاب التغطية والعنوان. | `job_id`, `portfolioUrl`, `coverLetter`, `resumeUrl` |
| **GET** | `/api/applications/my` | جلب قائمة الوظائف والطلبات التي تقدم إليها الباحث الحالي وتاريخ حالتها. | يتطلب تسجيل دخول باحث |
| **GET** | `/api/applications/job/:jobId` | عرض المتقدمين لوظيفة محددة بالترتيب مع بيانات سيرهم الذاتية (للناشر فقط). | معرّف الوظيفة بالرابط (`jobId`) |
| **GET** | `/api/applications/company/:companyId/hired` | جلب الباحثين المقبولين نهائياً وتم تعيينهم من قبل الشركة المحددة. | معرّف الشركة بالرابط |
| **GET** | `/api/applications/user/hired` | جلب جميع طلبات التوظيف المقبولة والناجحة نهائياً للمستخدم الحالي. | يتطلب تسجيل دخول |
| **GET** | `/api/applications/:id` | عرض تفاصيل طلب تقديم محدد بالمعرف البرمجي الفريد. | معرّف طلب التقديم بالرابط (`id`) |
| **PATCH** | `/api/applications/:id/status` | مراجعة وتحديث حالة طلب التقديم (قبول، رفض، جدولة مقابلة، توظيف). | `status` (مثال: `hired`, `rejected`, `interview`) |
| **GET** | `/api/applications/status/:jobId` | التحقق الفوري عما إذا كان الباحث قد تقدم سابقاً لهذه الوظيفة لعرض حالتها. | معرّف الوظيفة بالرابط |
| **DELETE** | `/api/applications/:id` | سحب طلب التقديم على الوظيفة وإلغائه نهائياً (متاح للباحث فقط). | معرّف طلب التقديم بالرابط |

---

## 6. مسارات الدردشة والرسائل المباشرة والوسائط (Chat & Media APIs)

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/chat/p2p` | إرسال رسالة نصية أو ملف مباشرة لمستقبل معين ثنائي الاتجاه P2P. | `senderId`, `recipientId`, `content`, `type` |
| **GET** | `/api/chat/p2p/history` | جلب وعرض سجل المحادثة المباشرة بين مستخدمين بالصفحات والتاريخ. | المتغيرات بالرابط (`userId`, `otherId`, `page`) |
| **GET** | `/api/chat/my-chats/:userId` | جلب المحادثات الجارية للمستخدم الحالي مع تفاصيل الطرف الآخر وحالة القراءة. | معرّف المستخدم بالرابط |
| **PUT** | `/api/chat/p2p/read` | تحديث وقراءة كافة الرسائل الواردة غير المقروءة لتصبح مقروءة للطرفين. | `userId`, `otherId` |
| **PUT** | `/api/chat/p2p/:id` | تعديل وتغيير محتوى رسالة مرسلة مسبقاً بنص جديد. | `content` بالـ Body، معرّف الرسالة بالرابط |
| **DELETE** | `/api/chat/p2p/:id` | حذف رسالة مرسلة نهائياً من سجل المحادثة للطرفين. | معرّف الرسالة بالرابط |
| **POST** | `/api/chat/upload` | رفع الصور والمستندات المرفقة أثناء المحادثات الفورية. | ملف الرفع (`file`) كـ `Multipart FormData` |
| **POST** | `/api/chat/upload-audio` | رفع الرسائل الصوتية المسجلة وتخزين مدتها لحفظها في سجل المحادثة. | `file` (صوت)، `senderId`, `recipientId`, `duration` |
| **GET** | `/api/chat/media/:fileName` | تحميل وبث ملفات الصور والمقاطع الصوتية المرفوعة في غرف المحادثة. | اسم الملف بالرابط (`fileName`) |
| **GET** | `/api/chat/search-users` | البحث عن مستخدمين بالاسم لبدء محادثة فورية جديدة معهم بالمنصة. | اسم البحث `q` ومعرّف الباحث الحالي |
| **GET** | `/api/chat/user-info/:userId` | جلب البيانات المعروضة لخصائص الطرف الآخر بالمحادثة (الاسم والصورة الشخصية). | معرّف المستخدم بالرابط |
| **POST** | `/api/chat/users-info` | جلب بيانات مجموعة مستخدمين دفعة واحدة (لتحسين أداء عرض المحادثات). | مصفوفة المعرفات `userIds` بالـ Body |

---

## 7. مسارات تحليلات الذكاء الاصطناعي الفعّالة (AI Analytics APIs)

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/ai/smart-search` | محرك البحث الذكي: جلب وتصفية الوظائف بالاعتماد على مطابقة الكلمات والوسوم الدلالية. | `q` (نص البحث الأصلي)، والموقع والتصنيف اختياري |
| **POST** | `/api/ai/auto-tag` | التحليل التلقائي وتوليد الكلمات الدلالية ووسوم المهارات المطلوبة من العنوان والوصف. | `title`, `description` (اختياري) |
| **GET** | `/api/ai/expand-query` | توسيع وتكبير الكلمات البحثية وتوفير المترادفات لها في الكواليس (اختبار وتطوير). | نص البحث `q` |
| **POST** | `/api/ai/score-cv` | التحليل الذكي لحساب نسبة توافق السيرة الذاتية مع متطلبات وظيفة معينة بنسبة مئوية. | `userSkills`, `userBio`, `jobTitle`, `jobDescription` |
| **POST** | `/api/ai/generate-job-desc` | توليد وصياغة وصف وظيفي احترافي جذاب بناءً على معطيات بسيطة من السيرفر. | `title`, `category`, `experience`, `location` |
| **POST** | `/api/ai/cover-letter` | توليد وصياغة خطاب تغطية ذكي ومقنع وموجه مباشرة للوظيفة المستهدفة بالشركة. | `userName`, `userSkills`, `userExperience`, `jobTitle` |
| **GET** | `/api/ai/analytics/top-searches`| جلب الكلمات والعبارات الأكثر بحثاً في محركات البحث بالمنصة لفترات معينة. | فترة الأيام الاختيارية `days` |
| **GET** | `/api/ai/analytics/top-companies`| جلب الشركات الأكثر تفاعلاً وزيارة وقراءة للملفات التعريفية بالمنصة. | فترة الأيام الاختيارية `days` |
| **GET** | `/api/ai/analytics/top-jobs` | جلب وعرض الوظائف وإعلانات التوظيف الأكثر مشاهدة من قبل الباحثين. | فترة الأيام الاختيارية `days` |
| **GET** | `/api/ai/analytics/traffic` | جلب تقارير الزيارات ومعدلات المشاهدة الإجمالية وحركة المرور بالسيرفر. | فترة الأيام الاختيارية `days` |
| **POST** | `/api/ai/analytics/send-report`| توليد تقرير حركة المرور والنشاط الكامل للمنصة وإرساله بشكل آلي لبريد الإدارة. | عدد الأيام للتقرير `days` |

---

## 8. مسارات الشات بوت التفاعلي (AI Chatbot Service APIs)

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/ai-chatbot/chat` | إرسال رسالة نصية أو مرفق صورة للشات بوت الذكي وتلقي الرد المباشر بأسلوب التدفق SSE. | `message`, `userId`, `image` (اختياري)، `fileType` |
| **GET** | `/api/ai-chatbot/history/:userId` | جلب السجلات الكاملة للمحادثات السابقة التي دارت بين الباحث والشات بوت. | معرّف الباحث بالرابط |

---

## 9. مسارات إشعارات الويب والهاتف (Push Notifications APIs)

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/push/register/fcm` | تسجيل وتحديث معرّف الجهاز (Device Token) الممنوح من Firebase لإرسال إشعارات الهاتف. | `userId`, `deviceToken`, `deviceName` |
| **POST** | `/api/push/register/web` | تسجيل وحفظ كائن الاشتراك لمتصفحات الويب (Web Push Subscription) لإشعارات الويب. | `userId`, `subscription`, `deviceName` |
| **DELETE** | `/api/push/unregister/:subscriptionId`| إلغاء تفعيل اشتراك جهاز محدد ومنع إرسال أي إشعارات إضافية إليه. | معرّف الاشتراك بالرابط، ومعرّف المستخدم |
| **GET** | `/api/push/subscriptions/:userId`| جلب الأجهزة والاشتراكات الفعالة المسجلة لإشعارات المستخدم الحالي بالمنصة. | معرّف المستخدم بالرابط |
| **GET** | `/api/push/vapid-key` | جلب المفتاح العام القياسي VAPID للويب من السيرفر لبدء تهيئة إشعارات الويب. | لا يوجد |

---

## 10. الترجمة وتذاكر الدعم والصفحة الرئيسية (General Setup & Support APIs)

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/translations` | جلب ملف القاموس الكامل لترجمات الواجهة بناءً على اللغة المطلوبة. | لغة الواجهة المطلوبة بالرابط `lang` |
| **GET** | `/api/support/help/categories` | جلب وتصفح تصنيفات وأقسام مقالات المساعدة المتوفرة بمركز المساعدة. | لا يوجد |
| **GET** | `/api/support/help/articles` | البحث في مقالات الدعم والمساعدة وحلول المشاكل بالكلمات المفتاحية. | كلمة البحث `q` بالرابط |
| **GET** | `/api/support/help/articles/:id` | عرض تفاصيل مقال دعم محدد بخطوات الحل والمسائل المرتبطة به. | معرّف المقال بالرابط |
| **POST** | `/api/support/contact` | إرسال طلب تواصل أو تذكرة دعم للزوار والباحثين إلى خادم بريد الإدارة آلياً. | `name`, `email`, `subject`, `message`, `preferredContact` |
| **GET** | `/api/content/services` | جلب قائمة الخدمات وميزات الدعم الفعلي لعرضها بالصفحة الرئيسية للموقع. | لا يوجد |
| **GET** | `/api/content/features` | جلب الميزات التنافسية وعناصر النجاح لعرضها بالصفحة الرئيسية للمنصة. | لا يوجد |
| **GET** | `/api/content/stats` | جلب إحصاءات المنصة الحية (إجمالي التعيينات والشركات والوظائف) للزوار. | لا يوجد |
| **POST** | `/api/content/reports` | تقديم شكوى أو إبلاغ حول محتوى إعلان أو وظيفة أو حساب مستخدم مسيء بالمنصة. | كائن الشكوى مع تفاصيل المحتوى |

---

## 11. لوحة التحكم الإدارية وإدارة عمليات النظام (Admin & Operations APIs)

مجموعة واجهات مخصصة **لطاقم الإدارة العليا (Super Admins)** و **مدراء العمليات (Operation Managers)** لإدارة ومراقبة المنصة:

### أ) لوحة التحكم والمصادقة وإدارة المسؤولين (Admin Controls)
| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | الصلاحية المطلوبة (Roles Allowed) |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/admin/setup` | إنشاء حساب المدير المالك الأول للنظام (Super Admin) لأول مرة لتفادي الاختراقات. | متاح للجميع لمرة واحدة فقط |
| **POST** | `/api/admin/login` | تسجيل الدخول للنظام الإداري للمدراء وإصدار رمز وصول JWT خاص بهم. | متاح لجميع المشرفين والمدراء |
| **GET** | `/api/admin/dashboard/stats` | جلب الإحصاءات العامة الشاملة للنظام (المستخدمين، الوظائف، بلاغات المحتوى). | المدير العام (Super Admin) |
| **GET** | `/api/admin/dashboard/charts` | جلب بيانات الرسم البياني الأسبوعي لتفاعلات وعمليات المنصة التاريخية. | المدير العام (Super Admin) |
| **GET** | `/api/admin/maintenance` | الاستعلام عن وضع الصيانة الشامل للنظام ومعرفة ما إذا كان مفعّلاً أم لا. | المشرفين والمدراء |
| **PATCH** | `/api/admin/maintenance` | تشغيل أو إطفاء وضع الصيانة الشامل للمنصة (يقفل التسجيل والدخول العام). | المدير العام (Super Admin) |
| **POST** | `/api/admin/invite` | دعوة وإنشاء حساب مسؤول أو مدير عمليات جديد برول محدد بالصلاحيات. | المدير العام (Super Admin) |
| **GET** | `/api/admin/list` | جلب وعرض قائمة المشرفين والمسؤولين والمدراء وطاقم العمل بالكامل. | المدير العام (Super Admin) |
| **GET** | `/api/admin/staff` | جلب طاقم العمل بالكامل وعرضه لكافة المشرفين لأغراض التعاون الداخلي. | متاح لجميع المشرفين والمدراء |
| **GET** | `/api/admin/activity-log` | جلب سجل عمليات الإدارة التاريخي (بشكل مفصل ومؤرخ) لمراقبة الأفعال. | المدير العام (Super Admin) |
| **GET** | `/api/admin/ops-activities` | جلب نشاطات طاقم إدارة العمليات (شخصي للمدير، أو عام للـ Super Admin). | متاح لجميع المشرفين والمدراء |
| **GET** | `/api/admin/ops-chart` | جلب بيانات رسم بياني للنشاط التاريخي لآخر 24 ساعة لمدير العمليات الحالي. | متاح لجميع المشرفين والمدراء |
| **GET** | `/api/admin/system-requests` | عرض طلبات النظام الحساسة المرفوعة من مدراء العمليات للموافقة عليها. | المدير العام (Super Admin) |
| **PATCH** | `/api/admin/system-requests/:id` | مراجعة واعتماد أو رفض طلب نظام حساس محدد (مثل ميزانية أو صلاحيات). | المدير العام (Super Admin) |
| **GET** | `/api/admin/profile` | جلب بيانات الملف التعريفي والمهني للمدير المسؤول الحالي المسجل دخوله. | متاح لجميع المشرفين والمدراء |
| **PATCH** | `/api/admin/change-password` | تغيير كلمة المرور للمسؤول الحالي بعد التحقق من صحة القديمة. | متاح لجميع المشرفين والمدراء |

### ب) إدارة حسابات المستخدمين والتحقق ورقابة المحتوى (Operations & Reviews)
يتطلب الوصول لهذه المسارات أن يكون المسؤول برول **مدير عمليات (Operation Manager)** أو **مدير عام (Super Admin)**:

| طريقة الطلب (Method) | مسار الرابط (Endpoint) | غرض ووظيفة المسار الفعلي | البيانات المطلوبة (Payload) / المدخلات |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/ops/users` | جلب وتصفح كافة حسابات مستخدمي المنصة بانتظام مع إمكانية الفلترة والبحث. | `search`, `accountType`, `status`, `page` |
| **GET** | `/api/admin/ops/users/:id` | جلب السجلات والخصائص وتفاصيل الحساب الكامل لمستخدم معين بالمنصة. | معرّف المستخدم بالرابط |
| **POST** | `/api/admin/ops/users/action` | تنفيذ عقوبة أو إجراء رقابي على حساب مستخدم (تحذير، إيقاف، حظر). | `targetUserId`, `actionType` (`WARNING`, `SUSPEND`, `BAN`), `reason` |
| **GET** | `/api/admin/ops/companies/pending` | عرض وعرض ملفات ومستندات الشركات المسجلة حديثاً بانتظار الموافقة والاعتماد. | لا يوجد |
| **GET** | `/api/admin/ops/companies/:id` | جلب وتصفح تفاصيل ومستندات شركة بانتظار مراجعة طلب تفعيلها بالمنصة. | معرّف الشركة بالرابط |
| **POST** | `/api/admin/ops/companies/review` | مراجعة واعتماد ملف الشركة (قبول وتفعيل حساب، أو رفض مع ذكر الأسباب للبريد). | `companyId`, `action` (`approve` أو `reject`), `rejectionReason` |
| **GET** | `/api/admin/ops/companies` | تصفح واستعراض قائمة الشركات المسجلة بالكامل مع تصفيتها حسب حالتها. | حالة الشركة بالرابط `status` |
| **GET** | `/api/admin/ops/content/reported` | جلب بلاغات الإساءة والشكاوى المقدمة ضد محتويات بالمنصة بانتظار المراجعة. | حالة البلاغات بالرابط |
| **POST** | `/api/admin/ops/content/review` | اتخاذ قرار بخصوص البلاغات المرفوعة (حذف المحتوى تماماً، أو تبرئة وحفظ البلاغ).| `reportId`, `action` (`delete` أو `dismiss`) |
| **GET** | `/api/admin/ops/support/tickets` | تصفح وجلب تذاكر الدعم والاستفسارات الفنية الواردة من مستخدمي المنصة. | حالة التذاكر بالرابط |
| **GET** | `/api/admin/ops/support/tickets/:id`| جلب تفاصيل محادثة تذكرة فنية معينة والرسائل المتبادلة بها لدراستها. | معرّف التذكرة بالرابط |
| **POST** | `/api/admin/ops/support/tickets/:id/reply`| إرسال رد رسمي للمستخدم على تذكرته الفنية يصله في مركز الدعم وبالبريد. | كائن الرد `content` بالـ Body |
| **PATCH** | `/api/admin/ops/support/tickets/:id/close`| إغلاق تذكرة الدعم بالكامل وتأكيد حل المشكلة الفنية للعميل نهائياً. | معرّف التذكرة بالرابط |
| **GET** | `/api/admin/ops/criminal-records` | عرض المهنيين الأحرار الذين رفعوا صحيفة الحالة الجنائية للمراجعة للموافقة والتحقق. | حالة الصحيفة بالرابط `status` |
| **POST** | `/api/admin/ops/criminal-records/review`| اتخاذ قرار بمراجعة صحيفة الحالة الجنائية (قبول وتوثيق الحساب، أو رفضه). | `userId`, `action` (`approve` أو `reject`), `reason` |
| **POST** | `/api/admin/ops/system-request` | رفع طلب نظام حساس للمدير العام (Super Admin) لاعتماده وتفعيله للنظام. | كائن تفاصيل الطلب برأس الحقل |


---

# 📌 قائمة إضافية بجميع مسارات النظام (المستخرجة برمجياً)

تحتوي هذه القائمة على جميع الـ APIs الموجودة في المشروع (175 مسار) لتغطية أي مسارات لم تذكر في الأعلى:

## 📂 وحدة: admin-auth
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **POST** | `/api/admin/setup` |
| **POST** | `/api/admin/login` |
| **GET** | `/api/admin/dashboard/stats` |
| **GET** | `/api/admin/sys/dashboard` |
| **GET** | `/api/admin/dashboard/charts` |
| **GET** | `/api/admin/maintenance` |
| **PATCH** | `/api/admin/maintenance` |
| **POST** | `/api/admin/invite` |
| **GET** | `/api/admin/list` |
| **GET** | `/api/admin/staff` |
| **GET** | `/api/admin/activity-log` |
| **GET** | `/api/admin/sys/activity-log` |
| **GET** | `/api/admin/ops-activities` |
| **GET** | `/api/admin/system-requests` |
| **PATCH** | `/api/admin/system-requests/:id` |
| **GET** | `/api/admin/ops-chart` |
| **GET** | `/api/admin/profile` |
| **PATCH** | `/api/admin/change-password` |

---

## 📂 وحدة: admin-ops
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/admin/ops/users` |
| **GET** | `/api/admin/ops/users/:id` |
| **POST** | `/api/admin/ops/users/action` |
| **PATCH** | `/api/admin/ops/users/:id` |
| **GET** | `/api/admin/ops/companies/pending` |
| **GET** | `/api/admin/ops/companies/:id` |
| **POST** | `/api/admin/ops/companies/review` |
| **PATCH** | `/api/admin/ops/companies/:id` |
| **GET** | `/api/admin/ops/companies` |
| **GET** | `/api/admin/ops/content/reported` |
| **POST** | `/api/admin/ops/content/review` |
| **GET** | `/api/admin/ops/support/tickets` |
| **GET** | `/api/admin/ops/support` |
| **GET** | `/api/admin/ops/support/tickets/:id` |
| **POST** | `/api/admin/ops/support/tickets/:id/reply` |
| **PATCH** | `/api/admin/ops/support/tickets/:id/close` |
| **GET** | `/api/admin/ops/system-requests` |
| **POST** | `/api/admin/ops/system-request` |
| **GET** | `/api/admin/ops/criminal-records` |
| **POST** | `/api/admin/ops/criminal-records/review` |

---

## 📂 وحدة: ai-chatbot
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **POST** | `/api/ai-chatbot/chat` |
| **GET** | `/api/ai-chatbot/history/:userId` |

---

## 📂 وحدة: app
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api` |
| **GET** | `/api/config` |
| **GET** | `/api/maintenance-status` |

---

## 📂 وحدة: applications
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/applications/my` |
| **GET** | `/api/applications/job/:jobId` |
| **GET** | `/api/applications/company/:companyId/hired` |
| **GET** | `/api/applications/user/hired` |
| **GET** | `/api/applications/:id` |
| **PATCH** | `/api/applications/:id` |
| **PATCH** | `/api/applications/:id/status` |
| **POST** | `/api/applications/:id/status` |
| **GET** | `/api/applications/status/:jobId` |
| **PATCH** | `/api/applications/:id/unlock-rating` |
| **DELETE** | `/api/applications/:id` |
| **POST** | `/api/applications` |

---

## 📂 وحدة: ai-smart
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/ai/smart-search` |
| **POST** | `/api/ai/auto-tag` |
| **GET** | `/api/ai/expand-query` |
| **POST** | `/api/ai/score-cv` |
| **POST** | `/api/ai/generate-job-desc` |
| **POST** | `/api/ai/cover-letter` |
| **GET** | `/api/ai/analytics/top-searches` |
| **GET** | `/api/ai/analytics/top-companies` |
| **GET** | `/api/ai/analytics/top-jobs` |
| **GET** | `/api/ai/analytics/traffic` |
| **POST** | `/api/ai/analytics/send-report` |

---

## 📂 وحدة: auth
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **POST** | `/api/auth/refresh-token` |
| **POST** | `/api/auth/refresh` |
| **POST** | `/api/auth/register` |
| **POST** | `/api/auth/upload-document` |
| **POST** | `/api/auth/login` |
| **POST** | `/api/auth/verify-email` |
| **POST** | `/api/auth/verify-otp` |
| **GET** | `/api/auth/verify-link` |
| **POST** | `/api/auth/verify-firebase-phone` |
| **POST** | `/api/auth/resend-code` |
| **POST** | `/api/auth/forgot-password` |
| **POST** | `/api/auth/reset-password` |
| **POST** | `/api/auth/reset-password-google` |
| **POST** | `/api/auth/google-login` |
| **POST** | `/api/auth/link-google` |

---

## 📂 وحدة: chat
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **POST** | `/api/chat/message` |
| **POST** | `/api/chat/upload` |
| **POST** | `/api/chat/upload-audio` |
| **GET** | `/api/chat/media/:fileName` |
| **GET** | `/api/chat/history/:sessionId` |
| **POST** | `/api/chat/p2p` |
| **DELETE** | `/api/chat/p2p/:id` |
| **PUT** | `/api/chat/p2p/read` |
| **PUT** | `/api/chat/p2p/:id` |
| **GET** | `/api/chat/p2p/history` |
| **GET** | `/api/chat/my-chats/:userId` |
| **GET** | `/api/chat/search-users` |
| **GET** | `/api/chat/support-staff` |
| **GET** | `/api/chat/user-info/:userId` |
| **POST** | `/api/chat/users-info` |

---

## 📂 وحدة: conversations
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/conversations/:id/messages` |
| **POST** | `/api/conversations/:id/messages` |
| **GET** | `/api/conversations` |

---

## 📂 وحدة: companies
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/companies/:id` |
| **PATCH** | `/api/companies/:id` |
| **GET** | `/api/companies/my/dashboard-summary` |
| **GET** | `/api/companies/my/profile` |
| **PATCH** | `/api/companies/my/profile` |
| **GET** | `/api/companies/dev/cleanup` |
| **GET** | `/api/companies/:id/statistics` |
| **GET** | `/api/companies` |
| **POST** | `/api/companies` |

---

## 📂 وحدة: content
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/content/services` |
| **GET** | `/api/content/features` |
| **GET** | `/api/content/stats` |
| **POST** | `/api/content/reports` |

---

## 📂 وحدة: dashboard
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **POST** | `/api/dashboard/stats` |
| **POST** | `/api/dashboard/applicants-summary` |
| **POST** | `/api/dashboard/job-updates` |
| **POST** | `/api/dashboard/job-listing-stats` |

---

## 📂 وحدة: favorites
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **POST** | `/api/favorites/toggle/:jobId` |
| **GET** | `/api/favorites` |

---

## 📂 وحدة: images
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **POST** | `/api/images/upload` |
| **GET** | `/api/images/data/:imageId` |
| **GET** | `/api/images/entity/:type/:id` |
| **PUT** | `/api/images/profile` |
| **PUT** | `/api/images/banner` |
| **GET** | `/api/images/profile/:userId` |
| **DELETE** | `/api/images/:imageId` |

---

## 📂 وحدة: jobs
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/jobs/seed-categories` |
| **GET** | `/api/jobs/categories` |
| **GET** | `/api/jobs/nearby` |
| **GET** | `/api/jobs/:id` |
| **GET** | `/api/jobs/similar/:id` |
| **POST** | `/api/jobs/bulk` |
| **PATCH** | `/api/jobs/:id` |
| **POST** | `/api/jobs/:id/view` |
| **GET** | `/api/jobs/:id/analytics` |
| **DELETE** | `/api/jobs/:id` |
| **GET** | `/api/jobs` |
| **POST** | `/api/jobs` |

---

## 📂 وحدة: monitoring
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/monitoring/reports` |
| **POST** | `/api/monitoring/log` |
| **GET** | `/api/monitoring/test-error` |

---

## 📂 وحدة: push
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **POST** | `/api/push/register/fcm` |
| **POST** | `/api/push/register/web` |
| **DELETE** | `/api/push/unregister/:subscriptionId` |
| **GET** | `/api/push/subscriptions/:userId` |
| **POST** | `/api/push/send` |
| **POST** | `/api/push/broadcast` |
| **GET** | `/api/push/vapid-key` |

---

## 📂 وحدة: ratings
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/ratings/company/:companyId` |
| **GET** | `/api/ratings/job/:jobId` |
| **GET** | `/api/ratings/user/:userId` |
| **GET** | `/api/ratings/company/:companyId/given` |
| **GET** | `/api/ratings/user/:userId/given` |
| **POST** | `/api/ratings` |

---

## 📂 وحدة: service-requests
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/service-requests/:id` |
| **POST** | `/api/service-requests` |
| **GET** | `/api/service-requests` |

---

## 📂 وحدة: support
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/support/help/categories` |
| **GET** | `/api/support/help/articles` |
| **GET** | `/api/support/help/articles/:id` |
| **POST** | `/api/support/contact` |

---

## 📂 وحدة: testimonials
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/testimonials/featured` |
| **GET** | `/api/testimonials` |
| **POST** | `/api/testimonials` |

---

## 📂 وحدة: translations
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **POST** | `/api/translations/batch` |
| **GET** | `/api/translations` |

---

## 📂 وحدة: users
| طريقة الطلب (Method) | مسار الرابط (Endpoint) |
| :--- | :--- |
| **GET** | `/api/users/me` |
| **PUT** | `/api/users/me` |
| **PATCH** | `/api/users/me/theme` |
| **PATCH** | `/api/users/me/language` |
| **PUT** | `/api/users/me/password` |
| **DELETE** | `/api/users/me` |
| **PATCH** | `/api/users/me/cancel-deletion` |
| **GET** | `/api/users/me/deletion-status` |
| **GET** | `/api/users/:id` |
| **GET** | `/api/users` |

---

