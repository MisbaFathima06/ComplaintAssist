export interface Translation {
  [key: string]: string | Translation;
}

export const translations: Record<string, Translation> = {
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
    'categories.other': 'Other',
    'form.tags': 'Tags (helps categorize your complaint)',
    'form.complaint': 'Describe your complaint',
    'form.voice_record': 'Voice Record',
    'form.recording': 'Recording...',
    'form.attachments': 'Attachments (Optional)',
    'form.upload_files': 'Upload Files',
    'form.file_limit': 'Max 10MB per file. Images, audio, PDFs supported.',
    'form.make_public': 'Make this complaint public',
    'form.include_location': 'Include my location',
    'form.emergency': 'This is an emergency',
    'form.priority': 'Priority Level',
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',
    'form.emergency_contact': 'Emergency Contact Number',
    'form.submit_secure': 'Submit Securely',
    'form.encryption_notice': '🔒 Your complaint will be encrypted before transmission',
    'status.title': 'Track Your Complaint Status',
    'status.description': 'Enter your complaint reference ID to check the current status and any updates',
    'status.reference_id': 'Complaint Reference ID',
    'status.check_status': 'Check Status',
    'status.received_id': 'You received this ID when you submitted your complaint',
    'status.progress': 'Complaint Progress',
    'status.details': 'Complaint Details',
    'status.category': 'Category:',
    'status.status': 'Status:',
    'status.priority': 'Priority:',
    'status.upvotes': 'Upvotes:',
    'status.verification': 'Verification Info',
    'status.submitted': 'Submitted:',
    'status.updated': 'Last Updated:',
    'status.blockchain': 'Blockchain Hash:',
    'status.verified': 'Cryptographically Verified',
    'status.copy_id': 'Copy Reference ID',
    'status.download_report': 'Download Report',
    'status.view_blockchain': 'View on Blockchain',
    'status.not_found': 'Complaint not found. Please check your reference ID and try again.',
    'status.pending': 'Pending',
    'status.review': 'Under Review',
    'status.progress': 'In Progress',
    'status.resolved': 'Resolved',
    'community.title': 'Community Complaints',
    'community.description': 'Public complaints where users chose to share anonymously to help others',
    'community.filter_category': 'Filter by Category',
    'community.all_categories': 'All Categories',
    'community.filter_status': 'Filter by Status',
    'community.all_statuses': 'All Statuses',
    'community.sort_by': 'Sort By',
    'community.most_recent': 'Most Recent',
    'community.most_upvoted': 'Most Upvoted',
    'community.highest_priority': 'Highest Priority',
    'community.search': 'Search',
    'community.public_protected': 'Public complaint • Identity protected',
    'community.load_more': 'Load More Complaints',
    'success.title': 'Complaint Submitted Successfully!',
    'success.description': 'Your complaint has been encrypted, stored securely, and logged to the blockchain.',
    'success.reference_id': 'Reference ID:',
    'success.copy_id': 'Copy Reference ID',
    'success.encrypted': 'Encrypted',
    'success.ipfs_stored': 'IPFS Stored',
    'success.blockchain_logged': 'Blockchain Logged',
    'success.track_status': 'Track Status',
    'success.submit_another': 'Submit Another',
    'emergency.title': 'Emergency Alert',
    'emergency.description': 'Are you in immediate danger and need help? This will send an encrypted alert to your emergency contact.',
    'emergency.share_location': 'Share my location',
    'emergency.help_responders': 'Help responders find you quickly',
    'emergency.contact_number': 'Emergency Contact Number *',
    'emergency.description_optional': 'Brief Description (Optional)',
    'emergency.cancel': 'Cancel',
    'emergency.send_alert': 'Send Alert',
    'emergency.encrypted_notice': '🔒 All emergency data is encrypted and stored securely'
  },
  hi: {
    'hero.title': 'आपकी आवाज़, आपकी सुरक्षा',
    'hero.subtitle': 'पूर्णतः गुमनाम',
    'hero.description': 'शून्य-ज्ञान गोपनीयता के साथ संवेदनशील मुद्दों की रिपोर्ट करें। आपकी पहचान सुरक्षित रहती है जबकि आपकी आवाज़ बदलाव लाती है।',
    'hero.submit_report': 'गुमनाम रिपोर्ट सबमिट करें',
    'hero.track_status': 'स्थिति ट्रैक करें',
    'zk.status': 'शून्य-ज्ञान पहचान: सक्रिय',
    'zk.active': 'शून्य-ज्ञान पहचान सक्रिय',
    'zk.generating': 'पहचान जेनरेट हो रही है...',
    'features.anonymous.title': '100% गुमनाम',
    'features.anonymous.description': 'शून्य-ज्ञान प्रमाण सुनिश्चित करते हैं कि आपकी पहचान पूर्णतः निजी रहे जबकि प्रामाणिकता सिद्ध हो।',
    'features.encrypted.title': 'एंड-टू-एंड एन्क्रिप्टेड',
    'features.encrypted.description': 'सैन्य-ग्रेड AES एन्क्रिप्शन सुनिश्चित करता है कि आपकी शिकायतें सबमिशन से समाधान तक सुरक्षित रहें।',
    'features.blockchain.title': 'ब्लॉकचेन सत्यापित',
    'features.blockchain.description': 'ब्लॉकचेन पर संग्रहीत अपरिवर्तनीय सबमिशन प्रमाण छेड़छाड़ को रोकता है और पारदर्शिता सुनिश्चित करता है।',
    'impact.title': 'वास्तविक प्रभाव कहानियां',
    'emergency': 'आपातकाल',
    'report.title': 'अपनी रिपोर्ट सबमिट करें',
    'report.description': 'आपकी पहचान पूर्णतः गुमनाम रहती है। सभी डेटा ट्रांसमिशन से पहले एन्क्रिप्ट किया जाता है।',
    'form.category': 'शिकायत श्रेणी',
    'form.select_category': 'एक श्रेणी चुनें...',
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
    'hero.description': 'பூஜ்ய-அறிவு தனியுரிமையுடன் உணர்திறன் பிரச்சினைகளைப் புகாரளிக்கவும். உங்கள் அடையாளம் பாதுகாக்கப்படும் போது உங்கள் குரல் மாற்றத்தை உருவாக்குகிறது।',
    'emergency': 'அவசரநிலை'
  },
  kn: {
    'hero.title': 'ನಿಮ್ಮ ಧ್ವನಿ, ನಿಮ್ಮ ಸುರಕ್ಷತೆ',
    'hero.subtitle': 'ಸಂಪೂರ್ಣವಾಗಿ ಅಜ್ಞಾತ',
    'hero.description': 'ಶೂನ್ಯ-ಜ್ಞಾನ ಗೌಪ್ಯತೆಯೊಂದಿಗೆ ಸೂಕ್ಷ್ಮ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ. ನಿಮ್ಮ ಗುರುತು ಸುರಕ್ಷಿತವಾಗಿರುತ್ತದೆ ಆದರೆ ನಿಮ್ಮ ಧ್ವನಿ ಬದಲಾವಣೆಯನ್ನು ಸೃಷ್ಟಿಸುತ್ತದೆ।',
    'emergency': 'ತುರ್ತುಸ್ಥಿತಿ'
  },
  ur: {
    'hero.title': 'آپ کی آواز، آپ کی حفاظت',
    'hero.subtitle': 'مکمل طور پر گمنام',
    'hero.description': 'صفر-علم رازداری کے ساتھ حساس مسائل کی رپورٹ کریں۔ آپ کی شناخت محفوظ رہتی ہے جبکہ آپ کی آواز تبدیلی لاتی ہے۔',
    'emergency': 'ہنگامی حالات'
  }
};

export function useTranslations() {
  const currentLanguage = localStorage.getItem('speaksecure-language') || 'en';
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        break;
      }
    }
    
    // Fallback to English if translation not found
    if (typeof value !== 'string') {
      let fallback: any = translations.en;
      for (const k of keys) {
        if (fallback && typeof fallback === 'object') {
          fallback = fallback[k];
        } else {
          break;
        }
      }
      return typeof fallback === 'string' ? fallback : key;
    }
    
    return value;
  };

  return { t, currentLanguage };
}

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
];
