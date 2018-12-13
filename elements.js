/** Essentials */
//Config {
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
config.button = {
    w: 75,
    h: 30,
    r: 5
};
config.radiobutton = {
    r: 10
};
config.checkbox = {
    w: 20,
    h: 20,
    r: 5
};
config.slider = {
    w: 100,
    r: 10,
    min: 0,
    max: 100
};
config.pane = {
    w: 100,
    h: 125,
    r: 5
};
config.dropdown = {
    w: 125,
    h: 25,
    r: 10,
    items: 4
};
config.textbox = {
    w: 200,
    h: 30,
    r: 5,
    max: 20,
    obfuscation: "•"
};
//}
//Functions {
String.prototype.toTitleCase = function(str) {
    return this.replace(/\w\S*/g, function(word) {
        return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    });
};
Array.prototype.except = function(val) {
    return this.filter(function(arr) { return arr !== val; });        
};
var inherit = function (subClass, superClass) {
    Object.setPrototypeOf(subClass.prototype, superClass.prototype);
    subClass.prototype.constructor = subClass;
    if (superClass.prototype.constructor === Object) {
        superClass.prototype.constructor = superClass;
    }
};
var noop = function() {};
//}
//Symbols {
var symbols = {
    checkmark: function(x, y, scale) {
        scale = scale || 1;
        line(x - (5 * scale), y + (1 * scale), x - (1.75 * scale), y + (5 * scale));
        line(x - (1.75 * scale), y + (5 * scale), x + (5 * scale), y - (5 * scale));
    },
    arrow: function(x, y, scale) {
        scale = scale || 1;
        noFill();
        beginShape();
        vertex(x - (5 * scale), y - (2 * scale));
        vertex(x, y + (3 * scale));
        vertex(x + (5 * scale), y - (2 * scale));
        endShape();
    }
};
//}
//Element {
var Element = function(params) {
    this.x = params.x;
    this.y = params.y;
    this.w = params.w || this.shape === ellipse && params.r * 2;
    this.h = params.h || this.shape === ellipse && params.r * 2;
    this.label = params.label;
    this.shape = params.shape;
    this.action = params.action;
    
    this.x2 = this.x + this.w / 2;
    this.y2 = this.y + this.h / 2;
    this.x3 = this.x + this.w;
    this.y3 = this.y + this.h;
    this.r = params.r;
    this.cursor = "DEFAULT";
    
    this.selected = false;
    this.focused = false;
    this.transition = 0;
    this.transition2 = 0;
};
Element.prototype = {
    disable: function() {
        this.disabled = true;
        this.color = this.fill;
        this.fill = config.fill.disabled;
    },
    enable: function() {
        this.disabled = false;
        this.fill = this.color;
    },
    drawShadow: function(args) {
        if(this.disabled) {
            return;   
        }
        pushStyle();
        noStroke();
        stroke(config.shadow.fill);
        noFill();
        for(var i = 0; i < map(this.transition, 0, 1, config.shadow.min, config.shadow.max); i++) {
            strokeWeight(sin(i) * i);
            if(this.shape === rect && !args) {
                (this.shape)(this.x + 1.5, this.y + 3, this.w - 4, this.h - 3, this.r);
            } else {
                ellipseMode(CORNER);
                (this.shape).apply(this, args);
            }
        }
        popStyle();
    },
    drawGradient: function() {
        if(!config.fill.gradient || this.disabled) {
            return;
        }
        pushStyle();
        strokeWeight(1);
        if(this.shape === rect) {
            for(var i = 0; i < config.gradient.size; i ++) {
                stroke(lerpColor(config.gradient.startColor, config.gradient.stopColor, map(i, 0, config.gradient.size, 0, 1)));
                line(this.x, this.y + i, this.x2 + this.w / 2, this.y + i);
            }
        } else {
            println("Only rect gradients are avalible.");
            noLoop();
        }
        popStyle();
    },
    animate: function() {
        if(this.selected || this.disabled) {
            this.transition -= config.animationStep * 2;
            this.transition2 += config.animationStep / 2;
        } else if(this.mouseOver()) {
            this.transition2 -= config.animationStep / 2;
            this.transition += config.animationStep;
            if(this.cursor !== "POINTER" && !this.noCursorChange) {
                 this.cursor = "POINTER";
                 cursor(this.cursor);
            }
        } else {
            this.transition2 -= config.animationStep;
            this.transition -= config.animationStep;
            if(this.cursor !== "DEFAULT" && !this.noCursorChange) {
                 this.cursor = "DEFAULT";
                 cursor(this.cursor);
            }
        }
        this.transition = constrain(this.transition, 0, 1);
        this.transition2 = constrain(this.transition2, 0, 1);
    },
    mouseOver: function() {
        return this.shape === rect ? (mouseX >= this.x && mouseX <= this.x3 && mouseY >= this.y && mouseY <= this.y3) : (dist(mouseX, mouseY, this.thumb ? this.thumb.x : this.x2, this.thumb ? this.thumb.y : this.y2) < this.r);
    },
    onmousepress: function() {
        if(this.mouseOver() && !this.disabled) {
            this.selected = true;
        } else {
            this.focused = false; 
        }
    },
    onmouserelease: function() {
        if(this.mouseOver() && this.selected && !this.disabled) {
            this.focused = true;
            try {
                this.toggled = this.toggled ? false : true;
            } catch(error) {}
            this.action();
            try {
                playSound(config.audioFeedback);
            } catch(error) {}
        }
        this.selected = false;
    },
    onmousedrag: noop,
    onmousescroll: noop,
    onkeypress: noop
};
//}

