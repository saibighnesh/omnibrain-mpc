const { exec } = require('child_process');
exec('npx next build', (err, stdout, stderr) => {
    require('fs').writeFileSync('err.log', stdout + stderr, 'utf8');
});
