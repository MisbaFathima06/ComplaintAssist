import { Router } from 'express';

// Define translations and supported languages directly
const translations: Record<string, any> = {
  en: {
    'hero.title': 'Your Voice, Your Safety',
    'hero.subtitle': 'Completely Anonymous',
    'hero.description': 'Report sensitive issues with zero-knowledge privacy. Your identity stays protected while your voice creates change.',
    'hero.submit_report': 'Submit Anonymous Report',
    'hero.track_status': 'Track Status',
    'zk.status': 'Zero-Knowledge Identity: Active',
    'zk.active': 'Zero-Knowledge Identity Active',
    'zk.generating': 'Generating Identity...',
    'features.anonymous.title': '100% Anonymous',
    'features.anonymous.description': 'Zero-knowledge proofs ensure your identity remains completely private while proving authenticity.',
    'features.encrypted.title': 'End-to-End Encrypted',
    'features.encrypted.description': 'Military-grade AES encryption ensures your complaints are secure from submission to resolution.',
    'features.blockchain.title': 'Blockchain Verified',
    'features.blockchain.description': 'Immutable proof of submission stored on blockchain prevents tampering and ensures transparency.',
    'impact.title': 'Real Impact Stories',
    'impact.quote': 'For the first time, I felt safe to speak.',
    'impact.story': 'I had faced something no one should ever go through. But fear of being blamed, judged, or exposed kept me silent. Then I found SpeakSecure. It let me report everything anonymously. No one knew who I was, but someone finally listened. The NGO team took action — and for once, I felt seen, heard, and protected.',
    'impact.attribution': '— Anonymous Survivor, India',
    'impact.outcome': 'Sexual assault case addressed • July 2025',
    'emergency': 'Emergency',
    'report.title': 'Submit Your Report',
    'report.description': 'Your identity remains completely anonymous. All data is encrypted before transmission.',
    'form.category': 'Complaint Category',
    'form.select_category': 'Select a category...',
    'categories.harassment': 'Workplace Harassment',
    'categories.abuse': 'Physical/Mental Abuse',
    'categories.discrimination': 'Discrimination',
    'categories.corruption': 'Corruption',
    'categories.safety': 'Public Safety',
    'categories.legal': 'Legal Issues',
    'categories.other': 'Other'
  },
  hi: {
    'hero.title': 'आपकी आवाज़, आपकी सुरक्षा',
    'hero.subtitle': 'पूर्णतः गुमनाम',
    'hero.description': 'शून्य-ज्ञान गोपनीयता के साथ संवेदनशील मुद्दों की रिपोर्ट करें। आपकी पहचान सुरक्षित रहती है जबकि आपकी आवाज़ बदलाव लाती है।',
    'hero.submit_report': 'गुमनाम रिपोर्ट सबमिट करें',
    'hero.track_status': 'स्थिति ट्रैक करें',
    'emergency': 'आपातकाल',
    'form.category': 'शिकायत श्रेणी',
    'categories.harassment': 'कार्यक्षेत्र उत्पीड़न',
    'categories.abuse': 'शारीरिक/मानसिक दुर्व्यवहार',
    'categories.discrimination': 'भेदभाव',
    'categories.corruption': 'भ्रष्टाचार',
    'categories.safety': 'सार्वजनिक सुरक्षा',
    'categories.legal': 'कानूनी मुद्दे',
    'categories.other': 'अन्य'
  },
  ta: {
    'hero.title': 'உங்கள் குரல், உங்கள் பாதுகாப்பு',
    'hero.subtitle': 'முற்றிலும் அநாமதேய',
    'hero.description': 'பூஜ்ய-அறிவு தனியுரிமையுடன் உணர்திறன் பிரச்சினைகளைப் புகாரளிக்கவும்.',
    'emergency': 'அவசரநிலை'
  },
  kn: {
    'hero.title': 'ನಿಮ್ಮ ಧ್ವನಿ, ನಿಮ್ಮ ಸುರಕ್ಷತೆ',
    'hero.subtitle': 'ಸಂಪೂರ್ಣವಾಗಿ ಅಜ್ಞಾತ',
    'emergency': 'ತುರ್ತುಸ್ಥಿತಿ'
  },
  ur: {
    'hero.title': 'آپ کی آواز، آپ کی حفاظت',
    'hero.subtitle': 'مکمل طور پر گمنام',
    'emergency': 'ہنگامی حالات'
  }
};

