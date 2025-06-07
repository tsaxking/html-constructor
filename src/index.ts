import parse, { HTMLElement } from 'node-html-parser';
import * as fs from 'fs';
import '@total-typescript/ts-reset';
import path from 'path';

export type Constructor = {
    [key: string]: string | number | boolean | undefined | Constructor[] | Constructor;
}

export type RenderConfig = {
    root?: string; // root path for file loading
}

const runRepeat = (html: HTMLElement, cstr: Constructor[], config?: RenderConfig): HTMLElement[] => {
    return cstr.map((c) => {
        const tag = html.getAttribute('tag');

        const { innerHTML } = html;
        const root = parse(innerHTML);
        let rendered = render(root.outerHTML, c, config);

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
    let { innerHTML } = html; // pure javascript

    const notAllowed = [
        'html', 'id', 'cstr', 'this', 'innerHTML', 'val', 'require'
    ];

    for (const key of notAllowed) {
        if (innerHTML.includes(key)) {
            console.error(`Key ${key} is not allowed in script ${id}`);
            return html;
        }
    }

    let val: string;
    try {
        val = eval(`
            (function(c) {
                const { ${Object.keys(cstr).join(',')} } = c;
                ${innerHTML}
            })(cstr);
        `);

        // val = eval.call(null, `
        //     (function(c) {
        //         const { ${Object.keys(cstr).join(',')} } = c;
        //         ${innerHTML};
        //     })(cstr);
        // `);

        if (typeof val !== 'string') throw new Error('Script must return a string');
    } catch (e) {
        console.warn(`Error evaluating script ${id}: ${e}`);
        val = '';
    }
    return parse(val);
};

const replace = (html: HTMLElement, cstr: Constructor): HTMLElement => {
    // find {{ key }} in html, ignoring newlines and whitespace
    const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
    html.innerHTML = html.innerHTML.replace(regex, (match: string, key: string) => {
        const val = cstr[key];
        if (val === undefined) {
            console.warn(`Key ${key} is undefined in ${cstr}`);
            return match;
        }
        return val.toString();
    });
    return html;
};

// export const render = (html: string, cstr: Constructor, config?: RenderConfig): string => {
//     if (html.endsWith('.html') && fs.existsSync(html)) {
//         html = fs.readFileSync(html).toString();
//     }

//     const root = parse(html);

//     const files = root.querySelectorAll('file');
//     const repeats = root.querySelectorAll('repeat');
//     const scripts = root.querySelectorAll('script[cstr]');
//     const ifs = root.querySelectorAll('if');
//     const switches = root.querySelectorAll('switch');

//     for (const file of files) {
//         renderFiles(file, cstr, config);
//     }

//     for (const repeat of repeats) {
//         if (Array.isArray(cstr[repeat.id])) {
//             const replace = runRepeat(repeat, cstr[repeat.id] as Constructor[]);
//             repeat.replaceWith(...replace);
//         } else {
//             console.warn(`Repeat ${repeat.id} is not an array, it has been removed.`);
//             // repeat.remove();
//         }

//         delete cstr[repeat.id];
//     }

//     for (const script of scripts) {
//         const obj = cstr[script.id];
//         if (obj) {
//             const replace = evaluate(script, script.id, obj as Constructor);
//             // console.log(replace.outerHTML);
//             script.replaceWith(replace);
//         } else {
//             console.warn(`Script ${script.id} is not defined, it has been removed.`);
//             // script.remove();
//         }

//         delete cstr[script.id];
//     }

//     for (const i of ifs) {
//         renderIfs(i, cstr[i.id] as Constructor);
//         delete cstr[i.id];
//     }

//     for (const s of switches) {
//         renderSwitch(s, cstr);
//         delete cstr[s.id];
//     }

//     // cleanup

//     root.querySelectorAll('script[cstr]').forEach(s => s.remove());
//     root.querySelectorAll('repeat').forEach(r => r.remove());
//     root.querySelectorAll('if').forEach(i => i.remove());

//     return replace(root, cstr).outerHTML;
// };

export const render = (html: string, cstr: Constructor, config?: RenderConfig): string => {
    if (html.endsWith('.html') && fs.existsSync(html)) {
        html = fs.readFileSync(html).toString();
    }

    const root = parse(html);

    const walk = (node: HTMLElement) => {
        for (const child of [...node.childNodes]) { // clone list so it's stable while modifying
            if (!(child instanceof HTMLElement)) continue;

            switch (child.tagName.toLowerCase()) {
                case 'file':
                    renderFiles(child, cstr, config);
                    break;
                case 'repeat':
                    if (Array.isArray(cstr[child.id])) {
                        const replace = runRepeat(child, cstr[child.id] as Constructor[], config);
                        child.replaceWith(...replace);
                    } else {
                        console.warn(`Repeat ${child.id} is not an array, it has been removed.`);
                        child.remove();
                    }
                    delete cstr[child.id];
                    break;
                case 'script':
                    if (child.hasAttribute('cstr')) {
                        const obj = cstr[child.id];
                        if (obj) {
                            const replace = evaluate(child, child.id, obj as Constructor);
                            child.replaceWith(replace);
                        } else {
                            console.warn(`Script ${child.id} is not defined, it has been removed.`);
                            child.remove();
                        }
                        delete cstr[child.id];
                    }
                    break;
                case 'if':
                    renderIfs(child, cstr[child.getAttribute('id')!] as Constructor, config);
                    delete cstr[child.getAttribute('id')!];
                    break;
                case 'switch':
                    renderSwitch(child, cstr, config);
                    delete cstr[child.getAttribute('id')!];
                    break;
            }

            // Recursively process children (important for <file> and <repeat>)
            if (child.parentNode) {
                walk(child);
            }
        }
    };

    walk(root);

    return replace(root, cstr).outerHTML;
};


const renderIfs = (html: HTMLElement, cstr: Constructor, config?: RenderConfig) => {
    const id = html.getAttribute('id');
    if (!id) {
        console.warn('<if> is missing an id attribute.');
        html.remove();
        return html;
    }

    const condition = (typeof cstr === 'object') ? cstr[id] : cstr;
    const elseElement = html.querySelector('else');

    html.removeAttribute('id'); // Clean up so output looks clean

    if (condition) {
        elseElement?.remove();
        html.replaceWith(render(html.innerHTML, cstr, config));
    } else {
        if (elseElement) {
            elseElement.remove();
            html.replaceWith(render(elseElement.innerHTML, cstr, config));
        } else {
            html.remove();
        }
    }

    return html;
};

// import { Parser } from 'expr-eval';

// const parser = new Parser();

// const evalExpr = (expr: string, cstr: Constructor) => {
//     try {
//         const compiled = parser.parse(expr);
//         return compiled.evaluate(cstr);
//     } catch (err) {
//         console.warn(`Error evaluating expr: ${expr}`, err);
//         return false;
//     }
// };

let cache: Map<string, { date: number; content: string }> | undefined = undefined;

export const setupCache = (timer: number) => {
    cache = new Map<string, { date: number; content: string }>();
    setInterval(() => {
        if (!cache) return; // will never happen, but just in case
        const now = Date.now();
        for (const [key, value] of cache.entries()) {
            if (now - value.date > timer) { // 5 minutes
                cache.delete(key);
            }
        }
    }, timer);
};




const renderFiles = (html: HTMLElement, cstr: Constructor, config?: RenderConfig) => {
    if (!config?.root) {
        console.warn('Root path is not set. No files will be loaded. Set the root path in the render(html, cstr, { root: "path" }) parameter.');
        html.remove();
        return;
    }
    const id = html.getAttribute('id');
    const src = html.getAttribute('src');

    if (!id || !src) {
        console.warn('<file> tag must have both id and src attributes');
        html.remove();
        return;
    }

    try {
        const subCstr = cstr[id];
        if (typeof subCstr !== 'object' || Array.isArray(subCstr)) {
            throw new Error(`Sub-Constructor ${id} is an invalid type. It must be a non-array object for <file> tags.`);
        }

        let file = '';
        if (cache && cache.has(src)) {
            const cached = cache.get(src);
            if (cached) { // this will always be true
                cached.date = Date.now();
                file = cached.content;
            }
        } else {
            file = fs.readFileSync(path.join(config?.root, src), 'utf-8');
            cache?.set(src, {
                date: Date.now(),
                content: file,
            });
        }

        const fragmentElement = parse(file);

        // Render the fragment with the sub-cstr
        const rendered = render(fragmentElement.outerHTML, subCstr, config);

        html.replaceWith(rendered);
    } catch (err) {
        console.warn(`Failed to load file from "${src}"`, err);
        html.remove();
    }
    return html;
};

export const renderSwitch = (html: HTMLElement, cstr: Constructor, config?: RenderConfig) => {
    const id = html.getAttribute('id');
    
    // Check if the 'id' attribute exists
    if (!id) {
        console.warn('<switch> is missing an id attribute.');
        html.remove();
        return html;
    }

    const condition = cstr[id];
    const cases = html.querySelectorAll('case');
    const defaultCase = html.querySelector('default');
    
    // Handle the default case if present
    if (defaultCase) {
        defaultCase.remove();
        html.appendChild(defaultCase);
    }

    if (condition === undefined) {
        console.warn(`Condition ${id} is undefined.`);
        html.remove();
        return html;
    }

    let matched = false;
    
    for (const c of cases) {
        const caseCondition = c.getAttribute('value');
        console.log(`Case condition: ${caseCondition}, Condition: ${condition}`, caseCondition === condition);

        if (matched && !html.hasAttribute('multiple')) {
            c.remove();
            break;
        }
        if (caseCondition === condition) {
            c.replaceWith(render(c.innerHTML, cstr, config)); 
            matched = true;
        } else {
            c.remove();
        }
    }

    if (!matched && defaultCase) {
        defaultCase.replaceWith(render(defaultCase.innerHTML, cstr, config));
    }

    defaultCase?.remove();

    // return html;
    html.replaceWith(...html.childNodes);
};

// const condense = (html: HTMLElement) => {
//     // remove all redundancies
//     // style tags
//     html.querySelectorAll('style').forEach((s) => {
//         s.remove();
//     });
// };