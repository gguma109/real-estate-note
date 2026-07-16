const fs = require('fs');

let c = fs.readFileSync('public/brokerage.html', 'utf8');

// 1. handleRentalSaveClick
c = c.replace(
    '            closeRentalEditor();\n        }',
    '            alert("성공적으로 저장되었습니다!");\n            closeRentalEditor();\n        }'
);

c = c.replace(
    '            closeRentalEditor();\r\n        }',
    '            alert("성공적으로 저장되었습니다!");\n            closeRentalEditor();\n        }'
);

// 2. saveCurrentNoteState
c = c.replace(
    'if (manualSave) alert("메모가 성공적으로 저장되었습니다!");',
    'if (manualSave) {\n                    alert("메모가 성공적으로 저장되었습니다!");\n                    document.getElementById(\'note-editor-view\').classList.add(\'hidden\');\n                    document.getElementById(\'notes-list-view\').classList.remove(\'hidden\');\n                    renderNotesList();\n                }'
);

// 3. saveCurrentAd (Make sure it closes the editor)
// Check if it already does this
if (!c.includes("document.getElementById('ads-editor-view').classList.add('hidden');")) {
    c = c.replace(
        'if (manualSave) {\n                    alert("성공적으로 저장되었습니다!");\n                }',
        'if (manualSave) {\n                    alert("성공적으로 저장되었습니다!");\n                    document.getElementById(\'ads-editor-view\').classList.add(\'hidden\');\n                    document.getElementById(\'ads-list-view\').classList.remove(\'hidden\');\n                    renderAdsList();\n                }'
    );
}

fs.writeFileSync('public/brokerage.html', c);
