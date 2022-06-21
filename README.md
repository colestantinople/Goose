![image](https://user-images.githubusercontent.com/37753525/174710810-5114539f-9e3f-458d-a9c3-bb3f23e641d0.png)

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
When the page loads, Goose will insert your component into that container.  No JavaScript knowledge required.

## Further information

An extended demo can be found in the [Goose-Tutorial](https://github.com/colestantinople/Goose-tutorial) repository.

### Reserved Components
Do not try to redefine any components from the following list.  For various reasons, implementing them will 
probably interfere with the Goose' ability to work:
 * `goose-body`
