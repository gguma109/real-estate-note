// Testing regex replace
let valueD = "100";
let numD = valueD.replace(/[^0-9.]/g, ''); // Should output "100"
console.log("Desktop 100:", numD);

valueD = "a";
numD = valueD.replace(/[^0-9.]/g, ''); // Should output ""
console.log("Desktop a:", numD);
