// jshint ignore: start

// Since elements are created before Essentials import, functions are not defined
let noop;

// Config {
const DEFAULTS = {
    strokeWeight: 0,
    roundedCorners: 5,
    shapes: [rect, ellipse],
    minPadding: 15,
    // Holds function that return colors calculated off of the primary color
    colors: {
        primary: function() { return color(0, 111, 222); },
        text: function(_color) {
            return lightOrDarkText(_color);
        },
        onfocus: function(_color) {
            return lerpColor(_color, color(255), 0.4);
        },
        // Color to be used when mouse is over element
        onmouseover: function(_color) {
            return lerpColor(_color, color(255), 0.2);
        },
        // Color to be used when mouse is pressed on element
        onmousepress: function(_color) {
            return lerpColor(_color, color(0), 0.2);
        }
    },
    font: createFont('Segoe UI', 16),
    // Amount to increase transition by per frame
    animationStep: 0.25,
    // Object containing functions that take transition argument that is updated by element
    animations: {
        onfocus: function(transition) {
            this.strokeWeight = lerp(this.strokeWeight, 3, transition);
            this.stroke = this.colors.onfocus;
        },
        onblur: function(transition) {
            this.strokeWeight = lerp(this.strokeWeight, 0, transition);
            this.stroke = this.colors.onfocus;
        },
        onmouseover: function(transition) {
            this.fill = lerpColor(this.colors.primary, this.colors.onmouseover, 
                transition);
        },
        onmouseout: function(transition) {
            this.fill = lerpColor(this.colors.onmouseover, this.colors.primary,
                transition);
        },
        onmousepress: function(transition) {
            this.fill = lerpColor(this.colors.primary, this.colors.onmousepress, 
                transition);
        },
        onmouserelease: function(transition) {
            this.fill = lerpColor(this.colors.onmousepress, this.colors.primary,
                transition);
        }
    },
    // Options related to accessiblity and/or efficiency
    flags: {
        ANIMATIONS: true,
        CURSOR_CHANGE: true
    }
};
// }
// Element object {
/**
 * Base element class.
 * 
 * Parameters are passed in an `options` object. Keys are parameter names while values are values. This was done to allow most parameters to be optional.
 * 
 * @param  label    {string}    -   Label
 * @param  shape    {function}  -   Element body shape
 * @param  x        {number}    -   x position
 * @param  y        {number}    -   Y position
 * @param  x2       {number}    -   Center point horizontal position
 * @param  x3       {number}    -   Opposite edge horizontal position
 * @param  y2       {number}    -   Center point vertical position
 * @param  y3       {number}    -   Opposite edge vertical position
 * @param  w        {number}    -   Width of element body
 * @param  h        {number}    -   Height of element body
 * @param  colors   {object}    -   Custom colors of element body
 * @param  callback {function}  -   Function to be called when mouse is released on element
 * 
 * The `element` object should only be used by a element type (i.e. button, slider) when creating a new element.
 * These functions will not overwrite the default behaviour.
 * 
 * @param  flags            {object}    -   Custom flags
 * @param  defaults         {object}    -   Custom default values for options
 * @param  type             {string}    -   Element type
 * @param  init             {function}  -   Initialization function
 * @param  draw             {function}  -   Draw function
 * @param  onfocus          {function}  -   Custom callback for focus event
 * @param  onblur        {function}  -   Custom callback for blur event
 * @param  onmouseover      {function}  -   Custom callback for mouse over event
 * @param  onmouseout       {function}  -   Cusotm callback for mouse out event
 * @param  onmousepress     {function}  -   Custom callback for mouse press event
 * @param  onmousedrag      {function}  -   Custom callback for mouse drag event
 * @param  onmouserelease   {function}  -   Custom callback for mouse release event
 * @param  onkeypress       {function}  -   Custom callback for key press event
 * @param  onkeyrelease     {function}  -   Custom callback for key release event
 * @param  animations       {object}    -   Custom animations for various events
 */
