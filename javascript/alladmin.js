// | XTXhXiXsX XfXiXlXeX XiXsX XnXoXtX XuXsXeXdX.X XAXlXlX XtXhXeX
// | XcXoXdXeX XtXhXaXtX XiXsX XhXeXrXeX
// | XhXaXsX XbXeXeXnX XcXoXpXiXeXdX XtXoX XtXhXeX XmXaXiXnX
// | XhXtXmXlX XfXiXlXeX X(XaXdXmXiXnX.XhXtXmXlX)X.X
// |
// | Thank you for your understanding!
// |
// | -TannerO (Co-Founder of starship)

// #region Overlay Screen
// Define Overlay Screens
const overlayScreens = {
  viewblogpost: `
              <img src="{blogpostimg}" alt="Blog Cover" class="viewingimg"/>
              <h2>{blogpostitle}</h2>
              <p>{blogpostcontent}</p>
            `,
  editblogpost: `
              <h2>{createoredit} Blog Post</h2>
              <form id="blogForm" data-coe='{createoredit}'>
                <label for="blogCover">Blog Cover Image:</label><br>
                <input type="file" id="blogCover" name="blogCover" accept="image/*" autocomplete="off"/><br><br>

                <label for="postTitle">Post Title:</label><br>
                <input type="text" id="postTitle" name="postTitle" autocomplete="off" required /><br><br>

                <label for="postContent">Content:</label><br>
               <textarea id="postContent" name="postContent"></textarea><br><br>

               <button type="submit">Submit</button><br>
             </form>
            {deleteButton}
            `,
  editgame: `
              <h2>{createoredit} Game</h2>
              <form id="gameForm" data-coe="{createoredit}">
                <label for="gameName">Game Name:</label>
                <input type="text" id="gameName" required />
                <label for="gameCover">Game Cover:</label>
                <input type="file" accept="image/*" id="gameCover" required />
                <label for="gameDescription">Description:</label>
                <textarea id="gameDescription" required></textarea>
                <label for="gameTags">Tags (comma-separated):</label>
                <input type="text" id="gameTags" required />
                <label for="gameURL">Game URL:</label>
                <input id="gameURL" type="text" required />
                <button type="submit" id="gameSubmitBtn">Submit</button>
              </form>
              {deleteButton}
            `,
  addAdmin: `
              <h2>Add Admin</h2>
              <form id="addAdminForm">
                <label for="adminUsername">Username:</label>
                <input type="text" id="adminUsername" name="adminUsername" required />
                <label for="adminEmail">Email:</label>
                <input type="email" id="adminEmail" name="adminEmail" required />
                <label for="adminRole">Role:</label>
                <select id="adminRole" name="adminRole">
                  <option value="super">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="gameadd">Game Adder</option>
                  <option value="editor">Editor</option>
                </select>
                <button type="submit">Add Admin</button>
              </form>
            `,
};

// Supabase config
// const supabaseUrl = "https://jbekjmsruiadbhaydlbt.supabase.co";
// const supabaseKey =
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// #region Game Functions
async function addGame(gameName, gameLink, gameCoverFile, gameDescription, gameTags) {
  if (!gameName || !gameLink || !gameCoverFile) {
    alert('Please fill in all fields.');
    return;
  }

  // Step 1: Convert file to Base64
  const base64Image = await fileToBase64(gameCoverFile);

  // Step 2: Insert into Supabase
  const { data, error } = await supabase.from('games_menu').insert([
    {
      name: gameName,
      url: gameLink,
      description: gameDescription,
      tags: gameTags.length > 0 ? gameTags : null, // Save as array if tags exist
      img_url: base64Image, // Save as base64 string
    },
  ]);

  if (error) {
    console.error('❌ Supabase insert error:', error.message);
    alert('Game could not be added.');
    return;
  }

  console.log('✅ Game added to DB:', data);
  refreshGamesList();
}

async function deleteGame(gameId) {
  console.log(`Type of gameId: ${typeof gameId}, Value: ${gameId}`);
  const { error } = await supabase
    .from('games_menu')
    .delete()
    .eq('id', parseInt(gameId));

  if (error) {
    console.error('❌ Error deleting game:', error.message);
    alert('Failed to delete game.');
    return;
  }
}

