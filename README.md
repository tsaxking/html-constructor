# node-html-constructor
Easy Server Side Rendering!

# #installation

```
npm install -s node-html-constructor
```

## Usage
```html
<!doctype html>
<html lang="en">

<head>
    <title>{page_title}</title>
</head>

<body>
    <cstr cstr-type="repeat" id="thing" class="col-md-4">
        <div class="card text-start">
            <cstr type="eval">
                if (cstr.img) `<img class="card-img-top" src="${cstr.img}">`;
            </cstr>
            <div class="card-body">
                <h4 class="card-title">{title}</h4>
                <p class="card-text">{body}</p>
            </div>
        </div>
    </cstr>

    <cstr cstr-type="repeat" id="thing2" class="col-md-4">
        <div class="card text-start">
            <cstr type="eval">
                if (cstr.img) `<img class="card-img-top" src="${cstr.img}">`;
            </cstr>
            <div class="card-body">
                <h4 class="card-title">{title}</h4>
                <p class="card-text">{body}</p>
            </div>
        </div>
    </cstr>

    <cstr cstr-type="eval" id="thingy">
        if (cstr.hello) cstr.hello;
    </cstr>

    <script class="cstr" id="script_thing">
        if (cstr.hello) cstr.hello;
    </script>
</body>

</html>
```

```javascript
    const HTMLConstructor = require('node-html-constructor').v2;
    const fs = require('fs');
 
    const html = fs.readFileSync('/path/to/above/html').toString('utf-8');

    const cstrOpts = {
        thing: {
            _trustEval: true,
            _repeatNum: 3,
            img: '/hello-world.jpg',
            title: 'Title _pos!',
            body: 'Body _pos!'
        },
        thing2: [{
            img: '/hello-world.jbg',
            title: 'Title-_pos!',
            body: 'Body-_pos!'
        }, {
            title: 'Title-_pos!',
            body: 'Body-_pos!'
        }, {
            _trustEval: true,
            title: 'Title-_pos!',
            body: 'Body-_pos!'
        }],
        thingy: {
            hello: 'Hello world!'
        },
        script_thing: {
            hello: 'something'
        },
        page_title: 'Page Title!'
    }

    const cstr = new HTMLConstructor(html,cstrOpts);

    cstr.render() // renders the below content
```

```html
    <!doctype html>
    <html lang="en">

    <head>
        <title>Page Title!</title>
    <body>

            <div class="card text-start">
                <img class="card-img-top" src="/hello-world.jpg">
                <div class="card-body">
                    <h4 class="card-title">Title 1!</h4>
                    <p class="card-text">Body 1!</p>
                </div>
            </div>

                <div class="card-body">
                    <h4 class="card-title">Title 2!</h4>
                    <p class="card-text">Body 2!</p>
                </div>
            </div>

            <div class="card text-start">
                <img class="card-img-top" src="/hello-world.jpg">
                <div class="card-body">
                    <h4 class="card-title">Title 3!</h4>
                    <p class="card-text">Body 3!</p>
            </div>



            <div class="card text-start">
                <div class="card-body">
                    <h4 class="card-title">Title-1!</h4>
                    <p class="card-text">Body-1!</p>
                </div>
            </div>

            <div class="card text-start">
                <div class="card-body">
                    <h4 class="card-title">Title-2!</h4>
                    <p class="card-text">Body-2!</p>
                </div>
            </div>

            <div class="card text-start">

                <div class="card-body">
                    <h4 class="card-title">Title-3!</h4>
                    <p class="card-text">Body-3!</p>
                </div>
            </div>


        Hello world!

        something
    </body>

    </html>
```

## Contribution
I am new to coding, so this package is more for me personally. I wrote it in my first year of learning javascript so there are some parts that are bad practices; I am planning on fixing those instances.


## Updates
I aim to keep backwards compatibility back to version 1.0.0 to the best of my ability, so if anyone uses this and updates, I want it to still work
Everything will still work from 1.3.0 and before if you change this:
```javascript
const HTMLConstructor = require('node-html-constructor');
// to:
const HTMLConstructor = require('node-html-constructor').v1; // Full backwards compatibility 1.3.0 and before (This was the last update before 2.0.0)
```
However it is deprecated
## License
[ISC](https://choosealicense.com/licenses/isc/)

## Version 1.3.0 and Before Usage:
```javascript
 const HTMLConstructor = require('node-html-constructor').v1; // MUST CONTAIN .v1!
 const fs = require('fs');
 
 // Create a new constructor
/**
 * @param {Object} req Request Object (for sendToClient)
 * @param {String} HTML HTML String
 * @param {Object} options Constructor Options (View below)
*/
 const constructor = new HTMLConstructor(res, fs.readFileSync('./index.html').toString('utf-8'), {
    repeatObj: {
        repeatTag1: [ // finds <repeat id="repeatTag1">@FOO@    @HELLO@</repeat>
            { foo: 'bar', hello: 'world', _REPEAT_TEST_: (thisObject) => return thisObject.foo == 'bar' }, // will render this data
            { foo: 'foo', hello: 'bar', _REPEAT_TEST_: (thisObject) => return thisObject.foo == 'bar' }, // skips this data
            { foo: 'foo', hello: 'bar' } // will also render this data
        ]
    },
    ifConstructor: [// replaces all '@FOO@' in html with 'bar' 
        { replace: "foo", valueIfTrue: 'bar', valueIfFalse: '' (Obsolete with elseCondition), condition: true, elseCondition: false (Optional), elseTrue: 'hello' (value if else if is true), elseFalse: 'world' },
    ],
    replaceTags: 'div', // Replaces all <repeat></repeat> tags with <div></div> Keeps all other data types (ie. id, classList, datasets, etc.),
    sanitize: true, // uses require('sanitize') to remove all <script> and <style> tags as well as any inline-scripts/styles. (use this for client side inputs)
    sendToClient: true, // requires a req object in the constructor. will send rendered html to client on constructor.render()
    replaceObj: { // replaces all '@FOO@' with 'bar' and '@HELLO@' with 'world'. I recommend you use this after the repeatObj
        foo: 'bar',
        hello: 'world' 
    },
    log: true, // Print logs
    replaceArray, // Deprecated. Only continues to exist for backwards compatibility
    repeatArray // Deprecated. Only continues to exist for backwards compatibility
})
 
// Renders the html. Since sendToClient is true, will send to the client as a status 200.
// This will execute the above options in order (with the exception of sendToClient)
constructor.render();
```