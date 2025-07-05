const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const upload = multer();

// === Cloudinary Ayarları ===
cloudinary.config({
  cloud_name: 'beatify',
  api_key: '228552328415657',
  api_secret: '1s7Y2g8kK1uxso5aNw_2vz_lqLE'
});

// === MongoDB Bağlantısı ===
mongoose.connect('mongodb+srv://beatify:1234@cluster0.mongodb.net/beatify?retryWrites=true&w=majority')
  .then(() => console.log("✅ MongoDB bağlandı"))
  .catch(err => console.error("MongoDB hatası:", err));

// === MongoDB Şema ===
const Song = mongoose.model("Song", {
  username: String,
  songName: String,
  url: String,
  date: { type: Date, default: Date.now }
});

// === Middleware ===
app.use(express.static('public'));
app.use(express.json());

// === Ana Sayfa ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Müzik Yükleme ===
app.post('/upload', upload.single('music'), async (req, res) => {
  const { username, songName } = req.body;
  const file = req.file;
  if (!file) return res.status(400).send("Dosya yok");

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: "video",
      folder: "beatify_songs"
    },
    async (error, result) => {
      if (error) {
        console.error("Yükleme hatası:", error);
        res.status(500).send("Yükleme başarısız");
      } else {
        const newSong = new Song({
          username,
          songName,
          url: result.secure_url
        });
        await newSong.save();
        res.json({ url: result.secure_url });
      }
    }
  );

  streamifier.createReadStream(file.buffer).pipe(uploadStream);
});

// === Müzik Listesi ===
app.get('/songs', async (req, res) => {
  const songs = await Song.find().sort({ date: -1 }).limit(50);
  res.json(songs);
});

// === Sunucu Başlat ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Beatify çalışıyor: http://localhost:${PORT}`);
});
