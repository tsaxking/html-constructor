# node-html-constructor
Easy Server Side Rendering! All information can be passed into a simple variable!

## Installation

```bash
npm i node-html-constructor
```

```typescript
import { v4 as render } from 'node-html-constructor';
// or
import render from 'node-html-constructor/versions/v4';
// require
const render = require('node-html-constructor').v4;
```

## Usage
Usage will look like this:
```typescript
const html = fs.readFileSync('./index.html', 'utf-8');

const cstr = {} // Properties to be passed into the html (see below)

const result = render(html, cstr);
```

## The Constructor
The constructor is broken down into 3 parts: 
1. Replacing
2. Looping
3. Conditional Rendering

<hr>

### Replacing
This is very simple, any property in the constructor that is in the html as `{{ property }}` will be replaced with the value of the property. For example:
```typescript
const html = '<h1>{{ title }}</h1>';

const cstr = {
    title: 'Hello World!'
}

const result = render(html, cstr); // <h1>Hello World!</h1>
```

The double brackets are used because it's unlikely any string of text in english will have double brackets in it. If you want to use double brackets in your html, you can escape them with a backslash: `\\{\\{` and `\\}\\}`.

<hr>


### Looping
Looping is done using `<repeat>` tags. All tags used by `node-html-constructor` are lowercase and require an id to be used, otherwise they will be removed. For example:

```typescript
const html = `
    <repeat id="users">
        <p>{{ name }}</p>
    </repeat>
`;

const cstr = {
    users: [
        { name: 'John' },
        { name: 'Jane' }
    ]
}

const result = render(html, cstr); // <p>John</p><p>Jane</p>
```

As you can see, the rendering function looks for `users` in `cstr` and loops through it, replacing `{{ name }}` with the value of `name` in each object.

<hr>

### Conditional Rendering
Conditional rendering is done using `<script cstr>` tags. These tags are used to run javascript code on the server side. For example:


```typescript
const html = `
    <script cstr id="user">
        if (${name}) {
            return '<p>${name}</p>';
        } else {
            return '<p>No user found!</p>';
        }
    </script>
`;

const cstr = {
    user: {
        name: 'John'
    }
}

const result = render(html, cstr); // <p>John</p>
```

**IMPORTANT:**
- The `<script>` tag **MUST** have the `cstr` attribute.
- The javascript inside the tag must use return statements
- This must return a string
- The string does not need to be wrapped in html tags, but it can be
- The code inside the tag is run in a sandboxed environment, so it cannot access any variables outside of the tag unless explicitly passed into the property of the `cstr` object. Don't pass in anything you don't want the code to have access to!

<hr>

### Nesting
All of these properties can be nested inside each other. For example:

```typescript
const html = `
    <repeat id="users">
        <script cstr id="user">
            if (${name}) {
                return '<p>${name}</p>';
            } else {
                return '<p>No user found!</p>';
            }
        </script>
    </repeat>
`;

const cstr = {
    users: [
        { name: 'John' },
        { name: 'Jane' }
    ]
}

const result = render(html, cstr); // <p>John</p><p>Jane</p>
```
Basically, this calls `render()` on each object in `users` and replaces the `<script>` tag with the result. However, you cannot nest `<repeat>` tags inside a `<script>` tag. Maybe in the future!