/** Elements */
//Button {
var Button = function(params) {
    this.init = function() {
        params.label = this.label || params.label || "";
        params.shape = rect;
        params.x = this.x || params.x || 0;
        params.y = this.y || params.y || 0;
        textFont(config.font);
        params.w = max(textWidth(params.label) + 40, config.button.w);
        params.h = params.h || config.button.h;
        params.r = config.button.r;
        params.action = params.action || noop;
        Element.call(this, params);
        this.disabled = this.disabled || params.disabled;
        this.fill = this.disabled ? config.fill.disabled : (this.fill || params.fill || config.fill.accent);
    };
    this.init();
};
Button.prototype = {
    draw: function() {
        pushStyle();
        this.drawShadow();
        rectMode(LEFT);
        ellipseMode(CORNER);
        strokeWeight(config.strokeWeight);
        noStroke();
        //stroke(this.disabled ? config.fill.outline : this.fill);
        fill(lerpColor(this.fill, color(255), this.transition / 10));
        (this.shape)(this.x, this.y, this.w, this.h, this.r);
        this.drawGradient();
        fill(255);
        textAlign(CENTER, CENTER);
        textFont(config.font);
        text(this.label, this.x2, this.y2);
        this.animate();
        popStyle();
    }
};
inherit(Button, Element);
//}
//Textbox {
var Textbox = function(params) {
    this.init = function() {
        params.label = this.label || params.label || "";
        params.shape = rect;
        params.x = this.x || params.x || 0;
        params.y = this.y || params.y || 0;
        textFont(config.font);
        params.w = params.w || config.textbox.w;
        params.h = params.h || config.textbox.h;
        params.r = config.textbox.r;
        params.action = params.action || noop;
        Element.call(this, params);
        this.disabled = this.disabled || params.disabled;
        this.noCursorChange = true;
        this.inline = params.inline || false;
        this.fill = this.disabled ? config.fill.disabled : (this.fill || params.fill || config.fill.accent);
        this.text = params.text || "";
        this.caret = 0;
        this.max = min(params.max, config.textbox.max);
        this.obfusticated = params.obfusticate || false;
    };
    this.init();
};
Textbox.prototype = {
    draw: function() {
        pushStyle();
        if(!this.inline && this.focused) {
            this.drawShadow();
        }
        rectMode(LEFT);
        ellipseMode(CORNER);
        strokeWeight(config.strokeWeight);
        stroke(this.inline ? (this.focused ? config.fill.outline : lerpColor(color(0, 0, 0, 1), config.fill.outline, this.transition / 5)) : this.focused ? this.fill: config.fill.outline);
        fill(this.inline ? color(0, 0, 0, 1) : lerpColor(color(255), config.fill.disabled, this.transition / 10));
        (this.shape)(this.x, this.y, this.w, this.h, this.r);
        fill(0);
        textAlign(LEFT, CENTER);
        textFont(config.font);
        if(textWidth(this.text) > this.w - 5) {
            this.label = this.obfusticated ? config.textbox.obfuscation.repeat(this.text.length).substring(this.text.length - 15) : this.text.substring(this.text.length - 15);
        } else {
            this.label = this.obfusticated ? config.textbox.obfuscation.repeat(this.text.length) : this.text;
        }
        text(this.label, this.x + 5, this.y2);
        if(this.mouseOver() && this.text.length > 0 && !keyIsPressed) {
            var caret = this.text.length;
            var complete = false;
            for(var i = 0; i < this.text.length; i++) {
                if(textWidth(this.text.substring(0, i)) - textWidth(this.text.substring(i - 1, i)) / 2 > mouseX - this.x - 5) {
                    caret = i - 1;
                    complete = true;
                    break;
                }
            }
            if(!complete) {
                caret = this.text.length;   
            }
            stroke(0, 0, 0, 100);
            line(this.x + textWidth(this.label.substring(0, caret)) + 5, this.y + 6, this.x + textWidth(this.label.substring(0, caret)) + 5, this.y3 - 6);
        } else {
            stroke(floor((millis() % 500) / 250) === 0 && this.focused ? color(0) : color(0, 0, 0, 5));
            line(this.x + textWidth(this.label.substring(0, this.caret)) + 5, this.y + 6, this.x + textWidth(this.label.substring(0, this.caret)) + 5, this.y3 - 6);
        }
        this.animate();
        if(this.mouseOver()) {
            if(this.cursor !== "TEXT") {
                 this.cursor = "TEXT";
                 cursor(this.cursor);
            }
        } else {
            if(this.cursor !== "DEFAULT") {
                 this.cursor = "DEFAULT";
                 cursor(this.cursor);
            }
        }
        popStyle();
    },
    onkeypress: function() {
        var SPACE = 32;
        if(this.focused) {
            switch(keyCode) {
                case ENTER:
                    //this.text += "\n";
                    this.action();
                    break;
                case BACKSPACE:
                    if(this.text.length > 0) {
                        this.text = this.text.substring(0, this.caret - 1) + this.text.substring(this.caret, this.text.length);
                        this.caret--;
                        this.caret = constrain(this.caret, 0, this.text.length);
                    }
                    break;
                case DELETE:
                    this.text = this.text.substring(0, this.caret) + this.text.substring(this.caret + 1, this.text.length);
                    break;
                case LEFT:
                    this.caret--;
                    this.caret = constrain(this.caret, 0, this.text.length);
                    break;
                case RIGHT:
                    this.caret++;
                    this.caret = constrain(this.caret, 0, this.text.length);
                    break;
                case SPACE:
                    if(this.text.length < this.max) {
                        this.text = this.text.substring(0, this.caret) + " " + this.text.substring(this.caret, this.text.length);
                        this.caret++;
                    }
                    break;
                default:
                    if(keyCode < 48 || keyCode >= 112 && keyCode < 145 || keyCode >= 91 && keyCode <= 93 || [157, 155].includes(keyCode)) {
                        
                    } else if(this.text.length < this.max) {
                        this.text = this.text.substring(0, this.caret) + key.toString() + this.text.substring(this.caret, this.text.length);
                        this.caret++;   
                    }
            }
        }
    },
    onmouserelease: function() {
        if(this.mouseOver() && this.selected && !this.disabled) {
            this.focused = true;
            try {
                playSound(config.audioFeedback);
            } catch(error) {}
            var complete = false;
            for(var i = 0; i < this.text.length; i++) {
                if(textWidth(this.text.substring(0, i)) - textWidth(this.text.substring(i - 1, i)) / 2 > mouseX - this.x - 5) {
                    this.caret = i - 1;
                    complete = true;
                    break;
                }
            }
            if(!complete) {
                this.caret = this.text.length;   
            }
        }
        this.selected = false;
    }
};
inherit(Textbox, Element);
//}
//Radio Button {
var RadioButton = function(params) {
    this.init = function() {
        params.shape = ellipse;
        params.x = this.x || params.x || 0;
        params.y = this.y || params.y || 0;
        params.r = config.radiobutton.r;
        params.action = params.action || noop;
        Element.call(this, params);
        this.disabled = this.disabled || params.disabled;
        this.toggled = this.toggled || params.toggled || false;
        this.fill = this.disabled ? config.fill.disabled : (this.fill || params.fill || config.fill.accent);
    };
    this.init();
};
RadioButton.prototype = {
    draw: function() {
        pushStyle();
        strokeWeight(config.strokeWeight);
        if(this.disabled) {
            stroke(config.fill.outline);
            fill(config.fill.disabled);
        } else if(this.toggled) {
            stroke(this.fill);
            fill(lerpColor(this.fill, color(255), this.transition / 10));
        } else if(!this.toggled) {
            stroke(config.fill.outline);
            fill(lerpColor(color(255), color(0), this.transition / 10));
        }
        ellipseMode(CORNER);
        (this.shape)(this.x, this.y, this.r * 2, this.r * 2);
        if(this.toggled) {
            stroke(this.fill);
            fill(this.disabled ? config.fill.outline : color(255));
            ellipseMode(CENTER);
            (this.shape)(this.x2, this.y2, this.r, this.r);
        }
        this.animate();
        fill(this.disabled ? config.fill.disabled : color(0));
        textAlign(LEFT, CENTER);
        textFont(config.font);
        text(this.label, this.x3 + 5, this.y2);
        popStyle();
    }
};
inherit(RadioButton, Element);
//}
//Checkbox {
var Checkbox = function(params) {
    this.init = function() {
        params.shape = rect;
        params.x = this.x || params.x || 0;
        params.y = this.y || params.y || 0;
        params.w = config.checkbox.w;
        params.h = config.checkbox.h;
        params.r = config.checkbox.r;
        params.action = params.action || noop;
        Element.call(this, params);
        this.disabled = this.disabled || params.disabled;
        this.toggled = this.toggled || params.toggled || false;
        this.fill = this.disabled ? config.fill.disabled : (this.fill || params.fill || config.fill.accent);
    };
    this.init();
};
Checkbox.prototype = {
    draw: function() {
        pushStyle();
        strokeWeight(config.strokeWeight);
        if(this.disabled) {
            stroke(config.fill.outline);
            fill(config.fill.disabled);
        } else if(this.toggled) {
            stroke(this.fill);
            fill(lerpColor(this.fill, color(255), this.transition / 10));
        } else if(!this.toggled) {
            stroke(config.fill.outline);
            fill(lerpColor(color(255), color(0), this.transition / 10));
        }
        (this.shape)(this.x, this.y, this.w, this.h, this.r);
            this.drawGradient();
        if(this.toggled) {
            strokeWeight(config.symbolWeight);
            stroke(this.disabled ? config.fill.outline : color(255));
            symbols.checkmark(this.x2, this.y2, 0.75);
        }
        this.animate();
        fill(this.disabled ? config.fill.disabled : color(0));
        textAlign(LEFT, CENTER);
        textFont(config.font);
        text(this.label, this.x3 + 5, this.y2);
        popStyle();
    }
};
inherit(Checkbox, Element);
//}
//Slider {
var Slider = function(params) {
    this.init = function() {
        params.shape = ellipse;
        params.x = this.x || params.x || 0;
        params.y = this.y || params.y || 0;
        params.w = params.w || config.slider.w;
        params.h = config.slider.r * 2;
        params.r = config.slider.r;
        params.action = params.action || noop;
        Element.call(this, params);
        this.disabled = this.disabled || params.disabled;
        this.min = params.min || config.slider.min;
        this.max = params.max || config.slider.max;
        this.value = this.value || params.value || 0;
        this.value = constrain(this.value, this.min, this.max);
        this.thumb = {
            x: map(this.value, this.min, this.max, this.x + this.r, this.x3 - this.r),
            y: this.y + this.r
        };
        this.increment = params.increment || (Math.log(this.max - this.min) * Math.LOG10E + 1 | 0) <= 1 ? 0.1 : 1;
        this.fill = this.disabled ? config.fill.disabled : (this.fill || params.fill || color(255));
        this.textbox = new Textbox({
            x: this.x3 - 35,
            y: this.y - 25,
            w: 35,
            max: 3,
            inline: false
        });
    };
    this.init();
};
Slider.prototype = {
    draw: function() {
        pushStyle();
        stroke(config.fill.disabled);
        strokeWeight(config.strokeWeight * 2);
        line(this.x + 1, this.y2, this.x3 - 2, this.y2);
        stroke(!this.disabled ? config.fill.accent : config.fill.disabled);
        strokeCap(SQUARE);
        line(this.x, this.y2, this.thumb.x, this.y2);
        this.drawShadow([this.thumb.x - this.r + 3, this.thumb.y - this.r + 3, this.r * 2 - 5, this.r * 2 - 3.5]);
        strokeWeight(config.strokeWeight / 1.5);
        stroke(!this.disabled ? lerpColor(color(255), color(0), 0.1) : config.fill.outline);
        fill(lerpColor(this.fill, color(0), this.transition / 50));
        ellipseMode(CENTER);
        (this.shape)(this.thumb.x, this.thumb.y, this.r * 2 * (this.transition / 10 + 1), this.r * 2 * (this.transition / 10 + 1));
        this.animate();
        fill(this.disabled ? config.fill.disabled : color(0));
        textAlign(LEFT, BOTTOM);
        textFont(config.font);
        text(this.label, this.x, this.y);
        if(this.label && !this.disabled) {
            fill(100);
            textAlign(RIGHT, BOTTOM);
            //this.textbox.draw();
            text(this.increment >= 1 ? round(this.value) : this.value.toFixed(1), this.x3, this.y);
        }
        popStyle();
    },
    onmousepress: function() {
        if(this.mouseOver() && !this.disabled) {
            this.selected = true;
        } else {
            this.focused = false; 
        }
        this.textbox.onmousepress();
    },
    onmouserelease: function() {
        if(this.mouseOver() && this.selected && !this.disabled) {
            this.focused = true;
            try {
                this.toggled = this.toggled ? false : true;
            } catch(error) {}
            this.action();
            try {
                playSound(config.audioFeedback);
            } catch(error) {}
        }
        this.selected = false;
        this.textbox.onmouserelease();
    },
    onmousedrag: function() {
        if(this.selected) {
            this.thumb.x = constrain(mouseX, this.x + this.r, this.x3 - this.r);
            this.value = map(this.thumb.x, this.x + this.r, this.x3 - this.r, this.min, this.max);
            this.action();
        }
    },
    onkeypress: function() {
        if(this.focused) {
            if([LEFT, DOWN, 189, 109].includes(keyCode)) {
                this.value = constrain(this.value - this.increment, this.min, this.max);
                this.thumb.x = map(this.value, this.min, this.max, this.x + this.r, this.x3 - this.r);
            } else if([RIGHT, UP, 187, 107].includes(keyCode)) {
                this.value = constrain(this.value + this.increment, this.min, this.max);
                this.thumb.x = map(this.value, this.min, this.max, this.x + this.r, this.x3 - this.r);
            } else if([188, 219].includes(keyCode)) {
                this.value = this.min;
                this.thumb.x = map(this.value, this.min, this.max, this.x + this.r, this.x3 - this.r);
            } else if([190, 221].includes(keyCode)) {
                this.value = this.max;
                this.thumb.x = map(this.value, this.min, this.max, this.x + this.r, this.x3 - this.r);
            } else if(!isNaN(String.fromCharCode(keyCode))) {
                this.value = map(String.fromCharCode(keyCode), 0, 10, this.min, this.max);
                this.thumb.x = map(this.value, this.min, this.max, this.x + this.r, this.x3 - this.r);
            }
        }
        this.textbox.onkeypress();
    }
};
inherit(Slider, Element);
//}
//Radiolist {
var radioOptions;
var Radiolist = function(params) {
    this.init = function() {
        params.shape = rect;
        params.x = this.x || params.x || 0;
        params.y = this.y || params.y || 0;
        params.w = 100;
        params.h = params.options * 2 + 5;
        params.action = params.action || noop;
        Element.call(this, params);
        this.options = params.options || {};
        this.optionsLength = Object.keys(this.options).length;
        this.radioButtons = [];
        for(var option in this.options) {
            this.radioButtons.push(new RadioButton({
                label: option.toTitleCase(),
                x: this.x,
                y: this.y,
                toggled: this.options[option]
            }));
        }
        for(var i = 0; i < this.optionsLength; i++) {
            if(this.radioButtons[i].toggled) {
                this.selectedOption = this.radioButtons[i].label;
            }
            this.radioButtons[i].y = this.radioButtons[i].y + (config.radiobutton.r * 2 + 5) * i;
            this.radioButtons[i].init();
        }
    };
    this.init();
};
Radiolist.prototype = {
    draw: function() {
        this.radioButtons.forEach(function(element) {
            element.draw();
        });
    },
    onmousepress: function() {
        this.radioButtons.forEach(function(element) {
            element.onmousepress();
        });
        if(this.mouseOver() && !this.disabled) {
            this.selected = true;
        } else {
            this.focused = false; 
        }
    },
    onmouserelease: function() {
        if(this.mouseOver() && this.selected && !this.disabled) {
            this.focused = true;
        }
        this.selected = false;
        
        var selectedOption = this.selectedOption;
        this.radioButtons.forEach(function(element) {
            element.onmouserelease();
            if(element.mouseOver()) {
                selectedOption = element.label;
            }
        });
        this.radioButtons.forEach(function(element) {
            element.toggled = element.label === selectedOption;
            debug(element);
        });
        this.selectedOption = selectedOption;
    },
    onkeypress: function() {
        if(this.focused) {
            if(keyCode === UP) {
                println(true);
            }
        }
    }
};
inherit(Radiolist, Element);
//}
//Checklist {
var checkBoxOptions;
var Checklist = function(params) {
    this.init = function() {
        params.x = this.x || params.x || 0;
        params.y = this.y || params.y || 0;
        params.action = params.action || noop;
        Element.call(this, params);
        this.options = params.options || {};
        this.optionsLength = Object.keys(this.options).length;
        this.checkboxes = [];
        for(var option in this.options) {
            this.checkboxes.push(new Checkbox({
                label: option.toTitleCase(),
                x: this.x,
                y: this.y,
                toggled: this.options[option]
            }));
        }
        for(var i = 0; i < this.optionsLength; i++) {
            this.checkboxes[i].y = this.y + (config.checkbox.h + 5) * i;
            this.checkboxes[i].init();
        }
    };
    this.init();
};
Checklist.prototype = {
    draw: function() {
        this.checkboxes.forEach(function(element) {
            element.draw();
        });
    },
    onmousepress: function() {
        this.checkboxes.forEach(function(element) {
            element.onmousepress();
        });
    },
    onmouserelease: function() {
        this.checkboxes.forEach(function(element) {
            element.onmouserelease();
        });
        for(var i = 0; i < this.optionsLength; i++) {
            checkBoxOptions[Object.keys(this.options)[i]] = this.checkboxes[i].toggled;
        }
    }
};
inherit(Checklist, Element);
//}
//Pane {
var Pane = function(params) {
    this.init = function() {
        params.shape = rect;
        params.x = this.x || params.x || 0;
        params.y = this.y || params.y || 0;
        params.w = params.w || config.pane.w;
        params.h = params.h || config.pane.h;
        params.r = config.pane.r;
        params.action = params.action || noop;
        Element.call(this, params);
        this.fill = this.fill || params.fill || config.fill.accent;
    };
    this.init();
};
Pane.prototype = {
    draw: function() {
        pushStyle();
        this.drawShadow();
        strokeWeight(config.strokeWeight);
        stroke(config.fill.background);
        fill(config.fill.background);
        rect(this.x, this.y, this.w, this.h, this.r);
        this.animate();
        popStyle();
    }
};
inherit(Pane, Element);
//}
//ToggleButton {
var ToggleButton = function(params) {
    this.init = function() {
        params.label = this.label || params.label || "";
        params.shape = rect;
        params.x = this.x || params.x + 1|| 0;
        params.y = this.y || params.y || 0;
        params.w = config.dropdown.w - 1;
        params.h = params.h || config.dropdown.h;
        params.r = config.button.r;
        params.action = params.action || noop;
        Element.call(this, params);
        this.disabled = this.disabled || params.disabled;
        this.noCursorChange = true;
        this.toggled = this.toggled || params.toggled || false;
        this.fill = this.disabled ? config.fill.disabled : (this.fill || params.fill || config.fill.accent);
    };
    this.init();
};
ToggleButton.prototype = {
    draw: function() {
        pushStyle();
        rectMode(LEFT);
        noStroke();
        fill(this.toggled ? this.fill : lerpColor(color(0, 0, 0, 1), color(0, 0, 0, 75), this.transition / 5));
        (this.shape)(this.x, this.y, this.w, this.h);
        fill(this.toggled ? color(255) : color(0));
        textAlign(LEFT, CENTER);
        textFont(config.font);
        textSize(13.5);
        text(this.label, this.x + 5, this.y2);
        this.animate();
        popStyle();
    }
};
inherit(ToggleButton, Element);
//}
//Dropdown {
var dropOptions;
var Dropdown = function(params) {
    this.init = function() {
        params.label = this.label || params.label || undefined;
        params.shape = rect;
        params.x = this.x || params.x || 0;
        params.y = this.y || params.y || 0;
        textFont(config.font);
        params.w = max(textWidth(params.label) + 40, config.dropdown.w);
        params.h = params.h || config.dropdown.h;
        params.r = config.dropdown.r;
        params.action = params.action || noop;
        Element.call(this, params);
        this.options = params.options || {};
        this.optionsLength = Object.keys(this.options).length;
        this.toggleButtons = [];
        for(var option in this.options) {
            this.toggleButtons.push(new ToggleButton({
                label: option.toTitleCase(),
                x: this.x,
                y: this.y,
                toggled: false
            }));
        }
        for(var i = 0; i < this.optionsLength; i++) {
            this.toggleButtons[i].y = this.y + this.h + config.dropdown.h * i + 1;
            this.toggleButtons[i].init();
        }
        var label;
        this.toggleButtons.forEach(function(element) {
            element.onmouserelease();
            if(element.toggled) {
                label = element.label;
            }
        });
        this.label = label;
        this.disabled = this.disabled || params.disabled;
        this.toggled = false;
        this.fill = this.disabled ? config.fill.disabled : (this.fill || params.fill || config.fill.accent);
    };
    this.init();
};
Dropdown.prototype = {
    draw: function() {
        pushStyle();
        this.drawShadow([this.x + 1, this.y + 1, this.w - 2, this.h + lerp(0, this.h * this.optionsLength, constrain(this.transition2 * 2, 0, 1)), 5]);
        strokeWeight(config.strokeWeight);
        stroke(config.fill.outline);
        fill(255);
        rect(this.x, this.y, this.w, this.h + lerp(0, this.h * this.optionsLength, constrain(this.transition2 * 2, 0, 1)), 5);
        noStroke();
        fill(lerpColor(lerpColor(this.fill, color(255), this.transition / 10), color(255), this.transition2));
        rect(this.x3 - 8, this.y + 1, 8, this.h - 1, this.r);
        rect(this.x3 - 25, this.y + 1, 20, this.h - 1);
        this.drawGradient();
        strokeWeight(config.symbolWeight);
        stroke(lerpColor(color(255), config.fill.disabled, this.transition2));
        pushMatrix();
        translate(this.x3 - 12.5, this.y2);
        rotate(lerp(0, 180, this.transition2));
        symbols.arrow(0, 0);
        popMatrix();
        fill((this.label === undefined) ? config.fill.disabled : color(0));
        textFont(config.font);
        textSize(15);
        textAlign(LEFT, CENTER);
        text(!this.label ? "Select..." : this.label, this.x + 7.5, this.y2);
        if(this.selected) {
            strokeWeight(config.strokeWeight);
            stroke(config.fill.background);
            line(this.x + 5, this.y3, this.x3 - 5, this.y3);
            if(this.transition2 !== 1) {
                for(var i = 0; i < this.optionsLength; i++) {
                    this.toggleButtons[i].y = this.y + this.h + lerp(0, config.dropdown.h, constrain(this.transition2 * 2, 0, 1) * i);
                    this.toggleButtons[i].init();
                }
            }
            this.toggleButtons.forEach(function(element) {
                element.draw();
            });
        }
        this.animate();
        popStyle();
    },
    onmousepress: function() {
        if(this.mouseOver() && !this.disabled) {
            this.selected = true;
        }
        if(!this.toggled) {
            return;
        }
        this.toggleButtons.forEach(function(element) {
            element.onmousepress();
        });
    },
    onmouserelease: function() {
        if(this.mouseOver() && this.selected && !this.disabled) {
            try {
                if(this.toggled) {
                    this.selected = false;   
                }
                this.toggled = this.toggled ? false : true;
            } catch(error) {}
            this.action();
            try {
                playSound(config.audioFeedback);
            } catch(error) {}
            if(this.cursor !== "DEFAULT") {
                this.cursor = "DEFAULT";
                cursor(this.cursor);   
            }
        } else {
            this.selected = false;
            this.toggled = false;
            if(this.cursor !== "DEFAULT") {
                this.cursor = "DEFAULT";
                cursor(this.cursor);   
            }
        }
        //This is a mess
        var toUnselect;
        for(var i = 0; i < this.optionsLength; i++) {
            if(this.toggleButtons[i].selected && this.toggleButtons[i].mouseOver()) {
                toUnselect = this.toggleButtons.except(this.toggleButtons[i]);
            }
        }
        var toUnselectLength = -1;
        for(var element in toUnselect) {
            toUnselectLength++;
        }
        if(toUnselect !== this.toggleButtons && toUnselectLength !== this.optionsLength && toUnselectLength > 0) {
            for(var i = 0; i < this.optionsLength; i++) {
                this.toggleButtons[i].toggled = false;
            }
        }
        var label;
        this.toggleButtons.forEach(function(element) {
            element.onmouserelease();
            if(element.toggled) {
                label = element.label;
            }
        });
        this.label = label;
        for(var i = 0; i < this.optionsLength; i++) {
            dropOptions[Object.keys(this.options)[i]] = this.toggleButtons[i].toggled;
        }
    }
};
inherit(Dropdown, Element);
//}

