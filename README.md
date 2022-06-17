# node-html-constructor
Easy Server Side Rendering! All information can be passed into a simple variable!

## Installation

```
npm install -s node-html-constructor
```

## Usage
### How to initialize:
Initializing takes 3 parameters, an html string, constructorOptions (I often abbreviate to cstrOpts), and optionally, a res object from express.

```javascript
const HTMLConstructor = require('node-html-constructor').v2;
// or
const { HTMLConstructor } = require('node-html-constructor'); // this will always be the most recent, but may not be fully backwards compatible so be careful when updating!

const cstr = new HTMLConstructor(
    '<></>', // Either a path to an html file or an html string
    {}, // constructor options (I recommend initializing before and passing in as a variable)
    res // response object from express (adding this variable will automatically send rendered html using res.status(200).send(renderedHTML))
);
```
### How to run:
Calling .render() will render your html given your constructorOptions. If you pass in an express res object, it will automatically send the rendered html using res.status(200).send(renderedHTML)
```javascript
cstr.render();
```
### Simple replacing
If you just want to replace some content in your html, all you have to do is place the variables you want in your options variable!

Anything in {thisTypeOfTag} can be read by HTMLConstructor and is accessible through your constructorOptions

ex:
```html
<h1>{title}</h1>
```
and
```javascript
const cstrOpts = {
    title: 'Hello world!'
}
```
Will be rendered into:
```html
<h1>Hello world!</h1>
```
Now, be sure to not have `<cstr>` tags below with the same id as the above or else it will not be replaced.

### Building your constructorOptions with HTML:
This works in tandem with a custom html tag: `<cstr>`

In your "options" variable, each key works with a single `<cstr>` element with the id of the same name. Example:
```html
<cstr id="someElement">
</cstr>
```
Will be rendered by:
```javascript
const cstrOpts = {
    someElement // read what you can do with this below
}
```
### Types of constructorOptions:
There are currently 2 types of `<cstr>` tags: eval and repeat. To create them, just type eval or repeat in the `cstr-type` attribute
```html
<cstr cstr-type="eval"></cstr>
<cstr cstr-type="repeat"></cstr>
```

### Repeats! (`<cstr cstr-type="repeat">`)
Honestly whenever I use HTMLConstructor, this is mostly what I use it for ;) I find this really handy for dynamic sites!

Anything inside of a `<cstr cstr-type="repeat">` tag can have its contents repeated with a very simple replace feature on each repeat similar to what's shown above.

Say you want this:
```html
<span id="thing-0">
    <h1>Coffee</h1>
    <p>Is amazing</p>
</span>
<span id="thing-1">
    <h1>Chocolate</h1>
    <p>Is best when dark</p>
</span>
<span id="thing-2">
    <h1>Sushi</h1>
    <p>Tastes terrible (yeahhh sorry)</p>
</span>
<span id="thing-3">
    <h1>Pasta</h1>
    <p>Is not quite as good as coffee, but still amazing</p>
</span>
```
You could write that all out and have it be entirely static, or you could do this:
```html
<cstr cstr-type="repeat" id="repeatThis">
    <span id="thing-{_pos}">
        <h1>{title}</h1>
        <p>{description}</p>
    </span>
</cstr>
```
Then in your constructorOptions:
```javascript
const cstrOpts = {
    repeatThis: [
        { title: 'Coffee', description: 'Is amazing' },
        { title: 'Chocolate', description: 'Is best when dark' },
        { title: 'Sushi', description: 'Tastes terrible (yeahhh sorry)' },
        { title: 'Pasta', description: 'Is not quite as good as coffee, but still amazing' }
    ]
}
```
And it will render the same thing as above!

Notice, I also had an iterable variable called `_pos` (position) that was rendered. This is done by HTMLConstructor, you don't need to create it! It will be a 0 based index

If you want something that repeats a bunch of times but the only thing that changes is its position number (_pos), you don't need an array, you can do this:

```html
<cstr cstr-type="repeat" id="countTo1Million">
    <p>{_pos}</p>
</cstr>
```
Then in your javascript:
```javascript
const cstrOpts = {
    countTo1Million: {
        _repeatNum: 1000000
    }
}
```
You can pass in other variables similar to the one before, but it could be useful! It's also possible to run a function in a repeat, but to do that you have to understand `<cstr cstr-type="eval">`

### Inline javascript! (`<cstr cstr-type="eval">`):
Eval will run any javascript in this tag and replace the entire contents with what the javascript returns. For example:
```html
<p>
    <cstr cstr-type="eval" id="runThis">
        if (true) 'hello world!';
        else 'goodbye world!';
    </cstr>
</p>
<!-- Will render into: -->
<p>'hello world!'</p>
```
If your javascript is long and you're using an HTML formatter, it may put all your javascript on one line (because it's not reading the multilines). You can avoid this by doing something similar with a script tag!

```html
<p>
    <script cstr-type="eval" id="doThis">
        if (true) 'hello world!';
        else 'goodbye world!';
    </script>
</p>
<!-- Will also render into: -->
<p>'hello world!'</p>
```
#### Ensuring the scripts run
Now, these will only be rendered if you have the keys in the constructor object! If you're not passing in any variables, you can just set them to be anything as long as they are not `undefined`!

