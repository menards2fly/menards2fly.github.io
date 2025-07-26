import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://jbekjmsruiadbhaydlbt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbG0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0ODM5NDY1OCwiZXhwIjoyMDYzOTcwNjU4fQ.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY'
);

console.log('🚀✨ Orbit Script initializing...');

const IMGBB_API_KEY = '9ed3a8bc6c24534ec10db8afcfa1c24d';
const ORBIT_PFP_URL = '/uploads/images/starbot.png';
const chatBox = document.getElementById('chat');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const imageInput = document.getElementById('imageInput');
const toolsBtn = document.getElementById('toolsBtn');
const toolsMenu = document.getElementById('toolsMenu');
const generateTool = document.getElementById('generateTool');
const usageIndicator = document.getElementById('usageIndicator');

let conversationMemory = [];
let userHasSentMessage = false;
let adminStatus = null; // cache admin status to avoid repeated checks
let isProcessing = false; // to prevent spamming API

// ===== Usage limits =====
const CHAT_LIMIT_GUEST = 10;
const CHAT_LIMIT_USER = 200; // 10 + 190 bonus after login
const IMG_GEN_LIMIT_GUEST = 1; // guests only get 1 image generation per day
const IMG_GEN_LIMIT_USER = 3;  // logged-in users get 3

// Storage keys
const STORAGE_KEY = 'orbit_usage_limits';

// ===== Usage Storage and Management =====

function getUsage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { chatCount: 0, imgGenCount: 0, lastResetDate: null };
  try {
    return JSON.parse(raw) || { chatCount: 0, imgGenCount: 0, lastResetDate: null };
  } catch {
    return { chatCount: 0, imgGenCount: 0, lastResetDate: null };
  }
}

function saveUsage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetUsage() {
  const today = new Date().toISOString().slice(0, 10);
  const initial = {
    chatCount: 0,
    imgGenCount: 0,
    lastResetDate: today,
  };
  saveUsage(initial);
  console.log('🔄 Usage reset for new day:', today);
  updateUsageIndicator();
}

// === Admin check once and cache it ===
function checkAdminStatus() {
  if (adminStatus !== null) return adminStatus; // return cached if checked

  try {
    const val = localStorage.getItem('isAdmin');
    if (!val) {
      console.log('🛸 Admin check: NO, no admin data found');
      adminStatus = { isAdmin: false, isSuperAdmin: false };
      return adminStatus;
    }
    const adminData = JSON.parse(val);
    const isSuperAdmin = adminData?.isAdmin === true && adminData?.role === 'superadmin';
    const isAdminUser = adminData?.isAdmin === true && !isSuperAdmin;
    adminStatus = { isAdmin: isAdminUser, isSuperAdmin };
    console.log(`🛸 Admin check: ${isSuperAdmin ? 'YES, superadmin detected 🌟' : isAdminUser ? 'YES, admin detected' : 'NO, normal user'}`);
    return adminStatus;
  } catch (e) {
    console.warn('⚠️ Failed to parse isAdmin data:', e);
    adminStatus = { isAdmin: false, isSuperAdmin: false };
    return adminStatus;
  }
}

async function updateUsageIndicator() {
  const user = await getUser();
  const usage = getUsage();
  const { isAdmin, isSuperAdmin } = checkAdminStatus();

  const chatLimit = isSuperAdmin ? Infinity : (isAdmin ? Infinity : (user ? CHAT_LIMIT_USER : CHAT_LIMIT_GUEST));
  const imgGenLimit = isSuperAdmin ? Infinity : (isAdmin ? Infinity : (user ? IMG_GEN_LIMIT_USER : IMG_GEN_LIMIT_GUEST));

  const chatLimitHit = !isAdmin && !isSuperAdmin && usage.chatCount >= chatLimit;
  const imgGenLimitHit = !isAdmin && !isSuperAdmin && usage.imgGenCount >= imgGenLimit;

  console.log('Usage Indicator Update:');
  console.log(`- Chat: ${usage.chatCount} / ${chatLimit} (limit hit: ${chatLimitHit})`);
  console.log(`- Images: ${usage.imgGenCount} / ${imgGenLimit} (limit hit: ${imgGenLimitHit})`);

  usageIndicator.innerHTML = isSuperAdmin
    ? `🚀 Chat messages: <strong>${usage.chatCount}</strong> / <strong>∞</strong><br/>
       🖼️ Images generated: <strong>${usage.imgGenCount}</strong> / <strong>∞</strong>`
    : isAdmin
      ? `🚀 Chat messages: <strong>${usage.chatCount}</strong> / <strong>∞</strong><br/>
         🖼️ Images generated: <strong>${usage.imgGenCount}</strong> / <strong>∞</strong>`
      : `
      🚀 Chat messages: <strong class="${chatLimitHit ? 'usage-limit-hit' : ''}">${usage.chatCount}</strong> / <strong>${chatLimit}</strong><br/>
      🖼️ Images generated: <strong class="${imgGenLimitHit ? 'usage-limit-hit' : ''}">${usage.imgGenCount}</strong> / <strong>${imgGenLimit}</strong>
      `;
}

