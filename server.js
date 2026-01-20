const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = 3000;

// 1. KONEKSI DATABASE
mongoose
  .connect("mongodb://127.0.0.1:27017/db_konveksi")
  .then(() => console.log("✅ DATABASE CONNECTED"))
  .catch((err) => console.error("❌ Gagal Konek:", err));

// 2. MIDDLEWARE (Urutan ini sangat penting)
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Cukup pasang satu kali di sini untuk semua fitur
app.use(express.static("public"));

// 3. SKEMA DATA
const OrderSchema = new mongoose.Schema({
  nama_pemesan: String,
  no_wa: String,
  jenis_baju: String,
  jumlah: Number,
  catatan: String,
  tanggal_pesan: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", OrderSchema);

// --- 4. ROUTES (JALUR API) ---

// CREATE: Simpan pesanan baru
app.post("/kirim-pesanan", async (req, res) => {
  try {
    const pesananBaru = await Order.create({
      nama_pemesan: req.body.nama,
      no_wa: req.body.wa,
      jenis_baju: req.body.jenis,
      jumlah: req.body.qty,
      catatan: req.body.notes,
    });
    // Redirect membawa ID asli ke halaman sukses
    res.redirect(`/sukses.html?id=${pesananBaru._id}&nama=${req.body.nama}`);
  } catch (error) {
    res.status(500).send("Terjadi kesalahan saat memproses pesanan.");
  }
});

// READ ALL: Ambil semua data untuk Admin
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ tanggal_pesan: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data admin" });
  }
});

// READ ONE: Ambil satu data berdasarkan ID (Untuk Nota Customer)
app.get("/api/orders/:id", async (req, res) => {
  try {
    const data = await Order.findById(req.params.id);
    if (!data)
      return res.status(404).json({ error: "Pesanan tidak ditemukan" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Format ID salah atau server error" });
  }
});

// UPDATE: Edit data pesanan
app.put("/api/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Update berhasil!" });
  } catch (error) {
    res.status(500).json({ error: "Gagal update" });
  }
});

// DELETE: Hapus data pesanan
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const hasil = await Order.findByIdAndDelete(req.params.id);
    if (hasil) {
      res.json({ message: "Berhasil dihapus" });
    } else {
      res.status(404).json({ message: "Data sudah tidak ada" });
    }
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus" });
  }
});

// 5. JALANKAN SERVER
app.listen(port, () => {
  console.log(`🚀 Server jalan di http://localhost:${port}`);
});
