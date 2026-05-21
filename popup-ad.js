// popup-ad.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUlaYW7amE3tl7klCZ0WbVUfmTgOn0NSM",
  authDomain: "pop-up-2545a.firebaseapp.com",
  projectId: "pop-up-2545a",
  storageBucket: "pop-up-2545a.firebasestorage.app",
  messagingSenderId: "77878116792",
  appId: "1:77878116792:web:25c2da56b15d023cddcf4d",
  measurementId: "G-XZS0186BCP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const container = document.getElementById('popup-ad-container');

const style = document.createElement('style');
style.textContent = `
  .learny-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 99999; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
  .learny-popup-overlay.active { opacity: 1; pointer-events: auto; }
  .learny-popup-content { background: #ffffff; border-radius: 14px; padding: 20px; max-width: 380px; width: 92%; text-align: center; position: relative; box-shadow: 0 12px 30px rgba(0,0,0,0.25); }
  .learny-popup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .learny-ad-title { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .learny-info-btn { background: none; border: 1px solid #ddd; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #555; font-size: 13px; }
  .learny-ad-img { width: 100%; height: auto; border-radius: 10px; margin-bottom: 12px; max-height: 220px; object-fit: cover; }
  .learny-ad-desc { font-size: 14px; color: #444; margin-bottom: 16px; line-height: 1.5; }
  .learny-ad-btn { display: inline-block; background: #2563eb; color: #fff; padding: 11px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; transition: background 0.2s; width: 100%; box-sizing: border-box; }
  .learny-ad-btn:hover { background: #1d4ed8; }
  .learny-premium-tip { display: none; position: absolute; bottom: -48px; left: 50%; transform: translateX(-50%); background: #fff; border: 1px solid #e5e7eb; padding: 8px 12px; border-radius: 8px; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); white-space: nowrap; z-index: 10; color: #333; }
  .learny-premium-tip a { color: #2563eb; text-decoration: underline; font-weight: 600; }
  .learny-premium-tip button { background: none; border: none; cursor: pointer; margin-left: 6px; font-size: 14px; }
  @media (max-width: 480px) { .learny-popup-content { padding: 16px; } .learny-premium-tip { bottom: -65px; width: 85%; white-space: normal; text-align: center; } }
`;
document.head.appendChild(style);

async function initPopupAd() {
  if (!container) return;
  try {
    const q = query(collection(db, "popup_ads"), where("isActive", "==", true));
    const snap = await getDocs(q);
    let ads = [];
    snap.forEach(d => ads.push({ id: d.id, ...d.data() }));
    ads.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    let targetAd = null;
    for (const ad of ads) {
      const token = ad.resetToken || 'v1';
      const lsKey = `learny_popup_seen_${ad.id}_${token}`;
      if (!localStorage.getItem(lsKey)) { targetAd = ad; break; }
    }
    if (targetAd) renderAd(targetAd);
  } catch (err) { console.error("Popup Ad Fetch Error:", err); }
}

function renderAd(ad) {
  container.innerHTML = `
    <div class="learny-popup-overlay" id="learny-overlay">
      <div class="learny-popup-content">
        <div class="learny-popup-header">
          <span class="learny-ad-title">Sponsored</span>
          <button class="learny-info-btn" id="learny-info-btn" title="Premium Info">ⓘ</button>
        </div>
        <img src="${ad.imageUrl}" alt="Ad" class="learny-ad-img" onerror="this.style.display='none'">
        <p class="learny-ad-desc">${ad.description || ''}</p>
        <a href="${ad.buttonUrl}" target="_blank" class="learny-ad-btn" id="learny-action-btn">${ad.buttonText || 'Learn More'}</a>
        <div class="learny-premium-tip" id="learny-tooltip">
          <span>🌟 <a href="premium.html">Get Premium</a> to hide ads permanently</span>
          <button id="learny-close-tip">✖</button>
        </div>
      </div>
    </div>
  `;

  const overlay = document.getElementById('learny-overlay');
  const actionBtn = document.getElementById('learny-action-btn');
  const infoBtn = document.getElementById('learny-info-btn');
  const tooltip = document.getElementById('learny-tooltip');
  const closeTip = document.getElementById('learny-close-tip');

  // Show popup with animation
  setTimeout(() => overlay.classList.add('active'), 10);

  // Prevent skipping by clicking overlay
  overlay.addEventListener('click', (e) => { if (e.target === overlay) e.stopPropagation(); });

  // Info button tooltip
  infoBtn.addEventListener('click', (e) => { e.stopPropagation(); tooltip.style.display = 'block'; });
  closeTip.addEventListener('click', () => tooltip.style.display = 'none');

  // Action button click
  actionBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const token = ad.resetToken || 'v1';
    localStorage.setItem(`learny_popup_seen_${ad.id}_${token}`, 'true');

    try { await updateDoc(doc(db, "popup_ads", ad.id), { clicks: increment(1) }); } 
    catch (err) { console.warn("Click tracking failed", err); }

    window.open(ad.buttonUrl, '_blank');
    overlay.classList.remove('active');
    setTimeout(() => container.innerHTML = '', 300);
  });

  // Track view
  try { await updateDoc(doc(db, "popup_ads", ad.id), { views: increment(1) }); } 
  catch (err) { console.warn("View tracking failed", err); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPopupAd);
else initPopupAd();
