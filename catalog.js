// AUTH GUARD

const loggedInFirstName = localStorage.getItem("firstName");

const loggedInUsername = localStorage.getItem("username");

const loggedInUserId = localStorage.getItem("userId");

// kalau sesi tidak ada (falsy), paksa kembali ke login.
if (!loggedInFirstName) {
  window.location.href = "login.html";
}

// KONSTANTA

const PRODUCTS_API = "https://dummyjson.com/products";

const FETCH_PAGE_LIMIT = 100;

const PAGE_SIZE = 8;

const DEBOUNCE_DELAY = 400;

// Key keranjang dibuat spesifik per user agar tiap akun punya keranjang sendiri
// Fallback ke firstName untuk sesi lama yang belum menyimpan username.
const CART_OWNER = loggedInUsername || loggedInUserId || loggedInFirstName;

const CART_KEY = CART_OWNER ? `cartItems_${CART_OWNER}` : "cartItems";

const LEGACY_CART_KEY = "cartItems";

// REFERENSI DOM

const productGrid = document.getElementById("productGrid");

const resultCount = document.getElementById("resultCount");

const searchInput = document.getElementById("searchInput");

const categoryFilter = document.getElementById("categoryFilter");

const sortFilter = document.getElementById("sortFilter");

const loadMoreBtn = document.getElementById("loadMoreBtn");

const loadMoreWrap = document.getElementById("loadMoreWrap");

const userGreeting = document.getElementById("userGreeting");

const cartCountEl = document.getElementById("cartCount");

const cartTotalEl = document.getElementById("cartTotal");

const productModal = document.getElementById("productModal");

const modalBody = document.getElementById("modalBody");

const closeModalBtn = document.getElementById("closeModalBtn");

const logoutBtn = document.getElementById("logoutBtn");

// STATE APLIKASI

let allProducts = []; // seluruh data mentah dari API

let workingProducts = []; // hasil setelah search + filter + sort diterapkan

let visibleCount = PAGE_SIZE; // berapa banyak produk yang saat ini ditampilkan

let currentSearchTerm = "";

let currentCategory = "all";

let currentSort = "default";

let cartQty = 0; // jumlah item di keranjang (navbar)

let cartTotalPrice = 0; // total harga keseluruhan (navbar)

let cartItems = []; // daftar produk di keranjang: [{ id, title, price, qty }]

// NAVBAR: SAPAAN

// pengaman tambahan bila firstName kosong.
userGreeting.textContent = loggedInFirstName ?? "Pengguna";

// NAVBAR: LOGOUT

// Logout: hapus sesi; pertahankan keranjang per-user & bersihkan key global
logoutBtn.addEventListener("click", function () {
  localStorage.removeItem("firstName");

  localStorage.removeItem("username");

  localStorage.removeItem("userId");

  localStorage.removeItem(LEGACY_CART_KEY);

  cartItems = [];
  cartQty = 0;
  cartTotalPrice = 0;

  window.location.href = "login.html";
});

// FUNGSI UTILITAS

// function Declaration: formatRupiah

function formatRupiah(price = 0) {
  // Mengalikan harga USD dari API dengan kurs 15.000 agar tampil dalam nominal Rupiah realistis
  const hargaRupiah = price * 15000;

  return "Rp " + Math.round(hargaRupiah).toLocaleString("id-ID");
}

/**
 * Function Declaration: renderStars
 * Membangun tampilan rating bintang menggunakan while loop.
 */
function renderStars(rating) {
  const fullStars = Math.round(rating);

  let stars = "";

  let i = 0;

  // berputar selama kondisi (i < 5) masih true.
  while (i < 5) {
    // bintang penuh atau bintang kosong.
    stars += i < fullStars ? "★" : "☆";

    i++; // wajib diubah agar tidak infinite loop
  }

  return stars;
}

// Function Declaration: getStockLabel

function getStockLabel(stock) {
  if (stock === 0) {
    return { text: "Stok Habis", className: "stock-out" };
  } else if (stock <= 10) {
    return { text: `Sisa ${stock}`, className: "stock-low" };
  } else {
    return { text: "Tersedia", className: "stock-ok" };
  }
}

