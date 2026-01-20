# 🎵 دليل إضافة الأصوات - WAV

## الملفات المطلوبة

ضع الملفات في: `android/app/src/main/res/raw/`

### الصيغة المدعومة:
- **WAV** ✅ (مفضل - جودة عالية)
- **MP3** ✅ (حجم أصغر)

### الملفات:

1. **game_music.wav** - موسيقى خلفية (30-60 ثانية)
2. **success.wav** - صوت النجاح (0.5-1 ثانية)
3. **error.wav** - صوت الخطأ (0.5-1 ثانية)
4. **combo.wav** - صوت Combo (0.5-1 ثانية)
5. **victory.wav** - صوت الفوز (2-3 ثوانٍ)
6. **warning.wav** - صوت التحذير (0.5 ثانية)

## مصادر مجانية:

### موسيقى خلفية:
- **Mixkit**: https://mixkit.co/free-sound-effects/game/
  - ابحث عن: "happy game music" أو "kids music"
  
### أصوات التأثيرات:
- **FreeSound**: https://freesound.org/
  - Success: ابحث عن "ding" أو "chime"
  - Error: ابحث عن "buzz" أو "wrong"
  - Combo: ابحث عن "power up"
  - Victory: ابحث عن "fanfare" أو "win"
  - Warning: ابحث عن "beep"

- **Zapsplat**: https://www.zapsplat.com/
  - قسم: Game Sound Effects

## خطوات التحميل:

### 1. تحميل الأصوات
```
1. اذهب إلى Mixkit أو FreeSound
2. ابحث عن الصوت المناسب
3. حمّل بصيغة WAV (أو MP3)
```

### 2. تحويل MP3 إلى WAV (إذا لزم الأمر)
استخدم: https://online-audio-converter.com/
- اختر WAV
- Quality: 16-bit, 44100 Hz

### 3. إعادة تسمية الملفات
يجب أن تكون الأسماء:
- `game_music.wav`
- `success.wav`
- `error.wav`
- `combo.wav`
- `victory.wav`
- `warning.wav`

**مهم**: أحرف صغيرة فقط، بدون مسافات!

### 4. نسخ الملفات
```bash
# انسخ الملفات إلى:
E:\jjj\mobile\android\app\src\main\res\raw\
```

### 5. إعادة البناء
```bash
cd E:\jjj\mobile
npm run android
```

## ملاحظات:

- **الحجم**: حاول أن تكون الملفات أقل من 500KB
- **الجودة**: 16-bit, 44100 Hz كافية
- **الطول**: 
  - موسيقى خلفية: 30-60 ثانية
  - تأثيرات: 0.5-3 ثوانٍ

## أمثلة موصى بها:

### من Mixkit (مجاني 100%):
1. **موسيقى خلفية**: "Happy Kids" أو "Playful Melody"
2. **Success**: "Game Bonus" أو "Positive Notification"
3. **Error**: "Error Alert" أو "Negative Beep"
4. **Combo**: "Power Up" أو "Level Up"
5. **Victory**: "Win Fanfare" أو "Success Jingle"
6. **Warning**: "Alert Beep" أو "Notification"

---

**بعد إضافة الملفات**: الأصوات ستعمل تلقائياً! 🎵✨
