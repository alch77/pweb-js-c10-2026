let angka = [];

for (let i = 0; i < 5; i++) {
  let input = prompt("Masukkan angka ke-" + (i + 1) + ":");
  angka[i] = parseInt(input);
}

let teksHasil = "";

for (let i = 0; i < angka.length; i++) {
  if (angka[i] % 2 === 0) {
    teksHasil += angka[i] + " = Genap\n";
  } else {
    teksHasil += angka[i] + " = Ganjil\n";
  }
}

console.log(teksHasil);
document.getElementById("output").textContent = teksHasil;