const Element = Backbone.Model.extend({
    initialize: function(options) {
        // Element object {
        let element = this.element;
        // Fallback to default values if not defined in element object
        element = $.extend({}, DEFAULTS, element);
        // Set element default options if not defined in options object
        if (element.defaults) {
            options = $.extend({}, element.defaults, options);
        }
        // All methods of a base element
        let methods = ['init', 'draw', 'onfocus', 'onblur', 'onmouseover', 'onmouseout', 'onmousepress', 'onmousedrag', 'onmouserelease', 
            'onkeypress', 'onkeyrelease'];
        // Set methods to `noop` if they aren't defined
        methods.forEach(function(method) {
            element[method] = element[method] || noop;
        });
        /* `element` object is used because user does not need to change animations directly when creating new element instances. */
        let animations = {};
        let animationStep = !element.flags.ANIMATIONS ? 1 : element.animationStep;
        for (let i in element.animations) {
            // Fallback to default animation
            let animation = element.animations[i];
            // Define animation function
            animations[i] = function() {
                // To be used in animation, ranges from 0 to 1 to make use of `lerp` easier
                let transition = 0;
                return function() {
                    // Increment transition by default animation step
                    transition += animationStep;
                    /* Make sure transition value is not greater than one. This line is in place to prevent transition not completely finishing because transition value is greater than one and the animation stops. */
                    transition = constrain(transition, 0, 1);
                    // Pass in `transition` variable
                    animation.call(this, transition);
                    // Returns true if animation is complete, animation is stopped
                    return transition == 1;
                };
            };
        }
        element.animations = animations;
        this.activeAnimations = [];
        
        this.element = element;
        // }
        // Options object {
        // Call custom initialization function with `this`, `options` and `element` arguments
        options = $.extend({}, options, element.init.call(this, options, element));
        // Set shape to optional shape if it is included in possible element shapes
        this.shape = (element.shapes.includes(options.shape) && options.shape) || element.shapes[0];
        this.label = options.label || element.type;
        /* These fallbacks are in place in case the user wants to create a square or circle (which don't need a width and height. This is set before `x` and `y` since those values use `w` and `h` to calculate their values. 
        
        Values should already have fell back to element in defaults check */
        options.w = options.w || options.h;
        options.h = options.h || options.w;
        /* Since `x` can be zero we can't simply check for `x`. Although this could be rewritten as `typeof options.x == 'number'` it was not done since we do not check if the value of an option is a number for any other parameter. Therefore, to retain uniformity, it is not done here either */
        this.x = typeof options.x != 'undefined' ? options.x :
                 options.x2 - options.w / 2 ||
                 options.x3 - options.w;
        // Since `y` can be zero we can't simply check for `y`
        this.y = typeof options.y != 'undefined' ? options.y :
                 options.y2 - options.h / 2 ||
                 options.y3 - options.h;
        /* Width defaults to the `x2` and `x3` values respectively. This is done to retain uniformity.
        These fallbacks are in place in case the user wants to create a square or circle. */
        this.w = options.w ||
                 (options.x2 - this.x) * 2 ||
                 (options.x3 - this.x);
        /* Height defaults to the `y2` and `y3` values respectively. */
        this.h = options.h  ||
                 (options.y2 - this.y) * 2 ||
                 (options.y3 - this.y);
        
        // Ellipses aren't supported so width overwrites height's value if shape is ellipse
        this.shape == ellipse && (this.h = this.w);
        
        // Note that these values do not get defined to their counterparts in the `options` object to retain uniformity.
        this.x2 = this.x + this.w / 2;
        this.x3 = this.x + this.w;
        this.y2 = this.y + this.h / 2;
        this.y3 = this.y + this.h;
        
        // If the mouse is over the element
        this.hovered = false;
        // If the mouse is pressed on the element
        this.active = false;
        // If the mouse was last released on the element
        this.focused = false;
        // Callback defaults to the no-operation function so it doesn't throw an error when `this.callback` is invoked in event handling.
        this.callback = options.callback || noop;
        
        // Object that stores colors
        let colors = options.colors || {};
        // Set methods to defaults in configuration object if they aren't defined
        Object.keys(element.colors).forEach(function(type) {
            // Fallback to config functions that will calculate color based off primary color
            colors[type] = colors[type] || element.colors[type](colors.primary); 
        });
        /* Set `colors` attribute to the `colors` variable we have been modifying. This is just for convinience as code in the `forEach` function is not in the `Element` scope. */
        this.colors = colors;
        this.fill = this.colors.primary;
        // For animating later on
        this.stroke = this.fill;
        this.strokeWeight = options.strokeWeight || element.strokeWeight;
        this.options = options;
        // }
        // Handle attribute changes
        this.on({
            'change:x': function() {
                this.x = this.get('x');
                this.x2 = this.x + this.w / 2;
                this.x3 = this.x + this.w;
            },
            'change:y': function() {
                this.y = this.get('y');
                this.y2 = this.y + this.h / 2;
                this.y3 = this.y + this.h;
            },
            'change:w': function() {
                this.w = this.get('w');
                this.x2 = this.x + this.w / 2;
                this.x3 = this.x + this.w;
            },
            'change:h': function() {
                this.h = this.get('h');
                this.y2 = this.y + this.h / 2;
                this.y3 = this.y + this.h;
            }
        });
        // Event handling
        Mouse.on({
            'mousepress': this.onmousepress,
            'mousedrag': this.onmousedrag,
            'mouserelease': this.onmouserelease
        }, this);
        Key.on({
            'keypress': this.onkeypress,
            'keyrelease': this.onkeyrelease
        }, this);
        // this.on({
        //     'focus': this.onfocus,
        //     'blur': this.onblur,
        //     'mouseover': this.onmouseover,
        //     'mouseout': this.onmouseout,
        //     'mousepress': this.onmousepress,
        //     'mousedrag': this.onmousedrag,
        //     'mouserelease': this.onmouserelease,
        //     'keypress': this.onkeypress,
        //     'keyrelease': this.onkeyrelease
        // });
    },
    draw: function() {
        pushMatrix();
        pushStyle();
        textFont(this.element.font);
        rectMode(CORNER);
        ellipseMode(CORNER);
        strokeWeight(this.strokeWeight);
        stroke(this.stroke);
        // Call `noStroke()` if stroke weight is 0 to avoid thin stroke
        this.strokeWeight == 0 && noStroke();
        fill(this.fill);
        /* Animations are drawn after `stroke` and `fill` functions in case they do not declare them. Seems to be a better option than a random color from previous drawing leaking through. */
        for (let i = this.activeAnimations.length; i--;){
            // Check if animation is complete
            if (this.activeAnimations[i].call(this)){
                // Remove that animation, stopping it
                this.activeAnimations.splice(i, 1);
            }
        }
        // Call custom draw code with `this`
        this.element.draw.call(this, this.options, this.element);
        // Only call `onmouseover` event once by checking if hovered attribute is false
        if (this.mouseOver() && !this.hovered) {
            this.onmouseover();
            // Set attribute to true to prevent calling event multiple times
            this.hovered = true;
        // Only call `onmouseout` event once by checking if hovered attribute is true
        } else if (!this.mouseOver() && this.hovered) {
            this.onmouseout();
            // Set attribute to false to prevent calling event multiple times
            this.hovered = false;
        }
        // Pop after event handling in case event handling contains color changes
        popMatrix();
        popStyle();
    },
    mouseOver: function() {
        // Assume shape is either a rectangle or circle
        return this.shape == rect ?
            // Check if inside rectangle
            (mouseX >= this.x && mouseX <= this.x3 &&
            mouseY >= this.y && mouseY <= this.y3) :
            // Check if inside circle
            (dist(mouseX, mouseY, this.x2, this.y2) < this.w / 2);
    },
    onfocus: function() {
        this.focused = true;
        // Call custom callback with `this`
        this.element.onfocus.call(this);
        // Display focus animation
        this.activeAnimations.push(this.element.animations.onfocus());
    },
    onblur: function() {
        this.focused = false;
        // Call custom callback with `this`
        this.element.onblur.call(this);
        // Display blur animation
        this.activeAnimations.push(this.element.animations.onblur());
    },
    onmouseover: function() {
        // Only change cursor if `CURSOR_CHANGE` flag is true
        this.element.flags.CURSOR_CHANGE && cursor('POINTER');
        // Call custom callback with `this`
        this.element.onmouseover.call(this);
        // Display mouse over animation
        this.activeAnimations.push(this.element.animations.onmouseover());
    },
    onmouseout: function() {
        // Only change cursor if `CURSOR_CHANGE` flag is true
        this.element.flags.CURSOR_CHANGE && cursor('DEFAULT');
        // Call custom callback with `this`
        this.element.onmouseout.call(this);
        // Display mouse out animation
        this.activeAnimations.push(this.element.animations.onmouseout());
    },
    onmousepress: function() {
        if (this.mouseOver()) {
            this.active = true;
            // Call custom callback with `this`
            this.element.onmousepress.call(this);
            // Display mouse press animation
            this.activeAnimations.push(this.element.animations.onmousepress());
        } else {
            // Focus is lost when mouse is anywhere but on element
            this.onblur();
        }
    },
    onmousedrag: function() {
        // Call custom callback with `this`
        this.element.onmousedrag.call(this);
    },
    onmouserelease: function() {
        if (this.mouseOver() && this.active) {
            this.callback();
            this.onfocus();
            // Call custom callback with `this`
            this.element.onmouserelease.call(this);
            // Display mouse release animation
            this.activeAnimations.push(this.element.animations.onmouserelease());
            // Display mouse over animation after mouse release
            this.mouseOver() && this.onmouseover();
        }
        // Element is not longer pressed when mouse is released anywhere
        this.active = false;
    },
    onkeypress: function() {
        if (this.focused) {
            if (Key.code === ENTER) {
                this.active = true;
                // Reutilizing mouse press animation
                this.activeAnimations.push(this.element.animations.onmousepress());
            }
            // Call custom callback with `this`
            this.element.onkeypress.call(this);
        };
    },
    onkeyrelease: function() {
        if (this.focused) {
            if (Key.code == ENTER) {
                this.callback();
                this.active = false;
                // Reutilizing mouse release animation
                this.activeAnimations.push(this.element.animations.onmouserelease());
            };
            // Call custom callback with `this`
            this.element.onkeypress.call(this);
        }
    }
});
// }
// Push Button object {
const PushButton = Element.extend({
    element: {
        type: 'Push Button',
        init: function(options, element) {
            pushStyle();
            textFont(DEFAULTS.font);
            let buttonWidth = max(options.w, textWidth(options.label || element.type) + DEFAULTS.minPadding);
            popStyle();
            return {
                w: buttonWidth
            };
        },
        draw: function() {
            (this.shape)(this.x, this.y, this.w, this.h, this.element.roundedCorners);
            fill(this.colors.text);
            textAlign(CENTER, CENTER);
            text(this.label, this.x2, this.y2);
        },
        defaults: {
            w: 52,
            h: 40
        }
    }
});
// }
// Slider object {
const Slider = Element.extend({
    element: {
        type: 'Slider',
        init: function(options, element) {
            this.value = options.value;
            this.min = options.min;
            this.max = options.max;
            let Thumb = Element.extend({
                element: {
                    init: function() {
                        this.on({
                            'change:x': function() {
                                this.value = 10;
                            } 
                        });
                    },
                    type: 'Slider Thumb',
                    draw: function() {
                        (this.shape)(this.x, this.y, this.w, this.h);
                    },
                    onmousedrag: function() {
                        let x = constrain(mouseX - this.w / 2, options.x, options.w);
                        if (this.active) {
                            this.set('x', x)
                        }
                    },
                    defaults: {
                        shape: ellipse,
                        x: options.x,
                        y: options.y + 7.5 - 10,
                        w: 20,
                        colors: {
                            primary: color(255)
                        }
                    }
                }
            });
            this.thumb = new Thumb()
            let label = options.label || ' ';
            return {
                label: label
            };
        },
        draw: function() {
            noFill();
            strokeWeight(this.strokeWeight);
            stroke(this.colors.primary);
            (this.shape)(this.x, this.y2, this.x3, this.y2);
            fill(0);
            textAlign(LEFT, BOTTOM);
            text(this.label, this.x, this.y);
            text(this.value, this.x2, this.y);
            this.thumb.draw();
        },
        shapes: [line],
        defaults: {
            value: 0,
            min: 0,
            max: 100,
            w: 150,
            h: 15
        },
        strokeWeight: 2,
        animations: {
            onmouseover: noop,
            onmouseout: noop,
            onmousepress: noop,
            onmouserelease: noop,
        },
        flags: {
            CURSOR_CHANGE: false
        }
    }
});
// }
// Exporting {

