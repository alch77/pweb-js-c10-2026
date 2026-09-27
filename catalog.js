// =========================
// AUTH GUARD
// =========================

const loggedInFirstName = localStorage.getItem("firstName");

// if tanpa else: kalau sesi tidak ada (falsy), paksa kembali ke login.
if (!loggedInFirstName) {
  window.location.href = "login.html";
}

// =========================
// KONSTANTA
// =========================

const PRODUCTS_API = "https://dummyjson.com/products";

const FETCH_PAGE_LIMIT = 100;

const PAGE_SIZE = 8;

const DEBOUNCE_DELAY = 400;

// =========================
// REFERENSI DOM
// =========================

const productGrid = document.getElementById("productGrid");

const resultCount = document.getElementById("resultCount");

const searchInput = document.getElementById("searchInput");

const categoryFilter = document.getElementById("categoryFilter");

const sortFilter = document.getElementById("sortFilter");

const loadMoreBtn = document.getElementById("loadMoreBtn");

const loadMoreWrap = document.getElementById("loadMoreWrap");

const userGreeting = document.getElementById("userGreeting");

// =========================
// STATE APLIKASI
// =========================

let allProducts = []; // seluruh data mentah dari API (tidak pernah diubah)

let workingProducts = []; // hasil setelah search + filter + sort diterapkan

let visibleCount = PAGE_SIZE; // berapa banyak produk yang saat ini ditampilkan

let currentSearchTerm = "";

let currentCategory = "all";

let currentSort = "default";

// =========================
// NAVBAR: SAPAAN
// =========================

// Nullish coalescing (??) sekadar pengaman tambahan bila firstName kosong.
userGreeting.textContent = loggedInFirstName ?? "Pengguna";

// =========================
// FUNGSI UTILITAS
// =========================

/**
 * Function Declaration: formatRupiah
 * Dipakai berulang kali di banyak tempat -> cocok pakai Function
 * Declaration (hoisting). Default Parameter dipakai agar tetap aman
 * dipanggil tanpa argumen.
 */
function formatRupiah(price = 0) {
  return "Rp " + Math.round(price).toLocaleString("id-ID");
}

/**
 * Function Declaration: renderStars
 * Membangun tampilan rating bintang menggunakan while loop.
 */
function renderStars(rating) {
  const fullStars = Math.round(rating);

  let stars = "";

  let i = 0;

  // while loop: berputar selama kondisi (i < 5) masih true.
  while (i < 5) {
    // Ternary: bintang penuh atau bintang kosong.
    stars += i < fullStars ? "★" : "☆";

    i++; // wajib diubah agar tidak infinite loop
  }

  return stars;
}

/**
 * Function Declaration: getStockLabel
 * Lebih dari 2 kemungkinan hasil -> pakai if / else if / else biasa
 * (bukan ternary bertingkat) agar tetap mudah dibaca.
 */
function getStockLabel(stock) {
  if (stock === 0) {
    return { text: "Stok Habis", className: "stock-out" };
  } else if (stock <= 10) {
    return { text: `Sisa ${stock}`, className: "stock-low" };
  } else {
    return { text: "Tersedia", className: "stock-ok" };
  }
}

/**
 * Arrow Function: escapeHtml
 * Fungsi pendek satu baris (implicit return).
 */
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

/**
 * Function Declaration: debounce (Closure)
 * Fungsi bagian dalam "mengingat" variabel timerId dari fungsi luar
 * meskipun debounce() sudah selesai dieksekusi. Inilah yang membuat
 * pencarian tidak memicu re-render di setiap ketikan keyboard.
 */
function debounce(callback, delay) {
  let timerId; // tetap "hidup" berkat closure

  return function (...args) {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}

// =========================
// FETCH PRODUK + GLOBAL ERROR HANDLING
// =========================

function renderSkeletons(count = 8) {
  let html = "";

  // for loop klasik: jumlah putaran sudah pasti diketahui.
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

/**
 * Function Declaration: fetchAllProductsFromApi
 * Products API (https://dummyjson.com/products) hanya mengirim maksimal
 * beberapa puluh data per request. Supaya search/filter/sort bekerja
 * terhadap SELURUH katalog (bukan cuma batch pertama), fungsi ini menarik
 * data halaman demi halaman menggunakan parameter `skip` & `limit`,
 * lalu digabung sampai jumlahnya sama dengan `total` yang dikirim server.
 *
 * while loop (Sub-Bab 03) dipakai karena jumlah halaman yang dibutuhkan
 * TIDAK diketahui di awal -> baru diketahui setelah membaca field
 * `total` dari response pertama.
 */
async function fetchAllProductsFromApi() {
  let combinedProducts = [];

  let skip = 0;

  let total = Infinity; // nilai awal sekadar "tidak diketahui", diganti setelah request pertama

  let pageCount = 0; // penghitung halaman, dipakai sebagai jaring pengaman

  while (skip < total) {
    pageCount++;

    // break: jaring pengaman -> hentikan total loop kalau sudah menarik
    // lebih dari 20 halaman (setara 2000 produk). Ini mencegah infinite
    // loop seandainya server mengirim nilai `total` yang tidak wajar.
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

    total = data.total; // total keseluruhan produk di server (mis. 194)

    skip += FETCH_PAGE_LIMIT;
  }

  return combinedProducts;
}

/**
 * Function Declaration: fetchProducts
 * Mengambil seluruh produk dari Products API secara dinamis dengan
 * fetch(), dibungkus try...catch untuk Global Error Handling.
 */
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

// =========================
// FILTER KATEGORI (populate dropdown)
// =========================

/**
 * Function Declaration: populateCategoryOptions
 * Mengumpulkan kategori unik menggunakan for...of + Set, lalu mengisi
 * elemen <select>.
 */
function populateCategoryOptions(products) {
  const categorySet = new Set();

  for (const product of products) {
    // continue: lewati produk yang tidak punya kategori.
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

// =========================
// SEARCH (Debounce + Closure), FILTER & SORT (Functional Programming)
// =========================

/**
 * Function Declaration: applyFiltersAndRender
 * Pipeline: filter (search + kategori) -> sort -> reset pagination -> render.
 */
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

  // Sorting: if / else if / else menentukan comparator yang dipakai.
  if (currentSort === "price-asc") {
    workingProducts.sort((a, b) => a.price - b.price);
  } else if (currentSort === "price-desc") {
    workingProducts.sort((a, b) => b.price - a.price);
  } else if (currentSort === "rating-desc") {
    workingProducts.sort((a, b) => b.rating - a.rating);
  }
  // else (currentSort === "default"): biarkan urutan asli dari API.

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

// =========================
// RENDER PRODUK + LOAD MORE (Array Slicing)
// =========================

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
            </div>
        </article>
    `;
};

/**
 * Function Declaration: renderProductGrid
 * Load More / Pagination memakai teknik Array Slicing: hanya produk
 * dari index 0 sampai visibleCount yang dirender.
 */
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

  // Ternary: tombol "Load More" hanya tampil jika masih ada sisa data.
  loadMoreWrap.style.display =
    visibleCount < workingProducts.length ? "flex" : "none";
}

loadMoreBtn.addEventListener("click", function () {
  visibleCount += PAGE_SIZE; // tambah batch berikutnya

  renderProductGrid();
});

// =========================
// INISIALISASI APLIKASI
// =========================

function initApp() {
  fetchProducts();
}

initApp();
