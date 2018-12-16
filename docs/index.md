# Simple-Elements
Simple GUI elements for Khan Academy. This GUI library was made to be simple and easy to use. It doesn't offer a huge selection of elements as of now, but the number will increase in the future.

You can view the Khan Academy program [here](https://www.khanacademy.org/computer-programming/simple-elements/5201788906799104).

## Credits
[KWC](https://www.khanacademy.org/profile/MKaelin368/)
- Provided the `inherit` function
- Suggested a better way of defining methods
- Suggested to store all elements in an array and iterate over each element to deliver the event
- Suggested to use a `virtual` `noop` function in case a method that is not defined is invoked

[Jentacular Gent](https://www.khanacademy.org/computer-programming/sub-page-i-guess/4518351057747968/)
- Created the `blur` function

[VisioN](https://stackoverflow.com/a/14879700)
- Created an efficient way of finding the number of digits in a number

## Inspiration
- [Graphical User Interface Elements](https://www.khanacademy.org/computer-programming/graphical-user-interface-elements/4582505184231424) by [Dalendrion](https://www.khanacademy.org/profile/Dalendrion/)
- [UI](https://www.khanacademy.org/computer-programming/ui/2181435578) by [木](https://www.khanacademy.org/profile/humbleservant/)
- [GUI](https://www.khanacademy.org/computer-programming/gui/4904971019485184) by [Thomas L](https://www.khanacademy.org/profile/voidx/)
- [Peter Collingridge](https://www.khanacademy.org/profile/peterwcollingridge/)'s projects
- MacOS Mojave and Material Design

# Usage
Before the elements can be used, they require a bit of a set up process. This includes the event handling, configuration and some special functions.

The elements will not work properly without these components.

## Event Handling
Event handling is done by storing all elements in an array and iterating over the array to invoke each method of the elements.
```javascript
var elements = [button1, slider1];
            
mouseReleased = function() {
    elements.forEach(function (element) {
        element.onmouserelease();
    });
};
```
If there are multiple pages in a program, it is recommended that elements be stored in separate arrays for each of the pages. This eliminates the possibility of invoking elements from separate pages.
```javascript
var page1 = [button1, slider1];
var page2 = [slider2];

mouseReleased = function() {
    switch(page) {
        case "page1":
            page1.forEach(function (element) {
                element.onmouserelease();
            });
            break;
        case "page2":
            page2.forEach(function (element) {
                element.onmouserelease();
            });
            break;
    }
};
```

Below are all the event methods and their corresponding Processing function.

| Event Name | Processing Function |
| --- | --- |
| onmousepress | mousePressed |
| onmouserelease | mouseReleased |
| onmousedrag | mouseDragged |
| onkeypress | keyPressed |

## Configuration
Almost all fall back parameters are stored individually for each element in a `config` object. The object also includes global settings that are used by all elements.

It's not recommended to remove any values from the `config` object as most of them are needed and the elements will break if they are not defined. There are, however, some that can be given directly to the elements when creating them. Parameters given to the elements will almost always overwrite the config values.

Below is the first and main section of the `config` object.
```javascript
var config = {
    audioFeedback: null,
    animationStep: 0.2,
    font: createFont("sans-serif", 16),
    strokeWeight: 1,
    symbolWeight: 3,
    fill: {
        accent: color(0, 111, 222),
        outline: color(150),
        background: color(240),
        disabled: color(175),
        gradient: true
    },
    shadow: {
        min: 25,
        max: 27.5,
        fill: color(0, 0, 0, 2.5)
    },
    gradient: {
        startColor: color(255, 255, 255, 50),
        stopColor: color(255, 255, 255, 0),
        size: 25
    }
};
```
<dl>
  <dt>Audio Feedback</dt>
  <dd>Stores sound that will be played when the mouse is released on an element. Should be set to <code>getSound("<code>sound</code>")</code>. Leave as <code>null</code> for no audio feedback.</dd>
  
<dt>Animation Step</dt>
  <dd>Amount the transition will increase or decrease by for hover and click animations. Note that hover out animation will be twice as fast.</dd>
  
  <dt>Font</dt>
  <dd>The font to be used by the elements. It's recommended to not drastically change the size as it might mess up the elements' appearances.</dd>
  
  <dt>Stroke Weight</dt>
  <dd>The stroke weight used for various parts for elements. Note that fine lines will be half the stroke weight.</dd>
  
  <dt>Symbol Weight</dt>
  <dd>The stroke weight used for all symbols for the elements.</dd>
  
  <dt>Fill</dt>
  <dd>Object that hold the accent, outline, background and disabled colors as well as the gradient value. Note, the gradient value is boolean  and only determines if elements will have a gradient or not.</dd>
  
  <dt>Shadow</dt>
  <dd>Object that hold the minimum, maximum and fill color values. The minimum and maximum values refer to the size of the shadow when neutral and hovered respectively. Note that the fill color is not displayed accurately because when the shadow is drawn, it will be much darker as it is applied multiple times to achieve the blur effect.</dd>
  
  <dt>Gradient</dt>
  <dd>Object that hold the start and stop color as well as the size value. The start and stop color values represent what color the gradient will start, from the top to the bottom. The size value determines how far down the gradient goes.</dd>
</dl>

The rest of the `config` object's sections are separate for every element. This was done to not end up with unneeded values if certain elements are not utilized in a program.

Individual `config` objects for every element are usually not required. If a certain element's `config` is not defined, though, the parameters that would have been in the config must all be passed into the element. The format for a `config` for each element is as shown below.
```javascript
config.element = {
    prop1: value1,
    prop2: value2
};
```

# Special Functions
Some stand-alone are needed to further increase the functionality of vanilla JavaScript functions. The `toTitleCase` prototype function for the `String` object converts text to title case, it's used everywhere text is displayed in elements except the text box input area. The `except` prototype function for the `Array` object return the array except a certain value. The `inherit` function is used to add the `Element` methods to elements; it inherits the `Element` class for the element class.

Special functions also include the `Symbols` object which stores all the different symbol functions that will be used in some elements such as the check mark and arrow symbols. The base `Element` class is the parent class for every element and provides most of the basic functionality.

# Elements
Elements are all object oriented and a new instance must be created for any element class to be used.
```javascript
var button1 = new Button();
```

## Parameters
Parameters are passed into the elements in a single object.
```javascript
var button1 = new Button({
    x: 100,
    y: 150
});
```
Parameters not passed to into the element will fall back to the `config` object or a hard-coded value.

Every element inherits generic parameters from the `Element` class. Although some parameters can't be changed for certain elements most of these parameters are the same in every element and do the same thing, unless otherwise stated.

Parameter | Definition
--- | ---
`x` | The `x` position of the element.
`y` | The `y` position of the element.
`w` | The width of the element.
`h` | The width of the element.
`label` | The label for the element, usually shown above or inside the element.
`action` | A function that will be called if the element is pressed.
`r` | The border radius of a rectangle if the element's shape is a rectangle, if the shape of the element is an ellipse, this parameter will be the radius of the ellipse.
`fill` | The color of the element.
`disabled` | Boolean value that will determine if the element is disabled or not. Cannot be changed after element creation, the `disable` and `enable` methods need to be used for that.

## Methods
Every element inherits some essential methods from the `Element` class.

Method | Definition
--- | ---
`init` | Initiates the element, if any values like the x or w positions were changed the changes will be updated.
`disable` | Disables the element if previously enabled.
`enable` | Enables the element if previously disabled.

## Drawing Elements
Elements will not appear on the screen until their draw method is called. It is recommended to store elements in an array and iterate over the array to draw the elements if there are several elements to be displayed as shown below.
```javascript
var elements = [button1, button2, slider1, textbox1];
elements.forEach(function (element) {
    element.draw();
});
```
Each element needs to be set up in a different way. All elements and their specific parameters and usage are below.

### Button
A simple button element that executes a function when clicked. Below is the button's default config.
```javascript
config.button = {
    w: 75,
    h: 30,
    r: 5
};
```
The `Button` element has no unique parameters or methods.

### Slider
A simple slider that executes a function when the thumb is dragged or when certain keys are pressed. Below is the slider's default config.
```javascript
config.slider = {
    w: 100,
    r: 10,
    min: 0,
    max: 100
};
```
The `Slider` element takes some unique parameters to set its value range and default value.

Parameter | Definition
--- | ---
`min` | The minimum number the user can set the slider's value to.
`max` | The maximum number the user can set the slider's value to.
`value` | The default value of the slider, will be constrained to the `min` and `max` values provided.

Besides the obvious way to change the slider's value by dragging the thumb, the user can also use various keyboard controls to change the value while the slider is in focus.

Key |	Action
--- | ---
<kbd>←</kbd> or <kbd>-</kbd>	| Decrements the value by 1 or 0.1 based on the range of the value.
<kbd>→</kbd> or <kbd>+</kbd>	| Increments the value by 1 or 0.1 based on the range of the value.
<kbd>0</kbd> - <kbd>9</kbd>	| Sets the value to a certain percentage of the range. For example, 2 will set the value to 20% of the range.
<kbd><</kbd> or <kbd>[</kbd> | Sets the value to the minimum value
<kbd>></kbd> or <kbd>]</kbd> | Sets the value to the maximum value
  
More usage and examples will be added soon...
