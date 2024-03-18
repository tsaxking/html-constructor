"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_html_parser_1 = require("node-html-parser");
var fs = require("fs");
require("@total-typescript/ts-reset");
var runRepeat = function (html, cstr) {
    return cstr.map(function (c) {
        var tag = html.getAttribute('tag');
        var innerHTML = html.innerHTML;
        var root = (0, node_html_parser_1.default)(innerHTML);
        var rendered = render(root.outerHTML, c);
        if (tag) {
            rendered = "<".concat(tag, ">").concat(rendered, "</").concat(tag, ">");
            var root_1 = (0, node_html_parser_1.default)(rendered);
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
            rendered = root_1.outerHTML;
        }
        return (0, node_html_parser_1.default)(rendered);
    });
};
var evaluate = function (html, id, cstr) {
    var innerHTML = html.innerHTML; // pure javascript
    var notAllowed = [
        'html', 'id', 'cstr', 'this', 'innerHTML', 'val', 'require'
    ];
    for (var _i = 0, notAllowed_1 = notAllowed; _i < notAllowed_1.length; _i++) {
        var key = notAllowed_1[_i];
        if (innerHTML.includes(key)) {
            console.error("Key ".concat(key, " is not allowed in script ").concat(id));
            return html;
        }
    }
    var val;
    try {
        val = eval("\n            (function(c) {\n                const { ".concat(Object.keys(cstr).join(','), " } = c;\n                ").concat(innerHTML, "\n            })(cstr);\n        "));
        // val = eval.call(null, `
        //     (function(c) {
        //         const { ${Object.keys(cstr).join(',')} } = c;
        //         ${innerHTML};
        //     })(cstr);
        // `);
        if (typeof val !== 'string')
            throw new Error('Script must return a string');
    }
    catch (e) {
        console.warn("Error evaluating script ".concat(id, ": ").concat(e));
        val = '';
    }
    return (0, node_html_parser_1.default)(val);
};
var replace = function (html, cstr) {
    // find {{ key }} in html, ignoring newlines and whitespace
    var regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
    html.innerHTML = html.innerHTML.replace(regex, function (match, key) {
        var val = cstr[key];
        if (val === undefined) {
            console.warn("Key ".concat(key, " is undefined in ").concat(cstr));
            return match;
        }
        return val.toString();
    });
    return html;
};
var render = function (html, cstr, res) {
    if (html.endsWith('.html') && fs.existsSync(html)) {
        html = fs.readFileSync(html).toString();
    }
    console.log(cstr);
    var root = (0, node_html_parser_1.default)(html);
    var repeats = root.querySelectorAll('repeat');
    var scripts = root.querySelectorAll('script[cstr]');
    var ifs = root.querySelectorAll('if');
    for (var _i = 0, repeats_1 = repeats; _i < repeats_1.length; _i++) {
        var repeat = repeats_1[_i];
        console.log(cstr[repeat.id]);
        if (Array.isArray(cstr[repeat.id])) {
            var replace_1 = runRepeat(repeat, cstr[repeat.id]);
            repeat.replaceWith.apply(repeat, replace_1);
        }
        else {
            console.warn("Repeat ".concat(repeat.id, " is not an array, it has been removed."));
            // repeat.remove();
        }
        delete cstr[repeat.id];
    }
    for (var _a = 0, scripts_1 = scripts; _a < scripts_1.length; _a++) {
        var script = scripts_1[_a];
        var obj = cstr[script.id];
        if (obj) {
            var replace_2 = evaluate(script, script.id, obj);
            // console.log(replace.outerHTML);
            script.replaceWith(replace_2);
        }
        else {
            console.warn("Script ".concat(script.id, " is not defined, it has been removed."));
            // script.remove();
        }
        delete cstr[script.id];
    }
    for (var _b = 0, ifs_1 = ifs; _b < ifs_1.length; _b++) {
        var i = ifs_1[_b];
        renderIfs(i, cstr[i.id]);
        delete cstr[i.id];
    }
    if (res) {
        res.status(200).send(root.outerHTML);
    }
    // cleanup
    root.querySelectorAll('script[cstr]').forEach(function (s) { return s.remove(); });
    root.querySelectorAll('repeat').forEach(function (r) { return r.remove(); });
    root.querySelectorAll('if').forEach(function (i) { return i.remove(); });
    return replace(root, cstr).outerHTML;
};
var renderIfs = function (html, cstr) {
    var id = html.id;
    var elseRoot = html.parentNode.querySelector("else#".concat(id));
    html.removeAttribute('id');
    var attributes = html.attributes;
    delete attributes.id; // this is likely not necessary, but just in case
    if (Object.keys(attributes).length === 1) {
        var _a = Object.entries(attributes)[0], key = _a[0], val = _a[1];
        if (typeof cstr === 'object') {
            if ((cstr === null || cstr === void 0 ? void 0 : cstr[key]) == val) {
                html.replaceWith(render(html.innerHTML, cstr));
                elseRoot === null || elseRoot === void 0 ? void 0 : elseRoot.remove();
            }
            else {
                if (elseRoot) {
                    elseRoot.removeAttribute('id');
                    elseRoot.replaceWith(render(elseRoot.innerHTML, cstr));
                }
                html.remove();
            }
        }
        else {
            if (cstr === val) {
                html.replaceWith((0, node_html_parser_1.default)(html.innerHTML));
                elseRoot === null || elseRoot === void 0 ? void 0 : elseRoot.remove();
            }
            else {
                if (elseRoot) {
                    elseRoot.removeAttribute('id');
                    elseRoot.replaceWith((0, node_html_parser_1.default)(elseRoot.innerHTML));
                }
                html.remove();
            }
        }
    }
    else {
        console.warn("<if> ".concat(id, " has more than one attribute, it has been removed."));
        elseRoot === null || elseRoot === void 0 ? void 0 : elseRoot.remove();
    }
    return html;
};
exports.default = render;
