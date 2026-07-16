const fs = require('fs');
let c = fs.readFileSync('public/management.html', 'utf8');

c = c.replace(/>\\s*완료\\s*</g, '>저장<').replace(/>\\s*클라우드 저장\\s*</g, '>저장<');

const oldAlert = "alert('퇴실확인서가 성공적으로 클라우드에 저장되었습니다!');";
const newAlert = "alert('성공적으로 저장되었습니다!');\\n                closeMoveoutEditor();";
c = c.replace(oldAlert, newAlert);

const oldDiffDays = `        function diffDays(start, end) {
            if (!start || !end) return 0;
            const d1 = new Date(start);
            const d2 = new Date(end);
            const diffTime = Math.abs(d2 - d1);
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }`;
const newDiffDays = `        function diffDays(start, end) {
            if (!start || !end) return 0;
            const d1 = new Date(start);
            const d2 = new Date(end);
            const diffTime = Math.abs(d2 - d1);
            return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
        }`;
c = c.replace(oldDiffDays, newDiffDays);
c = c.replace(oldDiffDays.replace(/\\n/g, '\\r\\n'), newDiffDays);

// We must also replace handleRentalSaveClick in management.html to be robust like in brokerage.html
const oldHandleRental = `        async function handleRentalSaveClick() {
            if (syncTimeout) clearTimeout(syncTimeout);
            
            const editorCard = document.querySelector('#rental-editor-view [data-id]');
            if (editorCard) {
                const id = editorCard.getAttribute('data-id');
                const rental = rentals.find(r => r.id === id);
                if (rental && !rental.id.startsWith('temp_')) {
                    document.getElementById('sync-icon').classList.remove('hidden');
                    await syncToCloud(rental);
                } else if (rental && rental.id.startsWith('temp_')) {
                    // Try to wait a bit if it is still tempid (creation in progress)
                    await new Promise(r => setTimeout(r, 1000));
                    const updatedRental = rentals.find(r => r.id === id) || rentals.find(r => r === rental); // find ref
                    if(updatedRental && !updatedRental.id.startsWith('temp_')) {
                        await syncToCloud(updatedRental);
                    }
                }
            }
            alert("성공적으로 저장되었습니다!");
            closeRentalEditor();
        }`;
const newHandleRental = `        async function handleRentalSaveClick() {
            if (syncTimeout) clearTimeout(syncTimeout);
            
            const editorCard = document.querySelector('#rental-editor-view [data-id]');
            if (editorCard) {
                const id = editorCard.getAttribute('data-id');
                const rental = rentals.find(r => r.id === id);
                if (rental) {
                    const inputs = editorCard.querySelectorAll('.rental-input, .rental-check');
                    inputs.forEach(el => {
                        const field = el.getAttribute('data-field');
                        if (field) {
                            if (el.type === 'checkbox') {
                                rental[field] = el.checked;
                            } else {
                                rental[field] = el.value;
                            }
                        }
                    });

                    document.getElementById('sync-icon').classList.remove('hidden');
                    if (!rental.id.startsWith('temp_')) {
                        await syncToCloud(rental);
                    } else {
                        const res = await fetchWithAuth('/api/rentals', {
                            method: 'POST',
                            body: JSON.stringify(rental)
                        });
                        if (res && res.success && res.id) {
                            rental.id = res.id;
                            const idx = rentals.findIndex(r => r.id === id);
                            if(idx !== -1) rentals[idx].id = res.id;
                        }
                    }
                }
            }
            alert("성공적으로 저장되었습니다!");
            closeRentalEditor();
        }`;
c = c.replace(oldHandleRental, newHandleRental);
c = c.replace(oldHandleRental.replace(/\\n/g, '\\r\\n'), newHandleRental);

fs.writeFileSync('public/management.html', c);
