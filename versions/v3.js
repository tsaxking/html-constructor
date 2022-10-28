const HTMLConstructor = require("./v2");

/**
 * 
 * @param {String} html HTML string
 * @param {Object} options Constructor options 
 * @param {Object} res Response object from Express (optional) 
 * @returns 
 */
function render(html, options, res) {
    const cstr = new HTMLConstructor(html, options, res);
    return cstr.render();
}

module.exports = render;