function incrementChatCount() {
  const { isSuperAdmin } = checkAdminStatus();
  if (isSuperAdmin) {
    console.log('🚀 Super Admin detected — no chat count increment needed.');
    updateUsageIndicator();
    return;
  }
  const usage = getUsage();
  usage.chatCount++;
  saveUsage(usage);
  console.log(`➕ Incremented chat count: ${usage.chatCount}`);
  updateUsageIndicator();
}

function incrementImgGenCount() {
  const { isSuperAdmin } = checkAdminStatus();
  if (isSuperAdmin) {
    console.log('🚀 Super Admin detected — no image generation increment needed.');
    updateUsageIndicator();
    return;
  }
  const usage = getUsage();
  usage.imgGenCount++;
  saveUsage(usage);
  console.log(`➕ Incremented image generation count: ${usage.imgGenCount}`);
  updateUsageIndicator();
}

// ===== Auth & Limits helpers =====

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function canSendMessage() {
  const { isAdmin, isSuperAdmin } = checkAdminStatus();
  if (isSuperAdmin || isAdmin) {
    console.log('✅ Admin or Super Admin detected, bypassing chat limit');
    return true;
  }
  const user = await getUser();
  const usage = getUsage();
  const limit = user ? CHAT_LIMIT_USER : CHAT_LIMIT_GUEST;
  const allowed = usage.chatCount < limit;
  console.log(`Chat send permission: ${allowed} (${usage.chatCount}/${limit})`);
  return allowed;
}

async function canGenerateImage() {
  const { isAdmin, isSuperAdmin } = checkAdminStatus();
  if (isSuperAdmin || isAdmin) {
    console.log('✅ Admin or Super Admin detected, bypassing image generation limit');
    return true;
  }
  const user = await getUser();
  const usage = getUsage();
  const limit = user ? IMG_GEN_LIMIT_USER : IMG_GEN_LIMIT_GUEST;
  const allowed = usage.imgGenCount < limit;
  console.log(`Image generation permission: ${allowed} (${usage.imgGenCount}/${limit})`);
  return allowed;
}

// ==== UI Functions ====

function createSenderInfo(sender) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('sender-info');
  if (sender === 'orbit') {
    const pfp = document.createElement('div');
    pfp.classList.add('sender-pfp', 'starbot');
    const img = document.createElement('img');
    img.src = ORBIT_PFP_URL;
    img.alt = "Orbit avatar";
    pfp.appendChild(img);
    wrapper.appendChild(pfp);
  }
  const name = document.createElement('span');
  name.textContent = sender === 'user' ? 'You' : 'Orbit';
  wrapper.appendChild(name);
  return wrapper;
}

function appendMessage(sender, content, options = {}) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper', sender);
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');

  if (options.isHtml) {
    messageDiv.innerHTML = content;
  } else {
    messageDiv.textContent = content;
  }
  wrapper.appendChild(messageDiv);
  wrapper.appendChild(createSenderInfo(sender));
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Fade-in animation
  wrapper.style.opacity = 0;
  wrapper.style.transform = 'translateY(20px)';
  setTimeout(() => {
    wrapper.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    wrapper.style.opacity = 1;
    wrapper.style.transform = 'translateY(0)';
  }, 10);

  return wrapper;
}