async function refreshGamesList() {
  // Clear the current games list
  const gamesList = document.querySelector('.gamedisplay');
  gamesList.innerHTML = '';

  const { data, error } = await supabase
    .from('games_menu')
    .select('id, name, url, img_url');

  data.forEach((game) => {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.dataset.url = game.url;
    gameCard.dataset.id = game.id;
    gameCard.innerHTML = `
      <img
                class="game-thumbnail"
                src="${game.img_url}"
                alt="Game Thumbnail"
              />
              <div class="game-meta-row">
                <div class="game-info">
                  <h4 class="game-title">${game.name}</h4>
                </div>
                <button class="edit-btn" title="Edit">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
              </div>
    `;
    gamesList.appendChild(gameCard);
    // Manually trigger your existing click handler here
    gameCard.addEventListener('click', (e) => {
      window._editingGameId = game.id;

      const name = gameCard.querySelector('.game-title').textContent;
      const gameUrl = gameCard.dataset.url;

      const html = overlayScreens.editgame
        .replaceAll('{createoredit}', 'Edit')
        .replace(
          '{deleteButton}',
          `<button id="deleteGameBtn" style="margin-top: 20px; background: #dc2626; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">Delete Game</button>`
        );
      openOverlay1(html);

      setTimeout(() => {
        document.getElementById('gameName').value = name;
        document.getElementById('gameURL').value = gameUrl;
      }, 50);
    });
  });
}

function safeRefreshGamesList() {
  const gamesList = document.querySelector('.gamedisplay');
  if (!gamesList) {
    console.warn('Waiting for .gamedisplay to appear...');
    requestAnimationFrame(safeRefreshGamesList);
    return;
  }
  refreshGamesList();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result); // full base64 string: data:image/png;base64,...
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// #region Blog Functions
// Blog Post Functions
async function refreshBlogPosts() {
  const container = document.querySelector('.blogposts');
  if (!container) return;

  container.innerHTML = ''; // clear previous posts

  const { data: posts, error } = await supabase
    .from('blog_menu')
    .select('id, title, content, image');

  if (error) {
    console.error('❌ Failed to load blog posts:', error.message);
    container.innerHTML =
      '<p>Error loading blog posts, look at console for more details</p>';
    return;
  }

  posts.forEach((post) => {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.id = post.id;

    card.innerHTML = `
      <img class="post-thumbnail" src="${post.image}" alt="Blog cover" />
      <div class="post-info">
        <h4 class="post-title">${post.title}</h4>
        <button class="edit-btn" title="Edit">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </div>
      <p class="markdown-preview" data-markdown="${post.content.replace(
      /"/g,
      '&quot;'
    )}" hidden></p>
    `;

    container.appendChild(card);
  });
  document.querySelectorAll('.post-card').forEach((card) => {
    card.addEventListener('click', async (e) => {
      // Ignore clicks on the edit button
      if (e.target.closest('.edit-btn')) return;

      const postId = card.dataset.id;
      if (!postId) return;

      // Fetch full post from Supabase
      const { data: post, error } = await supabase
        .from('blog_menu')
        .select('title, content, image')
        .eq('id', postId)
        .single();

      if (error || !post) {
        alert('Failed to load blog post.');
        console.error(error);
        return;
      }

      // Render using your overlay template
      const html = overlayScreens.viewblogpost
        .replace('{blogpostimg}', post.image)
        .replace('{blogpostitle}', post.title)
        .replace('{blogpostcontent}', marked.parse(post.content));

      openOverlay1(html);
    });
  });
  document.querySelectorAll('.post-card .edit-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevents triggering the view overlay

      const post = btn.closest('.post-card');
      const postId = post.dataset.id;

      const { data, error } = await supabase
        .from('blog_menu')
        .select('title, content, image')
        .eq('id', postId)
        .single();

      if (error || !data) {
        alert('Failed to load blog post.');
        console.error(error);
        return;
      }

      const html = overlayScreens.editblogpost
        .replaceAll('{createoredit}', 'Edit')
        .replace(
          '{deleteButton}',
          `<button id="deleteBlogPostBtn" style="margin-top: 20px; background: #dc2626; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">Delete Post</button>`
        );

      openOverlay1(html);
      window._editingBlogId = postId;

      setTimeout(() => {
        document.getElementById('postTitle').value = data.title;
        easyMDE.value(data.content);
        // Note: can't prefill file input for image
      }, 50);
    });
  });
}
window.addEventListener('DOMContentLoaded', () => {
  safeRefreshGamesList();
  refreshBlogPosts();
  refreshAdminList();
  // Load reports section
  try { refreshReports(); } catch(e) { console.warn('refreshReports failed to start:', e); }
});

