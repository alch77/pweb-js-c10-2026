let angka1 = prompt("Masukkan angka pertama:");
angka1 = parseFloat(angka1);

let angka2 = prompt("Masukkan angka kedua:");
angka2 = parseFloat(angka2);

let operator = prompt(
  "Masukkan operator:\n(Tambah [+] | Kurang [-] | Kali [*] | Bagi [/])",
);

let hasil;

if (operator === "+") {
  hasil = angka1 + angka2;
} else if (operator === "-") {
  hasil = angka1 - angka2;
} else if (operator === "*") {
  hasil = angka1 * angka2;
} else if (operator === "/") {
  hasil = angka1 / angka2;
} else {
  hasil = "Operator tidak valid";
}

let teksHasil = angka1 + " " + operator + " " + angka2 + " = " + hasil;

console.log(teksHasil);
document.getElementById("output").textContent = teksHasil;
