const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(express.json());

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Şarkı yükle
app.post('/upload', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya yüklenmedi.' });
  res.json({ filename: req.file.filename });
});

// Şarkı listesi getir
app.get('/songs', (req, res) => {
  fs.readdir(uploadFolder, (err, files) => {
    if (err) return res.status(500).json({ error: 'Dosya listelenemedi.' });
    res.json(files);
  });
});

// Şarkı sil
app.delete('/songs/:name', (req, res) => {
  const filePath = path.join(uploadFolder, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Dosya bulunamadı.' });

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Dosya silinemedi.' });
    res.json({ message: 'Dosya silindi.' });
  });
});

// Şarkı dosyasını sun
app.get('/songs/:name', (req, res) => {
  const filePath = path.join(uploadFolder, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).send('Dosya bulunamadı');
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`🚀 Beatify server çalışıyor: http://localhost:${PORT}`);
});
