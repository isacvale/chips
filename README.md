# chips

Chips allows you painlessly import web components saved as HTML files, and use them without the need to explicitly import them in your files.

## Why save web components as HTML?

That was the original idea behind web components, that they'd be modularized in HTML files containing style and scripts. They'd then be imported through HTML Import, a fantastic API that regrettably got left aside.

Most web component frameworks require you to write HTML with string templates, and others require you to write CSS in JS. Writing code outside they natural environment doesn't make for a good experience, it presents a steeper learning curve, and it may get in the way of your tools, such a syntax highlighing. On the other hand, writing your components in HTML means writing mark up, code, and style in their own native way, in a one-file module.

## How does it work?
Chips creates a `mutation observer`, and at any time a custom tag (a tag with a hyphen in it) is inserted in the DOM, it fetches the code for that component. This approach means that by having a default source for your web-components, you don't even have to import them: just use the custom tag from any file you wish, just like you would a native element.

Chips also uses an `intersection observer`, so your components are only fetched when they are scrolled close to the screen, meaning you get lazy loading out of the box.

Finally, Chips will memoize the components, so they're only fetched once.

### Configurations
Chips is meant to use minimum configuration. For basic use, you should:
1. Have your web-components in a folder called `./components`.
1. Import the script before body, and not as an ES6 module (Chips is meant to block the thread).
1. _You component tag name **must** match the file name_, so ``<my-component>`` should be saved as `my-component.html`.

If you must have multiple sources for components, you can configure Chips by having a global object called `window.config.chips`. That may contain a `path` object with custom-tags for keys and the component's path for values. For example:

```js
<script>
  window.config = {
    chips: {
      paths: {
        "second-component": "/alt-components",
      },
    },
  };
</script>
<script src="./index.js"></script>
```

Notice you should create the `window.config` in a simple script tag before importing Chips. In the example above, all web components would be fetched from the components folders (the default) while a component called "second-component" is imported from a folder called `/alt-components`.

Alternatively, you can have all components default to a custom source by setting a path parameter.

```js
<script>
  window.config = {
    chips: {
      path: "/my-components",
    },
  };
</script>
<script src="./index.js"></script>
```
On the example above, all components would be fetched from /my-components.

## How should I create web-components

However you like, honestly. A simple way that works is having a single HTML file per component, with a `<template>` tag containing the markup and a `<script>` tag that will be run _once_ when the component is loaded. You should use that script to define the web component.

The code below shows a simple but fully functional component:

```html
<template id="tpl-hello-world">
  <div>
    <p>Hello-world</p>
  </div>
  <style>
    p {
      padding: 5px 10px;
      background-color: antiquewhite;
    }
  </style>
</template>

<script>
  class HelloWorld extends HTMLElement {
    constructor() {
      super();
      const el = document
        .querySelector(`#tpl-hello-world`)
        .content.cloneNode(true);
      this.attachShadow({ mode: "open" }).appendChild(el);
    }
  }

  customElements.define("hello-world", HelloWorld);
  console.log("injected <hello-world>");
</script>
```

### Subcomponents
A custom element may have custom element descendants: for example, you can have an `awesome-pillbox` that holds `awesome-pills`. Chips will parse the descendants immediately after loading the parent.

### Logic components
You can create components that do not render any markup, delivering instead only code or style. The reason for it has to do organization. For example, maybe you have a "pink-" family of components, including `pink-button`, `pink-checkbox`, and `pink-select`, and you want them to share CSS.

You can, of course, just link a CSS file. But you may want to save the style as a `pink-style` component, and use it on top of each component. That allows them to share the style without the need to import them in your page.

On theat example, the `pink-style.html` would be:
```html
<style>
  [data-family="pink"]:is(button, [type="select"], [type="checkbox"]) {
    background: pink;
    padding: 1em;
  }
</style>
```
The `pink-button` would be:
```html
<template id="tpl-pink-button">
  <button data-family="pink">Pink!</button>
</template>
<pink-style></pink-style>
<script>
  class PinkButton extends HTMLElement {
    constructor() {
      super();
      const el = document
        .querySelector(`#tpl-pink-button`)
        .content.cloneNode(true);
      this.appendChild(el);
    }
  }
  customElements.define("pink-button", PinkButton);
</script>
```
