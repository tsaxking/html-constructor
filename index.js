// const fs = require('fs');
const sanitizeHTML = require('sanitize');
const { parse } = require('node-html-parser');



/**
 * @description Constructor for strings using HTML tags
 * @param {string}  req Request from client NOT USED YET
 * @param {string}  res Response to client
 * @param {string}  HTML HTML String
 * @param {object}  options --- if you want to send everything after rendered. Returns rendered HTML regardless
    sendToClient: bool,

    --- if you want to use the sanitize-html package and remove all potential attacks
    sanitizeHTML: bool,

    --- In your sting, just put @YOUR_TOKEN_HERE@, must be UPPERCASE within @@
    replaceArray: [
        ["Replace this token regardless of case", "with this"],
        ["token", "with this"],
        ["token", "with this"]
    ],

    --- Repeats everything in <repeat id="repeatId"> tags for every replaceArray. Replaces <repeat and </repeat> with <div and </div>
    repeatObj:{
        repeatId: [
            replaceArray, //(see above)
            replaceArray,
            replaceArray
        ],
        repeatId: [
            replaceArray, //(see above)
            replaceArray,
            replaceArray
        ]...
    },

    --- OPTIONAL REPEAT OPTIONS
    replaceTags: {
        --- If you want the <repeat> tags to be replaced with something other than <div>, put the new tag here, this corresponds with the repeatObj
        "repeatID": 'newTag',
        "repeatID": 'newTag',
        "repeatID": 'newTag',
    },

    --- Replaces a set of tokens based on a boolean value
    ifConditions: [
        { replace: "token", valueIfTrue: "val", valueIfFalse: "val", condition: boolean },
        { replace: "token", valueIfTrue: "val", valueIfFalse: "val", condition: boolean },
        { replace: "token", valueIfTrue: "val", valueIfFalse: "val", condition: boolean }
    ]
}
 */
