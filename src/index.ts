import { parseHTML, Node, HTMLElement, Element } from 'linkedom';
import * as fs from 'fs';
import '@total-typescript/ts-reset';

// type HTMLElement = Node;

const parse = (html: string) => {
    const { document } = parseHTML(html);
    return document.body;
};

export type Constructor = {
    [key: string]: string | number | boolean | undefined | Constructor[] | Constructor;
}

const runRepeat = (html: Element, cstr: Constructor[]): Element[] => {
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

const evaluate = (html: Element, id: string, cstr: Constructor): Element => {
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

const replace = (html: Element, cstr: Constructor): Element => {
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

export const render = (html: string, cstr: Constructor): string => {
    if (html.endsWith('.html') && fs.existsSync(html)) {
        html = fs.readFileSync(html).toString();
    }

    const root = parse(html);

    const repeats = root.querySelectorAll('repeat');
    const scripts = root.querySelectorAll('script[cstr]');
    const ifs = root.querySelectorAll('if');


    for (const repeat of repeats) {
        if (Array.isArray(cstr[repeat.id])) {
            const replace = runRepeat(repeat, cstr[repeat.id] as Constructor[]);
            repeat.replaceWith(...replace);
        } else {
            console.warn(`Repeat ${repeat.id} is not an array, it has been removed.`);
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
            // script.remove();
        }

        delete cstr[script.id];
    }

    for (const i of ifs) {
        renderIfs(i, cstr[i.id] as Constructor);
        delete cstr[i.id];
    }

    // cleanup

    root.querySelectorAll('script[cstr]').forEach(s => s.remove());
    root.querySelectorAll('repeat').forEach(r => r.remove());
    root.querySelectorAll('if').forEach(i => i.remove());

    return replace(root, cstr).outerHTML;
};

const renderIfs = (html: Element, cstr: Constructor) => {
    const { id } = html;
    const elseRoot = html.parentElement?.querySelector(`else#${id}`);

    html.removeAttribute('id');
    const attributes = html.attributes;
    attributes.removeNamedItem; // this is likely not necessary, but just in case


    if (attributes.length === 1) {
        // const [key, val] = Object.entries(attributes)[0];
        const key = attributes[0].name;
        const val = attributes[0].value;

        if (typeof cstr === 'object') {
            if (cstr?.[key] == val) {
                html.replaceWith(render(html.innerHTML, cstr));
                elseRoot?.remove();
            } else {
                if (elseRoot) {
                    elseRoot.removeAttribute('id');
                    elseRoot.replaceWith(render(elseRoot.innerHTML, cstr));
                }
                html.remove();
            }
        } else {
            if (cstr === val) {
                html.replaceWith(parse(html.innerHTML));
                elseRoot?.remove();
            } else {
                if (elseRoot) {
                    elseRoot.removeAttribute('id');
                    elseRoot.replaceWith(parse(elseRoot.innerHTML));
                }
                html.remove();
            }
        }
    } else {
        console.warn(`<if> ${id} has more than one attribute, it has been removed.`);
        elseRoot?.remove();
    }

    return html;
};