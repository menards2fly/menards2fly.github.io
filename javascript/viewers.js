// G tag
// Create the <script> element for the Google tag (gtag.js)
var script1 = document.createElement('script');
script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-MKDF11ZW6N';
script1.async = true;

// Create the inline <script> for initializing gtag
var script2 = document.createElement('script');
script2.text = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-MKDF11ZW6N');
`;

// Find the <head> element and insert the scripts after it
var head = document.getElementsByTagName('head')[0];
head.appendChild(script1);
head.appendChild(script2);

// Add screen time tracking

// Create a new script element
var script = document.createElement('script');

// Set the source to your screenTimeTracker.js file
script.src = '/javascript/screentimetracking.js';

// (Optional) Set the script to load asynchronously
script.async = true;

// Append the script to the document's head (or body)
document.head.appendChild(script);

// Alternatively, you can append it to the body:
// document.body.appendChild(script);

// Iframe controls for viewers
const iframe = document.getElementById('gameFrame');
const reloadButton = document.getElementById('reloadButton');
const fullscreenButton = document.getElementById('fullscreenButton');
const homeButton = document.getElementById('homeButton');

reloadButton.addEventListener('click', () => {
  iframe.src = iframe.src;
});

fullscreenButton.addEventListener('click', () => {
  if (iframe.requestFullscreen) {
    iframe.requestFullscreen();
  } else if (iframe.mozRequestFullScreen) {
    // Firefox
    iframe.mozRequestFullScreen();
  } else if (iframe.webkitRequestFullscreen) {
    // Chrome, Safari, Opera
    iframe.webkitRequestFullscreen();
  } else if (iframe.msRequestFullscreen) {
    // IE/Edge
    iframe.msRequestFullscreen();
  }
});

homeButton.addEventListener('click', () => {
  const currentURL = window.location.href; // Get the current URL of the page

  if (currentURL.includes('/storage/tv')) {
    location.replace('/tv'); // Redirect to the /tv page
  } else if (currentURL.includes('/storage/games')) {
    location.replace('/games'); // Redirect to the /games page
  } else if (currentURL.includes('/storage/music')) {
    location.replace('/music'); // Redirect to the /music page
  } else {
    location.replace('/'); // Fallback redirect if no match
  }
});

/* Load iframe with anim */

// Store the original src of the iframe
const originalSrc = iframe.src;

// Function to redirect the iframe to multiple pages sequentially
function redirectIframeSequence(pages, delays) {
  if (pages.length !== delays.length) {
    console.error('Pages and delays arrays must have the same length.');
    return;
  }

  let currentIndex = 0;

  function redirectNext() {
    if (currentIndex < pages.length) {
      iframe.src = pages[currentIndex];
      setTimeout(() => {
        currentIndex++;
        redirectNext();
      }, delays[currentIndex]);
    } else {
      // After all redirects, reset to the original source
      iframe.src = originalSrc;
    }
  }

  // Start the sequence
  redirectNext();
}

// Example usage: Redirect to two pages and then back to the original source
redirectIframeSequence(
  ['/storage/loading.html', '/storage/advertisement.html'], // Pages to redirect to
  [4000, 4000] // Delays in milliseconds for each page
);

/* Dynamic update fav */

// Function to change the favicon based on the last part of the URL
function changeFavicon() {
  // Get the current URL and extract the last part after the last slash
  const url = window.location.href;
  const lastPart = url.substring(url.lastIndexOf('/') + 1);

  // Map for favicon assignment based on the last part of the URL
  const faviconMap = {
    home: 'home.ico',
    profile: 'profile.ico',
    settings: 'settings.ico',
    // Add more mappings as needed
  };

  // Get the favicon link element or create one if it doesn't exist
  let favicon =
    document.querySelector("link[rel='icon']") ||
    document.createElement('link');
  favicon.rel = 'icon';

  // Check if the last part matches a known page, otherwise use the image path
  if (faviconMap[lastPart]) {
    favicon.href = faviconMap[lastPart];
  } else {
    // Set the favicon to an image from the /uploads/covers/ directory
    favicon.href = `/uploads/covers/${lastPart}.png`; // Assuming the last part corresponds to an image file
  }

  // Append the favicon to the document head if it's new
  if (!document.querySelector("link[rel='icon']")) {
    document.head.appendChild(favicon);
  }
}

// Run the function on page load
window.addEventListener('load', changeFavicon);

/* Title */

// Get the current page title
let pageTitle = document.title;

// Check if the title starts with "GameVerse - " and remove it
if (pageTitle.startsWith('GameVerse - ')) {
  document.title = pageTitle.slice('GameVerse - '.length);
}
// Check if the title starts with "GameVerse - " and remove it
if (pageTitle.startsWith('MusicVerse - ')) {
  document.title = pageTitle.slice('MusicVerse - '.length);
}
// Check if the title starts with "GameVerse - " and remove it
if (pageTitle.startsWith('WatchVerse - ')) {
  document.title = pageTitle.slice('WatchVerse - '.length);
}

window.onload = function () {
  // Create the div for particles-js
  var particlesDiv = document.createElement('div');
  particlesDiv.id = 'particles-js';

  // Append the div to the body at the end
  document.body.appendChild(particlesDiv);

  // Create the script tag for particles.js
  var particlesJsScript = document.createElement('script');
  particlesJsScript.src = '/javascript/particles.js';

  // Append the script to the body
  document.body.appendChild(particlesJsScript);

  // Create the script tag for the particles-config.js
  var particlesConfigScript = document.createElement('script');
  particlesConfigScript.src = '/javascript/particles-config.js';

  // Append the second script to the body
  document.body.appendChild(particlesConfigScript);
};
