# Goose

Goose is a super basic tool for creating web components on a website.

By allowing the developer to define their own HTML/CSS/JS components in a single place, Goose encourages 
adherence to the Don't Repeat Yourself (DRY) principle without any JavaScript knowledge required.

## Setup

The process of using Goose is simple:
 1. Add the Goose folder in the root of your website folder
 2. Add the below code to your `<head>` element:
```html
<div class="code center-code">
  <script src="Goose/_private/load.js" type="module"></script>
</div>
```
 3. That's it!
  
## Using Goose Components
 
To use a Goose component, all you have to do is write it into your HTML like any other element.
When the page loads, Goose will insert your component into that container, and voila, you have a component!

## Further information

An extended demo can be found in the `index.html` file.
