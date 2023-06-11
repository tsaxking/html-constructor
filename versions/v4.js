"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_html_parser_1 = __importDefault(require("node-html-parser"));
var fs = __importStar(require("fs"));
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
    var val;
    try {
        val = eval("\n            (function(c) {\n                const { ".concat(Object.keys(cstr).join(','), " } = c;\n                ").concat(innerHTML, "\n            })(cstr);\n        "));
        // console.log(val);
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
    // find {{ key }} in html
    var regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
    html.innerHTML = html.innerHTML.replace(regex, function (match, key) {
        var val = cstr[key];
        if (val === undefined) {
            console.warn("Key ".concat(key, " is undefined in ").concat(html.id));
            return match;
        }
        return val.toString();
    });
    return html;
};
var render = function (html, cstr, res) {
    if (fs.existsSync(html)) {
        html = fs.readFileSync(html).toString();
    }
    var root = (0, node_html_parser_1.default)(html);
    var repeats = root.querySelectorAll('repeat');
    var scripts = root.querySelectorAll('script[cstr]');
    for (var _i = 0, repeats_1 = repeats; _i < repeats_1.length; _i++) {
        var repeat = repeats_1[_i];
        if (Array.isArray(cstr[repeat.id])) {
            var replace_1 = runRepeat(repeat, cstr[repeat.id]);
            repeat.replaceWith.apply(repeat, replace_1);
        }
        else {
            console.warn("Repeat ".concat(repeat.id, " is not an array, it has been removed."));
            repeat.remove();
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
            script.remove();
        }
        delete cstr[script.id];
    }
    if (res) {
        res.status(200).send(root.outerHTML);
    }
    return replace(root, cstr).outerHTML;
};
exports.default = render;
