import React, { useState, useEffect, useRef } from 'react';
// Firebase Imports
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, serverTimestamp, query, orderBy, updateDoc } from "firebase/firestore";

// --- i18n (Internationalization) Setup ---
const translations = {
  en: {
    // General
    loading: "Loading...",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    confirmPasswordLabel: "Re-enter Password",
    passwordsNoMatch: "Passwords do not match.",
    // Navbar
    newRecording: "+ New Recording",
    dashboard: "Dashboard",
    logout: "Logout",
    login: "Login",
    signup: "Sign Up",
    findPoliceNav: "Find Stations",
    about: "About",
    // Welcome Page
    welcomeTitle: "Welcome to the AI FIR Assistant",
    welcomeDesc: "A tool to help you draft a First Information Report (FIR) by simply stating your complaint.",
    welcomeCTA: "Please log in or sign up to begin.",
    selectLang: "Select Language",
    // Login Page
    loginTitle: "Login",
    dontHaveAccount: "Don't have an account?",
    // Signup Page
    signupTitle: "Create an Account",
    passwordMin: "Password should be at least 6 characters long.",
    alreadyHaveAccount: "Already have an account?",
    // Recorder
    recordTitle: "Record Your Statement",
    recordDesc: "Click the button and state your complaint to begin.",
    recordDescListen: "Listening... Click the button again to stop.",
    btnRecord: "Record Statement",
    btnStop: "Stop Recording",
    btnProcessing: "Processing...",
    // Results
    firDraftTitle: "Generated FIR Draft",
    saveDraft: "Save Draft",
    saving: "Saving...",
    saved: "Saved successfully!",
    saveFailed: "Failed to save.",
    // Disclaimer
    disclaimerTitle: "Important Disclaimer",
    disclaimerBody: "This document is AI-generated and for drafting purposes ONLY. It is NOT legal advice. Review carefully and consult a legal professional.",
    // Dashboard
    dashboardTitle: "Your Saved Drafts",
    noDrafts: "You have no saved drafts.",
    backToDash: "← Back to Dashboard",
    newRecordingDash: "+ New Recording",
    findPolice: "Find Police Stations",
    editDraft: "Edit",
    printExport: "Print / Export",
    saveChanges: "Save Changes",
    updating: "Updating...",
    updated: "Updated!",
    // Police Locator
    locatorTitle: "Find Nearby Police Stations",
    locatorDesc: "Use your current location to find police stations near you.",
    locatorBtn: "Find Stations Near Me",
    gettingLocation: "Getting your location...",
    locationError: "Could not get location. Please enable location permissions in your browser.",
    // About Page
    aboutTitle: "About the AI FIR Assistant",
    aboutDesc1: "This application is a proof-of-concept tool designed to help citizens draft a First Information Report (FIR) using voice-to-text and Artificial Intelligence.",
    aboutDesc2: "The goal is to simplify the initial, often intimidating, step of documenting a complaint for legal purposes.",
    howItWorks: "How It Works",
    howStep1: "Record: State your complaint clearly in your chosen language.",
    howStep2: "Generate: The AI analyzes your statement and drafts a formal FIR.",
    howStep3: "Save & Edit: Save the draft to your private dashboard and edit it to ensure all details are accurate.",
    howStep4: "Export: Print the final draft or save it as a PDF to take to the police station.",
  },
  hi: {
    // General
    loading: "लोड हो रहा है...",
    emailLabel: "ईमेल पता",
    passwordLabel: "पासवर्ड",
    confirmPasswordLabel: "पासवर्ड फिर से दर्ज करें",
    passwordsNoMatch: "पासवर्ड मेल नहीं खाते।",
    // Navbar
    newRecording: "+ नई रिकॉर्डिंग",
    dashboard: "डैशबोर्ड",
    logout: "लॉग आउट",
    login: "लॉग इन करें",
    signup: "साइन अप करें",
    findPoliceNav: "स्टेशन खोजें",
    about: "बारे में",
    // Welcome Page
    welcomeTitle: "एआई एफआईआर सहायक में आपका स्वागत है",
    welcomeDesc: "केवल अपनी शिकायत बताकर प्रथम सूचना रिपोर्ट (एफआईआर) का मसौदा तैयार करने में आपकी मदद करने वाला एक उपकरण।",
    welcomeCTA: "शुरू करने के लिए कृपया लॉग इन या साइन अप करें।",
    selectLang: "भाषा चुनें",
    // Login Page
    loginTitle: "लॉग इन करें",
    dontHaveAccount: "खाता नहीं है?",
    // Signup Page
    signupTitle: "खाता बनाएं",
    passwordMin: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।",
    alreadyHaveAccount: "पहले से ही एक खाता है?",
    // Recorder
    recordTitle: "अपना बयान रिकॉर्ड करें",
    recordDesc: "बटन पर क्लिक करें और अपनी शिकायत दर्ज करना शुरू करें।",
    recordDescListen: "सुन रहा है... रोकने के लिए फिर से बटन पर क्लिक करें।",
    btnRecord: "बयान रिकॉर्ड करें",
    btnStop: "रिकॉर्डिंग रोकें",
    btnProcessing: "प्रोसेस हो रहा है...",
    // Results
    firDraftTitle: "उत्पन्न एफआईआर ड्राफ्ट",
    saveDraft: "ड्राफ्ट सहेजें",
    saving: "सहेज रहा है...",
    saved: "सफलतापूर्वक सहेजा गया!",
    saveFailed: "सहेजने में विफल।",
    // Disclaimer
    disclaimerTitle: "महत्वपूर्ण अस्वीकरण",
    disclaimerBody: "यह दस्तावेज़ एआई-जनरेटेड है और केवल मसौदा तैयार करने के उद्देश्यों के लिए है। यह कानूनी सलाह नहीं है। कृपया ध्यान से समीक्षा करें और किसी कानूनी पेशेवर से सलाह लें।",
    // Dashboard
    dashboardTitle: "आपके सहेजे गए ड्राफ्ट",
    noDrafts: "आपके पास कोई सहेजा हुआ ड्राफ्ट नहीं है।",
    backToDash: "← डैशबोर्ड पर वापस",
    newRecordingDash: "+ नई रिकॉर्डिंग",
    findPolice: "पुलिस स्टेशन खोजें",
    editDraft: "संपादित करें",
    printExport: "प्रिंट / निर्यात",
    saveChanges: "बदलाव सहेजें",
    updating: "अपडेट हो रहा है...",
    updated: "अपडेट किया गया!",
    // Police Locator
    locatorTitle: "आस-पास के पुलिस स्टेशन खोजें",
    locatorDesc: "अपने आस-पास के पुलिस स्टेशनों को खोजने के लिए अपने वर्तमान स्थान का उपयोग करें।",
    locatorBtn: "मेरे पास के स्टेशन खोजें",
    gettingLocation: "आपका स्थान प्राप्त हो रहा है...",
    locationError: "स्थान प्राप्त नहीं हो सका। कृपया अपने ब्राउज़र में स्थान की अनुमति सक्षम करें।",
    // About Page
    aboutTitle: "एआई एफआईआर सहायक के बारे में",
    aboutDesc1: "यह एप्लिकेशन एक प्रूफ-ऑफ-कॉन्सेप्ट टूल है जिसे नागरिकों को वॉयस-टू-टेक्स्ट और आर्टिफिशियल इंटेलिजेंस का उपयोग करके प्रथम सूचना रिपोर्ट (एफआईआर) का मसौदा तैयार करने में मदद करने के लिए डिज़ाइन किया गया है।",
    aboutDesc2: "इसका लक्ष्य कानूनी उद्देश्यों के लिए शिकायत दर्ज करने के प्रारंभिक, अक्सर डराने वाले, कदम को सरल बनाना है।",
    howItWorks: "यह कैसे काम करता है",
    howStep1: "रिकॉर्ड करें: अपनी चुनी हुई भाषा में अपनी शिकायत स्पष्ट रूप से बताएं।",
    howStep2: "उत्पन्न करें: एआई आपके बयान का विश्लेषण करता है और एक औपचारिक एफआईआर का मसौदा तैयार करता है।",
    howStep3: "सहेजें और संपादित करें: ड्राफ्ट को अपने निजी डैशबोर्ड में सहेजें और यह सुनिश्चित करने के लिए संपादित करें कि सभी विवरण सटीक हैं।",
    howStep4: "निर्यात करें: अंतिम ड्राफ्ट को प्रिंट करें या पुलिस स्टेशन ले जाने के लिए इसे पीडीएफ के रूप में सहेजें।",
  },
  mr: {
    // General
    loading: "लोड होत आहे...",
    emailLabel: "ईमेल पत्ता",
    passwordLabel: "पासवर्ड",
    confirmPasswordLabel: "पासवर्ड पुन्हा प्रविष्ट करा",
    passwordsNoMatch: "पासवर्ड जुळत नाहीत.",
    // Navbar
    newRecording: "+ नवीन रेकॉर्डिंग",
    dashboard: "डॅशबोर्ड",
    logout: "लॉग आउट",
    login: "लॉग इन करा",
    signup: "साइन अप करा",
    findPoliceNav: "स्टेशन शोधा",
    about: "बद्दल",
    // Welcome Page
    welcomeTitle: "एआय एफआयआर सहाय्यकामध्ये आपले स्वागत आहे",
    welcomeDesc: "तुमची तक्रार सांगून प्रथम माहिती अहवाल (एफआयआर) तयार करण्यात मदत करणारे एक साधन.",
    welcomeCTA: "सुरू करण्यासाठी कृपया लॉग इन करा किंवा साइन अप करा.",
    selectLang: "भाषा निवडा",
    // Login Page
    loginTitle: "लॉग इन करा",
    dontHaveAccount: "खाते नाही?",
    // Signup Page
    signupTitle: "खाते तयार करा",
    passwordMin: "पासवर्ड किमान 6 अक्षरांचा असावा.",
    alreadyHaveAccount: "आधीपासूनच खाते आहे?",
    // Recorder
    recordTitle: "तुमचे निवेदन रेकॉर्ड करा",
    recordDesc: "रेकॉर्डिंग सुरू करण्यासाठी बटणावर क्लिक करा.",
    recordDescListen: "ऐकत आहे... थांबवण्यासाठी पुन्हा बटणावर क्लिक करा.",
    btnRecord: "निवेदन रेकॉर्ड करा",
    btnStop: "रेकॉर्डिंग थांबवा",
    btnProcessing: "प्रक्रिया होत आहे...",
    // Results
    firDraftTitle: "तयार केलेला एफआयआर मसुदा",
    saveDraft: "मसुदा जतन करा",
    saving: "जतन करत आहे...",
    saved: "यशस्वीरित्या जतन केले!",
    saveFailed: "जतन करण्यात अयशस्वी.",
    // Disclaimer
    disclaimerTitle: "महत्त्वाची सूचना",
    disclaimerBody: "हा दस्तऐवज एआय-व्युत्पन्न आहे आणि केवळ मसुदा तयार करण्याच्या उद्देशाने आहे. हा कायदेशीर सल्ला नाही. कृपया काळजीपूर्वक पुनरावलोकन करा आणि कायदेशीर व्यावसायिकाचा सल्ला घ्या.",
    // Dashboard
    dashboardTitle: "तुमचे जतन केलेले मसुदे",
    noDrafts: "तुमचे कोणतेही जतन केलेले मसुदे नाहीत.",
    backToDash: "← डॅशबोर्डवर परत",
    newRecordingDash: "+ नवीन रेकॉर्डिंग",
    findPolice: "पोलीस स्टेशन शोधा",
    editDraft: "संपादित करा",
    printExport: "प्रिंट / निर्यात करा",
    saveChanges: "बदल जतन करा",
    updating: "अद्यतनित करत आहे...",
    updated: "अद्यतनित केले!",
    // Police Locator
    locatorTitle: "जवळपासची पोलीस स्टेशन शोधा",
    locatorDesc: "तुमच्या जवळची पोलीस स्टेशन शोधण्यासाठी तुमच्या वर्तमान स्थानाचा वापर करा.",
    locatorBtn: "माझ्या जवळची स्टेशन शोधा",
    gettingLocation: "तुमचे स्थान मिळवत आहे...",
    locationError: "स्थान मिळू शकले नाही. कृपया तुमच्या ब्राउझरमध्ये स्थान परवानगी सक्षम करा.",
    // About Page
    aboutTitle: "एआय एफआयआर सहाय्यकाबद्दल",
    aboutDesc1: "हा अनुप्रयोग नागरिकांना व्हॉइस-टू-टेक्स्ट आणि कृत्रिम बुद्धिमत्ता वापरून प्रथम माहिती अहवाल (एफआयआर) तयार करण्यात मदत करण्यासाठी डिझाइन केलेले एक प्रूफ-ऑफ-कॉन्सेप्ट साधन आहे.",
    aboutDesc2: "कायदेशीर हेतूंसाठी तक्रार नोंदवण्याच्या सुरुवातीच्या, अनेकदा भीतीदायक, पायरीला सोपे करणे हे याचे उद्दिष्ट आहे.",
    howItWorks: "हे कसे कार्य करते",
    howStep1: "रेकॉर्ड करा: तुमची तक्रार तुमच्या निवडलेल्या भाषेत स्पष्टपणे सांगा.",
    howStep2: "तयार करा: एआय तुमच्या निवेदनाचे विश्लेषण करते आणि एक औपचारिक एफआयआर तयार करते.",
    howStep3: "जतन करा आणि संपादित करा: मसुदा तुमच्या खाजगी डॅशबोर्डवर जतन करा आणि सर्व तपशील अचूक असल्याची खात्री करण्यासाठी संपादित करा.",
    howStep4: "निर्यात करा: अंतिम मसुदा प्रिंट करा किंवा पोलीस स्टेशनमध्ये नेण्यासाठी पीडीएफ म्हणून जतन करा.",
  }
};

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "fir-assistant-app-2c903.firebaseapp.com",
  projectId: "fir-assistant-app-2c903",
  storageBucket: "fir-assistant-app-2c903.appspot.com",
  messagingSenderId: "1067267781614",
  appId: "1:1067267781614:web:9214f285dd1da23f7454ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Helper & UI Components ---

const Spinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const LanguageSelector = ({ lang, setLang, className }) => (
  <select 
    value={lang} 
    onChange={(e) => setLang(e.target.value)}
    className={className}
  >
    <option value="en">English</option>
    <option value="hi">हिन्दी</option>
    <option value="mr">मराठी</option>
  </select>
);

const Header = ({ user, setPage, lang, setLang }) => {
  const t = translations[lang];
  return (
    <header className="bg-gray-900 text-white p-4 shadow-md print:hidden">
      <nav className="container mx-auto flex items-center justify-between">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => setPage(user ? 'home' : 'welcome')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 8v4l2 1"></path></svg>
          <h1 className="text-2xl font-bold">AI FIR Assistant</h1>
        </div>
        <div className="space-x-4 flex items-center">
          <LanguageSelector lang={lang} setLang={setLang} className="bg-gray-700 text-white p-1 rounded-md text-sm focus:outline-none" />
          {user ? (
            <>
              <button onClick={() => setPage('home')} className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition-colors">{t.newRecording}</button>
              <button onClick={() => setPage('dashboard')} className="hover:text-blue-300">{t.dashboard}</button>
              <button onClick={() => setPage('locator')} className="hover:text-blue-300">{t.findPoliceNav}</button>
              <button onClick={() => setPage('about')} className="hover:text-blue-300">{t.about}</button>
              <button onClick={() => signOut(auth)} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">{t.logout}</button>
            </>
          ) : (
            <>
              <button onClick={() => setPage('about')} className="hover:text-blue-300">{t.about}</button>
              <button onClick={() => setPage('login')} className="hover:text-blue-300">{t.login}</button>
              <button onClick={() => setPage('signup')} className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700">{t.signup}</button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

const Disclaimer = ({ lang }) => {
    const t = translations[lang];
    return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mt-6 rounded-r-lg shadow-sm print:hidden">
            <p className="font-bold mb-1">{t.disclaimerTitle}</p>
            <p className="text-sm">{t.disclaimerBody}</p>
        </div>
    );
};

const PasswordInput = ({ id, value, onChange, label }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="relative">
            <label className="block text-gray-700 mb-2" htmlFor={id}>{label}</label>
            <input
                type={showPassword ? "text" : "password"}
                id={id}
                value={value}
                onChange={onChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-600"
            >
                {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                )}
            </button>
        </div>
    );
};

// --- Page Components ---

const RecorderComponent = ({ user, lang }) => {
    const t = translations[lang];
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [firResult, setFirResult] = useState('');
    const [error, setError] = useState('');
    const [saveStatus, setSaveStatus] = useState('');

    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');

    const getSpeechRecognition = () => {
        if ('SpeechRecognition' in window) return new window.SpeechRecognition();
        if ('webkitSpeechRecognition' in window) return new window.webkitSpeechRecognition();
        return null;
    };

    const generateFir = async (text) => {
        if (!text) return;
        setIsProcessing(true);
        setError('');
        setSaveStatus('');

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const langName = lang === 'hi' ? 'Hindi' : (lang === 'mr' ? 'Marathi' : 'English');
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const prompt = `You are an expert AI assistant for drafting legal documents in India. Analyze the user's statement which is in ${langName} and generate a structured First Information Report (FIR) in ${langName}. After the FIR, suggest potential sections of the Indian Penal Code (IPC). User's Statement: "${text}"`;

        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const data = await response.json();
            const generatedText = data.candidates[0].content.parts[0].text;
            setFirResult(generatedText);
        } catch (err) {
            setError(`Failed to generate FIR: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const recognition = getSpeechRecognition();
        if (!recognition) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }
        
        recognition.continuous = true;
        recognition.interimResults = true;
        const langCode = lang === 'hi' ? 'hi-IN' : (lang === 'mr' ? 'mr-IN' : 'en-IN');
        recognition.lang = langCode;

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            }
            transcriptRef.current += finalTranscript;
        };
        
        recognition.onend = () => {
            setIsRecording(false);
            if (transcriptRef.current.trim()) {
                generateFir(transcriptRef.current.trim());
            }
        };
        
        recognition.onerror = (event) => {
            setError(`Speech recognition error: ${event.error}`);
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
    }, [lang]);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            transcriptRef.current = '';
            setFirResult('');
            setError('');
            setSaveStatus('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const handleSaveDraft = async () => {
        if (!firResult || !user) return;
        setSaveStatus(t.saving);
        try {
            const firId = `fir_${Date.now()}`;
            const firRef = doc(db, 'users', user.uid, 'firs', firId);
            await setDoc(firRef, {
                content: firResult,
                createdAt: serverTimestamp(),
                title: `Draft from ${new Date().toLocaleString()}`,
                lang: lang
            });
            setSaveStatus(t.saved);
        } catch (err) {
            setSaveStatus(t.saveFailed);
            console.error("Error saving document: ", err);
        }
    };

    return (
        <div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">{t.recordTitle}</h2>
                <p className="text-gray-600 mb-6">{isRecording ? t.recordDescListen : t.recordDesc}</p>
                <button
                    onClick={toggleRecording}
                    disabled={isProcessing}
                    className={`px-8 py-4 text-lg font-bold text-white rounded-full transition-all ${isRecording ? 'bg-red-600' : 'bg-blue-600'} ${isProcessing ? 'bg-gray-500' : ''}`}
                >
                    {isProcessing ? t.btnProcessing : (isRecording ? t.btnStop : t.btnRecord)}
                </button>
            </div>

            {isProcessing && <Spinner />}
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}

            {firResult && (
                <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.firDraftTitle}</h2>
                    <div className="relative">
                        <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap font-sans text-gray-700 max-h-[50vh] overflow-y-auto">{firResult}</pre>
                    </div>
                    <div className="mt-4 flex justify-end items-center space-x-4">
                        {saveStatus && <span className="text-gray-600">{saveStatus}</span>}
                        <button onClick={handleSaveDraft} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">{t.saveDraft}</button>
                    </div>
                    <Disclaimer lang={lang} />
                </div>
            )}
        </div>
    );
};

const WelcomePage = ({ lang, setLang }) => {
    const t = translations[lang];
    return (
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">{t.welcomeTitle}</h2>
            <p className="text-gray-700">{t.welcomeDesc}</p>
            <div className="my-8">
                <label className="block text-gray-700 mb-2 font-semibold">{t.selectLang}</label>
                <LanguageSelector lang={lang} setLang={setLang} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 mx-auto p-2.5" />
            </div>
            <p className="mt-4 text-gray-700">{t.welcomeCTA}</p>
        </div>
    );
};

const LoginPage = ({ setPage, lang }) => {
  const t = translations[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">{t.loginTitle}</h2>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-gray-700 mb-2" htmlFor="email">{t.emailLabel}</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
        </div>
        <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} label={t.passwordLabel} />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{t.login}</button>
      </form>
      <p className="text-center mt-4 text-sm">
        {t.dontHaveAccount} <button onClick={() => setPage('signup')} className="text-blue-600 hover:underline">{t.signup}</button>
      </p>
    </div>
  );
};

const SignupPage = ({ setPage, lang }) => {
    const t = translations[lang];
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError(t.passwordsNoMatch);
            return;
        }
        if (password.length < 6) {
            setError(t.passwordMin);
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">{t.signupTitle}</h2>
            <form onSubmit={handleSignup} className="space-y-6">
                <div>
                    <label className="block text-gray-700 mb-2" htmlFor="signup-email">{t.emailLabel}</label>
                    <input type="email" id="signup-email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <PasswordInput id="signup-password" value={password} onChange={(e) => setPassword(e.target.value)} label={t.passwordLabel} />
                <PasswordInput id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} label={t.confirmPasswordLabel} />
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{t.signup}</button>
            </form>
            <p className="text-center mt-4 text-sm">
                {t.alreadyHaveAccount} <button onClick={() => setPage('login')} className="text-blue-600 hover:underline">{t.login}</button>
            </p>
        </div>
    );
};

const DashboardPage = ({ user, setPage, lang }) => {
    const t = translations[lang];
    const [firs, setFirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFir, setSelectedFir] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [updateStatus, setUpdateStatus] = useState('');

    useEffect(() => {
        const fetchFirs = async () => {
            if (!user) return;
            try {
                const firsCollectionRef = collection(db, 'users', user.uid, 'firs');
                const q = query(firsCollectionRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const firsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFirs(firsList);
            } catch (err) {
                setError('Failed to fetch FIR drafts.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFirs();
    }, [user, updateStatus]);

    const handleSelectFir = (fir) => {
        setSelectedFir(fir);
        setEditText(fir.content);
        setIsEditing(false);
        setUpdateStatus('');
    };

    const handleSaveChanges = async () => {
        if (!selectedFir) return;
        setUpdateStatus(t.updating);
        const firRef = doc(db, 'users', user.uid, 'firs', selectedFir.id);
        try {
            await updateDoc(firRef, { content: editText });
            setUpdateStatus(t.updated);
            setSelectedFir(prev => ({ ...prev, content: editText }));
            setTimeout(() => {
                setIsEditing(false);
                setUpdateStatus('');
            }, 1500);
        } catch (err) {
            setUpdateStatus('Error updating.');
            console.error(err);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Spinner />;
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    if (selectedFir) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-lg" id="printable-area">
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <button onClick={() => setSelectedFir(null)} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">&larr; {t.backToDash}</button>
                    <div className="space-x-2">
                        <button onClick={() => setIsEditing(!isEditing)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">{t.editDraft}</button>
                        <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">{t.printExport}</button>
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">{selectedFir.title}</h2>
                {isEditing ? (
                    <div>
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full h-96 p-2 border rounded-md font-mono text-sm"
                        />
                        <div className="mt-4 flex justify-end items-center space-x-4">
                            {updateStatus && <span>{updateStatus}</span>}
                            <button onClick={handleSaveChanges} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">{t.saveChanges}</button>
                        </div>
                    </div>
                ) : (
                    <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap font-sans text-gray-700">{selectedFir.content}</pre>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t.dashboardTitle}</h2>
                <button onClick={() => setPage('locator')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">{t.findPolice}</button>
            </div>
            {firs.length === 0 ? (
                <p>{t.noDrafts}</p>
            ) : (
                <ul className="space-y-4">
                    {firs.map(fir => (
                        <li key={fir.id} className="p-4 border rounded-lg hover:bg-gray-100 transition-colors">
                            <div onClick={() => handleSelectFir(fir)} className="cursor-pointer">
                                <h3 className="font-semibold text-blue-700">{fir.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {fir.content.substring(0, 150)}...
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const PoliceLocatorPage = ({ lang }) => {
    const t = translations[lang];
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const mockStations = [
        { name: "Connaught Place Police Station", address: "Connaught Lane, New Delhi, Delhi 110001", distance: "1.2 km" },
        { name: "Parliament Street Police Station", address: "Parliament Street, New Delhi, Delhi 110001", distance: "2.5 km" },
        { name: "Mandir Marg Police Station", address: "Mandir Marg, New Delhi, Delhi 110001", distance: "3.1 km" },
        { name: "Chanakyapuri Police Station", address: "Teen Murti Marg, New Delhi, Delhi 110021", distance: "4.0 km" },
    ];

    const findStations = () => {
        setLoading(true);
        setError('');
        setStations([]);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setTimeout(() => {
                    setStations(mockStations);
                    setLoading(false);
                }, 1500);
            },
            () => {
                setError(t.locationError);
                setLoading(false);
            }
        );
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-2">{t.locatorTitle}</h2>
            <p className="text-gray-600 mb-6">{t.locatorDesc}</p>
            <div className="text-center">
                <button onClick={findStations} disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                    {loading ? t.gettingLocation : t.locatorBtn}
                </button>
            </div>
            
            {loading && <Spinner />}
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            
            {stations.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Nearby Stations:</h3>
                    <ul className="space-y-4">
                        {stations.map((station, index) => (
                            <li key={index} className="p-4 border rounded-lg">
                                <h4 className="font-bold text-lg">{station.name}</h4>
                                <p className="text-gray-700">{station.address}</p>
                                <p className="text-sm text-indigo-600 font-semibold mt-1">{station.distance} away</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const AboutPage = ({ lang }) => {
    const t = translations[lang];
    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">{t.aboutTitle}</h2>
            <p className="text-gray-700 mb-4">{t.aboutDesc1}</p>
            <p className="text-gray-700 mb-8">{t.aboutDesc2}</p>

            <h3 className="text-2xl font-bold mb-4 border-b pb-2">{t.howItWorks}</h3>
            <ul className="space-y-4 list-disc list-inside text-gray-700">
                <li><span className="font-semibold">{t.howStep1.split(':')[0]}:</span> {t.howStep1.split(':')[1]}</li>
                <li><span className="font-semibold">{t.howStep2.split(':')[0]}:</span> {t.howStep2.split(':')[1]}</li>
                <li><span className="font-semibold">{t.howStep3.split(':')[0]}:</span> {t.howStep3.split(':')[1]}</li>
                <li><span className="font-semibold">{t.howStep4.split(':')[0]}:</span> {t.howStep4.split(':')[1]}</li>
            </ul>

            <div className="mt-8">
                <Disclaimer lang={lang} />
            </div>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('welcome'); 
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        if (page === 'login' || page === 'signup' || page === 'welcome') {
          setPage('home');
        }
      } else {
        if (page !== 'login' && page !== 'signup') {
          setPage('welcome');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const renderPage = () => {
    if (loading) {
        return <Spinner />;
    }

    switch (page) {
      case 'login':
        return user ? <RecorderComponent user={user} lang={lang} /> : <LoginPage setPage={setPage} lang={lang} />;
      case 'signup':
        return user ? <RecorderComponent user={user} lang={lang} /> : <SignupPage setPage={setPage} lang={lang} />;
      case 'dashboard':
        return user ? <DashboardPage user={user} setPage={setPage} lang={lang} /> : <LoginPage setPage={setPage} lang={lang} />;
      case 'locator':
        return user ? <PoliceLocatorPage lang={lang} /> : <LoginPage setPage={setPage} lang={lang} />;
      case 'about':
        return <AboutPage lang={lang} />;
      case 'home':
        return user ? <RecorderComponent user={user} lang={lang} /> : <WelcomePage lang={lang} setLang={setLang} />;
      default: // 'welcome'
        return <WelcomePage lang={lang} setLang={setLang} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header user={user} setPage={setPage} lang={lang} setLang={setLang} />
      <main className="container mx-auto p-4 md:p-8">
        {renderPage()}
      </main>
      <footer className="text-center p-4 text-gray-500 text-xs print:hidden">
        <p>&copy; {new Date().getFullYear()} AI FIR Assistant. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