const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
];

const router = Router();

// Get translations for a specific language
router.get('/:language', async (req, res) => {
  try {
    const { language } = req.params;
    
    // Check if language is supported
    const supportedLanguageCodes = supportedLanguages.map(lang => lang.code);
    if (!supportedLanguageCodes.includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language',
        supportedLanguages: supportedLanguageCodes
      });
    }

    const languageTranslations = translations[language];
    
    if (!languageTranslations) {
      return res.status(404).json({
        success: false,
        error: 'Translations not found for language',
        language
      });
    }

    console.log(`🌐 Serving translations for language: ${language}`);

    res.json({
      success: true,
      language,
      translations: languageTranslations,
      meta: {
        totalKeys: Object.keys(languageTranslations).length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Failed to get translations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve translations'
    });
  }
});

// Get all supported languages
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      supportedLanguages,
      defaultLanguage: 'en',
      totalLanguages: supportedLanguages.length
    });

  } catch (error) {
    console.error('Failed to get supported languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve supported languages'
    });
  }
});

// Get specific translation key for a language
router.get('/:language/:key', async (req, res) => {
  try {
    const { language, key } = req.params;
    
    // Check if language is supported
    const supportedLanguageCodes = supportedLanguages.map(lang => lang.code);
    if (!supportedLanguageCodes.includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language'
      });
    }

    const languageTranslations = translations[language];
    if (!languageTranslations) {
      return res.status(404).json({
        success: false,
        error: 'Language not found'
      });
    }

    // Navigate nested keys (e.g., "hero.title")
    const keys = key.split('.');
    let value: any = languageTranslations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (value === undefined) {
      // Fallback to English
      let fallback: any = translations.en;
      for (const k of keys) {
        if (fallback && typeof fallback === 'object') {
          fallback = fallback[k];
        } else {
          fallback = undefined;
          break;
        }
      }

      if (fallback === undefined) {
        return res.status(404).json({
          success: false,
          error: 'Translation key not found',
          key
        });
      }

      res.json({
        success: true,
        language,
        key,
        value: fallback,
        fallback: true,
        message: 'Returned English fallback'
      });
    } else {
      res.json({
        success: true,
        language,
        key,
        value,
        fallback: false
      });
    }

  } catch (error) {
    console.error('Failed to get translation key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve translation'
    });
  }
});

// Set user language preference (for future features)
router.post('/preference', async (req, res) => {
  try {
    const { language, userId } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language is required'
      });
    }

    const supportedLanguageCodes = supportedLanguages.map(lang => lang.code);
    if (!supportedLanguageCodes.includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language'
      });
    }

    // In a real implementation, you would save this to user preferences
    // For now, just acknowledge the preference
    console.log(`👤 User language preference set: ${language}`);

    res.json({
      success: true,
      language,
      message: 'Language preference saved',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to set language preference:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save language preference'
    });
  }
});

// Get translation statistics
router.get('/stats/coverage', async (req, res) => {
  try {
    const stats = supportedLanguages.map(lang => {
      const langTranslations = translations[lang.code];
      const keyCount = langTranslations ? Object.keys(langTranslations).length : 0;
      const englishKeyCount = Object.keys(translations.en).length;
      const coverage = englishKeyCount > 0 ? (keyCount / englishKeyCount) * 100 : 0;

      return {
        language: lang.code,
        name: lang.name,
        flag: lang.flag,
        keyCount,
        coverage: Math.round(coverage * 100) / 100
      };
    });

    res.json({
      success: true,
      stats,
      totalLanguages: supportedLanguages.length,
      baseLanguage: 'en'
    });

  } catch (error) {
    console.error('Failed to get translation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve translation statistics'
    });
  }
});

export default router;
