

# اسلامیات - مکمل انٹیگریشن پلان
## Islamic Studies Complete Integration Plan

---

## 📋 موجودہ صورتحال (Current Status)

### ڈیٹابیس میں موجود ہے:
- **Subject:** Islamic Studies (ID: `0e09f3fb-188f-4d7b-9347-cc40f2e5be62`)
- **Units:** 11 ابواب (chapters)
- **Topics:** 82 موضوعات
- **Key Notes:** 83 (لیکن بہت سے نامکمل یا غلط فارمیٹ میں)
- **Quizzes:** صرف 9 (20 سوالات کے ساتھ)
- **MCQs Needed:** 2000+ (ابھی صرف 28)

### فونٹس (درست طریقے سے کنفیگر):
- **اردو:** Jameel Noori Nastaleeq (CSS میں شامل)
- **عربی:** Al Qalam Quran Majeed (CSS میں شامل)

---

## 🎯 مطلوبہ کام (Required Work)

### 1. Key Notes - مکمل نوٹس (Urdu میں)

**باب اول تا نہم سے نوٹس:**
تمام 10 ابواب کے لیے تفصیلی نوٹس اردو میں بنانے ہیں جن میں:
- تعریفات
- اہمیت
- قرآنی حوالے
- احادیث

**تیس احادیث مبارکہ کے نوٹس:**
PDF سے ہر حدیث کے لیے:
- عربی متن (Al Qalam Quran Majeed فونٹ)
- اردو ترجمہ (Jameel Noori Nastaleeq فونٹ)
- حدیث کی تشریح
- سبق/عملی فائدہ

---

### 2. MCQs - 2000+ سوالات

#### تقسیم (Distribution):

```text
باب                          | آسان | درمیانہ | مشکل | کل
---------------------------------------------------------
باب اول: توحید               | 80   | 60     | 40   | 180
باب دوم: تاریخی واقعات       | 80   | 60     | 40   | 180
باب سوم: موت اور آخرت        | 80   | 60     | 40   | 180
باب چہارم: توحید و شرک       | 80   | 60     | 40   | 180
باب پنجم: رسالت              | 80   | 60     | 40   | 180
باب ششم: قرآن مجید           | 80   | 60     | 40   | 180
باب ہفتم: حدیث               | 80   | 60     | 40   | 180
باب ہشتم: اخلاقیات           | 80   | 60     | 40   | 180
باب نہم: عبادات              | 80   | 60     | 40   | 180
باب دہم: تیس احادیث          | 120  | 80     | 60   | 260
---------------------------------------------------------
کل                          | 840  | 620    | 420  | 2000+
```

---

### 3. Subjective Questions

ہر باب کے لیے:
- **مختصر سوالات:** 10-15 (2-4 سطور کے جوابات)
- **تفصیلی سوالات:** 5-8 (5-10 سطور کے جوابات)

---

### 4. Edge Functions Updates

#### Competition Questions Generator:
Islamic Studies کے لیے:
- اردو میں سوالات
- عربی متن کے ساتھ
- قرآنی آیات اور احادیث سے سوالات

#### Subjective Questions Generator:
- اردو میں سوالات اور جوابات
- مناسب فونٹ اسٹائلنگ

---

### 5. AI Tutor System Prompt

Islamic Studies کے لیے:
- اردو میں جوابات
- قرآن و حدیث کے حوالے
- اخلاقی سبق کی وضاحت

---

## 🛠️ تکنیکی تفصیلات (Technical Implementation)

### Phase 1: Database Cleanup & Structure

**Step 1.1:** Duplicate subject ہٹانا
```sql
-- Remove duplicate Islamic Studies subject
DELETE FROM subjects WHERE id = 'a1b2c3d4-e5f6-4789-0abc-def012345678';
```

**Step 1.2:** Topics کی تصحیح - ہر باب میں 5-6 صحیح topics

---

### Phase 2: Key Notes Data (Urdu)

**30 احادیث کے نوٹس (صحیح فارمیٹ):**

