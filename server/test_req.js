const fs = require('fs');
fetch('http://localhost:8000/api/v1/news/69c3f34005bc77265d0e3d49/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'Telugu', tone: 'neutral' })
})
.then(res => res.json())
.then(data => fs.writeFileSync('test_trans_out.json', JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
