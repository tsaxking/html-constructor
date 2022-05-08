# html-constructor
Easy Server Side Rendering!

# #installation

```
npm install -s node-html-constructor
```

## Usage

```javascript
 const HTMLConstructor = require('node-html-constructor');
 const fs = require('fs');
 
 // Create a new constructor
 const constructor = new HTMLConstructor(null,res,fs.readFileSync('./index.html'),{
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
    replaceArray, // Deprecated. Only continues to exist for backwards compatibility
    repeatArray // Deprecated. Only continues to exist for backwards compatibility
})
 
// Renders the html. Since sendToClient is true, will send to the client as a status 200.
// This will execute the above options in order (with the exception of sendToClient)
constructor.render();
```

## Contribution
I am new to coding, so this package is more for me personally. I wrote it in my first year of learning javascript so there are some parts that are bad practices; I am planning on fixing those instances.


## Updates
I aim to keep backwards compatibility back to version 1.0.0 to the best of my ability, so if anyone uses this and updates, I want it to still work

## License
[MIT](https://choosealicense.com/licenses/mit/)
