"""Deterministic multilingual scam-intent scoring with optional Gemini context.

Supported/optimized languages: English, Hindi, Bengali, Marathi, Telugu and Tamil.
The rules engine always runs, so live scoring does not depend on Gemini.
"""
import logging
import os
import re

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_SDK_AVAILABLE = True
except ImportError:  # pragma: no cover
    GEMINI_SDK_AVAILABLE = False

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
_configured = False
if GEMINI_SDK_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    _configured = True

_PROMPT_TEMPLATE = """You are a multilingual phone-fraud classifier.
Analyze the transcript in any language. Return ONLY one integer 0-100.
0 = clearly ordinary conversation; 100 = clearly a scam/fraud attempt.
Consider combinations of impersonation, urgency, OTP/PIN/password requests,
bank/UPI/payment requests, KYC/account blocking, threats, remote-access requests,
refund/parcel/lottery/job/loan scams, secrecy and requests to bypass verification.
Do not raise the score merely because the language is non-English.

Transcript:
{transcript}"""
_NUMBER_RE = re.compile(r"-?\d+")

# Patterns intentionally cover common Indian fraud vocabulary. Scores are
# additive and capped at 100; multiple categories make a call more suspicious.
_RULES = [
    # English
    (r"\botp\b|one[- ]time password|verification code|security code", 35, "OTP/verification-code request"),
    (r"\bpin\b|password|passcode|login code", 30, "credential request"),
    (r"transfer (the )?money|send (the )?money|wire (the )?money|wire transfer|make (a )?payment", 30, "money-transfer/payment request"),
    (r"bank account|account has been blocked|account is blocked|card has been blocked|account will be closed", 22, "bank/account pressure"),
    (r"urgent|immediately|right now|as soon as possible|within (\d+|an?) hour", 15, "artificial urgency"),
    (r"gift card|crypto|bitcoin|usdt|upi", 25, "high-risk payment method"),
    (r"routing number|account number|debit card|credit card|cvv", 20, "sensitive financial information"),
    (r"do not tell|keep this secret|don't tell anyone|confidential", 18, "secrecy request"),
    (r"police|arrest|legal action|lawsuit|fine|penalty|warrant", 15, "threat/intimidation"),
    (r"verify your identity|kyc|remote access|install.*app|screen share|anydesk|teamviewer", 18, "identity/access request"),
    (r"refund|cashback|prize|lottery|winner|parcel|customs|courier|job offer|loan approved", 16, "common fraud pretext"),

    # Hindi (Devanagari + common Hinglish)
    (r"ओटीपी|otp|वन[- ]टाइम पासवर्ड|वेरिफिकेशन कोड|सुरक्षा कोड|कोड बताइए|कोड बताओ", 35, "OTP/verification-code request"),
    (r"पासवर्ड|पिन|पासकोड|लॉगिन कोड", 30, "credential request"),
    (r"पैसे भेज|पैसा भेज|पैसे ट्रांसफर|पैसा ट्रांसफर|भुगतान करें|पेमेंट करें|upi", 30, "money-transfer/payment request"),
    (r"बैंक खाता|बैंक अकाउंट|खाता बंद|खाता ब्लॉक|अकाउंट बंद|अकाउंट ब्लॉक|केवाईसी|kyc", 22, "bank/account pressure"),
    (r"तुरंत|अभी|जल्दी|फौरन|इसी समय", 15, "artificial urgency"),
    (r"गिफ्ट कार्ड|क्रिप्टो|बिटकॉइन|इनाम|लॉटरी|कैशबैक|रिफंड|कूरियर|पार्सल|कस्टम", 20, "common fraud pretext"),
    (r"पुलिस|गिरफ्तार|कानूनी कार्रवाई|जुर्माना|वारंट", 15, "threat/intimidation"),
    (r"किसी को मत बताना|गुप्त|राज़|स्क्रीन शेयर|रिमोट एक्सेस|ऐप इंस्टॉल", 18, "secrecy/access request"),
    (r"aapka account|aapka bank|otp bata|paise bhej|abhi bhej|kyc update|account block", 22, "Hinglish fraud language"),

    # Bengali
    (r"ওটিপি|otp|ওয়ান[- ]টাইম পাসওয়ার্ড|ভেরিফিকেশন কোড|কোড বলুন", 35, "OTP/verification-code request"),
    (r"পাসওয়ার্ড|পিন|পাসকোড|লগইন কোড", 30, "credential request"),
    (r"টাকা পাঠান|টাকা পাঠাও|টাকা ট্রান্সফার|পেমেন্ট করুন|upi", 30, "money-transfer/payment request"),
    (r"ব্যাঙ্ক অ্যাকাউন্ট|ব্যাংক অ্যাকাউন্ট|অ্যাকাউন্ট বন্ধ|অ্যাকাউন্ট ব্লক|কেওয়াইসি|kyc", 22, "bank/account pressure"),
    (r"এখনই|তাড়াতাড়ি|জরুরি|অবিলম্বে", 15, "artificial urgency"),
    (r"পুলিশ|গ্রেফতার|জরিমানা|আইনি ব্যবস্থা|লটারি|পুরস্কার|রিফান্ড|পার্সেল|কাস্টমস", 18, "fraud pretext/threat"),
    (r"কাউকে বলবেন না|গোপন|স্ক্রিন শেয়ার|রিমোট অ্যাক্সেস|অ্যাপ ইনস্টল", 18, "secrecy/access request"),

    # Marathi
    (r"ओटीपी|otp|वन[- ]टाइम पासवर्ड|व्हेरिफिकेशन कोड|कोड सांगा", 35, "OTP/verification-code request"),
    (r"पासवर्ड|पिन|पासकोड|लॉगिन कोड", 30, "credential request"),
    (r"पैसे पाठवा|पैसे पाठव|पैसे ट्रान्सफर|पेमेंट करा|upi", 30, "money-transfer/payment request"),
    (r"बँक खाते|बँक अकाउंट|खाते बंद|खाते ब्लॉक|केवायसी|kyc", 22, "bank/account pressure"),
    (r"तातडीने|लगेच|आत्ताच|ताबडतोब|त्वरित", 15, "artificial urgency"),
    (r"पोलीस|अटक|दंड|कायदेशीर कारवाई|लॉटरी|बक्षीस|परतावा|पार्सल|कस्टम", 18, "fraud pretext/threat"),
    (r"कोणाला सांगू नका|गुप्त|स्क्रीन शेअर|रिमोट अॅक्सेस|अॅप इन्स्टॉल", 18, "secrecy/access request"),

    # Telugu
    (r"ఓటీపీ|otp|వన్[- ]టైమ్ పాస్‌వర్డ్|వెరిఫికేషన్ కోడ్|కోడ్ చెప్పండి", 35, "OTP/verification-code request"),
    (r"పాస్‌వర్డ్|పిన్|పాస్‌కోడ్|లాగిన్ కోడ్", 30, "credential request"),
    (r"డబ్బు పంపండి|డబ్బు పంపు|డబ్బు ట్రాన్స్‌ఫర్|చెల్లింపు చేయండి|upi", 30, "money-transfer/payment request"),
    (r"బ్యాంక్ ఖాతా|బ్యాంక్ అకౌంట్|ఖాతా బ్లాక్|ఖాతా మూసివేత|కేవైసీ|kyc", 22, "bank/account pressure"),
    (r"వెంటనే|తక్షణం|ఇప్పుడే|అత్యవసరం", 15, "artificial urgency"),
    (r"పోలీసులు|అరెస్ట్|జరిమానా|చట్టపరమైన చర్య|లాటరీ|బహుమతి|రిఫండ్|పార్సెల్|కస్టమ్స్", 18, "fraud pretext/threat"),
    (r"ఎవరికి చెప్పకండి|రహస్యం|స్క్రీన్ షేర్|రిమోట్ యాక్సెస్|యాప్ ఇన్‌స్టాల్", 18, "secrecy/access request"),

    # Tamil
    (r"ஓடிபி|otp|ஒரு முறை கடவுச்சொல்|சரிபார்ப்பு குறியீடு|குறியீட்டை சொல்லுங்கள்", 35, "OTP/verification-code request"),
    (r"கடவுச்சொல்|பின்|பாஸ்கோடு|உள்நுழைவு குறியீடு", 30, "credential request"),
    (r"பணம் அனுப்புங்கள்|பணம் அனுப்பு|பணம் மாற்றம்|பணம் டிரான்ஸ்ஃபர்|பணம் செலுத்துங்கள்|upi", 30, "money-transfer/payment request"),
    (r"வங்கி கணக்கு|வங்கி அக்கவுண்ட்|கணக்கு முடக்கம்|கணக்கு மூடப்படும்|கேஒய்சி|kyc", 22, "bank/account pressure"),
    (r"உடனடியாக|இப்போதே|அவசரம்|தாமதமின்றி", 15, "artificial urgency"),
    (r"போலீஸ்|கைது|அபராதம்|சட்ட நடவடிக்கை|லாட்டரி|பரிசு|ரீஃபண்ட்|பார்சல்|சுங்கம்", 18, "fraud pretext/threat"),
    (r"யாரிடமும் சொல்லாதீர்கள்|ரகசியம்|ஸ்கிரீன் ஷேர்|ரிமோட் அணுகல்|ஆப் நிறுவ", 18, "secrecy/access request"),
]


