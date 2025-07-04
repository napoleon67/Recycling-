const avatarInput = document.getElementById('avatarInput');
const avatar = document.getElementById('avatar');
const usernameInput = document.getElementById('usernameInput');
const username = document.getElementById('username');
const audioUpload = document.getElementById('audioUpload');
const uploadBtn = document.getElementById('uploadBtn');
const songList = document.getElementById('songList');

let audioPlayer = null;

avatarInput.addEventListener('change', () => {
  const file = avatarInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    avatar.src = reader.result;
  };
  reader.readAsDataURL(file);
});

usernameInput.addEventListener('input', () => {
  username.textContent = usernameInput.value || 'Guest';
});

uploadBtn.addEventListener('click', () => {
  const file = audioUpload.files[0];
  if (!file) {
    alert('Please select a song first!');
    return;
  }

  const formData = new FormData();
  formData.append('audio', file);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Upload failed: ' + data.error);
      } else {
        alert('Song uploaded!');
        audioUpload.value = '';
        loadSongs();
      }
    })
    .catch(() => alert('Upload error.'));
});

function loadSongs() {
  fetch('/songs')
    .then(res => res.json())
    .then(files => {
      songList.innerHTML = '';
      files.forEach(file => {
        const li = document.createElement('li');

        const playBtn = document.createElement('button');
        playBtn.textContent = '▶️ Play';
        playBtn.onclick = () => playSong(file);

        const stopBtn = document.createElement('button');
        stopBtn.textContent = '⏹ Stop';
        stopBtn.onclick = () => stopSong();

        const delBtn = document.createElement('button');
        delBtn.textContent = '❌ Delete';
        delBtn.style.marginLeft = '10px';
        delBtn.onclick = () => deleteSong(file);

        const span = document.createElement('span');
        span.textContent = file;

        li.appendChild(span);
        li.appendChild(playBtn);
        li.appendChild(stopBtn);
        li.appendChild(delBtn);
        songList.appendChild(li);
      });
    })
    .catch(() => alert('Could not load songs.'));
}

function playSong(filename) {
  stopSong();
  audioPlayer = new Audio('/songs/' + filename);
  audioPlayer.play();
}

function stopSong() {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer = null;
  }
}

function deleteSong(filename) {
  if (!confirm(`Delete "${filename}"?`)) return;

  fetch('/songs/' + filename, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Delete failed: ' + data.error);
      } else {
        alert('Song deleted.');
        loadSongs();
      }
    })
    .catch(() => alert('Delete error.'));
}

window.onload = () => {
  loadSongs();
  startBackgroundAnimation();
  showAdOnce();
};

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

  const colors = ['#7B3F00', '#A9DFF7', '#3E4E3C'];
  const circles = Array.from({ length: 25 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 20 + Math.random() * 30,
    dx: -0.5 + Math.random(),
    dy: -0.5 + Math.random(),
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
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
  if (Math.random() > 0.5) return; // %50 ihtimalle

  const adBox = document.createElement('div');
  adBox.style.position = 'fixed';
  adBox.style.bottom = '20px';
  adBox.style.left = '20px';
  adBox.style.padding = '20px';
  adBox.style.background = 'rgba(0, 0, 0, 0.8)';
  adBox.style.color = 'white';
  adBox.style.borderRadius = '10px';
  adBox.style.zIndex = 9999;
  adBox.innerHTML = `
    <strong>Ad:</strong><br>
    I hate ads, so I bought this one. There's nothing here.
    <br><br>
    <button id="closeAd" style="margin-top:10px;padding:5px;">Close Ad</button>
  `;

  document.body.appendChild(adBox);
  localStorage.setItem('adShown', 'true');

  setTimeout(() => {
    const closeBtn = document.getElementById('closeAd');
    closeBtn.onclick = () => adBox.remove();
  }, 5000);
}
