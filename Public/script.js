const avatarInput = document.getElementById('avatarInput');
const avatar = document.getElementById('avatar');
const usernameInput = document.getElementById('usernameInput');
const username = document.getElementById('username');
const audioUpload = document.getElementById('audioUpload');
const uploadBtn = document.getElementById('uploadBtn');
const songList = document.getElementById('songList');

let audioPlayer = null;

// Avatar yükleme
avatarInput.addEventListener('change', () => {
  const file = avatarInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    avatar.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// İsim değiştirme
usernameInput.addEventListener('input', () => {
  username.textContent = usernameInput.value || 'Misafir';
});

// Şarkı yükleme
uploadBtn.addEventListener('click', () => {
  const file = audioUpload.files[0];
  if (!file) {
    alert('Lütfen önce bir şarkı seçin!');
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
        alert('Yükleme başarısız: ' + data.error);
      } else {
        alert('Şarkı yüklendi!');
        audioUpload.value = '';
        loadSongs();
      }
    })
    .catch(() => alert('Yükleme sırasında hata oluştu.'));
});

// Şarkıları listele
function loadSongs() {
  fetch('/songs')
    .then(res => res.json())
    .then(files => {
      songList.innerHTML = '';
      files.forEach(file => {
        const li = document.createElement('li');

        const playBtn = document.createElement('button');
        playBtn.textContent = '▶️ Çal';
        playBtn.onclick = () => playSong(file);

        const delBtn = document.createElement('button');
        delBtn.textContent = '❌ Sil';
        delBtn.style.marginLeft = '10px';
        delBtn.onclick = () => deleteSong(file);

        const span = document.createElement('span');
        span.textContent = file;

        li.appendChild(span);
        li.appendChild(playBtn);
        li.appendChild(delBtn);
        songList.appendChild(li);
      });
    })
    .catch(() => alert('Şarkılar yüklenemedi.'));
}

// Şarkı çalma
function playSong(filename) {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.remove();
    audioPlayer = null;
  }
  audioPlayer = new Audio('/songs/' + filename);
  audioPlayer.play();
}

// Şarkı silme
function deleteSong(filename) {
  if (!confirm(`"${filename}" silinsin mi?`)) return;

  fetch('/songs/' + filename, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Silme işlemi başarısız: ' + data.error);
      } else {
        alert('Şarkı silindi.');
        loadSongs();
      }
    })
    .catch(() => alert('Silme sırasında hata oluştu.'));
}

// Sayfa yüklendiğinde şarkıları getir
window.onload = () => {
  loadSongs();
  startBackgroundAnimation();
};

// Canvas arka plan animasyonu
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

  const colors = ['#7B3F00', '#3E4E3C', '#A9DFF7']; // şarap kırmızısı, yeşil, bebek mavisi
  let step = 0;

  function animate() {
    step += 0.005;
    const gradient = ctx.createLinearGradient(0, 0, width, height);

    colors.forEach((color, i) => {
      let pos = (step + i / colors.length) % 1;
      gradient.addColorStop(pos, color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    requestAnimationFrame(animate);
  }
  animate();
    }
