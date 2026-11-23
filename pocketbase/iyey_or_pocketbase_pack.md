# אִיֵּי אוֹר (SDF) — חבילת PocketBase להפרדת מורה/תלמיד, רישום חינמי ואיים עונתיים (חנוכה ו-Christmas)

חבילה זו מעבירה את `sdf-flame-zeta.vercel.app` מ-`localStorage` מקומי אל **Backend אמיתי בקובץ אחד (PocketBase)** עם:

1. **הפרדת הרשאות קשיחה (תלמיד / מורה / הורה)** — תלמיד לא יכול להיכנס או לראות את "ניהול למורה".
2. **גישה חינמית ברישום בלבד (`plan = "free_registered"`)** — בונה רשימת משתמשים אמיתית (מורים, הורים ותלמידים) ומוכנה להפעלת מסלולי תשלום בהמשך.
3. **תשתית איים עונתיים (`seasonal_islands`)** — מוכנה מראש לקמפיין **חנוכה תשפ"ז** ולקמפיין **Christmas 2026**.

## ייבוא מהיר ל-PocketBase
1. פתח את לוח הניהול של PocketBase (`http://127.0.0.1:8090/_/`).
2. עבור אל **Settings → Import collections** וייבא את [`pb_schema.json`](pb_schema.json).
3. על קולקציית `users` הקיימת ודא שקיימים השדות:
   - `role` — Select (`student`, `teacher`, `parent`) — Required
   - `plan` — Select (`free_registered`, `pro`, `school`) — Default: `free_registered`
   - `grade` — Text
   - `class_code` — Text
   - `xp` — Number (Default: `0`)
   - `hp` — Number (Default: `100`)
   - `stars` — Number (Default: `0`)
   - `avatar_config` — JSON
4. קובץ הנתונים של 2 האיים העונתיים (`hanukkah-2026` ו-`christmas-2026`) נמצא ב-[`seasonal_islands_seed.json`](seasonal_islands_seed.json) ומשולב גם כ-Fallback אוטומטי באפליקציה.
