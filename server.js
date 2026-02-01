const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect("mongodb://localhost:27017/konveksiDB")
  .then(() => console.log("Terhubung ke MongoDB NoSQL"))
  .catch((err) => console.error(err));

//SCHEMAS (3 COLLECTIONS)
// 1. Users
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
  }),
);

// 2. Products
const Product = mongoose.model(
  "Product",
  new mongoose.Schema({
    nama: String,
    harga: Number,
    gambar: String, //url gambar
    deskripsi: String,
  }),
);
// 3. Orders
const Order = mongoose.model(
  "Order",
  new mongoose.Schema({
    username: String,
    items: Array,
    total: Number,
    status: { type: String, default: "Pending" },
    paymentMethod: { type: String, default: "Transfer Bank" },
    tanggal: { type: Date, default: Date.now },
  }),
);

// 1. REGISTER (Create User)
app.post("/api/register", async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = new User({
    username: req.body.username,
    password: hashedPassword,
  });
  await user.save();
  res.json({ message: "Berhasil Daftar" });
});

// 2. LOGIN (Read User)
app.post("/api/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && (await bcrypt.compare(req.body.password, user.password))) {
    res.json({ success: true, username: user.username });
  } else {
    res.status(401).json({ success: false, message: "Gagal Login" });
  }
});

// 3. GET PRODUCTS (Read Products)
app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// 4. CHECKOUT (Create Order)
app.post("/api/orders", async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.json({ message: "Pesanan Masuk ke MongoDB!" });
});

// 5. CREATE : TAMBAH PRODUK BARU
app.post("/api/products", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json({ success: true, message: "Produk berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan produk",
      error: error.message,
    });
  }
});

// 6. UPDATE: Edit Produk berdasarkan ID
app.put("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true, message: "Produk berhasil diperbarui!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. DELETE: Hapus Produk berdasarkan ID
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Produk berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. GET ORDERS: Ambil semua daftar pesanan
app.get("/api/orders", async (req, res) => {
  try {
    // Ambil semua order, urutkan dari yang terbaru (descending)
    const orders = await Order.find().sort({ tanggal: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 9. DELETE ORDER: Hapus pesanan (opsional, buat bersih-bersih data)
app.delete("/api/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Pesanan dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 10. GET USER ORDERS: Ambil pesanan khusus untuk user tertentu
app.get("/api/orders/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    // Cari order berdasarkan username, urutkan dari yang terbaru
    const orders = await Order.find({ username: username }).sort({
      tanggal: -1,
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 11. UPDATE ORDER (Bisa untuk Status ATAU Detail Barang)
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // req.body bisa berisi { status: ... } ATAU { items: ... }
    // Kita update apapun yang dikirim oleh frontend
    await Order.findByIdAndUpdate(id, req.body);

    res.json({ success: true, message: "Pesanan berhasil diperbarui!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(3000, () => console.log("Server jalan di port 3000"));
