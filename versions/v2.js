const { parse } = require("node-html-parser");
const sanitize = require('sanitize-html');
const fs = require('fs');

class HTMLConstructor {
    /**
     * @description Renders html content as a string
     * @param {String} html <html content!>
     * @param {Object} options Object containing keys for each <cstr id="respectiveKey"> element
     * @param {Boolean} options._sanitize Uses sanitize-html package to remove unwanted scripts AFTER everything is rendered (recommended but default is false);
     * @param {Object} res (OPTIONAL) Response Object
     */
    constructor(html, options, res) {

        // if (typeof html != 'string') throw new Error(`html must be a string! It's type is: ${typeof html}`);
        if (typeof options != 'object') throw new Error(`options must be an object! It's type is: ${typeof options}`);

        this.options = options;
        try {
            this.html = parse(fs.readFileSync(html).toString('utf-8'));
        } catch (err) {
            this.html = parse(html.toString('utf-8'));
        }
        if (res) {
            if (typeof res != 'object') throw new Error(`res must be an object! It's type is: ${typeof res}`);
            this.res = res;
        }
    }

    sanitizeObj(obj) {
        Object.keys(obj).forEach(k => {
            obj[k] = sanitize(obj[k]);
        });
        return obj;
    }

    repeatElement(element) {
        let cstr = this.options[element.id];
        if (cstr === undefined) {
            console.log(`No constructor for <cstr type="repeat" id="${element.id}"></cstr> so it deleted the element`);
            return '';
        }
        let repeatEl = '',
            output;
        if (Array.isArray(cstr)) {
            let i = 1;
            cstr.forEach(repeat => {
                if (typeof repeat != 'object') throw new Error(`Position ${i-1} in options.${element.id} must be an object. Type received: ${typeof repeat}`);
                if (repeat._sanitize) repeat = this.sanitizeObj(repeat);

                let newEl = element.innerHTML;

                if (repeat._trustEval) {
                    newEl = parse(newEl);

                    newEl.querySelectorAll('cstr[type="eval"]').forEach(e => {
                        let cstr = repeat;
                        let evaluation = eval(e.innerHTML);
                        e.replaceWith(evaluation);
                    });

                    newEl = newEl.innerHTML;
                } else {
                    newEl = parse(newEl);
                    newEl.querySelectorAll('cstr[type="eval"]').forEach(e => {
                        e.replaceWith('');
                    });

                    newEl = newEl.innerHTML;
                }

                const _posRegex = new RegExp(`\{_pos\}`, 'gi');

                Object.keys(repeat).forEach(k => {
                    if (k == '_trustEval') return;
                    const regex = new RegExp(`\{${k}\}`, 'gi');

                    newEl = newEl.replace(regex, repeat[k]);
                });

                newEl = newEl.replace(_posRegex, i);

                repeatEl += newEl;
                i++;
            });
            // output = `<div>${repeatEl}</div>`;
            output = repeatEl;
        } else {
            if (!cstr._repeatNum) return;
            if (cstr._sanitize) cstr = this.sanitizeObj(cstr);

            let repeatEl = '';

            for (var i = 1; i <= cstr._repeatNum; i++) {

                let newEl = element.innerHTML;

                if (cstr._trustEval) {
                    newEl = parse(newEl);

                    newEl.querySelectorAll('cstr[type="eval"]').forEach(e => {
                        let evaluation = eval(e.innerHTML);
                        e.replaceWith(evaluation);
                    });

                    newEl = newEl.innerHTML;
                } else {
                    newEl = parse(newEl);
                    newEl.querySelectorAll('cstr[type="eval"]').forEach(e => {
                        e.replaceWith('');
                    });

                    newEl = newEl.innerHTML;
                }

                const _posRegex = new RegExp(`\{_pos\}`, 'gi');

                Object.keys(cstr).forEach(k => {
                    if (k == '_repeatNum') return;
                    if (k == '_trustEval') return;

                    const regex = new RegExp(`\{${k}\}`, 'gi');

                    newEl = newEl.replace(regex, cstr[k]);
                });

                newEl = newEl.replace(_posRegex, i);

                repeatEl += newEl;
            }

            // output = `<div>${repeatEl}</div>`;
            output = repeatEl;
        }

        delete this.options[element.id];
        return parse(output).innerHTML;
    }

    evalElement(element, type) {
        const cstr = this.options[element.id];
        if (cstr === undefined) {
            let elStr = type == 'script' ? `<script class="cstr" id="${element.id}"></script>` : `<cstr type="eval" id="${element.id}"></cstr>`;
            console.log(`No constructor for ${elStr} so the element has been deleted`);
            return '';
        }

        if (this.options[element.id]._sanitize) this.options[element.id] = this.sanitizeObj(this.options[element.id]);

        let output = eval(element.innerHTML);

        delete this.options[element.id];

        return output;
    }

    replaceRest() {
        let replacedHTML = this.html.outerHTML;
        Object.keys(this.options).forEach(k => {
            if (k == '_sanitize') return;
            const regex = new RegExp(`{${k}}`, 'g');
            replacedHTML = replacedHTML.replace(regex, this.options[k]);
        });

        this.html = parse(replacedHTML);
    }

    render() {
        this.html.querySelectorAll('cstr').forEach(el => {
            if (!el) return;
            switch (el.getAttribute('cstr-type')) {
                case 'repeat':
                    el.replaceWith(this.repeatElement(el));
                    return;
                case 'eval':
                    el.replaceWith(this.evalElement(el));
                    return;
            }
        });

        this.html.querySelectorAll('script[cstr-type="eval"]').forEach(el => {
            el.replaceWith(this.evalElement(el));
        });

        this.replaceRest();

        if (this.options._sanitize) this.html = parse(sanitize(this.html.outerHTML));
        if (this.res) this.res.status(200).send(this.html.outerHTML);

        return this.html.outerHTML;
    }
}

module.exports = HTMLConstructor