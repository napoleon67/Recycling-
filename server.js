const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const upload = multer();

// Cloudinary ayarları
cloudinary.config({
  cloud_name: 'beatify',
  api_key: '228552328415657',
  api_secret: '1s7Y2g8kK1uxso5aNw_2vz_lqLE'
});

// MongoDB bağlantısı
mongoose.connect('mongodb+srv://Beatify:123456788@cluster0.kfhmbbq.mongodb.net/beatify?retryWrites=true&w=majority')
  .then(() => console.log("✅ MongoDB bağlandı"))
  .catch(err => console.error("MongoDB hatası:", err));

// Şemalar
const Song = mongoose.model("Song", {
  username: String,
  songName: String,
  url: String,
  likes: { type: Number, default: 0 },
  comments: [{ username: String, text: String, date: { type: Date, default: Date.now } }],
  date: { type: Date, default: Date.now }
});

const User = mongoose.model("User", {
  username: { type: String, unique: true },
  password: String
});

app.use(express.static('public'));
app.use(express.json());

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Kayıt
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: "Kullanıcı adı alınmış" });
  }
});

// Giriş
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// Şarkı yükleme
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

// Şarkıları listele (filtreli)
app.get('/songs', async (req, res) => {
  const filter = {};
  if (req.query.user) filter.username = req.query.user;
  if (req.query.q) filter.songName = new RegExp(req.query.q, 'i');

  const songs = await Song.find(filter).sort({ date: -1 }).limit(50);
  res.json(songs);
});

// Şarkı silme
app.delete('/songs/:id', async (req, res) => {
  try {
    await Song.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Beğenme
app.post('/songs/:id/like', async (req, res) => {
  await Song.updateOne({ _id: req.params.id }, { $inc: { likes: 1 } });
  res.json({ success: true });
});

// Yorum ekleme
app.post('/songs/:id/comment', async (req, res) => {
  const { username, text } = req.body;
  await Song.updateOne(
    { _id: req.params.id },
    { $push: { comments: { username, text } } }
  );
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Beatify çalışıyor: http://localhost:${PORT}`);
});
