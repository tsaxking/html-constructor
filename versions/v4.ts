import parse, { HTMLElement } from 'node-html-parser';
import sanitize from 'sanitize-html';
import * as fs from 'fs';
import * as path from 'path';
import { NextFunction, Request, Response } from 'express';
import '@total-typescript/ts-reset';





export type Constructor = {
    [key: string]: string | number | boolean | undefined | Constructor[] | Constructor;
}



const runRepeat = (html: HTMLElement, cstr: Constructor[]): HTMLElement[] => {
    return cstr.map((c) => {
        const tag = html.getAttribute('tag');

        const { innerHTML } = html;
        const root = parse(innerHTML);
        let rendered = render(root.outerHTML, c);

        if (tag) {
            rendered = `<${tag}>${rendered}</${tag}>`;

            const root = parse(rendered);

            // // apply all attributes
            // const { attributes } = html;
            // for (const attr in attributes) {
            //     if (attr !== 'tag') {
            //         switch (attr) {
            //             case 'class': 
            //                 for (const c of attributes[attr].split(' ')) {
            //                     root.classList.add(c);
            //                 }
            //                 break;
            //             case 'id':
            //                 root.id = attributes[attr];
            //                 break;
            //             default:
            //                 root.setAttribute(attr, attributes[attr]);
            //                 break;
            //         }
            //     }
            // }

            rendered = root.outerHTML;
        }

        return parse(rendered);
    });
};

const evaluate = (html: HTMLElement, id: string, cstr: Constructor): HTMLElement => {
    const { innerHTML } = html; // pure javascript
    let val: string;
    try {
        val = eval(`
            (function(c) {
                const { ${Object.keys(cstr).join(',')} } = c;
                ${innerHTML}
            })(cstr);
        `);

        if (typeof val !== 'string') throw new Error('Script must return a string');
    } catch (e) {
        console.warn(`Error evaluating script ${id}: ${e}`);
        val = '';
    }
    return parse(val);
};

const replace = (html: HTMLElement, cstr: Constructor): HTMLElement => {
    // find {{ key }} in html
    const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
    html.innerHTML = html.innerHTML.replace(regex, (match, key) => {
        const val = cstr[key];
        if (val === undefined) {
            console.warn(`Key ${key} is undefined in ${html.id}`);
            return match;
        }
        return val.toString();
    });
    return html;
};


const render = (html: string, cstr: Constructor, res?: Response): string => {
    if (fs.existsSync(html)) {
        html = fs.readFileSync(html).toString();
    }

    const root = parse(html);

    const repeats = root.querySelectorAll('repeat');
    const scripts = root.querySelectorAll('script[cstr]');

    for (const repeat of repeats) {
        if (Array.isArray(cstr[repeat.id])) {
            const replace = runRepeat(repeat, cstr[repeat.id] as Constructor[]);
            repeat.replaceWith(...replace);
        } else {
            console.warn(`Repeat ${repeat.id} is not an array, it has been removed.`);
            repeat.remove();
        }

        delete cstr[repeat.id];
    }

    for (const script of scripts) {
        const obj = cstr[script.id];
        if (obj) {
            const replace = evaluate(script, script.id, obj as Constructor);
            // console.log(replace.outerHTML);
            script.replaceWith(replace);
        } else {
            console.warn(`Script ${script.id} is not defined, it has been removed.`);
            script.remove();
        }

        delete cstr[script.id];
    }

    if (res) {
        res.status(200).send(root.outerHTML);
    }

    return replace(root, cstr).outerHTML;
};

export default render;


type EngineParameters = {
    next?: boolean;
    viewsDir: string;
}

declare global {
    namespace Express {
        interface Request {
            render: (html: string, cstr: Constructor) => Promise<Error|void>;
        }
    }
}

export const engine = (parameters: EngineParameters) => (req: Request, res: Response, next: NextFunction) => {
    req.render = async (template: string, cstr: Constructor) => {
        try {
            const html = path.join(parameters.viewsDir, template);
            render(html, cstr);
            if (parameters.next) return next();
        } catch (e) {
            return e;
        }
    };
}