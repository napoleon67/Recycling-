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
const userFile = path.join(__dirname, 'usernames.json');

// Klasör yoksa oconst express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const path = require('path');

const app = express();
const upload = multer();

cloudinary.config({
  cloud_name: 'beatify',
  api_key: '228552328415657',
  api_secret: '1s7Y2g8kK1uxso5aNw_2vz_lqLE'
});

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('music'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("Dosya yok");

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: "video", // mp3 için video
      folder: "beatify_songs"
    },
    (error, result) => {
      if (error) {
        console.error("Yükleme hatası:", error);
        res.status(500).send("Yükleme başarısız");
      } else {
        res.json({ url: result.secure_url });
      }
    }
  );

  streamifier.createReadStream(file.buffer).pipe(uploadStream);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Beatify sunucusu çalışıyor: http://localhost:${PORT}`);
});
luştur
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
if (!fs.existsSync(userFile)) fs.writeFileSync(userFile, JSON.stringify([]));

// Multer ayarı
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Yükleme işlemi
app.post('/upload', upload.single('audio'), (req, res) => {
  const title = req.body.title || 'Untitled';
  const artist = req.body.artist || 'Unknown';
  const username = req.body.user?.trim();

  if (!req.file || !username) {
    return res.status(400).json({ error: 'Missing file or username.' });
  }

  const allUsers = JSON.parse(fs.readFileSync(userFile));
  if (!allUsers.includes(username)) {
    allUsers.push(username);
    fs.writeFileSync(userFile, JSON.stringify(allUsers, null, 2));
  } else {
    return res.status(400).json({ error: 'Username already used.' });
  }

  const metadata = {
    title,
    artist,
    filename: req.file.filename,
    user: username
  };

  fs.writeFileSync(
    path.join(uploadFolder, req.file.filename + '.json'),
    JSON.stringify(metadata, null, 2)
  );

  res.json(metadata);
});

// Listeleme
app.get('/songs', (req, res) => {
  const files = fs.readdirSync(uploadFolder).filter(f => f.endsWith('.mp3'));
  const list = files.map(file => {
    const metaPath = path.join(uploadFolder, file + '.json');
    let meta = {
      filename: file,
      title: file,
      artist: 'Unknown'
    };
    if (fs.existsSync(metaPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        meta = { ...meta, ...data };
      } catch {}
    }
    return meta;
  });
  res.json(list);
});

// Silme
app.delete('/songs/:filename', (req, res) => {
  const file = path.join(uploadFolder, req.params.filename);
  const meta = file + '.json';
  try {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    if (fs.existsSync(meta)) fs.unlinkSync(meta);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.listen(PORT, () => console.log(`🎧 Beatify running at http://localhost:${PORT}`));
