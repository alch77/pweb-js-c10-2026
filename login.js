const loginForm = document.getElementById("loginForm");

const usernameInput = document.getElementById("username");

const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");

const loginText = document.getElementById("loginText");

const spinner = document.getElementById("spinner");

const errorMessage = document.getElementById("errorMessage");

// FORM LOGIN

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  // AMBIL INPUT

  const username = usernameInput.value.trim();

  const password = passwordInput.value.trim();

  // Hapus error sebelumnya
  errorMessage.textContent = "";

  // VALIDASI INPUT

  if (username === "" || password === "") {
    errorMessage.textContent = "Username dan password wajib diisi.";

    return;
  }

  // TAMPILKAN LOADING

  spinner.classList.remove("hidden");

  loginText.classList.add("hidden");

  loginButton.disabled = true;

  try {
    // AMBIL DATA USER DARI API

    const response = await fetch("https://dummyjson.com/users");

    // CEK RESPONSE

    if (!response.ok) {
      throw new Error("Gagal mengambil data pengguna.");
    }

    // UBAH RESPONSE MENJADI JSON

    const data = await response.json();

    // CARI USER

    const user = data.users.find(function (user) {
      return user.username === username && user.password === password;
    });

    // USER TIDAK DITEMUKAN

    if (!user) {
      throw new Error("Username atau password salah.");
    }

    // LOGIN BERHASIL

    localStorage.setItem("firstName", user.firstName);

    localStorage.setItem("username", user.username);

    localStorage.setItem("userId", String(user.id));

    // REDIRECT

    window.location.href = "index.html";
  } catch (error) {
    // TAMPILKAN ERROR

    errorMessage.textContent = error.message;
  } finally {
    // SEMBUNYIKAN SPINNER

    spinner.classList.add("hidden");

    loginText.classList.remove("hidden");

    // Aktifkan tombol kembali
    loginButton.disabled = false;
  }
});

// HAPUS ERROR SAAT MENGETIK

usernameInput.addEventListener("input", function () {
  errorMessage.textContent = "";
});

passwordInput.addEventListener("input", function () {
  errorMessage.textContent = "";
});