/** Miscellaneous */
//Misc {
var openDocs = function() {
	this.externals.canvas.parentNode.parentNode.innerHTML = "Paste this in the URL bar<br><textarea>data:text/html;base64,PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KCjxoZWFkPgogICAgPHRpdGxlPlNpbXBsZSBFbGVtZW50cyBEb2NzPC90aXRsZT4KICAgIDxtZXRhIGNoYXJzZXQ9InV0Zi04Ij4KICAgIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MSwgc2hyaW5rLXRvLWZpdD1ubyI+CiAgICA8bGluayByZWw9InN0eWxlc2hlZXQiIGhyZWY9Imh0dHBzOi8vbWF4Y2RuLmJvb3RzdHJhcGNkbi5jb20vYm9vdHN0cmFwLzQuMC4wL2Nzcy9ib290c3RyYXAubWluLmNzcyIgaW50ZWdyaXR5PSJzaGEzODQtR241Mzg0eHFRMWFvV1hBKzA1OFJYUHhQZzZmeTRJV3ZUTmgwRTI2M1htRmNKbFNBd2lHZ0ZBVy9kQWlTNkpYbSIKICAgICAgICBjcm9zc29yaWdpbj0iYW5vbnltb3VzIj4KICAgIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L25wbS9wcmlzbS10aGVtZXNAMS4wLjEvdGhlbWVzL3ByaXNtLXZzLmNzcyI+CiAgICA8c3R5bGU+CiAgICAgICAgcHJlIHsKICAgICAgICAgICAgb3ZlcmZsb3c6IGF1dG87CiAgICAgICAgICAgIG92ZXJmbG93LXk6IHNjcm9sbDsKICAgICAgICAgICAgbWF4LWhlaWdodDogNTAwcHg7CiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDsKICAgICAgICB9CiAgICAgICAgdGFibGUgY29kZSwKICAgICAgICBkdCBjb2RlIHsKICAgICAgICAgICAgY29sb3I6ICMwMDAwMDA7CiAgICAgICAgfQogICAgICAgIGxpIGEuYWN0aXZlIHsKICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGUgIWltcG9ydGFudDsKICAgICAgICAgICAgY29sb3I6ICMwMDdiZmYgIWltcG9ydGFudDsKICAgICAgICB9CgogICAgICAgIDo6LXdlYmtpdC1zY3JvbGxiYXIgewogICAgICAgICAgICB3aWR0aDogNy41cHg7CiAgICAgICAgICAgIGhlaWdodDogNy41cHg7CiAgICAgICAgfQoKICAgICAgICA6Oi13ZWJraXQtc2Nyb2xsYmFyLXRyYWNrIHsKICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjEpOwogICAgICAgIH0KCiAgICAgICAgOjotd2Via2l0LXNjcm9sbGJhci10aHVtYiB7CiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4yNSk7CiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7CiAgICAgICAgfQoKICAgICAgICA6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iOmhvdmVyIHsKICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjUpOwogICAgICAgIH0KICAgIDwvc3R5bGU+CjwvaGVhZD4KCjxib2R5IGRhdGEtc3B5PSJzY3JvbGwiIGRhdGEtdGFyZ2V0PSIjbmF2YmFyLW1haW4iIGRhdGEtb2Zmc2V0PSIwIj4KICAgIDxuYXYgaWQ9Im5hdmJhci1tYWluIiBjbGFzcz0ibmF2YmFyIHN0aWNreS10b3AgbmF2YmFyLWRhcmsgYmctcHJpbWFyeSI+CiAgICAgICAgPGRpdiBjbGFzcz0iY29udGFpbmVyIj4KICAgICAgICAgICAgPGEgY2xhc3M9Im5hdmJhci1icmFuZCIgaHJlZj0iIyI+U2ltcGxlIEVsZW1lbnRzIERvY3M8L2E+CiAgICAgICAgICAgIDx1bCBjbGFzcz0ibmF2IG5hdi1waWxscyI+CiAgICAgICAgICAgICAgICA8bGkgY2xhc3M9Im5hdi1pdGVtIj4KICAgICAgICAgICAgICAgICAgICA8YSBjbGFzcz0ibmF2LWxpbmsgdGV4dC1saWdodCIgaHJlZj0iI2Fib3V0Ij5BYm91dDwvYT4KICAgICAgICAgICAgICAgIDwvbGk+CiAgICAgICAgICAgICAgICA8bGkgY2xhc3M9Im5hdi1pdGVtIj4KICAgICAgICAgICAgICAgICAgICA8YSBjbGFzcz0ibmF2LWxpbmsgdGV4dC1saWdodCIgaHJlZj0iI3VzYWdlIj5Vc2FnZTwvYT4KICAgICAgICAgICAgICAgIDwvbGk+CiAgICAgICAgICAgICAgICA8bGkgY2xhc3M9Im5hdi1pdGVtIGRyb3Bkb3duIj4KICAgICAgICAgICAgICAgICAgICA8YSBjbGFzcz0ibmF2LWxpbmsgZHJvcGRvd24tdG9nZ2xlIHRleHQtbGlnaHQiIGRhdGEtdG9nZ2xlPSJkcm9wZG93biIgaHJlZj0iIyIgcm9sZT0iYnV0dG9uIiBhcmlhLWhhc3BvcHVwPSJ0cnVlIgogICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWV4cGFuZGVkPSJmYWxzZSI+RWxlbWVudHM8L2E+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iZHJvcGRvd24tbWVudSI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzPSJkcm9wZG93bi1pdGVtIiBocmVmPSIjZWxlbWVudHMiPkJhc2UgRWxlbWVudDwvYT4KICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiByb2xlPSJzZXBhcmF0b3IiIGNsYXNzPSJkcm9wZG93bi1kaXZpZGVyIj48L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3M9ImRyb3Bkb3duLWl0ZW0iIGhyZWY9IiNidXR0b24iPkJ1dHRvbjwvYT4KICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3M9ImRyb3Bkb3duLWl0ZW0iIGhyZWY9IiNzbGlkZXIiPlNsaWRlcjwvYT4KICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3M9ImRyb3Bkb3duLWl0ZW0iIGhyZWY9IiNjaGVja2JveCI+Q2hlY2tib3g8L2E+CiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzPSJkcm9wZG93bi1pdGVtIiBocmVmPSIjcmFkaW8tYnV0dG9uIj5SYWRpbyBCdXR0b248L2E+CiAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICA8L2xpPgogICAgICAgICAgICA8L3VsPgogICAgICAgIDwvZGl2PgogICAgPC9uYXY+CiAgICA8ZGl2IGNsYXNzPSJjb250YWluZXIgbWFpbiI+CiAgICAgICAgPGJyPgogICAgICAgIDxoMiBpZD0iYWJvdXQiPkFib3V0PC9oMj4KICAgICAgICA8aHI+CiAgICAgICAgPHA+VGhpcyBHVUkgbGlicmFyeSB3YXMgbWFkZSB0byBiZSBzaW1wbGUgYW5kIGVhc3kgdG8gdXNlLiBJdCBkb2Vzbid0IG9mZmVyIGEgaHVnZSBzZWxlY3Rpb24gb2YKICAgICAgICAgICAgZWxlbWVudHMgYXMgb2YKICAgICAgICAgICAgbm93LCBidXQgdGhlIG51bWJlciB3aWxsIGluY3JlYXNlIGluIHRoZSBmdXR1cmUuPC9wPgogICAgICAgIDxwPkEgZGVtbyBvZiB0aGUgR1VJIGVsZW1lbnRzIGNhbiBiZSBzZWVuIDxhIGhyZWY9Imh0dHBzOi8vd3d3LmtoYW5hY2FkZW15Lm9yZy9jb21wdXRlci1wcm9ncmFtbWluZy9zaW1wbGUtZWxlbWVudHMvNTIwMTc4ODkwNjc5OTEwNCIKICAgICAgICAgICAgICAgIHRhcmdldD0iX2JsYW5rIj5oZXJlPC9hPi48L3A+CgogICAgICAgIDxoND5DcmVkaXRzPC9oND4KICAgICAgICA8dWwgY2xhc3M9Imxpc3QtdW5zdHlsZWQiPgogICAgICAgICAgICA8bGk+S1dDICg8YSBocmVmPSJodHRwczovL3d3dy5raGFuYWNhZGVteS5vcmcvcHJvZmlsZS9NS2FlbGluMzY4LyIgdGFyZ2V0PSJfYmxhbmsiPkBNS2FlbGluMzY4PC9hPik8L2xpPgogICAgICAgICAgICA8dWw+CiAgICAgICAgICAgICAgICA8bGk+UHJvdmlkZWQgdGhlIDxjb2RlPmluaGVyaXQ8L2NvZGU+IGZ1bmN0aW9uPC9saT4KICAgICAgICAgICAgICAgIDxsaT5TdWdnZXN0ZWQgYSBiZXR0ZXIgd2F5IG9mIGRlZmluaW5nIG1ldGhvZHM8L2xpPgogICAgICAgICAgICAgICAgPGxpPlN1Z2dlc3RlZCB0byBzdG9yZSBhbGwgZWxlbWVudHMgaW4gYW4gYXJyYXkgYW5kIGl0ZXJhdGUgb3ZlciBlYWNoIGVsZW1lbnQgdG8gZGVsaXZlciB0aGUgZXZlbnQ8L2xpPgogICAgICAgICAgICAgICAgPGxpPlN1Z2dlc3RlZCB0byB1c2UgYSA8Y29kZT52aXJ0dWFsPC9jb2RlPiA8Y29kZT5ub29wPC9jb2RlPiBmdW5jdGlvbiBpbiBjYXNlIGEgbWV0aG9kIHRoYXQgaXMgbm90CiAgICAgICAgICAgICAgICAgICAgZGVmaW5lZCBpcyBpbnZva2VkPC9saT4KICAgICAgICAgICAgPC91bD4KICAgICAgICAgICAgPGxpPlZpc2lvbiAoPGEgaHJlZj0iaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE0ODc5NzAwIiB0YXJnZXQ9Il9ibGFuayI+QFZpc2lvTjwvYT4pPC9saT4KICAgICAgICAgICAgPHVsPgogICAgICAgICAgICAgICAgPGxpPkVmZmljaWVudCB3YXkgb2YgZmluZGluZyB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBpbiBhIG51bWJlcjwvbGk+CiAgICAgICAgICAgIDwvdWw+CiAgICAgICAgPC91bD4KICAgICAgICA8aDQ+SW5zcGlyYXRpb248L2g0PgogICAgICAgIDx1bD4KICAgICAgICAgICAgPGxpPjxhIGhyZWY9Imh0dHBzOi8vd3d3LmtoYW5hY2FkZW15Lm9yZy9jb21wdXRlci1wcm9ncmFtbWluZy9ncmFwaGljYWwtdXNlci1pbnRlcmZhY2UtZWxlbWVudHMvNDU4MjUwNTE4NDIzMTQyNCIKICAgICAgICAgICAgICAgICAgICB0YXJnZXQ9Il9ibGFuayI+R3JhcGhpY2FsIFVzZXIgSW50ZXJmYWNlIEVsZW1lbnRzPC9hPiBieSA8YSBocmVmPSJodHRwczovL3d3dy5raGFuYWNhZGVteS5vcmcvcHJvZmlsZS9EYWxlbmRyaW9uLyIKICAgICAgICAgICAgICAgICAgICB0YXJnZXQ9Il9ibGFuayI+RGFsZW5kcmlvbjwvYT48L2xpPgogICAgICAgICAgICA8bGk+PGEgaHJlZj0iaHR0cHM6Ly93d3cua2hhbmFjYWRlbXkub3JnL2NvbXB1dGVyLXByb2dyYW1taW5nL3VpLzIxODE0MzU1NzgiIHRhcmdldD0iX2JsYW5rIj5VSTwvYT4gYnkgPGEKICAgICAgICAgICAgICAgICAgICBocmVmPSJodHRwczovL3d3dy5raGFuYWNhZGVteS5vcmcvcHJvZmlsZS9odW1ibGVzZXJ2YW50LyIgdGFyZ2V0PSJfYmxhbmsiPiYjMjY0MDg7PC9hPjwvbGk+CiAgICAgICAgICAgIDxsaT48YSBocmVmPSJodHRwczovL3d3dy5raGFuYWNhZGVteS5vcmcvY29tcHV0ZXItcHJvZ3JhbW1pbmcvZ3VpLzQ5MDQ5NzEwMTk0ODUxODQiIHRhcmdldD0iX2JsYW5rIj5HVUk8L2E+CiAgICAgICAgICAgICAgICBieSA8YSBocmVmPSJodHRwczovL3d3dy5raGFuYWNhZGVteS5vcmcvcHJvZmlsZS92b2lkeC8iIHRhcmdldD0iX2JsYW5rIj5UaG9tYXMgTDwvYT48L2xpPgogICAgICAgICAgICA8bGk+PGEgaHJlZj0iaHR0cHM6Ly93d3cua2hhbmFjYWRlbXkub3JnL3Byb2ZpbGUvcGV0ZXJ3Y29sbGluZ3JpZGdlLyIgdGFyZ2V0PSJfYmxhbmsiPlBldGVyIENvbGxpbmdyaWRnZTwvYT4ncwogICAgICAgICAgICAgICAgcHJvamVjdHM8L2xpPgogICAgICAgICAgICA8bGk+TWFjT1MgTW9qYXZlIGFuZCBNYXRlcmlhbCBEZXNpZ248L2xpPgogICAgICAgIDwvdWw+CiAgICAgICAgPGJyPgogICAgICAgIDxoMiBpZD0idXNhZ2UiPlVzYWdlPC9oMj4KICAgICAgICA8aHI+CiAgICAgICAgPHA+QmVmb3JlIHRoZSBlbGVtZW50cyBjYW4gYmUgdXNlZCwgdGhleSByZXF1aXJlIGEgYml0IG9mIGEgc2V0IHVwIHByb2Nlc3MuIFRoaXMgaW5jbHVkZXMgdGhlIGV2ZW50IGhhbmRsaW5nLAogICAgICAgICAgICBjb25maWd1cmF0aW9uIGFuZCBzb21lIHNwZWNpYWwgZnVuY3Rpb25zLjwvcD4KICAgICAgICA8cD5UaGUgZWxlbWVudHMgd2lsbCBub3Qgd29yayBwcm9wZXJseSB3aXRob3V0IHRoZXNlIGNvbXBvbmVuZXRzLjwvcD4KICAgICAgICA8YnI+CiAgICAgICAgPGg0IGlkPSJldmVudC1oYW5kbGluZyI+RXZlbnQgaGFuZGxpbmc8L2g0PgogICAgICAgIDxocj4KICAgICAgICA8cD5FdmVudCBoYW5kbGluZyBpcyBkb25lIGJ5IHN0b3JpbmcgYWxsIGVsZW1lbnRzIGluIGFuIGFycmF5IGFuZCBpdGVyYXRpbmcgb3ZlciB0aGUgYXJyYXkgdG8gaW52b2tlIGVhY2gKICAgICAgICAgICAgbWV0aG9kIG9mIHRoZSBlbGVtZW50cy48L3A+CiAgICAgICAgPHByZT48Y29kZSBjbGFzcz0ibGFuZ3VhZ2UtanMiPnZhciBlbGVtZW50cyA9IFtidXR0b24xLCBzbGlkZXIxXTsKICAgICAgICAgICAgCm1vdXNlUmVsZWFzZWQgPSBmdW5jdGlvbigpIHsKICAgIGVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHsKICAgICAgICBlbGVtZW50Lm9ubW91c2VyZWxlYXNlKCk7CiAgICB9KTsKfTs8L2NvZGU+PC9wcmU+CiAgICAgICAgPHA+SWYgdGhlcmUgYXJlIG11bHRpcGxlIHBhZ2VzIGluIGEgcHJvZ3JhbSwgaXQgaXMgcmVjb21tZW5kZWQgdGhhdCBlbGVtZW50cyBiZSBzdG9yZWQgaW4gc2VwYXJhdGVhcnJheXMgZm9yCiAgICAgICAgICAgIGVhY2ggb2YgdGhlIHBhZ2VzLiBUaGlzIGVsaW1pbmF0ZXMgdGhlIHBvc3NpYmlsaXR5IG9mIGludm9raW5nIGVsZW1lbnRzIGZyb20gc2VwYXJhdGVwYWdlcy48L3A+CiAgICAgICAgPHByZT48Y29kZSBjbGFzcz0ibGFuZ3VhZ2UtanMiPnZhciBwYWdlMSA9IFtidXR0b24xLCBzbGlkZXIxXTsKdmFyIHBhZ2UyID0gW3NsaWRlcjJdOwoKbW91c2VSZWxlYXNlZCA9IGZ1bmN0aW9uKCkgewogICAgc3dpdGNoKHBhZ2UpIHsKICAgICAgICBjYXNlICJwYWdlMSI6CiAgICAgICAgICAgIHBhZ2UxLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHsKICAgICAgICAgICAgICAgIGVsZW1lbnQub25tb3VzZXJlbGVhc2UoKTsKICAgICAgICAgICAgfSk7CiAgICAgICAgICAgIGJyZWFrOwogICAgICAgIGNhc2UgInBhZ2UyIjoKICAgICAgICAgICAgcGFnZTIuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkgewogICAgICAgICAgICAgICAgZWxlbWVudC5vbm1vdXNlcmVsZWFzZSgpOwogICAgICAgICAgICB9KTsKICAgICAgICAgICAgYnJlYWs7CiAgICB9Cn07PC9jb2RlPjwvcHJlPgogICAgICAgIDxicj4KICAgICAgICA8cD5CZWxvdyBhcmUgYWxsIHRoZSBldmVudCBtZXRob2RzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIFByb2Nlc3NpbmcgZnVuY3Rpb24uPC9wPgogICAgICAgIDx0YWJsZSBjbGFzcz0idGFibGUgdGFibGUtc20gdGFibGUtaG92ZXIiPgogICAgICAgICAgICA8dGhlYWQ+CiAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgPHRoIHNjb3BlPSJjb2wiPkV2ZW50PC90aD4KICAgICAgICAgICAgICAgICAgICA8dGggc2NvcGU9ImNvbCI+UHJvY2Vzc2luZyBGdW5jdGlvbjwvdGg+CiAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICA8L3RoZWFkPgogICAgICAgICAgICA8dGJvZHk+CiAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPm9ubW91c2VwcmVzczwvY29kZT48L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5tb3VzZVByZXNzZWQ8L2NvZGU+PC90ZD4KCiAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5vbm1vdXNlcmVsZWFzZTwvY29kZT48L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5tb3VzZVJlbGVhc2VkPC9jb2RlPjwvdGQ+CgogICAgICAgICAgICAgICAgPC90cj4KICAgICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+b25tb3VzZWRyYWc8L2NvZGU+PC90ZD4KICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+bW91c2VEcmFnZ2VkPC9jb2RlPjwvdGQ+CiAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5vbmtleXByZXNzPC9jb2RlPjwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPmtleVByZXNzZWQ8L2NvZGU+PC90ZD4KICAgICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgIDwvdGJvZHk+CiAgICAgICAgPC90YWJsZT4KICAgICAgICA8YnI+CiAgICAgICAgPGg0IGlkPSJjb25maWciPkNvbmZpZ3VyYXRpb248L2g0PgogICAgICAgIDxocj4KICAgICAgICA8cD5BbG1vc3QgYWxsIGZhbGwgYmFjayBwYXJhbWV0ZXJzIGFyZSBzdG9yZWQgaW5kdXZpZHVhbGx5IGZvciBlYWNoIGVsZW1lbnQgaW4gYSA8Y29kZT5jb25maWc8L2NvZGU+IG9iamVjdC4KICAgICAgICAgICAgVGhlIG9iamVjdCBhbHNvIGluY2x1ZGVzIGdsb2JhbCBzZXR0aW5ncyB0aGF0IGFyZSB1c2VkIGJ5IGFsbCBlbGVtZW50cy48L3A+CiAgICAgICAgPHA+SXQncyBub3QgcmVjb21tZW5kZWQgdG8gcmVtb3ZlIGFueSB2YWx1ZXMgZnJvbSB0aGUgPGNvZGU+Y29uZmlnPC9jb2RlPiBvYmplY3QgYXMgbW9zdCBvZiB0aGVtIGFyZSBuZWVkZWQgYW5kCiAgICAgICAgICAgIHRoZSBlbGVtZW50cyB3aWxsIGJyZWFrIGlmIHRoZXkgYXJlIG5vdCBkZWZpbmVkLiBUaGVyZSBhcmUsIGhvd2V2ZXIsIHNvbWUgdGhhdCBjYW4gYmUgZ2l2ZW4gZGlyZWN0bHkgdG8gdGhlCiAgICAgICAgICAgIGVsZW1lbnRzIHdoZW4gY3JlYXRpbmcgdGhlbS4gUGFyYW1ldGVycyBnaXZlbiB0byB0aGUgZWxlbWVudHMgd2lsbCBhbG1vc3QgYWx3YXlzIG92ZXJ3cml0ZSB0aGUgY29uZmlnCiAgICAgICAgICAgIHZhbHVlcy48L3A+CiAgICAgICAgPGg2PlRoaXMgaXMgdGhlIGZpcnN0IHNlY3Rpb24gb2YgdGhlIDxjb2RlPmNvbmZpZzwvY29kZT4gb2JqZWN0LjwvaDY+CiAgICAgICAgPHByZT48Y29kZSBjbGFzcz0ibGFuZ3VhZ2UtanMiPnZhciBjb25maWcgPSB7CiAgICBhdWRpb0ZlZWRiYWNrOiBudWxsLAogICAgYW5pbWF0aW9uU3RlcDogMC4yLAogICAgZm9udDogY3JlYXRlRm9udCgic2Fucy1zZXJpZiIsIDE2KSwKICAgIHN0cm9rZVdlaWdodDogMSwKICAgIHN5bWJvbFdlaWdodDogMywKICAgIGZpbGw6IHsKICAgICAgICBhY2NlbnQ6IGNvbG9yKDAsIDExMSwgMjIyKSwKICAgICAgICBvdXRsaW5lOiBjb2xvcigxNTApLAogICAgICAgIGJhY2tncm91bmQ6IGNvbG9yKDI0MCksCiAgICAgICAgZGlzYWJsZWQ6IGNvbG9yKDE3NSksCiAgICAgICAgZ3JhZGllbnQ6IHRydWUKICAgIH0sCiAgICBzaGFkb3c6IHsKICAgICAgICBtaW46IDI1LAogICAgICAgIG1heDogMjcuNSwKICAgICAgICBmaWxsOiBjb2xvcigwLCAwLCAwLCAyLjUpCiAgICB9LAogICAgZ3JhZGllbnQ6IHsKICAgICAgICBzdGFydENvbG9yOiBjb2xvcigyNTUsIDI1NSwgMjU1LCA1MCksCiAgICAgICAgc3RvcENvbG9yOiBjb2xvcigyNTUsIDI1NSwgMjU1LCAwKSwKICAgICAgICBzaXplOiAyNQogICAgfQp9OzwvY29kZT48L3ByZT4KICAgICAgICA8ZGwgY2xhc3M9InJvdyI+CiAgICAgICAgICAgIDxkdCBjbGFzcz0iY29sLXNtLTMiPjxjb2RlPmF1ZGlvRmVlZGJhY2s8L2NvZGU+PC9kdD4KICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+U3RvcmVzIHNvdW5kIHRoYXQgd2lsbCBiZSBwbGF5ZWQgd2hlbiB0aGUgbW91c2UgaXMgcmVsZWFzZWQgb24gYW4gZWxlbWVudC4gU2hvdWxkIGJlCiAgICAgICAgICAgICAgICBzZXQgdG8gPGNvZGU+Z2V0U291bmQoInNvdW5kIik8L2NvZGU+LiBMZWF2ZSBhcyA8Y29kZT5udWxsPC9jb2RlPiBmb3Igbm8gYXVkaW8gZmVlZGJhY2suPC9kZD4KCiAgICAgICAgICAgIDxkdCBjbGFzcz0iY29sLXNtLTMiPjxjb2RlPmFuaW1hdGlvblN0ZXA8L2NvZGU+KjwvZHQ+CiAgICAgICAgICAgIDxkZCBjbGFzcz0iY29sLXNtLTkiPkFtb3VudCB0aGUgdHJhbnNpdGlvbiB3aWxsIGluY3JlYXNlIG9yIGRlY3JlYXNlIGJ5IGZvciBob3ZlciBhbmQgY2xpY2sgYW5pbWF0aW9ucy4KICAgICAgICAgICAgICAgIE5vdGUgdGhhdCBob3ZlciBvdXQgYW5pbWF0aW9uIHdpbGwgYmUgdHdpY2UgYXMgZmFzdC48L2RkPgoKICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+Zm9udDwvY29kZT4qPC9kdD4KICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+VGhlIGZvbnQgdG8gYmUgdXNlZCBieSB0aGUgZWxlbWVudHMuIEl0J3MgcmVjb21tZW5kZWQgdG8gbm90IGRyYXN0aWNhbGx5IGNoYW5nZSB0aGUKICAgICAgICAgICAgICAgIHNpemUgYXMgaXQgbWlnaHQgbWVzcyB1cCB0aGUgZWxlbWVudHMnIGFwcGVhcmFuY2VzLjwvZGQ+CgogICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS0zIj48Y29kZT5zdHJva2VXZWlnaHQ8L2NvZGU+PC9kdD4KICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+VGhlIHN0cm9rZSB3ZWlnaHQgdXNlZCBmb3IgdmFyaW91cyBwYXJ0cyBmb3IgZWxlbWVudHMuIE5vdGUgdGhhdCBmaW5lIGxpbmVzIHdpbGwgYmUKICAgICAgICAgICAgICAgIGhhbGYgdGhlIHN0cm9rZSB3ZWlnaHQuPC9kZD4KCiAgICAgICAgICAgIDxkdCBjbGFzcz0iY29sLXNtLTMiPjxjb2RlPnN5bWJvbFdlaWdodDwvY29kZT48L2R0PgogICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij5UaGUgc3Ryb2tlIHdlaWdodCB1c2VkIGZvciBhbGwgc3ltYm9scyBmb3IgdGhlIGVsZW1lbnRzLjwvZGQ+CgogICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS0zIj48Y29kZT5maWxsPC9jb2RlPio8L2R0PgogICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij4KICAgICAgICAgICAgICAgIDxkbCBjbGFzcz0icm93Ij4KICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS00Ij48Y29kZT5hY2NlbnQ8L2NvZGU+KjwvZHQ+CiAgICAgICAgICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOCI+UHJpbWFyeSBjb2xvciB1c2VkIGluIGFsbCBlbGVtZW50cy48L2RkPgogICAgICAgICAgICAgICAgPC9kbD4KICAgICAgICAgICAgICAgIDxkbCBjbGFzcz0icm93Ij4KICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS00Ij48Y29kZT5vdXRsaW5lPC9jb2RlPio8L2R0PgogICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzcz0iY29sLXNtLTgiPkNvbG9yIHVzZWQgZm9yIG91dGxpbmVzIG9mIGVsZW1lbnRzIG9yIGVsZW1lbnRzJyBwYXJ0cy48L2RkPgogICAgICAgICAgICAgICAgPC9kbD4KICAgICAgICAgICAgICAgIDxkbCBjbGFzcz0icm93Ij4KICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS00Ij48Y29kZT5iYWNrZ3JvdW5kPC9jb2RlPio8L2R0PgogICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzcz0iY29sLXNtLTgiPlVzZWQgZm9yIGJhY2tncm91bmQgb2Ygc29tZSBlbGVtZW50cy48L2RkPgogICAgICAgICAgICAgICAgPC9kbD4KICAgICAgICAgICAgICAgIDxkbCBjbGFzcz0icm93Ij4KICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS00Ij48Y29kZT5kaXNhYmxlZDwvY29kZT4qPC9kdD4KICAgICAgICAgICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS04Ij5QcmltYXJ5IGNvbG9yIHVzZWQgd2hlbiBlbGVtZW50cyBhcmUgZGlzYWJsZWQuPC9kZD4KICAgICAgICAgICAgICAgIDwvZGw+CiAgICAgICAgICAgICAgICA8ZGwgY2xhc3M9InJvdyI+CiAgICAgICAgICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tNCI+PGNvZGU+Z3JhZGllbnQ8L2NvZGU+PC9kdD4KICAgICAgICAgICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS04Ij5Cb29sZWFuIGZvciBncmFkaWVudC4gTm90ZSwgdGhpcyBkb2VzIG5vdCBhZmZlY3QgY29sb3Igb2YgdGhlIGdyYWRpZW50LjwvZGQ+CiAgICAgICAgICAgICAgICA8L2RsPgogICAgICAgICAgICA8L2RkPgoKICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+c2hhZG93PC9jb2RlPio8L2R0PgogICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij4KICAgICAgICAgICAgICAgIDxkbCBjbGFzcz0icm93Ij4KICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS00Ij48Y29kZT5taW48L2NvZGU+KjwvZHQ+CiAgICAgICAgICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOCI+VGhlIHNpemUgb2YgdGhlIHNoYWRvdyB3aGVuIGluIHRoZSBub3JtYWwgc3RhdGUuPC9kZD4KICAgICAgICAgICAgICAgIDwvZGw+CiAgICAgICAgICAgICAgICA8ZGwgY2xhc3M9InJvdyI+CiAgICAgICAgICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tNCI+PGNvZGU+bWF4PC9jb2RlPio8L2R0PgogICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzcz0iY29sLXNtLTgiPlRoZSBzaXplIG9mIHRoZSBzaGFkb3cgd2hlbiBlbGVtZW50IGlzIGhvdmVyZWQgb3Zlci48L2RkPgogICAgICAgICAgICAgICAgPC9kbD4KICAgICAgICAgICAgICAgIDxkbCBjbGFzcz0icm93Ij4KICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS00Ij48Y29kZT5maWxsPC9jb2RlPio8L2R0PgogICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzcz0iY29sLXNtLTgiPkNvbG9yIHVzZWQgZm9yIHRoZSBzaGFkb3cuIE5vdGUgdGhhdCB0aGUgY29sb3IgaXMgbm90IGV4YWN0bHkgd2hhdCB3aWxsIHNob3cKICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiB0aGUgc2hhZG93IGlzIGRyYXduLCBpdCB3aWxsIGJlIG11Y2ggZGFya2VyIGFzIGl0IGlzIGFwcGxpZWQgbXVsdGlwbGUgdGltZXMgdG8gYWNoaWV2ZSB0aGUKICAgICAgICAgICAgICAgICAgICAgICAgYmx1ciBlZmZlY3QuPC9kZD4KICAgICAgICAgICAgICAgIDwvZGw+CiAgICAgICAgICAgIDwvZGQ+CgogICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS0zIj48Y29kZT5ncmFkaWVudDwvY29kZT48L2R0PgogICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij4KICAgICAgICAgICAgICAgIDxkbCBjbGFzcz0icm93Ij4KICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS00Ij48Y29kZT5zdGFydENvbG9yPC9jb2RlPjwvZHQ+CiAgICAgICAgICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOCI+Q29sb3Igb3ZlcmxheWVkIG9uIHRvcCBvZiBlbGVtZW50IGF0IHRoZSB0b3AuPC9kZD4KICAgICAgICAgICAgICAgIDwvZGw+CiAgICAgICAgICAgICAgICA8ZGwgY2xhc3M9InJvdyI+CiAgICAgICAgICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tNCI+PGNvZGU+c3RvcENvbG9yPC9jb2RlPjwvZHQ+CiAgICAgICAgICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOCI+Q29sb3IgdGhhdCB3aWxsIGJlIHRyYW5zaXRpb25lZCB0byBmcm9tIHRoZSA8Y29kZT5zdGFydENvbG9yPC9jb2RlPi4gTm90ZSB0aGF0CiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMgY29sb3Igc2hvdWxkIGlkZWFsbHkgYmUgdHJhbnNwYXJlbnQuPC9kZD4KICAgICAgICAgICAgICAgIDwvZGw+CiAgICAgICAgICAgICAgICA8ZGwgY2xhc3M9InJvdyI+CiAgICAgICAgICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tNCI+PGNvZGU+c2l6ZTwvY29kZT48L2R0PgogICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzcz0iY29sLXNtLTgiPkFtb3VudCBvZiBzcGFjZSBmb3IgdGhlIHRyYW5zaXRpb24gdG8gb2NjdXIuPC9kZD4KICAgICAgICAgICAgICAgIDwvZGw+CiAgICAgICAgICAgIDwvZGQ+CiAgICAgICAgPC9kbD4KICAgICAgICA8cD5UaGUgcmVzdCBvZiB0aGUgPGNvZGU+Y29uZmlnPC9jb2RlPiBvYmplY3QncyBzZWN0aW9ucyBhcmUgc2VwZXJhdGUgZm9yIGV2ZXJ5IGVsZW1lbnQuIFRoaXMgaXMgdG8gbm90IGhhdmUKICAgICAgICAgICAgdW5uZWVkZWQgdmFsdWVzIGlmIGEgY2VydGFpbiBlbGVtZW50IGlzIG5vdCB1dGlsaXplZCBpbiBhIHByb2dyYW0uPC9wPgogICAgICAgIDxwPkluZHV2aWR1YWwgPGNvZGU+Y29uZmlnPC9jb2RlPiBvYmplY3RzIGZvciBldmVyIGVsZW1lbnQgYXJlIHVzdWFsbHkgbm90IHJlcXVpcmVkLiBJZiBhIGNlcnRhaW4gZWxlbWVudCdzCiAgICAgICAgICAgIDxjb2RlPmNvbmZpZzwvY29kZT4gaXMgbm90IGRlZmluZWQsIHRob3VnaCwgdGhlIHBhcmFtZXRlcnMgdGhhdCB3b3VsZCBoYXZlIGJlZW4gaW4gdGhlIDxjb2RlPmNvbmZpZzwvY29kZT4KICAgICAgICAgICAgbXVzdCBhbGwgYmUgcGFzc2VkIGludG8gdGhlIGVsZW1lbnQuIFRoZSBmb3JtYXQgZm9yIEEgPGNvZGU+Y29uZmlnPC9jb2RlPiBmb3IgZWFjaCBlbGVtZW50IGlzIGFzIHNob3duCiAgICAgICAgICAgIGJlbG93LjwvcD4KICAgICAgICA8cHJlPjxjb2RlIGNsYXNzPSJsYW5ndWFnZS1qcyI+Y29uZmlnLmVsZW1lbnQgPSB7CiAgICBwcm9wMTogdmFsdWUxLAogICAgcHJvcDI6IHZhbHVlMgp9OzwvY29kZT48L3ByZT4KICAgICAgICA8YnI+CiAgICAgICAgPGg0IGlkPSJjb25maWciPlNlY2lhbCBGdW5jdGlvbnM8L2g0PgogICAgICAgIDxocj4KICAgICAgICA8cD5Tb21lIHN0YW5kLWFsb25lIGFyZSBuZWVkZWQgdG8gZnVydGhlciBpbmNyZWFzZSB0aGUgZnVuY3Rpb25hbGl0eSBvZiB2YW5pbGxhIEphdmFzY3JpcHQgZnVuY3Rpb25zLiBUaGUgPGNvZGU+dG9UaXRsZUNhc2U8L2NvZGU+CiAgICAgICAgICAgIHByb3RvdHlwZSBmdW5jdGlvbiBmb3IgdGhlIDxjb2RlPlN0cmluZzwvY29kZT4gb2JqZWN0IGNvbnZlcnRzIHRleHQgdG8gdGl0bGUgY2FzZSwgaXQncyB1c2VkIGV2ZXJ5d2hlcmUKICAgICAgICAgICAgdGV4dCBpcyBkaXNwbGF5ZWQgaW4gZWxlbWVudHMgZXhjZXB0IHRoZSA8Y29kZT5UZXh0Ym94PC9jb2RlPiBpbnB1dCBhcmVhLiBUaGUgPGNvZGU+ZXhjZXB0PC9jb2RlPiBwcm90b3R5cGUKICAgICAgICAgICAgZnVuY3Rpb24gZm9yIHRoZSA8Y29kZT5BcnJheTwvY29kZT4gb2JqZWN0IHJldHVybiB0aGUgYXJyYXkgZXhjZXB0IGEgY2VydGFpbiB2YWx1ZS4gVGhlIDxjb2RlPmluaGVyaXQ8L2NvZGU+CiAgICAgICAgICAgIGZ1bmN0aW9uIGlzIHVzZWQgdG8gYWRkIHRoZSA8Y29kZT5FbGVtZW50PC9jb2RlPiBtZXRob2RzIHRvIGVsZW1lbnRzLjwvcD4KICAgICAgICA8cD5TcGVjaWFsIGZ1bmN0aW9ucyBhbHNvIGluY2x1ZGUgdGhlIDxjb2RlPlN5bWJvbHM8L2NvZGU+IG9iamVjdCB3aGljaCBzdG9yZXMgYWxsIHRoZSBzeW1ib2xzIHRoYXQgd2lsbCBiZQogICAgICAgICAgICB1c2VkIGluIHNvbWUgZWxlbWVudHMgc3VjaCBhcyB0aGUgY2hlY2ttYXJrIGFuZCBhcnJvdy4gVGhlIGJhc2UgPGNvZGU+RWxlbWVudDwvY29kZT4gY2xhc3MgaXMgdGhlIHBhcmVudAogICAgICAgICAgICBjbGFzcyBmb3IgZXZlcnkgZWxlbWVudCBhbmQgcHJvdmlkZXMgbW9zdCBvZiB0aGUgYmFzaWMgZnVuY3Rpb25hbGl0eS48L3A+CiAgICAgICAgPGJyPgogICAgICAgIDxoMiBpZD0iZWxlbWVudHMiPkVsZW1lbnRzPC9oMj4KICAgICAgICA8aHI+CiAgICAgICAgPHA+RWxlbWVudHMgYXJlIGFsbCBvYmplY3Qgb3JpZW50ZWQgYW5kIGEgbmV3IGluc3RhbmNlIG11c3QgYmUgY3JlYXRlZCBmb3IgYW55IGVsZW1lbnQgY2xhc3MgdG8gYmUgdXNlZC48L3A+CiAgICAgICAgPHByZT48Y29kZSBjbGFzcz0ibGFuZ3VhZ2UtanMiPnZhciBidXR0b24xID0gbmV3IEJ1dHRvbigpOzwvY29kZT48L3ByZT4KICAgICAgICA8YnI+CiAgICAgICAgPGg1PlBhcmFtZXRlcnM8L2g1PgogICAgICAgIDxwPlBhcmFtZXRlcnMgYXJlIHBhc3NlZCBpbnRvIHRoZSBlbGVtZW50cyBpbiBhIHNpbmdsZSBvYmplY3QuPC9wPgogICAgICAgIDxwcmU+PGNvZGUgY2xhc3M9Imxhbmd1YWdlLWpzIj52YXIgYnV0dG9uMSA9IG5ldyBCdXR0b24oewogICAgeDogMTAwLAogICAgeTogMTUwCn0pOzwvY29kZT48L3ByZT4KICAgICAgICA8cD5QYXJhbWV0ZXJzIG5vdCBwYXNzZWQgdG8gaW50byB0aGUgZWxlbWVudCB3aWxsIGZhbGwgYmFjayB0byB0aGUgPGNvZGU+Y29uZmlnPC9jb2RlPiBvYmplY3Qgb3IgYSBoYXJkLWNvZGVkCiAgICAgICAgICAgIHZhbHVlLjwvcD4KICAgICAgICA8cD5FdmVyeSBlbGVtZW50IGluaGVyaXRzIGdlbmVyaWMgcGFyYW1ldGVycyBmcm9tIHRoZSA8Y29kZT5FbGVtZW50PC9jb2RlPiBjbGFzcy4gQWx0aG91Z2ggc29tZSBwYXJhbWV0ZXJzCiAgICAgICAgICAgIGNhbid0IGJlIGNoYW5nZWQgZm9yIGNlcnRhaW4gZWxlbWVudHMgbW9zdCBvZiB0aGVzZSBwYXJhbWV0ZXJzIGFyZSB0aGUgc2FtZSBpbiBldmVyeSBlbGVtZW50IGFuZCBkbyB0aGUKICAgICAgICAgICAgc2FtZSB0aGluZywgdW5sZXNzIG90aGVyd2lzZSBzdGF0ZWQuPC9wPgogICAgICAgIDxkbCBjbGFzcz0icm93Ij4KICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+eDwvY29kZT48L2R0PgogICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij5UaGUgPGNvZGU+eDwvY29kZT4gcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQuPC9kZD4KICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+eTwvY29kZT48L2R0PgogICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij5UaGUgPGNvZGU+eTwvY29kZT4gcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQuPC9kZD4KICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+dzwvY29kZT48L2R0PgogICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij5UaGUgd2lkdGggb2YgdGhlIGVsZW1lbnQuPC9kZD4KICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+aDwvY29kZT48L2R0PgogICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij5UaGUgd2lkdGggb2YgdGhlIGVsZW1lbnQuPC9kZD4KICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+bGFiZWw8L2NvZGU+PC9kdD4KICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+VGhlIGxhYmVsIGZvciB0aGUgZWxlbWVudCwgdXN1YWxseSBzaG93biBhYm92ZSBvciBpbnNpZGUgdGhlIGVsZW1lbnQuPC9kZD4KICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+YWN0aW9uPC9jb2RlPjwvZHQ+CiAgICAgICAgICAgIDxkZCBjbGFzcz0iY29sLXNtLTkiPkEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBpZiB0aGUgZWxlbWVudCBpcyBwcmVzc2VkLjwvZGQ+CiAgICAgICAgICAgIDxkdCBjbGFzcz0iY29sLXNtLTMiPjxjb2RlPnI8L2NvZGU+PC9kdD4KICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+VGhlIGJvcmRlciByYWRpdXMgb2YgYSByZWN0YW5nbGUgaWYgdGhlIGVsZW1lbnQncyBzaGFwZSBpcyBhIHJlY3RhbmdsZSwgaWYgdGhlIHNoYXBlCiAgICAgICAgICAgICAgICBvZiB0aGUgZWxlbWVudCBpcyBhbiBlbGxpcHNlLCB0aGlzIHBhcmFtZXRlciB3aWxsIGJlIHRoZSByYWRpdXMgb2YgdGhlIGVsbGlwc2UuPC9kZD4KICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+ZmlsbDwvY29kZT48L2R0PgogICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij5UaGUgY29sb3Igb2YgdGhlIGVsZW1lbnQuPC9kZD4KICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+ZGlzYWJsZWQ8L2NvZGU+PC9kdD4KICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+Qm9vbGVhbiB2YWx1ZSB0aGF0IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBlbGVtZW50IGlzIGRpc2FibGVkIG9yIG5vdC4gQ2Fubm90IGJlIGNoYW5nZWQKICAgICAgICAgICAgICAgIGFmdGVyIGVsZW1lbnQgY3JlYXRpb24sIHRoZSA8Y29kZT5kaXNhYmxlPC9jb2RlPiBhbmQgPGNvZGU+ZW5hYmxlPC9jb2RlPiBtZXRob2RzIG5lZWQgdG8gYmUgdXNlZCBmb3IKICAgICAgICAgICAgICAgIHRoYXQuPC9kZD4KICAgICAgICA8L2RsPgogICAgICAgIDxicj4KICAgICAgICA8aDU+TWV0aG9kczwvaDU+CiAgICAgICAgPHA+RXZlcnkgZWxlbWVudCBpbmhlcml0cyBzb21lIGVzc2VudGlhbCBtZXRob2RzIGZyb20gdGhlIDxjb2RlPkVsZW1lbnQ8L2NvZGU+IGNsYXNzLjwvcD4KICAgICAgICA8ZGwgY2xhc3M9InJvdyI+CiAgICAgICAgICAgIDxkdCBjbGFzcz0iY29sLXNtLTMiPjxjb2RlPmluaXQ8L2NvZGU+PC9kdD4KICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+SW5pdGlhdGVzIHRoZSBlbGVtZW50LCBpZiBhbnkgdmFsdWVzIGxpa2UgdGhlIDxjb2RlPng8L2NvZGU+IG9yIDxjb2RlPnc8L2NvZGU+CiAgICAgICAgICAgICAgICBwb3NpdGlvbnMgd2VyZSBjaGFuZ2VkIHRoZSBjaGFuZ2VzIHdpbGwgYmUgdXBkYXRlZC48L2RkPgogICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS0zIj48Y29kZT5kaXNhYmxlPC9jb2RlPjwvZHQ+CiAgICAgICAgICAgIDxkZCBjbGFzcz0iY29sLXNtLTkiPkRpc2FibGVzIHRoZSBlbGVtZW50IGlmIHByZXZpb3VzbHkgZW5hYmxlZC48L2RkPgogICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS0zIj48Y29kZT5lbmFibGU8L2NvZGU+PC9kdD4KICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+RW5hYmxlcyB0aGUgZWxlbWVudCBpZiBwcmV2aW91c2x5IGRpc2FibGVkLjwvZGQ+CiAgICAgICAgPC9kbD4KICAgICAgICA8YnI+CiAgICAgICAgPGg1PkRyYXdpbmcgRWxlbWVudHM8L2g1PgogICAgICAgIDxwPkVsZW1lbnRzIHdpbGwgbm90IGFwcGVhciBvbiB0aGUgc2NyZWVuIHVudGlsIHRoZWlyIDxjb2RlPmRyYXc8L2NvZGU+IG1ldGhvZCBpcyBjYWxsZWQuIEl0IGlzIHJlY29tbWVuZGVkIHRvCiAgICAgICAgICAgIHN0b3JlIGVsZW1lbnRzIGluIGFuIGFycmF5IGFuZCBpdGVyYXRlIG92ZXIgdGhlIGFycmF5IHRvIGRyYXcgdGhlIGVsZW1lbnRzIGlmIHRoZXJlIGFyZSBzZXZlcmFsIGVsZW1lbnRzIHRvCiAgICAgICAgICAgIGJlIGRpc3BsYXllZCBhcyBzaG93biBiZWxvdy48L3A+CiAgICAgICAgPHByZT48Y29kZSBjbGFzcz0ibGFuZ3VhZ2UtanMiPnZhciBlbGVtZW50cyA9IFtidXR0b24xLCBidXR0b24yLCBzbGlkZXIxLCB0ZXh0Ym94MV07CmVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHsKICAgIGVsZW1lbnQuZHJhdygpOwp9KTs8L2NvZGU+PC9wcmU+CiAgICAgICAgPGJyPgogICAgICAgIDxwPkVhY2ggZWxlbWVudCBuZWVkcyB0byBiZSBzZXQgdXAgaW4gYSBkaWZmZXJlbnQgd2F5LiBCZWxvdyBpcyBhIGxpc3Qgb2YgdGhlIGVsZW1lbnRzLCB3aGF0IHByb3BlcnRpZXMgdGhleQogICAgICAgICAgICBoYXZlIGFuZCB0aGVpciBjb2RlLjwvcD4KICAgICAgICA8ZGl2IGNsYXNzPSJyb3ciPgogICAgICAgICAgICA8aDQgaWQ9ImJ1dHRvbiI+QnV0dG9uPC9oND4KICAgICAgICAgICAgPGhyPgogICAgICAgICAgICA8cD5BIHNpbXBsZSBidXR0b24gZWxlbWVudCB0aGF0IGV4Y2VjdXRlcyBhIGZ1bmN0aW9uIHdoZW4gY2xpY2tlZC48L3A+CiAgICAgICAgICAgIDxwPlRoZSBidXR0b24ncyBkZWZhdWx0IGNvbmZpZzwvcD4KICAgICAgICAgICAgPHByZT48Y29kZSBjbGFzcz0ibGFuZ3VhZ2UtanMiPmNvbmZpZy5idXR0b24gPSB7CiAgICB3OiA3NSwKICAgIGg6IDMwLAogICAgcjogNQp9OzwvY29kZT48L3ByZT4KICAgICAgICAgICAgPGJyPgogICAgICAgICAgICA8cD5UaGUgPGNvZGU+QnV0dG9uPC9jb2RlPiBlbGVtZW50IGhhcyBubyB1bmlxdWUgcGFyYW1ldGVycyBvdGhlciB0aGFuIHRoZSA8Y29kZT5hY3Rpb248L2NvZGU+CiAgICAgICAgICAgICAgICBwYXJhbWV0ZXIuPC9wPgogICAgICAgICAgICA8ZGwgY2xhc3M9InJvdyI+CiAgICAgICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS0zIj48Y29kZT5hY3Rpb248L2NvZGU+PC9kdD4KICAgICAgICAgICAgICAgIDxkZCBjbGFzcz0iY29sLXNtLTkiPkEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4Y2VjdXRlZCBvbmNlIHRoZSBidXR0b24gaXMgcHJlc3NlZC48L2RkPgogICAgICAgICAgICA8L2RsPgogICAgICAgICAgICA8YnI+CiAgICAgICAgICAgIDxoNCBpZD0ic2xpZGVyIj5TbGlkZXI8L2g0PgogICAgICAgICAgICA8cD5BIHNpbXBsZSBzbGlkZXIgdGhhdCBleGNlY3V0ZXMgYSBmdW5jdGlvbiB3aGVuIHRoZSB0aHVtYiBpcyBkcmFnZ2VkIG9yIHdoZW4gY2VydGFpbiBrZXlzIGFyZQogICAgICAgICAgICAgICAgcHJlc3NlZC48L3A+CiAgICAgICAgICAgIDxwPlRoZSBkZWZhdWx0IHNsaWRlciBjb25maWc8L3A+CiAgICAgICAgICAgIDxwcmU+PGNvZGUgY2xhc3M9Imxhbmd1YWdlLWpzIj5jb25maWcuc2xpZGVyID0gewogICAgdzogMTAwLAogICAgcjogMTAsCiAgICBtaW46IDAsCiAgICBtYXg6IDEwMAp9OzwvY29kZT48L3ByZT4KICAgICAgICAgICAgPGJyPgogICAgICAgICAgICA8cD5UaGUgPGNvZGU+U2xpZGVyPC9jb2RlPiBlbGVtZW50IHRha2VzIHNvbWUgdW5pcXVlIHBhcmFtZXRlcnMgdG8gc2V0IGl0J3MgdmFsdWUgcmFuZ2UgYW5kIGRlZmF1bHQKICAgICAgICAgICAgICAgIHZhbHVlLjwvcD4KICAgICAgICAgICAgPGRsIGNsYXNzPSJyb3ciPgogICAgICAgICAgICAgICAgPGR0IGNsYXNzPSJjb2wtc20tMyI+PGNvZGU+bWluPC9jb2RlPjwvZHQ+CiAgICAgICAgICAgICAgICA8ZGQgY2xhc3M9ImNvbC1zbS05Ij5UaGUgbWluaW11bSBudW1iZXIgdGhlIHVzZXIgY2FuIHNldCB0aGUgc2xpZGVyJ3MgdmFsdWUgdG8uPC9kZD4KICAgICAgICAgICAgICAgIDxkdCBjbGFzcz0iY29sLXNtLTMiPjxjb2RlPm1heDwvY29kZT48L2R0PgogICAgICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+VGhlIG1heGltdW0gbnVtYmVyIHRoZSB1c2VyIGNhbiBzZXQgdGhlIHNsaWRlcidzIHZhbHVlIHRvLjwvZGQ+CiAgICAgICAgICAgICAgICA8ZHQgY2xhc3M9ImNvbC1zbS0zIj48Y29kZT52YWx1ZTwvY29kZT48L2R0PgogICAgICAgICAgICAgICAgPGRkIGNsYXNzPSJjb2wtc20tOSI+VGhlIGRlZmF1bHQgdmFsdWUgb2YgdGhlIHNsaWRlciwgd2lsbCBiZSBjb25zdHJhaW5lZCB0byB0aGUgPGNvZGU+bWluPC9jb2RlPgogICAgICAgICAgICAgICAgICAgIGFuZCA8Y29kZT5tYXg8L2NvZGU+IHZhbHVlcyBwcm92aWRlZC48L2RkPgogICAgICAgICAgICA8L2RsPgogICAgICAgICAgICA8cD5CZXNpZGVzIHRoZSBvYnZpb3VzIHdheSB0byBjaGFuZ2UgdGhlIHNsaWRlcidzIHZhbHVlIGJ5IGRyYWdnaW5nIHRoZSB0aHVtYiwgdGhlIHVzZXIgY2FuIGFsc28gdXNlCiAgICAgICAgICAgICAgICB2YXJpb3VzIGtleWJvYXJkIGNvbnRyb2xzIHRvIGNoYW5nZSB0aGUgdmFsdWUgd2hpbGUgdGhlIHNsaWRlciBpcyBpbiBmb2N1cy48L3A+CiAgICAgICAgICAgIDx0YWJsZSBjbGFzcz0idGFibGUgdGFibGUtc20gdGFibGUtaG92ZXIiPgogICAgICAgICAgICAgICAgPHRoZWFkPgogICAgICAgICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHNjb3BlPSJjb2wiPktleTwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzY29wZT0iY29sIj5BY3Rpb248L3RoPgogICAgICAgICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgICAgICA8L3RoZWFkPgogICAgICAgICAgICAgICAgPHRib2R5PgogICAgICAgICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxrYmQ+JmxhcnI7PC9rYmQ+IG9yIDxrYmQ+LTwva2JkPjwvdGQ+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5EZWNyZW1lbnRzIHRoZSB2YWx1ZSBieSA8Y29kZT4xPC9jb2RlPiBvciA8Y29kZT4wLjE8L2NvZGU+IGJhc2VkIG9uIHRoZSByYW5nZSBvZiB0aGUKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLjwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPC90cj4KICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48a2JkPiZyYXJyOzwva2JkPiBvciA8a2JkPis8L2tiZD48L3RkPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+SW5jcmVtZW50cyB0aGUgdmFsdWUgYnkgPGNvZGU+MTwvY29kZT4gb3IgPGNvZGU+MC4xPC9jb2RlPiBiYXNlZCBvbiB0aGUgcmFuZ2Ugb2YgdGhlCiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS48L3RkPgogICAgICAgICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGtiZD4wPC9rYmQ+IC0gPGtiZD45PC9rYmQ+PC90ZD4KICAgICAgICAgICAgICAgICAgICAgICAgPHRkPlNldHMgdGhlIHZhbHVlIHRvIGEgY2VydGFpbiBwZXJjZW50YWdlIG9mIHRoZSByYW5nZS4gRm9yIGV4YW1wbGUsIDxrYmQ+Mjwva2JkPiB3aWxsIHNldAogICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHZhbHVlIHRvIDIwJSBvZiB0aGUgcmFuZ2UuPC90ZD4KCiAgICAgICAgICAgICAgICAgICAgPC90cj4KICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48a2JkPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw8L2tiZD4gb3IgPGtiZD5bCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2tiZD48L3RkPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+U2V0cyB0aGUgdmFsdWUgdG8gdGhlIG1pbmltdW0gdmFsdWU8L3RkPgogICAgICAgICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGtiZD4+PC9rYmQ+IG9yIDxrYmQ+XTwva2JkPjwvdGQ+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5TZXRzIHRoZSB2YWx1ZSB0byB0aGUgbWF4aW11bSB2YWx1ZTwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPC90cj4KICAgICAgICAgICAgICAgIDwvdGJvZHk+CiAgICAgICAgICAgIDwvdGFibGU+CiAgICAgICAgICAgIDxicj4KICAgICAgICAgICAgPGg0IGlkPSJjaGVja2JveCI+Q2hlY2tib3g8L2g0PgogICAgICAgICAgICA8cD4uLi48L3A+CiAgICAgICAgICAgIDxicj4KICAgICAgICAgICAgPGg0IGlkPSJyYWRpby1idXR0b24iPlJhZGlvIGJ1dHRvbjwvaDQ+CiAgICAgICAgICAgIDxwPi4uLjwvcD4KICAgICAgICA8L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0ibW9kYWwgZmFkZSIgaWQ9ImV4YW1wbGVNb2RhbCIgdGFiaW5kZXg9Ii0xIiByb2xlPSJkaWFsb2ciIGFyaWEtbGFiZWxsZWRieT0iZXhhbXBsZU1vZGFsTGFiZWwiCiAgICAgICAgYXJpYS1oaWRkZW49InRydWUiPgogICAgICAgIDxkaXYgY2xhc3M9Im1vZGFsLWRpYWxvZyBtb2RhbC1kaWFsb2ctY2VudGVyZWQiIHJvbGU9ImRvY3VtZW50Ij4KICAgICAgICAgICAgPGRpdiBjbGFzcz0ibW9kYWwtY29udGVudCI+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJtb2RhbC1oZWFkZXIiPgogICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzcz0ibW9kYWwtdGl0bGUiIGlkPSJleGFtcGxlTW9kYWxMYWJlbCI+V29yayBpbiBwcm9ncmVzcy4uLjwvaDU+CiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPSJidXR0b24iIGNsYXNzPSJjbG9zZSIgZGF0YS1kaXNtaXNzPSJtb2RhbCIgYXJpYS1sYWJlbD0iQ2xvc2UiPgogICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBhcmlhLWhpZGRlbj0idHJ1ZSI+JnRpbWVzOzwvc3Bhbj4KICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0ibW9kYWwtYm9keSI+CiAgICAgICAgICAgICAgICAgICAgPHA+SnVzdCBhIHdhcm5pbmcgdGhhdCB0aGUgZG9jdW1lbnRhdGlvbiBpcyBzdGlsbCB1bmRlciBkZXZlbG9wbWVudCBhbmQgdGhlIG1ham9yaXR5IG9mIGVsZW1lbnRzCiAgICAgICAgICAgICAgICAgICAgICAgIGhhdmVuJ3QgYmVlbiBjb3ZlcmVkIHlldC48L3A+CiAgICAgICAgICAgICAgICAgICAgPHA+SSBwbGFuIHRvIGFkZCBtb3JlIGNvbnRlbnQgc29vbiwgYnV0IHVudGlsIHRoZW4sIGZlZWwgZnJlZSB0byBsb29rIG92ZXIgdGhlIHBhZ2UgYW5kIHByb3ZpZGUgYW55CiAgICAgICAgICAgICAgICAgICAgICAgIGZlZWRiYWNrIHlvdSBtaWdodCBoYXZlIGF0IHRoZSA8YSB0YXJnZXQ9Il9ibGFuayIgaHJlZj0iaHR0cHM6Ly93d3cua2hhbmFjYWRlbXkub3JnL2NvbXB1dGVyLXByb2dyYW1taW5nL3NpbXBsZS1lbGVtZW50cy81MjAxNzg4OTA2Nzk5MTA0Ij5vcmlnaW5hbAogICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbTwvYT4gb24gS2hhbiBBY2FkZW15LjwvcD4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0ibW9kYWwtZm9vdGVyIj4KICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgY2xhc3M9ImJ0biBidG4tc3VjY2VzcyIgZGF0YS1kaXNtaXNzPSJtb2RhbCI+R290Y2hhPC9idXR0b24+CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KICAgIDxicj4KICAgIDxzY3JpcHQgc3JjPSJodHRwczovL2NvZGUuanF1ZXJ5LmNvbS9qcXVlcnktMy4yLjEuc2xpbS5taW4uanMiIGludGVncml0eT0ic2hhMzg0LUtKM28yREt0SWt2WUlLM1VFTnptTTdLQ2tSci9yRTkvUXBnNmFBWkdKd0ZETVZOQS9HcEdGRjkzaFhwRzVLa04iCiAgICAgICAgY3Jvc3NvcmlnaW49ImFub255bW91cyI+PC9zY3JpcHQ+CiAgICA8c2NyaXB0IHNyYz0iaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcG9wcGVyLmpzLzEuMTIuOS91bWQvcG9wcGVyLm1pbi5qcyIgaW50ZWdyaXR5PSJzaGEzODQtQXBOYmdoOUIrWTFRS3R2M1JuN1czbWdQeGhVOUsvU2NRc0FQN2hVaWJYMzlqN2Zha0ZQc2t2WHVzdmZhMGI0USIKICAgICAgICBjcm9zc29yaWdpbj0iYW5vbnltb3VzIj48L3NjcmlwdD4KICAgIDxzY3JpcHQgc3JjPSJodHRwczovL21heGNkbi5ib290c3RyYXBjZG4uY29tL2Jvb3RzdHJhcC80LjAuMC9qcy9ib290c3RyYXAubWluLmpzIiBpbnRlZ3JpdHk9InNoYTM4NC1KWlI2U3Blamg0VTAyZDhqT3Q2dkxFSGZlL0pRR2lSUlNRUXhTZkZXcGkxTXF1VmRBeWpVYXI1Kzc2UFZDbVlsIgogICAgICAgIGNyb3Nzb3JpZ2luPSJhbm9ueW1vdXMiPjwvc2NyaXB0PgogICAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3ByaXNtLzEuMTUuMC9wcmlzbS5taW4uanMiPjwvc2NyaXB0PgogI%E2%80%A6</textarea>";
};
//}
//Creating Elements {
var docsButton = new Button({
    label: "Docs",
    x: 500,
    y: 550,
    fill: color(150),
    action: function() {
        openDocs();
    }
});
var b = new Button({
    label: "Click Me",
    x: 125,
    y: 15
});
var s = new Slider({
    label: "Slide Me",
    x: 20,
    y: 300,
    w: 200,
    min: -100,
    max: 100,
    value: 10,
    action: function() {
        //println(this.value);
    }
});
var radioOptions = {
    alpha: false,
    beta: true,
    charlie: false
};
var rl = new Radiolist({
    x: 10,
    y: 100,
    options: radioOptions
});
var checkBoxOptions = {
    one: false,
    two: true,
    three: false
};
var cl = new Checklist({
    x: 10,
    y: 10,
    options: checkBoxOptions
});
var t = new ToggleButton({
    label: "Toggle",
    x: 100,
    y: 100,
    toggled: true
});
var dropOptions = {
    un: false,
    deux: true,
    trois: false,
    quatre: false,
    cinq: false
};
var d = new Dropdown({
    x: 15,
    y: 200,
    options: dropOptions
});
var p = new Pane({
    x: 250,
    y: 15
});
var t = new Textbox({
    x: 250,
    y: 200,
    action: function() {
        println(t.text);
    }
});
var elements = [docsButton, b, s, rl, cl, t, d, p];
//}
//Drawing Elements {
var debugMode = false;
var pFrameRate = this.__frameRate;
var frames = [];
draw = function() {
    //println(rl.mouseOver());
    background(250);
    elements.forEach(function (element) {
        element.draw();
    });
    //Debugging purposes {
    if(debugMode) {
        for(var i = 0; i < Object.values(config.fill).length; i++) {
            strokeWeight(2);
            stroke(0);
            fill(Object.values(config.fill)[i]);
            rect(width - 15, 15 + i * 15, 15, 15);
        }
        if(pFrameRate !== this.__frameRate) {
            frames.push(this.__frameRate);
        }
        if(frames.length > width) {
            frames = [];
        }
        strokeWeight(1);
        stroke(200);
        fill(0, 0, 0, 25);
        beginShape();
        vertex(0, height);
        for(var i = 0; i < frames.length; i++) {
            vertex(i, map(frames[i], 0, 100, height, height - 100));
        }
        vertex(frames.length, height);
        endShape();
        fill(0, 0, 0, 100);
        textAlign(RIGHT, BOTTOM);
        textFont(createFont("monospace", 15));
        text(frameCount + "\n" + this.__frameRate.toFixed(3), width, height);
    }
    //}
};
//}
//Event handling {
mousePressed = function() {
    elements.forEach(function (element) {
        element.onmousepress();
    });
};
mouseReleased = function() {
    elements.forEach(function (element) {
        element.onmouserelease();
    });
};
mouseDragged = function() {
    elements.forEach(function (element) {
        element.onmousedrag();
    });
};
//mouseOut = mouseReleased;
keyPressed = function() {
    elements.forEach(function (element) {
        element.onkeypress();
    });
    //Debugging purposes {
    if(keyCode === 192) {
        debugMode = !debugMode;
    }
    //}
};
//}