def _clamp(value: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, int(value)))


def _local_scam_score(transcript: str) -> tuple[int, list[str]]:
    text = (transcript or "").lower().strip()
    score = 0
    reasons: list[str] = []
    for pattern, points, reason in _RULES:
        if re.search(pattern, text, flags=re.IGNORECASE):
            score += points
            if reason not in reasons:
                reasons.append(reason)
    # Combination bonus: fraud usually involves several different signals.
    if len(reasons) >= 3:
        score += 10
    if len(reasons) >= 5:
        score += 10
    return _clamp(score), reasons


def get_scam_score(transcript: str) -> dict:
    text = (transcript or "").strip()
    if not text or text.startswith("["):
        return {"scam_score": 0, "source": "no_transcript", "reasons": [], "note": "no usable transcript"}

    local_score, reasons = _local_scam_score(text)
    gemini_score = None
    if _configured:
        try:
            model = genai.GenerativeModel(GEMINI_MODEL)
            response = model.generate_content(
                _PROMPT_TEMPLATE.format(transcript=text),
                generation_config={"temperature": 0, "max_output_tokens": 8},
            )
            match = _NUMBER_RE.search((response.text or "").strip())
            if match:
                gemini_score = _clamp(int(match.group()))
        except Exception as exc:
            logger.warning("Gemini scam scoring failed; keeping local score: %s", exc)

    final_score = local_score if gemini_score is None else _clamp(max(local_score, gemini_score))
    return {
        "scam_score": final_score,
        "source": "rules" if gemini_score is None else "rules+gemini",
        "local_score": local_score,
        "gemini_score": gemini_score,
        "reasons": reasons,
    }
