const avatarInput = document.getElementById('avatarInput');
const avatar = document.getElementById('avatar');
const usernameInput = document.getElementById('usernameInput');
const username = document.getElementById('username');
const audioUpload = document.getElementById('audioUpload');
const uploadBtn = document.getElementById('uploadBtn');
const songList = document.getElementById('songList');

const songTitleInput = document.getElementById('songTitle');
const artistInput = document.getElementById('artistName');

const audioElement = new Audio();

function saveLocalData() {
  localStorage.setItem('avatarSrc', avatar.src);
  localStorage.setItem('username', usernameInput.value);
}

function loadLocalData() {
  const savedAvatar = localStorage.getItem('avatarSrc');
  const savedUsername = localStorage.getItem('username');
  if (savedAvatar) avatar.src = savedAvatar;
  if (savedUsername) {
    usernameInput.value = savedUsername;
    username.textContent = savedUsername;
  }
}

avatarInput.addEventListener('change', () => {
  const file = avatarInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    avatar.src = reader.result;
    saveLocalData();
  };
  reader.readAsDataURL(file);
});

usernameInput.addEventListener('input', () => {
  username.textContent = usernameInput.value || 'Guest';
  saveLocalData();
});

uploadBtn.addEventListener('click', () => {
  const file = audioUpload.files[0];
  const title = songTitleInput.value || 'Untitled';
  const artist = artistInput.value || 'Unknown';

  if (!file) return alert('Please select a song!');
  if (!usernameInput.value) return alert('Please enter your username first!');

  const formData = new FormData();
  formData.append('audio', file);
  formData.append('title', title);
  formData.append('artist', artist);
  formData.append('user', usernameInput.value);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) alert('Upload error: ' + data.error);
      else {
        alert('Song uploaded!');
        audioUpload.value = '';
        songTitleInput.value = '';
        artistInput.value = '';
        loadSongs();
      }
    });
});

function loadSongs() {
  fetch('/songs')
    .then(res => res.json())
    .then(list => {
      songList.innerHTML = '';
      list.forEach(item => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = `${item.artist} - ${item.title}`;

        const playBtn = document.createElement('button');
        playBtn.textContent = '▶️ Play';
        playBtn.onclick = () => {
          audioElement.src = '/songs/' + item.filename;
          audioElement.play();
        };

        const stopBtn = document.createElement('button');
        stopBtn.textContent = '⏹ Stop';
        stopBtn.onclick = () => {
          audioElement.pause();
          audioElement.currentTime = 0;
        };

        const delBtn = document.createElement('button');
        delBtn.textContent = '❌ Delete';
        delBtn.onclick = () => deleteSong(item.filename);

        li.appendChild(span);
        li.appendChild(playBtn);
        li.appendChild(stopBtn);
        li.appendChild(delBtn);
        songList.appendChild(li);
      });
    });
}

function deleteSong(filename) {
  if (!confirm('Delete this song?')) return;
  fetch('/songs/' + filename, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Deleted.');
        loadSongs();
      } else {
        alert('Delete error.');
      }
    });
}

function startBackgroundAnimation() {
  const canvas = document.getElementById('background');
  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const colors = ['#7B3F00', '#A9DFF7', '#5DAE8B'];

  const circles = Array.from({ length: 20 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 20 + Math.random() * 40,
    dx: -0.5 + Math.random(),
    dy: -0.5 + Math.random(),
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  function animate() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    for (let c of circles) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();

      c.x += c.dx;
      c.y += c.dy;
      if (c.x < 0 || c.x > width) c.dx *= -1;
      if (c.y < 0 || c.y > height) c.dy *= -1;
    }

    requestAnimationFrame(animate);
  }

  animate();
}

function showAdOnce() {
  if (localStorage.getItem('adShown')) return;
  if (Math.random() > 0.5) return;

  const ad = document.createElement('div');
  ad.style.position = 'fixed';
  ad.style.bottom = '20px';
  ad.style.left = '20px';
  ad.style.padding = '20px';
  ad.style.background = 'rgba(0,0,0,0.8)';
  ad.style.color = 'white';
  ad.style.borderRadius = '10px';
  ad.style.zIndex = 9999;
  ad.innerHTML = `
    <strong>Ad:</strong><br>
    I hate ads, so I bought this one. There's nothing here.
    <br><br>
    <button id="closeAd">Close Ad</button>
  `;

  document.body.appendChild(ad);
  localStorage.setItem('adShown', 'true');

  setTimeout(() => {
    document.getElementById('closeAd').onclick = () => ad.remove();
  }, 5000);
}

window.onload = () => {
  loadLocalData();
  loadSongs();
  startBackgroundAnimation();
  showAdOnce();
};