// #endregion
// #region Admin Functions
// Admin Functions
async function refreshAdminList() {
  console.log('Starting Refresh...');
  const tableBody = document.getElementById('adminList');
  if (!tableBody) return;
  console.log('Found table body:', tableBody);

  tableBody.innerHTML = ''; // Clear out old/fake entries

  const { data: admins, error } = await supabase
    .from('adminpanel_access')
    .select('user_uid, username, email, role');

  if (error) {
    console.error('❌ Failed to fetch admins:', error.message);
    tableBody.innerHTML = `<tr><td colspan="5">Error loading admins</td></tr>`;
    return;
  }
  console.log('Fetched admins:', admins);

  admins.forEach(async (admin) => {
    const row = document.createElement('tr');

    const { data, error } = await supabase.from('profiles').select('avatar_url, username').eq('id', admin.user_uid)

    if (error) {
      console.error('❌ Failed to fetch admin avatar:', error.message);
      tableBody.innerHTML = `<tr><td colspan="5">Error loading admins</td></tr>`;
      return;
    }

    // Change Role display
    if (admin.role === 'super') {
      admin.role = 'Super Admin';
    } else if (admin.role === 'admin') {
      admin.role = 'Admin';
    } else if (admin.role === 'gameadd') {
      admin.role = 'Game +';
    } else if (admin.role === 'editor') {
      admin.role = 'Editor';
    } else {
      alert('Invalid role selected.');
      return;
    }

    row.innerHTML = `
      <td>
        <img
          src="${data[0].avatar_url}"
          alt="${data[0].username}'s avatar"
          style="width: 36px; height: 36px; border-radius: 999px; object-fit: cover;"
        />
      </td>
      <td>${data[0].username}</td>
      <td>${admin.email}</td>
      <td>${admin.role}</td>
      <td>
        <button class="remove-btn" data-id="${admin.user_uid}" title="Remove admin">✖</button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Hook up remove buttons
  document.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const adminId = btn.dataset.id;
      const confirmDelete = confirm(
        'Are you sure you want to remove this admin?'
      );
      if (!confirmDelete) return;

      const { error } = await supabase
        .from('adminpanel_access')
        .delete()
        .eq('user_uid', adminId);

      if (error) {
        alert('❌ Failed to remove admin.');
        console.error(error);
        return;
      }

      alert('✅ Admin removed.');
      refreshAdminList();
    });
  });
}

//#region Restrictions
document.addEventListener('DOMContentLoaded', () => {
  const admincontainer = document.querySelector('.admincontainer');
  const blog = document.querySelector('.blog');
  const games = document.querySelector('.games');
  const admin = document.querySelector('.admins');
  const reviewsection = document.querySelector('.reviews');

  async function checkRole() {
  // Get the current logged-in user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ Failed to get logged-in user:', userError);
    return;
  }

  // Fetch user profile from profiles table
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    console.error('❌ Failed to fetch profile:', profileError);
    return;
  }

  // Fetch admin roles
  const { data: rolesData, error: rolesError } = await supabase
    .from('adminpanel_access')
    .select('user_uid, role')
    .eq('user_uid', user.id);

  if (rolesError || !rolesData || rolesData.length === 0) {
    console.warn('No roles found for user or failed to fetch roles:', rolesError);
    return;
  }

  const matched = rolesData[0]; // there should only be one role per user
  console.log('Matched user role:', matched.role);

  // Show/hide UI elements based on role
  switch (matched.role) {
    case 'editor':
      console.log('User is an editor, hiding admin features');
      games.remove();
      admin.remove();
      reviewsection.remove();
      break;
    case 'gameadd':
      console.log('User is a game adder, hiding some admin features');
      blog.remove();
      admin.remove();
      reviewsection.remove();
      break;
    case 'admin':
      console.log('User is an admin, hiding admin-only features');
      admin.remove();
      break;
    case 'super':
      console.log('User is a super admin, showing all features');
      break;
    default:
      console.warn('Unknown role:', matched.role);
  }
}


  checkRole();
});

// #region Review Viewing

const reviewList = document.querySelector('.reviewlist');
const approvalSection = document.querySelector('.approve');
const reviewHr = document.getElementById('review-hr');

async function loadReviews() {
  reviewList.innerHTML = ''; // Clear existing reviews
  approvalSection.innerHTML = ''; // Clear approval section too

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      title,
      content,
      stars,
      allowed,
      user_id
    `)
    .order('id', { ascending: false });

  if (error) return console.error('Failed to load reviews', error);

  if (!data || data.length === 0) {
    reviewList.innerHTML = '<p>No reviews yet. Be the first to review us!</p>';
    return;
  }

  reviewHr.style.display = data.some((r) => !r.allowed) ? 'block' : 'none';

  data.forEach(async (review) => {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', review.user_id)
      .single();

    const { title, content, stars, allowed, id } = review;
    const filledStars = '★'.repeat(stars);
    const emptyStars = '☆'.repeat(5 - stars);

    const reviewEl = document.createElement('div');
    reviewEl.className = 'review';

    reviewEl.innerHTML = `
      <div class="review-header">
        <h3 class="review-title">${title}</h3>
        <div class="star-rating">${filledStars}${emptyStars}</div>
      </div>
      <p>${content}</p>
      <div class="userdisplay">
        <img src="${profiles?.avatar_url || '../uploads/branding/default-avatar.png'}" alt="User avatar" />
        <h4>${profiles?.username || 'Unknown User'}</h4>
      </div>
    `;

    if (!allowed) {
      const allowBtn = document.createElement('button');
      allowBtn.textContent = '✓';
      allowBtn.className = 'allowReview';
      allowBtn.addEventListener('click', async () => {
        const { error } = await supabase.from('reviews').update({ allowed: true }).eq('id', id);
        if (error) return console.error('❌ Failed to allow review', error);
        loadReviews();
      });

      const denyBtn = document.createElement('button');
      denyBtn.textContent = '✗';
      denyBtn.className = 'denyReview';
      denyBtn.addEventListener('click', async () => {
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (error) return console.error('❌ Failed to delete review', error);
        loadReviews(); // refresh instead of full reload
      });

      reviewEl.appendChild(allowBtn);
      reviewEl.appendChild(denyBtn);
      approvalSection.appendChild(reviewEl);
    } else {
      reviewList.appendChild(reviewEl);
    }
  });
}



loadReviews();

// === Profile Reports ===
async function refreshReports() {
  const container = document.querySelector('.reports-list');
  if (!container) return;
  console.log('refreshReports: starting');
  container.innerHTML = '<p>Loading reports...</p>';

  const { data: reports, error } = await supabase
    .from('profile_reports')
    .select('id, reporter_id, reported_id, reason, details, created_at')
    .order('created_at', { ascending: false });

  console.log('refreshReports: query returned', { error, count: reports && reports.length });

  if (error) {
    console.error('❌ Failed to load reports:', error.message);
    container.innerHTML = '<p>Error loading reports.</p>';
    return;
  }

  if (!reports || reports.length === 0) {
    container.innerHTML = '<p>No reports found.</p>';
    return;
  }

  // Fetch profiles for all involved user ids
  const ids = Array.from(new Set(reports.flatMap(r => [r.reporter_id, r.reported_id])));
  console.log('refreshReports: fetching profiles for ids', ids);
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, username, bio, avatar_url').in('id', ids || []);
  if (profilesError) console.error('refreshReports: failed to fetch profiles', profilesError);
  const profilesMap = (profiles || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
  console.log('refreshReports: profilesMap', profilesMap);

  container.innerHTML = '';
  reports.forEach(report => {
    const reporter = profilesMap[report.reporter_id] || { username: 'Unknown', bio: '', avatar_url: '' };
    const reported = profilesMap[report.reported_id] || { username: 'Unknown', bio: '', avatar_url: '' };

  const row = document.createElement('div');
  row.className = 'report-row';
  // dark row style to match reports panel
  row.style = 'border:1px solid rgba(255,255,255,0.04);padding:10px;border-radius:8px;display:flex;gap:12px;align-items:center;cursor:pointer;background:#0b0b0b;color:#fff;';
    row.dataset.reportId = report.id;

  const avatar = document.createElement('img');
  const avatarPlaceholder = `https://placehold.co/60x60/8a2be2/ffffff?text=${(reported.username||'U').charAt(0).toUpperCase()}`;
  avatar.src = reported.avatar_url || avatarPlaceholder;
  avatar.style = 'width:48px;height:48px;border-radius:999px;object-fit:cover;';

    const content = document.createElement('div');
    content.style = 'flex:1;';
  content.innerHTML = `<strong style="color:#fff">${reported.username}</strong> — reported by <em style="color:#ddd">${reporter.username}</em><br/><small style="color:#bbb">${new Date(report.created_at).toLocaleString()} · ${report.reason}</small>`;

  console.log('refreshReports: appending row', { reportId: report.id, reported: reported.username, reporter: reporter.username });

    row.appendChild(avatar);
    row.appendChild(content);

    row.addEventListener('click', async () => {
      // Build modal HTML and open via existing overlay helper
      const avatarUrl = reported.avatar_url || `https://placehold.co/100x100/8a2be2/ffffff?text=${(reported.username||'U').charAt(0).toUpperCase()}`;
      const html = `
        <div style="color:#fff;max-width:700px;padding:18px;">
          <div style="display:flex;gap:12px;align-items:center;">
            <img src="${avatarUrl}" style="width:96px;height:96px;border-radius:12px;object-fit:cover;" />
            <div>
              <h2 style="margin:0">${reported.username}</h2>
              <p style="margin:0;color:#ddd">${reported.bio || '<i>No bio</i>'}</p>
              <p style="margin:6px 0 0 0;color:#aaa;font-size:13px">Reported by <strong>${reporter.username}</strong> on ${new Date(report.created_at).toLocaleString()}</p>
            </div>
          </div>
          <hr style="border-color:rgba(255,255,255,0.06);margin:12px 0" />
          <div style="background:#0b0b0b;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.03);">
            <h3 style="margin:0 0 8px 0;color:#fff">Reason: ${report.reason}</h3>
            <p style="color:#ccc">${report.details || ''}</p>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button id="__resetBioBtn" style="background:#dc2626;color:#fff;padding:8px 12px;border-radius:6px;border:none;cursor:pointer;">Reset Bio</button>
            <button id="__resetPicBtn" style="background:#2563eb;color:#fff;padding:8px 12px;border-radius:6px;border:none;cursor:pointer;">Reset Picture</button>
            <button id="__deleteReportBtn" style="background:#111;color:#fff;border:1px solid #444;padding:8px 12px;border-radius:6px;cursor:pointer;">Delete Report</button>
            <button id="__banUserBtn" style="background:#7c3aed;color:#fff;padding:8px 12px;border-radius:6px;border:none;cursor:pointer;">Ban User</button>
            <button id="__closeReportBtn" style="margin-left:auto;background:#666;color:#fff;padding:8px 12px;border-radius:6px;border:none;cursor:pointer;">Close</button>
          </div>
        </div>
      `;

      openOverlay1(`<div style="background:#000;padding:20px;border-radius:12px;">${html}</div>`);

      // Wire buttons with robust logging and better checks
      document.getElementById('__resetBioBtn').addEventListener('click', async (e) => {
        console.log('resetBio clicked for', report.reported_id);
        if (!confirm('Reset bio for ' + reported.username + ' ?')) return;
        const targetId = report.reported_id;
        if (!targetId) { console.error('resetBio: missing reported_id', report); return alert('Invalid reported id'); }
        try {
          console.log('resetBio: calling supabase.update', { id: targetId, bio: '[Deleted by admin]' });
          const { data, error: updErr } = await supabase.from('profiles').update({ bio: '[Deleted by admin]' }).eq('id', targetId).select().single();
          if (updErr) {
            console.error('resetBio: update error', updErr);
            return alert('Failed to reset bio: ' + (updErr.message || JSON.stringify(updErr)));
          }
          console.log('resetBio: update returned', data);
          // Verify the bio actually changed (sometimes Supabase returns null when RLS or policies restrict returning rows)
          if (!data || data.bio !== '[Deleted by admin]') {
            console.log('resetBio: verifying by re-querying profile');
            const { data: verify, error: verifyErr } = await supabase.from('profiles').select('bio').eq('id', targetId).single();
            if (verifyErr) {
              console.error('resetBio: verify query error', verifyErr);
            } else {
              console.log('resetBio: verify result', verify);
              if (!verify || verify.bio !== '[Deleted by admin]') {
                alert('Bio update did not persist. Check permissions.');
                return;
              }
            }
          }
          alert('Bio reset');
          closeOverlay();
          await refreshReports();
        } catch (ex) {
          console.error('resetBio: unexpected', ex);
          alert('Failed to reset bio. See console.');
        }
      });

      document.getElementById('__resetPicBtn').addEventListener('click', async (e) => {
        console.log('resetPic clicked for', report.reported_id);
        if (!confirm('Reset picture for ' + reported.username + ' ?')) return;
        const targetId = report.reported_id;
        if (!targetId) { console.error('resetPic: missing reported_id', report); return alert('Invalid reported id'); }
        const placeholder = `https://placehold.co/100x100/8a2be2/ffffff?text=${(reported.username||'U').charAt(0).toUpperCase()}`;
        try {
          console.log('resetPic: calling supabase.update', { id: targetId, avatar_url: placeholder });
          const { data, error: updErr } = await supabase.from('profiles').update({ avatar_url: placeholder }).eq('id', targetId).select().single();
          if (updErr) {
            console.error('resetPic: update error', updErr);
            return alert('Failed to reset picture: ' + (updErr.message || JSON.stringify(updErr)));
          }
          console.log('resetPic: update returned', data);
          if (!data || data.avatar_url !== placeholder) {
            console.log('resetPic: verifying by re-querying profile');
            const { data: verify, error: verifyErr } = await supabase.from('profiles').select('avatar_url').eq('id', targetId).single();
            if (verifyErr) {
              console.error('resetPic: verify query error', verifyErr);
            } else {
              console.log('resetPic: verify result', verify);
              if (!verify || verify.avatar_url !== placeholder) {
                alert('Avatar update did not persist. Check permissions.');
                return;
              }
            }
          }
          alert('Picture reset');
          closeOverlay();
          await refreshReports();
        } catch (ex) {
          console.error('resetPic: unexpected', ex);
          alert('Failed to reset picture. See console.');
        }
      });

      document.getElementById('__deleteReportBtn').addEventListener('click', async (e) => {
        console.log('deleteReport clicked for', report.id);
        if (!confirm('Delete this report permanently?')) return;
        const targetReportId = report.id;
        if (!targetReportId) { console.error('deleteReport: missing id', report); return alert('Invalid report id'); }
        try {
          console.log('deleteReport: calling supabase.delete', { id: targetReportId });
          const { data, error: delErr } = await supabase.from('profile_reports').delete().eq('id', targetReportId).select();
          if (delErr) {
            console.error('deleteReport: error', delErr);
            return alert('Failed to delete report: ' + (delErr.message || JSON.stringify(delErr)));
          }
          console.log('deleteReport: delete returned', data);
          // Verify deletion
          const { data: verify, error: verifyErr } = await supabase.from('profile_reports').select('id').eq('id', targetReportId).single();
          if (verifyErr && verifyErr.code !== 'PGRST116') { // PGRST116 = no rows found (single) - different libs vary
            console.error('deleteReport: verify query error', verifyErr);
          }
          if (verify) {
            console.error('deleteReport: still exists after delete', verify);
            alert('Report still exists after delete. Check permissions.');
            return;
          }
          console.log('deleteReport: success, verified removed');
          alert('Report deleted');
          closeOverlay();
          await refreshReports();
        } catch (ex) {
          // If the verify single() threw because there were no rows, postgres client may throw — treat as success
          if (ex && ex.code && (ex.code === 'PGRST116' || ex.name === 'PostgrestError')) {
            console.log('deleteReport: delete likely successful (no row found on verify).', ex);
            alert('Report deleted');
            closeOverlay();
            await refreshReports();
            return;
          }
          console.error('deleteReport: unexpected', ex);
          alert('Failed to delete report. See console.');
        }
      });

      document.getElementById('__closeReportBtn').addEventListener('click', (e) => { closeOverlay(); });

      // Ban User button: prefill create-ban overlay and open it
      const banBtnEl = document.getElementById('__banUserBtn');
      if (banBtnEl) {
        banBtnEl.addEventListener('click', (e) => {
          e.preventDefault();
          // Save prefill details to a global temporary var that the create-ban overlay will read
          window._ban_prefill = { id: report.reported_id, username: reported.username };
          // Close current overlay then open the create-ban overlay via the trigger
          closeOverlay();
          setTimeout(() => {
            const trigger = document.getElementById('createBanTrigger');
            if (trigger) trigger.click();
            else console.warn('createBanTrigger not found to open ban overlay');
          }, 60);
        });
      }
    });

    container.appendChild(row);
  });
}

// === Bans Management ===
async function refreshBans() {
  const container = document.querySelector('.bans-list');
  if (!container) return;
  console.log('refreshBans: starting');
  container.innerHTML = '<p>Loading bans...</p>';

  const { data: bans, error } = await supabase
    .from('bans')
    .select('user_id, ban_type, reason, created_at, expires_at, show_appeal, offensive_items, mod_notes')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to load bans:', error.message);
    container.innerHTML = '<p>Error loading bans.</p>';
    return;
  }

  if (!bans || bans.length === 0) {
    container.innerHTML = '<p>No bans found.</p>';
    return;
  }

  // Fetch profiles for all banned user ids
  const ids = Array.from(new Set(bans.map(b => b.user_id)));
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, username, bio, avatar_url').in('id', ids || []);
  if (profilesError) console.error('refreshBans: failed to fetch profiles', profilesError);
  const profilesMap = (profiles || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

  container.innerHTML = '';
  bans.forEach(ban => {
    const prof = profilesMap[ban.user_id] || { username: 'Unknown', bio: '', avatar_url: '' };

    const row = document.createElement('div');
    row.className = 'ban-row';
    row.style = 'border:1px solid rgba(255,255,255,0.04);padding:10px;border-radius:8px;display:flex;gap:12px;align-items:center;cursor:pointer;background:#0b0b0b;color:#fff;';
    row.dataset.userId = ban.user_id;

    const avatar = document.createElement('img');
    const avatarPlaceholder = `https://placehold.co/60x60/8a2be2/ffffff?text=${(prof.username||'U').charAt(0).toUpperCase()}`;
    avatar.src = prof.avatar_url || avatarPlaceholder;
    avatar.style = 'width:48px;height:48px;border-radius:999px;object-fit:cover;';

    const content = document.createElement('div');
    content.style = 'flex:1;';
    content.innerHTML = `<strong style="color:#fff">${prof.username}</strong><br/><small style="color:#bbb">${ban.ban_type} · ${new Date(ban.created_at).toLocaleString()}</small>`;

    row.appendChild(avatar);
    row.appendChild(content);

    row.addEventListener('click', async () => {
      // Build modal HTML using the ban.html card structure
      const avatarUrl = prof.avatar_url || `https://placehold.co/100x100/8a2be2/ffffff?text=${(prof.username||'U').charAt(0).toUpperCase()}`;
      const html = `
        <div style="color:#fff;max-width:700px;padding:18px;">
          <div style="display:flex;gap:12px;align-items:center;">
            <img src="${avatarUrl}" style="width:96px;height:96px;border-radius:12px;object-fit:cover;" />
            <div>
              <h2 style="margin:0">${prof.username}</h2>
              <p style="margin:0;color:#ddd">${prof.bio || '<i>No bio</i>'}</p>
              <p style="margin:6px 0 0 0;color:#aaa;font-size:13px">Banned on ${new Date(ban.created_at).toLocaleString()}</p>
            </div>
          </div>
          <hr style="border-color:rgba(255,255,255,0.06);margin:12px 0" />
          <div style="background:#0b0b0b;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.03);">
            <h3 style="margin:0 0 8px 0;color:#fff">Type: ${ban.ban_type}</h3>
            <p style="color:#ccc">Reason: ${ban.reason || ''}</p>
            <p style="color:#ccc">Expires: ${ban.expires_at ? new Date(ban.expires_at).toLocaleString() : 'Never'}</p>
            <p style="color:#ccc">Appealable: ${ban.show_appeal ? 'Yes' : 'No'}</p>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button id="__removeBanBtn" style="background:#dc2626;color:#fff;padding:8px 12px;border-radius:6px;border:none;cursor:pointer;">Remove Ban</button>
            <button id="__closeBanBtn" style="margin-left:auto;background:#666;color:#fff;padding:8px 12px;border-radius:6px;border:none;cursor:pointer;">Close</button>
          </div>
          <div style="margin-top:12px;color:#ccc;">
            <strong>Mod Notes</strong>
            <p>${ban.mod_notes || ''}</p>
          </div>
        </div>
      `;

      openOverlay1(`<div style="background:#000;padding:20px;border-radius:12px;">${html}</div>`);

      document.getElementById('__removeBanBtn').addEventListener('click', async () => {
        if (!confirm('Remove ban for ' + prof.username + ' ?')) return;
        try {
          const { data: delData, error: delErr } = await supabase.from('bans').delete().eq('user_id', ban.user_id).select();
          if (delErr) {
            console.error('removeBan: error', delErr);
            return alert('Failed to remove ban: ' + (delErr.message || JSON.stringify(delErr)));
          }
          alert('Ban removed');
          closeOverlay();
          await refreshBans();
        } catch (ex) {
          console.error('removeBan: unexpected', ex);
          alert('Failed to remove ban. See console.');
        }
      });

      document.getElementById('__closeBanBtn').addEventListener('click', () => closeOverlay());
    });

    container.appendChild(row);
  });
}

// Create Ban overlay with username search/autocomplete
document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('createBanTrigger');
  if (!trigger) return;
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const html = `
      <h2>Create Ban</h2>
      <form id="createBanForm" class="ban-form">
        <label>Search Username</label>
        <input id="ban_username_search" class="ban-input" placeholder="Type username to search..." autocomplete="off" />
        <div id="ban_search_results" class="ban-search-results" aria-hidden="true"></div>

        <input type="hidden" id="ban_user_id" />
        <div class="ban-selected"><strong>Selected:</strong> <span id="ban_user_display">(none)</span></div>

        <label>Ban Type</label>
        <select id="ban_type" class="ban-input"><option value="Permanent">Permanent</option><option value="Temporary">Temporary</option></select>

        <label>Reason</label>
        <textarea id="ban_reason" class="ban-textarea" placeholder="Optional reason..."></textarea>

  <label>Expires At (time they get unbanned)</label>
  <input id="ban_expires_at" class="ban-input" type="datetime-local" />

        <label>Allow Appeal </label>
        <select id="ban_show_appeal" class="ban-input"><option value="true">Yes</option><option value="false">No</option></select>

        <label>Offensive Items (comma-separated)</label>
        <input id="ban_offensive_items" class="ban-input" placeholder="item1, item2" />

        <label>Mod Notes</label>
        <textarea id="ban_mod_notes" class="ban-textarea" placeholder="Optional moderator notes"></textarea>

        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="submit" class="ban-button">Create Ban</button>
          <button type="button" class="ban-button" id="ban_cancel_btn" style="background:#666;">Cancel</button>
        </div>
      </form>
    `;

    openOverlay1(`<div style="background:#000;padding:20px;border-radius:12px;color:#fff;">${html}</div>`);

    setTimeout(() => {
      const searchInput = document.getElementById('ban_username_search');
      const resultsContainer = document.getElementById('ban_search_results');
      const hiddenUserId = document.getElementById('ban_user_id');
      const userDisplay = document.getElementById('ban_user_display');
      const cancelBtn = document.getElementById('ban_cancel_btn');

      // If a prefill was set (from Ban User button), populate selected user
      if (window._ban_prefill && window._ban_prefill.id) {
        hiddenUserId.value = window._ban_prefill.id;
        userDisplay.textContent = `${window._ban_prefill.username} (${window._ban_prefill.id})`;
        // clear the prefill so subsequent opens don't reuse it
        delete window._ban_prefill;
      }

      let debounceTimer = null;

      function clearResults() {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
        resultsContainer.setAttribute('aria-hidden', 'true');
      }

      function showResults(items) {
        resultsContainer.innerHTML = '';
        if (!items || items.length === 0) return clearResults();
        items.forEach(u => {
          const it = document.createElement('div');
          it.className = 'ban-search-item';
          it.dataset.id = u.id;
          const avatar = u.avatar_url || (`https://placehold.co/40x40/8a2be2/ffffff?text=${(u.username||'U').charAt(0).toUpperCase()}`);
          it.innerHTML = `<img src="${avatar}" style="width:32px;height:32px;border-radius:8px;object-fit:cover;margin-right:8px;vertical-align:middle;"/> <span class="ban-search-username">${u.username}</span>`;
          it.addEventListener('click', () => {
            hiddenUserId.value = u.id;
            userDisplay.textContent = u.username + ' (' + u.id + ')';
            clearResults();
            searchInput.value = '';
          });
          resultsContainer.appendChild(it);
        });
        resultsContainer.style.display = 'block';
        resultsContainer.setAttribute('aria-hidden', 'false');
      }

      searchInput.addEventListener('input', (ev) => {
        const term = ev.target.value.trim();
        if (debounceTimer) clearTimeout(debounceTimer);
        if (term.length < 2) { clearResults(); return; }
        debounceTimer = setTimeout(async () => {
          try {
            const { data: users, error } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .ilike('username', `%${term}%`)
              .limit(6);
            if (error) { console.error('ban search error', error); return clearResults(); }
            showResults(users || []);
          } catch (ex) {
            console.error('ban search unexpected', ex);
            clearResults();
          }
        }, 300);
      });

      cancelBtn.addEventListener('click', () => closeOverlay());

      // Handle form submit
      const form = document.getElementById('createBanForm');
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const user_id = hiddenUserId.value;
        if (!user_id) return alert('Please select a user from search results first.');
        const ban_type = document.getElementById('ban_type').value;
        const reason = document.getElementById('ban_reason').value;
  const expires_raw = document.getElementById('ban_expires_at').value || null;
  const expires_at = expires_raw ? new Date(expires_raw).toISOString() : null;
        const show_appeal = document.getElementById('ban_show_appeal').value === 'true';
        const offensive_items_raw = document.getElementById('ban_offensive_items').value;
        const offensive_items = offensive_items_raw ? offensive_items_raw.split(',').map(s=>s.trim()).filter(Boolean) : null;
        const mod_notes = document.getElementById('ban_mod_notes').value || null;

        try {
          const { data: ins, error: insErr } = await supabase.from('bans').insert([{ user_id, ban_type, reason, expires_at, show_appeal, offensive_items, mod_notes }]).select();
          if (insErr) {
            console.error('createBan: error', insErr);
            return alert('Failed to create ban: ' + (insErr.message || JSON.stringify(insErr)));
          }
          alert('Ban created');
          closeOverlay();
          await refreshBans();
        } catch (ex) {
          console.error('createBan: unexpected', ex);
          alert('Failed to create ban. See console.');
        }
      });
    }, 50);
  });
});

// Try to refresh bans when admin page loads
window.addEventListener('DOMContentLoaded', () => {
  try { refreshBans(); } catch(e) { console.warn('refreshBans failed to start:', e); }
});

