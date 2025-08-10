// File: blogmenu.js
// -----------------
// This module fetches blog posts from Supabase and renders them
// using your existing CSS classes (.post, .left, .right, .post-name, etc.).
// It also implements search, sorting, and overlay functionality exactly as before.

// 1. Import Supabase client from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
console.log('🔗 Supabase client loaded');
// 2. Initialize Supabase (replace with your actual values)
const SUPABASE_URL = 'https://jbekjmsruiadbhaydlbt.supabase.co'; // 🔁 Replace with your project URL
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY'; // 🔁 Replace with your anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 
import { summarizePost } from './orbit-global.js';
// 3. Global state
let blogPosts = []; // Will hold the array of posts fetched from Supabase
let currentSortOption = 'age'; // Default sort: newest first

// 4. DOM elements
const blogPostMenu = document.getElementById('blogPostMenu');
const blogPostCount = document.getElementById('blogPostCount');
const searchInput = document.getElementById('search');
const sortDropdown = document.getElementById('sortOptions');

// 5. Fetch blog posts from Supabase and normalize them
async function fetchBlogPosts() {
  const { data, error } = await supabase
    .from('blog_menu')
    .select('title, image, date, content, id, author');

  if (error) {
    console.error('Error fetching blog posts:', error);
    blogPostMenu.innerHTML = `<p style="color: white; text-align: center;">Failed to load blog posts 😞</p>`;
    return;
  }

  // Normalize each row into the same shape your old static array used:
  // { title, image, date: { year, month, day }, content }
  blogPosts = data.map((row) => {
    // Assume "date" column in Supabase is a DATE or TIMESTAMP string
    const dt = new Date(row.date);
    return {
      id: row.id,
      title: row.title,
      image: row.image,
      date: {
        year: dt.getUTCFullYear(),
        month: dt.getUTCMonth() + 1,
        day: dt.getUTCDate(),
      },
      content: row.content,
      author: row.author || 'Starship Team', // Add author if available
    };
  });

  // After fetching, immediately render:
  displayBlogPosts();
}

