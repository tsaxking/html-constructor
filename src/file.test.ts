import fs from 'fs';
import path from 'path';
import { render } from '.';


const html = fs.readFileSync(path.resolve(__dirname, './html', 'test.html'), 'utf-8');
const now = performance.now();
console.log(render(html, {
    title: 'Test',
    pages: [
        {
            page: {
                content: '1',
            }
        },
        {
            page: {
                content: '2',
            }
        },
        {
            page: {
                content: '3',
            }
        },
        {
            page: {
                content: '4',
            }
        },
        {
            page: {
                content: '5',
            }
        },
        {
            page: {
                content: '6',
            }
        }
    ]
}, {
    root: path.resolve(__dirname, './html'),
}));

console.log('Time taken:', performance.now() - now);