class HTMLConstructor {
    constructor(req, res, HTML, options) {
            // this.req = req;
            this.res = res;
            // this.url = req.url;
            // this.params = req.params;
            // this.body = req.body;
            // this.HTML = fs.readFileSync(`${__dirname.replace(/\\/g, "/")}${path}`).toString();
            this.HTML = HTML.toString();
            this.replaceArray = options.replaceArray;
            this.repeatObj = options.repeatObj;
            this.ifConditions = options.ifConditions;
            this.sendToClient = options.sendToClient;
            this.replaceTags = options.replaceTags;
            this.options = options;
            this.replaceObj = options.replaceObj;
            this.sanitize = options.sanitize;
        }
        /**
         * @description Renders HTMLConstructor.HTML and sends if requested
         * @returns {string} Rendered HTML
         */
    render() {
            let str = this.HTML
            for (var x in this.options) {
                if (x == "replaceArray") {
                    if (this.replaceArray) {
                        console.log("Rendering replaceArray");
                        str = this.replaceValuesInArray(str, this.replaceArray, '@');
                    }
                } else if (x == "repeatObj") {
                    if (this.repeatObj) {
                        console.log('Rendering repeats');
                        str = this.repeat(str, this.repeatObj);
                    }
                } else if (x == "ifConditions") {
                    if (this.ifConditions) {
                        console.log("Rendering if conditions");
                        str = this.ifConstructor(this.HTML, this.ifConditions);
                    }
                } else if (x == "Sanitize") {
                    if (this.sanitize) {
                        console.log("Sanitizing");
                        str = sanitizeHTML(str);
                    }
                } else if (x == "replaceObj") {
                    if (this.replaceObj) {
                        console.log("Rendering replaceObj");
                        str = this.replaceValuesInObject(str, this.replaceObj, '@');
                    }
                }
                this.HTML = str;
            }
            if (this.sendToClient) {
                console.log("Sending");
                this.res.status(200).send(str);
            }
            return str;
        }
        /**
         * @description Replaces all tokens in a string with an array In your sting, just put @YOUR_TOKEN_HERE@, must be UPPERCASE within your tokenDelimiters which default to @@
         * @param {string} str String to replace tokens in
         * @param {array} replaceArray Not case sensitive [["token","value"],["token","value"],...] 
         * @optional @param {string} tokenDelimeter Surrounds token in string
         * @returns {string} Rendered string with replaced values
         */
    replaceValuesInArray(str, replaceArray, tokenDelimeter) {
        replaceArray.map(pair => {
            var token = `${tokenDelimeter}${pair[0].toUpperCase()}${tokenDelimeter}`;
            str = this.replaceAll(str, token, pair[1])
        });
        return str;
    }
    replaceValuesInObject(str, replaceObj, tokenDelimeter) {
            Object.keys(replaceObj).forEach(key => {
                let token = tokenDelimeter + key + tokenDelimeter;
                token = token.toUpperCase();
                let regex = new RegExp(token, 'g');
                str = str.replace(regex, replaceObj[key]);
            });
            return str;
        }
        /**
         * @description Replaces all tokens in a string
         * @param {string} str String to replace tokens in
         * @param {string} token CASE SENSITIVE - Token to replace 
         * @param {string} value Replaces token with this
         * @returns Rendered string with replaced values
         */
    replaceAll(str, token, value) {
            const regex = new RegExp(token.toUpperCase(), 'g');
            str = str.replace(regex, value);
            return str;
        }
        /**
         * @description Repeats everything in <repeat></repeat>
         * @param {string} str HTML String with <repeat> tags
         * @param {object} repeatObj contains objects where the name matches the id of the repeat tag containing an array of replaceArrays
         * @returns {string} HTMLString with <repeat> rendered for the length of repeatArray
         */
    repeat(str, repeatObj) {
            let HTML = parse(str);
            if (!this.replaceTags) this.replaceTags = {}
            for (var repeatID in repeatObj) { // loops through all repeat arrays
                HTML.querySelectorAll(`repeat#${repeatID}`).forEach(repeatSect => {
                    repeatSect.id = '';
                    let repeatArray = repeatObj[repeatID]; // extracts its repeatArray
                    let renderedSubStr = ''; // temporary string
                    let repeatNum = 1;
                    repeatArray.map(rplcArray => { // loops through array
                        try { if (rplcArray.indexOf(['repeat-num', repeatNum]) == -1) rplcArray.push(['repeat-num', repeatNum]); } catch (err) {
                            if (!(rplcArray.repeat_num || rplcArray.repeatNum || rplcArray.num)) rplcArray.repeatNum = rplcArray.repeat_num || rplcArray.num || repeatNum;
                        }
                        let subStr = repeatSect.innerHTML; // extracts repeat section
                        try {
                            subStr = this.replaceValuesInObject(subStr, rplcArray, '@');
                        } catch (err) {
                            subStr = this.replaceValuesInArray(subStr, rplcArray, '@');
                        }
                        renderedSubStr = renderedSubStr + subStr; // appends to rendered string
                        repeatNum++;
                    });
                    repeatSect.innerHTML = renderedSubStr; // adds rendered contents
                    repeatSect.replaceWith(repeatSect.innerHTML);
                    // if (!this.replaceTags[repeatID]) this.replaceTags[repeatID] = 'div';
                });
            }
            return HTML.outerHTML;
        }
        /**
             * @description Replaces all tokens with another value given a boolean value
             * @param {string} str String to replace values in
             * @param {array} conditionSets [
            { replace: "token", valueIfTrue: "val", valueIfFalse: "val", condition: boolean },
            { replace: "token", valueIfTrue: "val", valueIfFalse: "val", condition: boolean },
            { replace: "token", valueIfTrue: "val", valueIfFalse: "val", condition: boolean, (OPTIONAL: ) elseCondition: boolean, elseTrue: "val", elseFalse: "val" }
        ]
             * @returns {string} Rendered string
             */
    ifConstructor(str, conditionSets) {
            conditionSets.map(conditionSet => {
                let value;
                if (conditionSet.condition) value = conditionSet.valueIfTrue;
                else if (conditionSet.elseCondition == undefined) value = conditionSet.valueIfFalse;
                else if (conditionSet.elseCondition) value = conditionSet.elseTrue;
                else value = conditionSet.elseFalse;
                str = this.replaceAll(str, `@${conditionSet.token.toUpperCase()}@`, value);
            });
            return str;
        }
        /**
         * @description Replaces all values in a string given a condition
         * @param {string} str String to replace values in
         * @param {string} token Token in string surrounded by @@ to be replaced
         * @param {str} valueIfTrue Value to replace if condition is true
         * @param {string} valueIfFalse Value to replace if condition is false
         * @param {string} condition Boolean value
         * @returns {string} Returns string with all tokens replaced
         */
    replaceIf(str, token, valueIfTrue, valueIfFalse, condition) {
        let value;
        if (condition) value = valueIfTrue;
        else value = valueIfFalse;
        return this.replaceAll(str, token, value);
    }
}

exports = module.exports = HTMLConstructor;