// Arrow Function: escapeHtml
const escapeHtml = (text) =>
  String(text).replace(
    /[&<>"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      })[char],
  );

// mengingat variabel timerId dari fungsi luar meskipun debounce() sudah selesai dieksekusi yang membuat pencarian tidak memicu re-render di setiap ketikan keyboard.
function debounce(callback, delay) {
  let timerId; // tetap hidup berkat closure

  return function (...args) {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}

// FETCH PRODUK + GLOBAL ERROR HANDLING

function renderSkeletons(count = 8) {
  let html = "";

  // jumlah putaran sudah pasti diketahui.
  for (let i = 0; i < count; i++) {
    html += `
            <div class="skeleton">
                <div class="sk-thumb"></div>
                <div class="sk-line" style="width:70%"></div>
                <div class="sk-line" style="width:40%; margin-bottom:12px;"></div>
            </div>
        `;
  }

  productGrid.innerHTML = html;
}

function renderFetchError(message) {
  productGrid.innerHTML = `
        <div class="state-block error">
            <p><strong>Gagal memuat produk.</strong></p>
            <p>${escapeHtml(message)}</p>
            <button class="btn-outline" id="retryFetchBtn">Coba Lagi</button>
        </div>
    `;

  loadMoreWrap.style.display = "none";

  resultCount.textContent = "";

  document
    .getElementById("retryFetchBtn")
    .addEventListener("click", fetchProducts);
}

// Ambil seluruh produk dari API halaman demi halaman sampai lengkap karena API membatasi jumlah data per request.

async function fetchAllProductsFromApi() {
  let combinedProducts = [];

  let skip = 0;

  let total = Infinity; // nilai awal sekadar tidak diketahui, diganti setelah request pertama

  let pageCount = 0; // penghitung halaman, dipakai sebagai jaring pengaman

  while (skip < total) {
    pageCount++;

    // Pengaman: Hentikan loop jika >20 halaman untuk mencegah infinite loop.
    if (pageCount > 20) {
      break;
    }

    const response = await fetch(
      `${PRODUCTS_API}?limit=${FETCH_PAGE_LIMIT}&skip=${skip}`,
    );

    if (!response.ok) {
      throw new Error(`Server merespons dengan status ${response.status}.`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.products)) {
      throw new Error("Format data produk tidak dikenali.");
    }

    combinedProducts = combinedProducts.concat(data.products);

    total = data.total; // total keseluruhan produk di server

    skip += FETCH_PAGE_LIMIT;
  }

  return combinedProducts;
}

// mengambil seluruh produk dari Products API secara dinamis dengan fetch(), dibungkus try...catch untuk Global Error Handling.

async function fetchProducts() {
  renderSkeletons(PAGE_SIZE);

  try {
    allProducts = await fetchAllProductsFromApi();

    populateCategoryOptions(allProducts);

    applyFiltersAndRender();
  } catch (error) {
    const isNetworkError = error instanceof TypeError;

    const message = isNetworkError
      ? "Periksa koneksi internet kamu, lalu coba lagi."
      : error.message;

    renderFetchError(message);
  }
}

// FILTER KATEGORI (populate dropdown)

// Kumpulkan kategori unik untuk mengisi elemen <select>

function populateCategoryOptions(products) {
  const categorySet = new Set();

  for (const product of products) {
    // lewati produk yang tidak punya kategori
    if (!product.category) {
      continue;
    }

    categorySet.add(product.category);
  }

  const categories = Array.from(categorySet).sort();

  let optionsHtml = '<option value="all">Semua Kategori</option>';

  for (const category of categories) {
    const label = category.replace(/-/g, " ");

    optionsHtml += `<option value="${category}">${escapeHtml(label)}</option>`;
  }

  categoryFilter.innerHTML = optionsHtml;
}

// SEARCH (Debounce + Closure), FILTER & SORT (Functional Programming)

// Pipeline: filter (search + kategori) -> sort -> reset pagination -> render.

function applyFiltersAndRender() {
  const keyword = currentSearchTerm.trim().toLowerCase();

  workingProducts = allProducts.filter((product) => {
    const matchesKeyword =
      keyword === ""
        ? true // keyword kosong -> loloskan semua produk
        : product.title.toLowerCase().includes(keyword) ||
          product.category.toLowerCase().includes(keyword);

    const matchesCategory =
      currentCategory === "all" ? true : product.category === currentCategory;

    return matchesKeyword && matchesCategory;
  });

  // Sorting menentukan comparator yang dipakai.
  if (currentSort === "price-asc") {
    workingProducts.sort((a, b) => a.price - b.price);
  } else if (currentSort === "price-desc") {
    workingProducts.sort((a, b) => b.price - a.price);
  } else if (currentSort === "rating-desc") {
    workingProducts.sort((a, b) => b.rating - a.rating);
  }
  // biarkan urutan asli dari API.

  visibleCount = PAGE_SIZE; // setiap kali filter/sort berubah, pagination direset

  renderProductGrid();
}

// Debounce dibungkus khusus untuk input pencarian.
const handleSearchDebounced = debounce(function (value) {
  currentSearchTerm = value;

  applyFiltersAndRender();
}, DEBOUNCE_DELAY);

searchInput.addEventListener("input", function (event) {
  handleSearchDebounced(event.target.value);
});

categoryFilter.addEventListener("change", function (event) {
  currentCategory = event.target.value;

  applyFiltersAndRender();
});

sortFilter.addEventListener("change", function (event) {
  currentSort = event.target.value;

  applyFiltersAndRender();
});

// RENDER PRODUK + LOAD MORE (Array Slicing)

const buildProductCardHtml = (product) => {
  const stock = getStockLabel(product.stock);

  const hasDiscount = product.discountPercentage > 0;

  const oldPrice = product.price / (1 - product.discountPercentage / 100);

  return `
        <article class="product-card" data-id="${product.id}">
            <div class="product-thumb">
                ${hasDiscount ? `<span class="discount-tag">-${Math.round(product.discountPercentage)}%</span>` : ""}
                <img src="${product.thumbnail}" alt="${escapeHtml(product.title)}" loading="lazy">
            </div>
            <div class="product-body">
                <div class="product-category">${escapeHtml(product.category.replace(/-/g, " "))}</div>
                <div class="product-title">${escapeHtml(product.title)}</div>
                <div class="price-row">
                    <span class="price-now">${formatRupiah(product.price)}</span>
                    ${hasDiscount ? `<span class="price-old">${formatRupiah(oldPrice)}</span>` : ""}
                </div>
                <div class="rating-row">
                    <span>${renderStars(product.rating)}</span>
                    <span>${product.rating.toFixed(1)}</span>
                    <span class="stock-label ${stock.className}">${stock.text}</span>
                </div>
                <button class="btn-add-cart" data-id="${product.id}">+ Keranjang</button>
            </div>
        </article>
    `;
};

// Load More / Pagination memakai teknik Array Slicing: hanya produk dari index 0 sampai visibleCount yang dirender.

function renderProductGrid() {
  if (workingProducts.length === 0) {
    productGrid.innerHTML = `
            <div class="state-block">
                Tidak ada produk yang cocok dengan pencarian/filter kamu.
            </div>
        `;

    loadMoreWrap.style.display = "none";

    resultCount.textContent = "0 produk ditemukan";

    return;
  }

  const visibleProducts = workingProducts.slice(0, visibleCount); // Array Slicing

  let cardsHtml = "";

  for (const product of visibleProducts) {
    // for...of

    cardsHtml += buildProductCardHtml(product);
  }

  productGrid.innerHTML = cardsHtml;

  resultCount.textContent = `${workingProducts.length} produk ditemukan`;

  // tombol Load More hanya tampil jika masih ada sisa data.
  loadMoreWrap.style.display =
    visibleCount < workingProducts.length ? "flex" : "none";
}

loadMoreBtn.addEventListener("click", function () {
  visibleCount += PAGE_SIZE; // tambah batch berikutnya

  renderProductGrid();
});

// KERANJANG: TOMBOL "+ KERANJANG" + ALERT + NAVBAR + LOCALSTORAGE

/** Muat data keranjang per-user dari localStorage agar persisten setelah refresh. */

function loadCartFromStorage() {
  try {
    let raw = localStorage.getItem(CART_KEY);

    // Migrasi data dari key global lama ke key per-user jika ada.
    if (!raw && CART_KEY !== LEGACY_CART_KEY) {
      const legacyRaw = localStorage.getItem(LEGACY_CART_KEY);

      if (legacyRaw) {
        localStorage.setItem(CART_KEY, legacyRaw);
        localStorage.removeItem(LEGACY_CART_KEY);
        raw = legacyRaw;
      }
    }

    // kalau belum ada data, pakai keranjang kosong.
    if (!raw) {
      cartItems = [];
      recalcCartTotals();
      return;
    }

    const parsed = JSON.parse(raw);

    // Pastikan formatnya array, kalau rusak pakai keranjang kosong.
    cartItems = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    cartItems = [];
  }

  recalcCartTotals();
}

// Menyimpan daftar produk + harga + qty ke localStorage sebagai teks JSON dengan key per-user "cartItems_<username>".

function saveCartToStorage() {
  localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
}

// Menghitung ulang kuantitas & total harga dari cartItems memakai Array reduce.

function recalcCartTotals() {
  cartQty = cartItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  cartTotalPrice = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0,
  );
}

// Menambah produk ke cartItems: kalau id sudah ada, qty +1, kalau belum ada, push entri baru { id, title, price, qty }.

function addProductToCart(product) {
  const existing = cartItems.find((item) => item.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cartItems.push({
      id: product.id,
      title: product.title,
      price: Number(product.price) || 0,
      qty: 1,
    });
  }

  saveCartToStorage();

  recalcCartTotals();

  updateCartSummary();
}

// Memperbarui angka kuantitas & total harga di navbar setiap kali ada produk yang masuk keranjang

function updateCartSummary() {
  cartCountEl.textContent = cartQty;

  // Dikalikan 15.000 agar tampilan total belanja di navbar serasi dengan harga produk
  cartTotalEl.textContent = Math.round(cartTotalPrice * 15000).toLocaleString(
    "id-ID",
  );
}

// Event Delegation: tangani klik tombol keranjang dan buka modal produk
productGrid.addEventListener("click", function (event) {
  const cartBtn = event.target.closest(".btn-add-cart");

  if (cartBtn) {
    const productId = Number(cartBtn.dataset.id);

    const product = allProducts.find((item) => item.id === productId);

    const productName = product ? product.title : "Produk";

    alert(`Berhasil menambahkan ${productName} ke keranjang!`);

    // alert() bersifat blocking, jadi kode di bawahnya baru berjalan setelah dialog ditutup
    if (!product) {
      return;
    }

    addProductToCart(product);
    return;
  }

  // Klik pada area kartu produk (selain tombol keranjang) -> buka modal detail.
  // abaikan klik yang bukan di dalam kartu produk.
  const card = event.target.closest(".product-card");
  if (!card) {
    return;
  }

  const cardId = Number(card.dataset.id);

  const cardProduct = allProducts.find((item) => item.id === cardId);

  if (!cardProduct) {
    return;
  }

  openProductModal(cardProduct);
});

// MODAL DETAIL PRODUK

// Menampilkan pop-up berisi info lengkap: gambar, judul, merek, kategori, deskripsi, stok, rating, dan harga.

function openProductModal(product) {
  const stock = getStockLabel(product.stock);

  const brand = product.brand ?? "-";

  const description = product.description ?? "Tidak ada deskripsi.";

  modalBody.innerHTML = `
    <img src="${product.thumbnail}" alt="${escapeHtml(product.title)}" class="modal-img">
    <div class="modal-category">${escapeHtml(String(product.category ?? "").replace(/-/g, " "))}</div>
    <h2 class="modal-title">${escapeHtml(product.title)}</h2>
    <div class="modal-brand">Merek: <strong>${escapeHtml(brand)}</strong></div>
    <div class="modal-rating">
      <span>${renderStars(product.rating)}</span>
      <span>${Number(product.rating).toFixed(1)}</span>
      <span class="stock-label ${stock.className}">${stock.text} (${Number(product.stock) || 0})</span>
    </div>
    <p class="modal-desc">${escapeHtml(description)}</p>
    <div class="modal-price-row">
      <span class="price-now">${formatRupiah(product.price)}</span>
    </div>
    <button class="btn-add-cart" data-id="${product.id}">+ Keranjang</button>
  `;

  productModal.style.display = "flex";
}

// Menyembunyikan pop-up detail produk
function closeProductModal() {
  productModal.style.display = "none";
}

closeModalBtn.addEventListener("click", closeProductModal);

// Klik area gelap di luar konten -> tutup modal
productModal.addEventListener("click", function (event) {
  if (event.target === productModal) {
    closeProductModal();
  }
});

// Tombol Escape -> tutup modal
document.addEventListener("keydown", function (event) {
  if (event.key !== "Escape") {
    return;
  }

  if (productModal.style.display === "flex") {
    closeProductModal();
  }
});

// Tombol "+ Keranjang" di dalam modal ikut menambah keranjang
modalBody.addEventListener("click", function (event) {
  const cartBtn = event.target.closest(".btn-add-cart");

  if (!cartBtn) {
    return;
  }

  const productId = Number(cartBtn.dataset.id);

  const product = allProducts.find((item) => item.id === productId);

  if (!product) {
    return;
  }

  alert(`Berhasil menambahkan ${product.title} ke keranjang!`);

  addProductToCart(product);

  closeProductModal();
});

// INISIALISASI APLIKASI

function initApp() {
  loadCartFromStorage();

  updateCartSummary();

  fetchProducts();
}

initApp();
