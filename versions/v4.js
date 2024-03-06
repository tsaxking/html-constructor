"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.engine = void 0;
var node_html_parser_1 = require("node-html-parser");
var fs = require("fs");
var path = require("path");
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
    innerHTML = innerHTML
        .replace(/require\(.+\)/g, '') // remove require statements
        .replace(/import .+ from .+/g, '') // remove import statements
        .replace(/export .+ from .+/g, ''); // remove export statements
    var val;
    try {
        val = eval === null || eval === void 0 ? void 0 : eval("\n            // with (cstr) {\n            //     ".concat(innerHTML, "\n            // }\n\n            (function(c) {\n                const { ").concat(Object.keys(cstr).join(','), " } = c;\n                ").concat(innerHTML, "\n            })(cstr);\n        "));
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
var engine = function (parameters) { return function (req, res, next) {
    req.render = function (template, cstr) { return __awaiter(void 0, void 0, void 0, function () {
        var html;
        return __generator(this, function (_a) {
            try {
                html = path.join(parameters.viewsDir, template);
                render(html, cstr);
                if (parameters.next)
                    return [2 /*return*/, next()];
            }
            catch (e) {
                return [2 /*return*/, e];
            }
            return [2 /*return*/];
        });
    }); };
}; };
exports.engine = engine;
