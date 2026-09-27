let tinggi = prompt("Masukkan tinggi segitiga");
tinggi = parseInt(tinggi);

let hasil = "";

for (let i = tinggi; i >= 1; i--) {
  let baris = "";
  for (let j = 1; j <= i; j++) {
    baris += "*";
  }
  hasil += baris + "\n";
}

document.getElementById("output").textContent = hasil;
console.log(hasil);