// 6. Render / re-render the posts based on search & sort
function displayBlogPosts(filter = '') {
  // 6.1 Clear out the container
  blogPostMenu.innerHTML = '';

  // 6.2 Filter by title (case-insensitive)
  const filtered = blogPosts.filter((post) =>
    post.title.toLowerCase().includes(filter.toLowerCase())
  );

  // 6.3 Sort according to currentSortOption
  filtered.sort((a, b) => {
    if (currentSortOption === 'age') {
      // Newest first: convert to JS Date
      const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
      const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
      return dateB - dateA;
    } else if (currentSortOption === 'alphabetical') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // 6.4 Generate HTML for each post using YOUR CSS classes:
  //     <a class="post">
  //       <img class="left" src="..." />
  //       <div class="right">
  //         <div class="post-name">Title</div>
  //       </div>
  //     </a>
  filtered.forEach((post) => {
    const postContainer = document.createElement('a');
    postContainer.href = 'javascript:void(0)';
    postContainer.classList.add('post');
    console.log('blogTitle element:', document.getElementById('blogTitle'));

    postContainer.addEventListener('click', () =>
      showOverlay({
        title: post.title,
        content: post.content,
        image: post.image,
        id: post.id,
        author: post.author,
      })
    );

    // -- Left side: image
    const postImage = document.createElement('img');
    postImage.src = post.image;
    postImage.classList.add('left');
    postContainer.appendChild(postImage);

    // -- Right side overlay with title
    const rightDiv = document.createElement('div');
    rightDiv.classList.add('right');

    const postName = document.createElement('div');
    postName.classList.add('post-name');
    postName.textContent = post.title;
    rightDiv.appendChild(postName);

    postContainer.appendChild(rightDiv);

    blogPostMenu.appendChild(postContainer);
  });

  // 6.5 Update count text
  blogPostCount.textContent = `Blog Posts Loaded: ${filtered.length}`;
}

// 7. Search handler (called by oninput in HTML)
window.filterBlogPosts = function () {
  const searchValue = searchInput.value;
  displayBlogPosts(searchValue);
};

// 8. Sort handler (called by onchange in HTML)
window.sortBlogPosts = function () {
  currentSortOption = sortDropdown.value;
  displayBlogPosts(searchInput.value);
};

// 9. Overlay functions
window.showOverlay = function (post) {
  const overlay = document.getElementById('overlay');
  const blogTitle = document.getElementById('blogTitle');
  const blogAuthor = document.getElementById('blogAuthor');
  const blogContent = document.getElementById('blogContent');
  const blogCover = document.getElementById('blogCover');
  const summaryResult = document.getElementById('summaryResult'); // Use your existing container
  const commentForm = document.querySelector('.comments form');

  blogTitle.textContent = post.title;
  blogAuthor.textContent = `by: ${post.author || 'Starship Team'}`;
  blogCover.src = post.image;
  blogContent.innerHTML = marked.parse(post.content);
  commentForm.setAttribute('post_id', post.id);

  overlay.style.display = 'flex';
  document.body.classList.add('overlay-open');
  displayComments(post.id);

  // Clear and prep the summaryResult container
  summaryResult.textContent = 'Summarizing with Orbit AI... 🚀';
  summaryResult.style.border = '1px solid #8a2be2'; // keep your debug styles if you want
  summaryResult.style.padding = '10px';
  summaryResult.style.backgroundColor = '#111';

  (async () => {
    try {
      const rawText = post.content.replace(/<\/?[^>]+(>|$)/g, "");
      const summaryText = await summarizePost(rawText);
      console.log('Summary generated:', summaryText);

      summaryResult.innerHTML = `<strong>Summarized with Orbit:</strong><br>`;

      const summarySpan = document.createElement('span');
      summaryResult.appendChild(summarySpan);

      if (typeof typewriterEffect === 'function') {
        await typewriterEffect(summarySpan, summaryText);
      } else {
        summarySpan.textContent = summaryText;
      }

      const disclaimer = document.createElement('p');
      disclaimer.style.marginTop = '12px';
      disclaimer.style.fontSize = '0.85rem';
      disclaimer.style.color = '#8a2be2cc';
      disclaimer.style.fontStyle = 'italic';
      disclaimer.textContent = 'Orbit AI can make mistakes. Check important info.';
      summaryResult.appendChild(disclaimer);
    } catch (e) {
      console.error('Error during summary generation:', e);
      summaryResult.textContent = 'Oops, failed to summarize. Try again later.';
    }
  })();
};








// 10. Kick off the fetch on page load
window.addEventListener('DOMContentLoaded', fetchBlogPosts);

// #region Comments
import { bannedWords } from '/javascript/filter.js';

const commentForm = document.querySelector('.comments form');
commentForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent form submission
  const commentInput = document.getElementById('commentInput');
  const comment = commentInput.value.trim();
  const user = await supabase.auth.getUser().then((res) => res.data.user);
  if (!user) {
    showNotification('You must be logged in to comment.', {
      persistClose: false,
      sound: false,
      duration: 5000,
      sticky: false,
      body: 'Please log in to leave a comment.',
    });
  }
  const lowered = comment.toLowerCase();
  const foundWord = bannedWords.find((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i'); // \b = word boundary, 'i' = case-insensitive
    return pattern.test(lowered);
  });

  if (foundWord) {
    console.log('Word blocked:', foundWord);
    showNotification('Message Filtered', {
      body: `That message contains inappropriate content and has been blocked.`,
      duration: 5000,
      sound: true,
    });
    input.value = ''; // Clear input
    return;
  }
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();
  const author = data.username || 'Anonymous';
  const post_id = e.target.getAttribute('post_id') || '1';

  await supabase
    .from('comments')
    .insert({
      post_id, // TODO: Replace with actual post ID
      comment,
      user_id: user.id
    })
    .then(() => {
      commentInput.value = ''; // Clear input after submission
      displayComments(post_id); // Refresh comments for this post
    });
});

// Function to fetch and display comments for a specific post
async function displayComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('user_id, comment')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    return;
  }

  const commentsContainer = document.querySelector('#commentSection');
  commentsContainer.innerHTML = ''; // Clear existing comments

  console.log(data);

  data.forEach(async (comment) => {
    const commentDiv = document.createElement('div');
    commentDiv.classList.add('comment');

    const authorP = document.createElement('p');
    authorP.classList.add('comment-author');
    authorP.textContent = await supabase.from('profiles')
      .select('username')
      .eq('id', comment.user_id)
      .single()
      .then((res) => res.data.username || 'Anonymous');

    const textP = document.createElement('p');
    textP.classList.add('comment-text');
    textP.textContent = comment.comment;

    commentDiv.appendChild(authorP);
    commentDiv.appendChild(textP);

    commentsContainer.appendChild(commentDiv);
  });
}

// #endregion

async function getLatestPost() {
  const { data, error } = await supabase
    .from('blog_menu')
    .select('title')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching latest post:', error);
    return 'Failed to load latest post';
  }

  console.log('Latest post data:', data);
  console.log('Latest post title:', data.title);

  return data.title;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Fetch and display the latest post title
  const latestPostTitle = await getLatestPost();
  document.querySelector('#latestNews').textContent = latestPostTitle;
});

async function typewriterEffect(element, text, delay = 15) {
  element.innerHTML = ''; // Clear existing content

  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.textContent = text[i];
    span.style.color = '#8a2be2'; // glowing purple color initially
    element.appendChild(span);

    // Animate color back to white after a short delay, staggered per letter
    setTimeout(() => {
      span.style.transition = 'color 0.5s ease';
      span.style.color = '#eee';
    }, delay * (i + 1) * 0.9);

    await new Promise(r => setTimeout(r, delay)); // wait before typing next letter
  }
}
