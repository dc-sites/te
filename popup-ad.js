// popup-ad.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc, increment, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAUlaYW7amE3tl7klCZ0WbVUfmTgOn0NSM",
  authDomain: "pop-up-2545a.firebaseapp.com",
  projectId: "pop-up-2545a",
  storageBucket: "pop-up-2545a.firebasestorage.app",
  messagingSenderId: "77878116792",
  appId: "1:77878116792:web:25c2da56b15d023cddcf4d",
  measurementId: "G-XZS0186BCP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const container = document.getElementById('popup-ad-container');

// Check & Show Popup
async function showPopupAd() {
  try {
    const q = query(collection(db, "ads"), where("isActive", "==", true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;
    
    // Get active ads
    const activeAds = [];
    snapshot.forEach(doc => {
      activeAds.push({ id: doc.id, ...doc.data() });
    });
    
    // Filter out ads user has already seen
    const seenAds = JSON.parse(localStorage.getItem('seen_ads') || '[]');
    const unseenAds = activeAds.filter(ad => !seenAds.includes(ad.id));
    
    if (unseenAds.length === 0) return;
    
    // Pick random unseen ad
    const ad = unseenAds[Math.floor(Math.random() * unseenAds.length)];
    
    // Increment views
    await updateDoc(doc(db, "ads", ad.id), {
      views: increment(1)
    });
    
    // Render popup
    renderPopup(ad);
    
  } catch (error) {
    console.error("Error loading popup ad:", error);
  }
}

// Render Popup UI
function renderPopup(ad) {
  container.innerHTML = `
    <style>
      #popup-ad-container {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: 'Segoe UI', sans-serif;
      }
      .popup-box {
        background: #fff;
        border-radius: 16px;
        max-width: 90%;
        width: 380px;
        padding: 20px;
        position: relative;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: popupSlide 0.3s ease;
      }
      @keyframes popupSlide {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .popup-img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 12px;
        margin-bottom: 12px;
        background: #f5f5f5;
      }
      .popup-desc {
        font-size: 14px;
        color: #333;
        margin-bottom: 16px;
        line-height: 1.4;
      }
      .popup-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 15px;
        cursor: pointer;
        transition: transform 0.2s;
      }
      .popup-btn:active { transform: scale(0.98); }
      .info-icon {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 22px;
        height: 22px;
        background: #e0e0e0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: #555;
        cursor: pointer;
        user-select: none;
      }
      .info-icon:hover { background: #ccc; }
      .premium-tip {
        position: absolute;
        top: 40px;
        right: 0;
        background: #fff;
        padding: 10px 14px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        font-size: 13px;
        color: #444;
        white-space: nowrap;
        display: none;
        z-index: 10000;
      }
      .premium-tip.show { display: block; animation: fadeIn 0.2s; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .premium-tip a {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
      }
      @media (max-width: 480px) {
        .popup-box { width: 92%; padding: 16px; }
        .popup-img { height: 180px; }
        .popup-desc { font-size: 13px; }
      }
    </style>
    
    <div class="popup-box">
      <div class="info-icon" id="infoIcon">ⓘ</div>
      <div class="premium-tip" id="premiumTip">
        🎁 <a href="premium.html" target="_blank">Get Premium</a> to hide ads
      </div>
      <img src="${ad.imageUrl}" alt="Ad" class="popup-img" onerror="this.src='https://via.placeholder.com/380x200?text=Ad+Image'">
      <p class="popup-desc">${ad.description}</p>
      <button class="popup-btn" id="adBtn">${ad.buttonText}</button>
    </div>
  `;

  // Info icon tooltip
  const infoIcon = document.getElementById('infoIcon');
  const premiumTip = document.getElementById('premiumTip');
  
  infoIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    premiumTip.classList.toggle('show');
    setTimeout(() => premiumTip.classList.remove('show'), 3000);
  });

  // Close popup on button click only
  document.getElementById('adBtn').addEventListener('click', async () => {
    // Increment clicks
    await updateDoc(doc(db, "ads", ad.id), {
      clicks: increment(1)
    });
    
    // Mark as seen in localStorage
    const seenAds = JSON.parse(localStorage.getItem('seen_ads') || '[]');
    if (!seenAds.includes(ad.id)) {
      seenAds.push(ad.id);
      localStorage.setItem('seen_ads', JSON.stringify(seenAds));
    }
    
    // Remove popup
    container.innerHTML = '';
    
    // Open button URL if provided
    if (ad.buttonUrl && ad.buttonUrl.trim() !== '') {
      window.open(ad.buttonUrl, '_blank');
    }
  });

  // Prevent closing by clicking outside
  container.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Show popup after page loads
window.addEventListener('load', () => {
  setTimeout(showPopupAd, 1500); // Slight delay for better UX
});
