// popup-ad.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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
    const adsSnapshot = await getDocs(collection(db, 'ads'));
    const activeAds = [];
    
    adsSnapshot.forEach(docSnap => {
      const ad = { id: docSnap.id, ...docSnap.data() };
      // Only include non-paused ads
      if (!ad.paused) activeAds.push(ad);
    });

    if (activeAds.length === 0) return;

    // Pick the first active ad (or randomize if preferred)
    const ad = activeAds[0];
    const storageKey = `popup_ad_clicked_${ad.id}`;
    
    // Skip if user already clicked this ad
    if (localStorage.getItem(storageKey) === 'true') return;

    // Track view
    await updateDoc(doc(db, 'ads', ad.id), {
      views: increment(1)
    });

    // Create Popup HTML
    container.innerHTML = `
      <div id="popup-overlay" style="
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div id="popup-card" style="
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          max-width: 90%;
          width: 380px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          position: relative;
        ">
          <!-- Info Icon -->
          <div id="info-icon" style="
            position: absolute;
            top: 12px; right: 12px;
            width: 22px; height: 22px;
            background: #e0e0e0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #555;
            cursor: pointer;
            font-weight: bold;
          ">i</div>
          
          <!-- Ad Image -->
          <img src="${ad.imageUrl}" alt="Ad" style="
            width: 100%;
            max-height: 200px;
            object-fit: cover;
            border-radius: 12px;
            margin-bottom: 14px;
          ">
          
          <!-- Description -->
          <p style="
            margin: 0 0 16px;
            color: #333;
            font-size: 15px;
            line-height: 1.4;
          ">${ad.description}</p>
          
          <!-- Action Button -->
          <a href="${ad.buttonUrl}" id="ad-button" style="
            display: inline-block;
            background: #007bff;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 15px;
            width: 100%;
            box-sizing: border-box;
          ">${ad.buttonText}</a>
          
          <!-- Premium Hint (hidden by default) -->
          <div id="premium-hint" style="
            display: none;
            margin-top: 12px;
            font-size: 13px;
            color: #666;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 8px;
          ">✨ Get <strong>Premium</strong> to hide all ads forever!<br><a href="premium.html" style="color:#007bff;text-decoration:none;">Upgrade now →</a></div>
        </div>
      </div>
    `;

    // Info Icon Click → Show Premium Hint
    document.getElementById('info-icon').addEventListener('click', (e) => {
      e.stopPropagation();
      const hint = document.getElementById('premium-hint');
      hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
    });

    // Button Click → Track & Close
    document.getElementById('ad-button').addEventListener('click', async () => {
      // Track click
      await updateDoc(doc(db, 'ads', ad.id), {
        clicks: increment(1)
      });
      // Mark as seen for this user
      localStorage.setItem(storageKey, 'true');
      // Remove popup after slight delay for tracking
      setTimeout(() => {
        container.innerHTML = '';
      }, 300);
    });

    // Prevent closing by clicking overlay (no skip allowed)
    document.getElementById('popup-overlay').addEventListener('click', (e) => {
      e.stopPropagation();
    });

  } catch (error) {
    console.error('Popup Ad Error:', error);
  }
}

// Show popup after page loads
window.addEventListener('load', () => {
  setTimeout(showPopupAd, 1500); // Slight delay for better UX
});