Any `<cstr>` or `<script>` with cstr-type="eval" will not be run if it is not in your options object. This is to help ensure no script you don't want to have run will be run. You can also sanitize any variables before passing them into your script if you're worried! How to do that is shown below.

So, to run the above constructor eval, just do this:
```javascript
const cstrOpts = {
    doThis: true,
    runThis: true
}
```
#### Passing in variables
If you want to pass variables into your `<cstr>` javascript, you can do it! Any information you pass into the key will be readable by your cstr or script tags, this data will be in a variable called `cstr`!

Here's how you can use it:

Javascript:
```javascript
const cstrOpts = {
    something: {
        foo: 'bar',
        greeting: 'hello world!'
    }
}
```
Then in your html:
```html
<p>
    <cstr cstr-type="eval" id="something">
        if (cstr.foo == 'bar') cstr.greeting
    </cstr>
</p>
<!-- or -->
<p>
    <script cstr-type="eval" id="something">
        if (cstr.foo == 'bar') cstr.greeting;
    </script>
</p>
<!-- Will both be rendered into: -->
<p>hello world!</p>
```

### Combining repeats and evals!
If you're running an evaluation inside a repeat `<cstr>`, you don't need to give the `<cstr cstr-type="eval">` an id! In your repeat's constructorOptions, you have to set `_trustEval = true`.

ex:
```html
<!-- Say this is a vertical navbar on the left with navigation sections and respective links -->
<nav>
    <cstr cstr-type="repeat" id="navRepeat">
        <script cstr-type="eval">
            if (cstr.type == 'title') `
                <h3>{title}</h3>`;
            else if (cstr.type == 'link') `
                <a href="{url}">
                    {name}
                </a>`; // this will return a string for the <cstr> tag to replace!
        </script>
    </cstr>
</nav>
```
Our javascript could look like this:
```javascript
const cstrOpts = {
    navRepeat: [
        {
            type: 'title',
            title: 'Main Links',
            _trustEval: true // this must be present in every position of this array or else the script won't run (this is to help protect against attacks)
        },
        {
            type: 'link',
            url: '/home',
            name: 'Home',
            _trustEval: true
        },
        {
            type: 'link',
            url: '/account',
            name: 'My Account',
            _trustEval: true
        } // and so on
    ]
}
```
This will generate:
```html
<nav>
    <h3>Main Links</h3>
    <a href="/home">Home</a>
    <a href="/account">My Account</a>
</nav>
```
IMPORTANT: If you don't have _trustEval in this, it won't run the script

Also, what's important to understand is the script will evaluate the scripts first, then replace. That's why I didn't put `cstr.title`, `cstr.url`, or `cstr.name`; the script was run first which allowed `{title}`, `{url}`, and `{name}` to be available.

### ConstructorOptions can be as long as you want!
You can have as many repeats, replaces, scripts, etc. as you want in your html and HTMLConstructor will render it! To do so, just place that information in constructorOptions!

```javascript
const fs = require('fs');
const HTMLConstructor = require('node-html-constructor').v2;

const cstrOpts = {
    someRepeat: [
        { firstName: 'Daniel', lastName: 'Craig' },
        { firstName: 'Melissa', lastName: 'Fumero' }
        { firstName: 'Robert', lastName: 'Downey Jr.' }
    ],
    someScript: {
        title: 'Some title I want to pass in',
        test: (() => {
            return bool; // Maybe some test, idk!
        })()
    },
    replaceMe: 'with this' // will {replaceMe} with this
}

const html = fs.readFileSync('./index.html').toString('utf-8');
const cstr = new HTMLConstructor(html, cstrOpts);

cstr.render();
```

## Contribution
I am new to coding, so this package is more for me personally. I hope to make this better so if you have any ideas, please let me know!

## Future of HTMLConstructor
Here are the plans I have for HTMLConstructor's future!

### Sanitizing (using sanitize-html)
By adding in `_sanitize: true` to ConstructorOptions, HTMLConstructor will sanitize all input variables in the same scope of `_sanitize: true`.

Ex:
```javascript
const cstrOpts = {
    someRepeat: [
        {
            _sanitize: true // this will sanitize all variables in cstrOpts.someRepeat in every position
        }
    ],
    someScript: {
        _sanitize: true // this will sanitize all variables in cstrOpts.someScript before passing them into your script
    },
    _sanitize: true // this will sanitize all variables in cstrOpts (making the other two _sanitize variables useless lol)
}
```

### Shorthand and other `<cstr>` tags
I plan on using tags like:
```html
<eval>
<repeat>
```
And some shorthands like:
```html
{rp (
        <!-- Repeat elements in this section -->
    )
}
{js (
        <!-- evaluate js in this section -->
    )
}
```
I still have yet to figure out some good ideas around that, but I'll be updating when possible.

## Updates
I aim to keep backwards compatibility back to version 1.0.0 to the best of my ability, so if anyone uses this and updates, I want it to still work

All code will still work from 1.0.0 to the current version, all code will be stored in .v(versionNumber)
```javascript
require('node-html-constructor').v1; // Full backwards compatibility 1.3.0 and before (This was the last update before 2.0.0)
require('node-html-constructor').v2; // 2.0.0 and up
```

#### Version 1.0.0 - 1.3.0 Usage:
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



## License
[ISC](https://choosealicense.com/licenses/isc/)