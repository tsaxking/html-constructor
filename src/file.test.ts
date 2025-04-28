import fs from 'fs';
import path from 'path';
import { render } from '.';


const html = fs.readFileSync(path.resolve(__dirname, './html', 'test.html'), 'utf-8');
const now = performance.now();
console.log(render(html, {
    title: 'Test',
    myIf: false,
    myFile: {
        data: 'Hi!',
    }
}, {
    root: __dirname,
}));

console.log('Time taken:', performance.now() - now);