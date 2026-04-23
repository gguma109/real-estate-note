function formatMoney(value) {
    let num = value.replace(/[^0-9.]/g, '');
    const parts = num.split('.');
    if (parts.length > 2) {
        num = parts[0] + '.' + parts.slice(1).join('');
    }

    let [integerPart, decimalPart] = num.split('.');
    if (integerPart) {
        integerPart = Number(integerPart.replace(/,/g, '')).toLocaleString();
    }
    value = decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;
    return value;
}

console.log('1 ->', formatMoney('1'));
console.log('1000 ->', formatMoney('1000'));
console.log('1,0000 ->', formatMoney('1,0000'));
