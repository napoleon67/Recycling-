const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Multer: Dosya yükleme ayarı
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 🔼 Şarkı yükleme
app.post('/upload', upload.single('audio'), (req, res) => {
  const title = req.body.title || 'Untitled';
  const artist = req.body.artist || 'Unknown';
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded.' });

  // Metadata dosyasını kaydet
  const metadata = {
    title,
    artist,
    filename: file.filename
  };

  fs.writeFileSync(
    path.join(uploadFolder, file.filename + '.json'),
    JSON.stringify(metadata, null, 2)
  );

  res.json(metadata);
});

// 🎵 Yüklenen şarkıları listele
app.get('/songs', (req, res) => {
  const files = fs.readdirSync(uploadFolder).filter(file => file.endsWith('.mp3'));
  const list = files.map(file => {
    const metaPath = path.join(uploadFolder, file + '.json');
    let metadata = { title: file, artist: 'Unknown', filename: file };

    if (fs.existsSync(metaPath)) {
      try {
        const content = fs.readFileSync(metaPath, 'utf-8');
        const parsed = JSON.parse(content);
        metadata = { ...metadata, ...parsed };
      } catch {}
    }

    return metadata;
  });

  res.json(list);
});

// 🎧 Şarkı dosyasını sun
app.get('/songs/:filename', (req, res) => {
  const filePath = path.join(uploadFolder, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found.' });
  }
});

// ❌ Şarkı silme
app.delete('/songs/:filename', (req, res) => {
  const audioPath = path.join(uploadFolder, req.params.filename);
  const metaPath = audioPath + '.json';

  try {
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed.' });
  }
});

app.listen(PORT, () => console.log(`🎵 Beatify server running on port ${PORT}`));