```markdown
### **حدیث نمبر 1: امانت**

<div class="font-arabic text-2xl leading-loose text-right" dir="rtl">
أَدِّ الْأَمَانَةَ إِلَى مَنِ ائْتَمَنَكَ وَلَا تَخُنْ مَنْ خَانَكَ
</div>

<div class="font-urdu text-lg text-right mt-4" dir="rtl">
**اردو ترجمہ:**
جو شخص تم پر امانت رکھے اس کی امانت ادا کرو، اور جو تمہارے ساتھ خیانت کرے اس کے ساتھ خیانت نہ کرو۔
</div>

<div class="font-urdu text-base text-right mt-4" dir="rtl">
**تشریح:**
یہ حدیث مبارکہ ہمیں امانت کی اہمیت سکھاتی ہے۔ امانت میں مال، راز، اور ذمہ داریاں سب شامل ہیں۔ مسلمان کو ہمیشہ امانت دار ہونا چاہیے۔
</div>
```

---

### Phase 3: MCQs Creation (2000+)

**سوال کا فارمیٹ:**

```json
{
  "question_text": "توحید کی کتنی اقسام ہیں؟",
  "option_a": "دو",
  "option_b": "تین",
  "option_c": "چار",
  "option_d": "پانچ",
  "correct_option": "B",
  "explanation": "توحید کی تین اقسام ہیں: توحید ربوبیت، توحید الوہیت، اور توحید اسماء و صفات۔",
  "difficulty": "easy"
}
```

**موضوعات کے لحاظ سے سوالات:**

**توحید:**
- توحید کی تعریف
- توحید کی اقسام
- شرک کی اقسام
- توحید کے فوائد

**احادیث:**
- ہر حدیث کا عربی متن
- ترجمے سے متعلق سوالات
- راوی کون ہیں؟
- سبق کیا ہے؟

---

### Phase 4: Edge Functions Update

**generate-competition-questions/index.ts:**

```typescript
// Islamic Studies specific handling
if (topic.includes('اسلامیات') || topic.includes('Islamic')) {
  systemPrompt = `آپ اسلامیات کے ماہر ہیں۔ سوالات اردو میں بنائیں۔
  
  - سوال اردو میں ہو
  - آپشنز اردو میں ہوں
  - وضاحت اردو میں ہو
  - قرآن و حدیث کے حوالے شامل کریں`;
}
```

---

### Phase 5: Frontend RTL Support

**Key Notes Display میں:**

```tsx
// Check if Islamic Studies for RTL
const isUrdu = subjectName.toLowerCase().includes('islamic');

<div 
  className={isUrdu ? "font-urdu text-right" : ""} 
  dir={isUrdu ? "rtl" : "ltr"}
>
  <ReactMarkdown>{content}</ReactMarkdown>
</div>
```

---

## 📁 فائلوں میں تبدیلیاں

### نئی فائلیں:
1. `supabase/functions/generate-islamic-questions/index.ts` (اسلامیات کے لیے مخصوص)

### ترمیم شدہ فائلیں:
1. `supabase/functions/generate-competition-questions/index.ts`
2. `supabase/functions/generate-subjective-questions/index.ts`
3. `supabase/functions/ai-tutor/index.ts`
4. `src/pages/Preparation.tsx` (RTL support)
5. `src/components/objective/ObjectiveQuiz.tsx` (Urdu font)

### ڈیٹابیس:
- Duplicate subjects کی صفائی
- 50+ key notes (اردو میں)
- 2000+ MCQs تمام ابواب کے لیے
- Subjective questions

---

## ⏱️ عمل درآمد کا طریقہ

### مرحلہ 1: فوری اقدامات
1. Duplicate subject حذف کرنا
2. Topics کی تصحیح
3. فونٹ کی تصدیق

### مرحلہ 2: Key Notes
- 30 احادیث کے مکمل نوٹس
- ہر باب کے 3-5 نوٹس

### مرحلہ 3: MCQs
- ہر topic کے لیے 20-30 سوالات
- آسان، درمیانہ، مشکل

### مرحلہ 4: Edge Functions
- Competition questions میں اردو support
- Subjective میں اردو support
- AI Tutor میں اردو/اسلامیات support

### مرحلہ 5: Testing
- Objective Paper ٹیسٹ
- Subjective Paper ٹیسٹ
- Competition ٹیسٹ

---

## ✅ نتیجہ

اس پلان کی تکمیل کے بعد:

- **2000+ MCQs** اردو میں تمام ابواب کے لیے
- **50+ Key Notes** صحیح فارمیٹ میں
- **Subjective Questions** ہر باب کے لیے
- **Competition System** اسلامیات کی سپورٹ
- **AI Tutor** اردو میں جوابات
- **صحیح فونٹس** عربی اور اردو کے لیے