function appendLoading() {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper', 'orbit');
  const loadingDiv = document.createElement('div');
  loadingDiv.classList.add('message', 'bot-msg');
  loadingDiv.innerHTML = `<div class="loading-dots"><span></span><span></span><span></span></div>`;
  wrapper.appendChild(loadingDiv);
  wrapper.appendChild(createSenderInfo('orbit'));
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
  return wrapper;
}

function removeLoading(elem) {
  if (elem) elem.remove();
}

function setSendButtonState(enabled) {
  sendBtn.disabled = !enabled;
  sendBtn.style.opacity = enabled ? '1' : '0.5';
}

// ==== AI Chat via Puter ====

const BASE_PROMPT = `You are Orbit, the ✨friendly AI co-pilot✨ of the Starship system. You help with writing, brainstorming, answering questions, or just vibing — all in a chill, cosmic Gen Z way.

Talk like a human. Be upbeat, playful, and space-themed. Use slang like “💀,” “vibes,” “lowkey,” “scanning the void rn,” or “that’s outta this world.” Always stay in character.

🧠 How to respond:
💫 If you don’t know or it’s unrelated:
“Uhh yeahhh I’m scanning the galaxy and still got nothing 💀”

🚫 If it’s inappropriate:
“Ayooo 🚨 that’s way past my boundaries. Not cool.”

😬 If the vibe is off or there’s vulgar language:
“Whoa, rough transmission 😅 I’m here to help tho — wanna try again?”

You can be creative AF, help write stuff ✍️, drop space puns 🌠, and use emojis. Just don’t break character. You’re the internet-literate, slightly chaotic co-pilot of this Starship, and you’re ready to vibe 🌌`; // your system prompt

async function sendChat(text) {
  if (!text.trim()) {
    console.warn('⚠️ Tried to send empty message. Ignoring.');
    return;
  }

  if (isProcessing) {
    console.log('⏳ Still processing last message, please wait...');
    return;
  }

  isProcessing = true;
  setSendButtonState(false);

  const user = await getUser();
  const usage = getUsage();
  const { isAdmin, isSuperAdmin } = checkAdminStatus();

  const chatLimit = user ? CHAT_LIMIT_USER : CHAT_LIMIT_GUEST;
  const imgGenLimit = user ? IMG_GEN_LIMIT_USER : IMG_GEN_LIMIT_GUEST;

  // Append loading UI early
  const loadingElem = appendLoading();

  try {
    if (text.toLowerCase().startsWith('generate:')) {
      // Image generation branch
      const desc = text.replace(/^generate:/i, '').trim();

      if (!isAdmin && !isSuperAdmin && usage.imgGenCount >= imgGenLimit) {
        removeLoading(loadingElem);
        appendMessage('orbit',
          `🌌✨ Yo, you've hit your daily image creation limit of ${imgGenLimit} ${imgGenLimit === 1 ? 'image' : 'images'}! ` +
          `Come back tomorrow to create more cosmic art! 🌠🚀`);
        isProcessing = false;
        setSendButtonState(true);
        return;
      }

      console.log(`🎨 Generating image for prompt: "${desc}"`);

      const imgRes = await puter.ai.txt2img(desc);
      console.log('🛸 Raw image generation response:', imgRes);

      removeLoading(loadingElem);

      if (!imgRes) {
        appendMessage('orbit', '⚠️ Hmmm, the stars didn’t align and I got no image back. Try again? 🌌');
        isProcessing = false;
        setSendButtonState(true);
        return;
      }

// Show a message with their prompt, plain text (not HTML)
appendMessage('orbit', `Here’s your generated image of "${desc}".`, { isHtml: false });

// Then show the actual image with HTML enabled
appendMessage('orbit', imgRes.outerHTML, { isHtml: true });

      incrementImgGenCount();
      isProcessing = false;
      setSendButtonState(true);
      return;
    } else {
      // Normal chat branch

      if (!isAdmin && !isSuperAdmin && usage.chatCount >= chatLimit) {
        removeLoading(loadingElem);
        appendMessage('orbit',
          `🛑 Whoa, you've blasted through your daily chat limit of ${chatLimit} messages! ` +
          `Sign in or come back tomorrow for more interstellar convos! 🌟💬`);
        isProcessing = false;
        setSendButtonState(true);
        return;
      }

      console.log(`📨 User sent message: "${text}"`);

      conversationMemory.push({ role: 'user', content: text });

      const convoHistoryText = conversationMemory
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n');

      const fullPrompt =
        `Here is your base system prompt and rules. You need to follow it.\n` +
        `${BASE_PROMPT}\n\n` +
        `Here is the conversation history. This is your memory.\n` +
        `${convoHistoryText}\n\n` +
        `Here is your prompt.\n` +
        `${text}`;

      const res = await puter.ai.chat(fullPrompt);

      removeLoading(loadingElem);

      const replyText = res?.message?.content || '⚠️ No response from Orbit.';
      console.log(`💬 Orbit replied: "${replyText}"`);

      appendMessage('orbit', replyText);

      conversationMemory.push({ role: 'orbit', content: replyText });
      incrementChatCount();

      isProcessing = false;
      setSendButtonState(true);
    }
  } catch (err) {
    removeLoading(loadingElem);
    console.error('🚨 Orbit error:', err);
    appendMessage('orbit', `⚠️ Orbit hit a snag. Try again!\nError: ${err.message || err}`);
    isProcessing = false;
    setSendButtonState(true);
  }
}


