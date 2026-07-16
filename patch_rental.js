const fs = require('fs');
let c = fs.readFileSync('public/brokerage.html', 'utf8');

const oldFunc = `        async function handleRentalSaveClick() {
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

const newFunc = `        async function handleRentalSaveClick() {
            if (syncTimeout) clearTimeout(syncTimeout);
            
            const editorCard = document.querySelector('#rental-editor-view [data-id]');
            if (editorCard) {
                const id = editorCard.getAttribute('data-id');
                const rental = rentals.find(r => r.id === id);
                if (rental) {
                    // Update from DOM just in case input events didn't fire
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
                        // temp_ id means it wasn't saved yet or we cancelled the create API call
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

// Replace ignoring \r
c = c.replace(oldFunc, newFunc);
c = c.replace(oldFunc.replace(/\n/g, '\r\n'), newFunc);

fs.writeFileSync('public/brokerage.html', c);