// Check if program is being imported or running by itself
let importer_context;
if (importer_context) {
    let exports = {
        'DEFAULTS': DEFAULTS,
        'Element': Element,
        'PushButton': PushButton
    };
    for (let i in exports) {
        importer_context[i] = exports[i];
    }
    export_module(exports);
}
// }
// Testing {
else {
    /* Using the cached bootstrapper when testing will save time but duplicated Backbone.js events causing elements to trigger callbacks multiple times */
// let __bmslib__;
    const bootstrapper = /* __bmslib__ ? __bmslib__.cached_bootstrapper : */ function(callback) {
        let doc = Object.constructor('return this.document')();
        let jsonp = doc[['createElement']]('script');
        doc.BMS_bootstrap_loader = function(data) {
            delete doc.BMS_bootstrap_loader;
            jsonp.parentNode.removeChild(jsonp);
            Object.constructor('importer_context', 'export_module', data.revision.code)
                (this, callback);
        }.bind(this);
        jsonp.setAttribute('src',
            'https://www.khanacademy.org/api/labs/scratchpads/5522928629252096?callback=document.BMS_bootstrap_loader'
        );
        doc.head.appendChild(jsonp);
    };
    const __requirements__ = {
        'Essentials': '#5219990839590912',
    };
    bootstrapper({
        done: function(BMS, modules) {
            if (typeof IMPORTED_ESSENTIALS == 'undefined') {
                Program.restart();   
            }
            var b = new PushButton({
                x: 25,
                y: 25,
                callback: function() {
                    println('Callback!');
                }
            });
            var b2 = new PushButton({
                shape: ellipse,
                label: 'New',
                x: 150,
                y: 25,
                w: 50
            });
            var s = new Slider({
                label: 'Slide Me',
                x: 25,
                y: 100
            });
            draw = function() {
                b2.set('x', map(sin(frameCount), -1, 1, 150, 250));
                background(255);
                b.draw();
                b2.draw();
                s.draw();
            };
        },
        progress: function(progress) {
            background(255);
            fill(0);
            textAlign(CENTER);
            textFont(createFont('monospace'), 15);
            text('Importing Essentials library...', width / 2, height / 2);
        }
    });
}
// }