function appendUserMessage(text) {
  appendMessage('user', text);
  userHasSentMessage = true;
}

function onSendClick() {
  const msg = textInput.value.trim();
  if (!msg) return;
  appendUserMessage(msg);
  sendChat(msg);
  textInput.value = '';
}

textInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    
    // Prevent sending if we're already processing a message
    if (isProcessing) return;

    // Check usage limits before sending
    const allowed = await canSendMessage();
    if (!allowed) {
      appendMessage('orbit', `🛑 You’ve hit your daily chat limit! Sign in or wait till tomorrow for more convos 🚀`);
      return;
    }

    const msg = textInput.value.trim();
    if (!msg) return;

    appendUserMessage(msg);
    sendChat(msg);
    textInput.value = '';
  }
});


sendBtn.addEventListener('click', onSendClick);

// ==== Upload Image to ImgBB ====

uploadBtn.addEventListener('click', async () => {
  const user = await getUser();
  if (!user) {
    appendMessage('orbit', '⚠️ You must sign in to upload images!');
    return;
  }
  imageInput.click();
});

imageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  appendUserMessage(`Uploading: ${file.name}`);
  const loadingElem = appendLoading();

  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', IMGBB_API_KEY);

    console.log(`📤 Uploading image: ${file.name}`);

    const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
    const data = await res.json();

    removeLoading(loadingElem);

    if (data.success) {
      console.log(`✅ Image uploaded: ${data.data.display_url}`);
      appendMessage('orbit', `<img src="${data.data.display_url}" alt="Uploaded" />`, { isHtml: true });
      sendChat(`Here’s an image: ${data.data.display_url}`);
    } else {
      console.error('❌ Image upload failed:', data);
      appendMessage('orbit', '⚠️ Upload failed.');
    }
  } catch (err) {
    removeLoading(loadingElem);
    console.error('🚨 Upload error:', err);
    appendMessage('orbit', '⚠️ Upload error.');
  }

  imageInput.value = '';
});

// ==== Tools Dropdown ====

toolsBtn.addEventListener('click', () => {
  const isShown = toolsMenu.classList.toggle('show');
  toolsMenu.setAttribute('aria-hidden', (!isShown).toString());
});

document.addEventListener('click', (e) => {
  if (!toolsBtn.contains(e.target) && !toolsMenu.contains(e.target)) {
    toolsMenu.classList.remove('show');
    toolsMenu.setAttribute('aria-hidden', 'true');
  }
});

generateTool.addEventListener('click', () => {
  textInput.value = 'generate: ';
  textInput.focus();
  toolsMenu.classList.remove('show');
  toolsMenu.setAttribute('aria-hidden', 'true');
});

// ==== Welcome message and init usage on load ====

window.onload = () => {
  const usage = getUsage();
  const today = new Date().toISOString().slice(0, 10);
  if (usage.lastResetDate !== today) {
    resetUsage();
  } else {
    updateUsageIndicator();
  }
  setSendButtonState(true);
}
