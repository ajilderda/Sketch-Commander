import WebUI from 'sketch-module-web-view'
import { getCommandsObj, splitCommands } from '../Resources/shared'

/*
l		+ - =
r		+ - =
t		+ - =
b		+ - =
x		+ - =
y		+ - =
w		+ - / * = %
h		+ - / * = %
a		+ - =
bdrs	=

*/

var context,
doc,
selection,
userInput;
var prevUserInput  = "",
actionContext  = "";
var sketch;

export default function (context) {
    context = context;
	sketch = context.api(); // Load sketch API — http://developer.sketchapp.com/reference/api/
	doc = context.document;
	selection = context.selection;
    
    // does a userInputSetting already exist?
	try {
		prevUserInput = sketch.settingForKey("userInputSetting");
        actionContext = sketch.settingForKey("actionContext");
	}
	catch (e) { // else reset history
		sketch.setSettingForKey("userInputSetting", "");
        sketch.setSettingForKey("actionContext", "");
	}
    
    // create webview
    const options = {
        identifier: 'unique.id', // to reuse the UI
        x: 0,
        y: 0,
        width: 520,
        height: 280,
        background: NSColor.blackColor(),
        titlebarAppearsTransparent: true,
        onlyShowCloseButton: true,
        title: 'Sketch Commander',
        hideTitleBar: false,
        setTitlebarAppearsTransparent : true,
        shouldKeepAround: true,
        handlers: {
            returnUserInput: function (s) {
                userInput = s;
                // store previous value for later use
                sketch.setSettingForKey("userInputSetting", userInput);
            },
            saveContext: function (s) {
                context = s;
                // store previous value for later use
                sketch.setSettingForKey("actionContext", context);
            },
            nativeLog: function (s) {
                webUI.panel.close();
                WebUI.clean()
                executeCommand(s);
                doc.reloadInspector();
            },
            closeModal: function () {
                webUI.panel.close();
                WebUI.clean()
            }
        },
        frameLoadDelegate: { // https://developer.apple.com/reference/webkit/webframeloaddelegate?language=objc
            'webView:didFinishLoadForFrame:': function (webView, webFrame) {
                // triggers when webview is loaded
                webUI.eval('prevUserInput ="' + prevUserInput + '"')
                webUI.eval('actionContext ="' + actionContext + '"')
                
                // create array with selected layers
                var layerNameArray = [];
                for (var i=0; i < selection.count(); i++) {
                    var layer = selection.objectAtIndex(i);
                    layerNameArray.push(layer.name());
                }
                webUI.eval('layerNameArray ="' + layerNameArray + '"')
                // webUI.eval('someJSFunction(' + prevCommand + ')');
            }
        }
    }
    const webUI = new WebUI(context, 'index.html', options);
}


function executeCommand(commandObj) {
    for (var k=0; k < commandObj.length; k++) {
        commandType = commandObj[k].type;
        operator = commandObj[k].operator;
        amount = commandObj[k].amount;
        // log('obj: ' + commandType + operator + amount);
        
        switchStatement:
            switch (commandType) {
                case "l":
                case "r":
                case "t":
                case "b":
                case "a":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        resizeObject(layer, commandType, operator, amount);
                    };
                    break switchStatement;
                case "w":
                case "h":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        setWidthHeightObject(layer, commandType, amount, operator);
                    }
                    break switchStatement;
                case "x":
                case "y":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        moveObject(layer, commandType, amount, operator);
                    }
                    break switchStatement;
                case "fs":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        textActions.setSize(layer, amount, operator);
                    }
                    break switchStatement;
                case "ttl":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        textActions.convertLowerCase(layer);
                    }
                    break switchStatement;
                case "ttu":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        textActions.convertUpperCase(layer);
                    }
                    break switchStatement;
                case "lh":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        textActions.setLineheight(layer, amount, operator);
                    }
                    break switchStatement;
                case "v":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        value = amount;
                        textActions.setValue(layer, value, operator);
                    }
                    break switchStatement;
                case "n":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        value = amount;
                        layerActions.rename(layer, value, operator);
                    }
                    break switchStatement;
                case "bdc":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        borderActions.setColor(layer, amount, operator);
                    }
                    break switchStatement;
                case "bdr":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        borderActions.radius(layer, amount, operator);
                    }
                    break switchStatement;
                case "bdw":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        borderActions.thickness(layer, amount, operator);
                    }
                    break switchStatement;
                case "bd":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        borderActions.checkOperator(layer, amount, operator);
                    }
                    break switchStatement;
                case "f":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        fillActions.setColor(layer, amount, operator);
                    }
                    break switchStatement;
                case "o":
                    for (var i=0; i < selection.count(); i++) {
                        var layer = selection.objectAtIndex(i);
                        fillActions.setOpacity(layer, amount, operator);
                    }
                    break switchStatement;
            }
    }
}

//////////////////////////////////////////////////////////////////
//  LAYER ACTIONS                                               //
//////////////////////////////////////////////////////////////////

function resizeObject(layer, command, operator, amount) {
	var calcAmount = Math.round(amount);
	if(operator == "-")
		calcAmount *= -1;

	switch (command) {
		case "a":
			resize(layer, calcAmount,calcAmount,calcAmount,calcAmount);
			break;
		case "l":
			resize(layer, 0,0,0,calcAmount);
			break;
		case "r":
			resize(layer, 0,calcAmount,0,0);
			break;
		case "t":
			resize(layer, calcAmount,0,0,0);
			break;
		case "b":
			resize(layer, 0,0,calcAmount,0);
			break;
	}
}

function moveObject(layer, command, amount, operator) {
	var xAmount = Number(amount);
	var yAmount = Number(amount);
	var frame = layer.frame();
	var xCurrent = layer.absoluteRect().rulerX();
	var yCurrent = layer.absoluteRect().rulerY();
	
	if(operator == "-" || operator == "+") {	
		if(operator == "-") {
			xAmount *= -1;
			yAmount *= -1;
		}
		if(command === "x") {
			layer.absoluteRect().setRulerX( xCurrent + xAmount );
		} else if (command === "y") {
			layer.absoluteRect().setRulerY( yCurrent + yAmount );
		}
	}
	if (operator == "=") {
		if(command === "x") {
			layer.absoluteRect().setRulerX( xAmount );
		} else if (command === "y") {
			layer.absoluteRect().setRulerY( yAmount );
		}
	}
}

// function is triggered when using operators = / * %
function setWidthHeightObject(layer, command, amount, operator) {
	var calcAmount = Math.round(amount);
	var frame = layer.frame();
    
	calcAmountPercentage = calcAmount / 100;

	frameHeight = frame.height();
	frameWidth = frame.width();
	
	// Set width or height =
	if (operator == "=") {
		if (command === "w")
			frame.setWidth(amount);
		else if (command === "h")
			frame.setHeight(amount);
	}
    // add or subtract width/height
	if (operator == "+" || operator == "-") {
        if (operator == "-") {
            calcAmount = calcAmount *= -1;
        }
		if (command === "w")
            resize(layer, 0,calcAmount,0,0);
		else if (command === "h")
            resize(layer, 0,0,calcAmount,0);
	}
	// Set percentage %
	else if (operator == "%") {
		if(command == 'h')
			frame.setHeight( Math.round(calcAmountPercentage * frameHeight) );
		else
			frame.setWidth( Math.round(calcAmountPercentage * frameWidth) );
	}
	// Divide /
	else if (operator == "/") {
		if(command == 'h')
			frame.setHeight( Math.round(frameHeight/amount) );
		else
			frame.setWidth( Math.round(frameWidth/amount) );
	}
	// Multiply *
	else if (operator == "*") {
		if(command == 'h')
			frame.setHeight(Math.round(frameHeight*amount) );
		else {
			frame.setWidth(Math.round(frameWidth*amount) );
		}
	}
}

// Function below is exactly the same as in Keyboard Resize
function resize(layer,t,r,b,l) {
	var frame = layer.frame();
	
	//if layer is a textlayer, set width to fixed
	if (layer.className() == "MSTextLayer") {
		layer.setTextBehaviour(1);
	}

	// Top
	if(t != 0) {
		if (frame.height() + t < 0) {
			var oldHeight = frame.height();
			frame.setHeight(1); // When contracting size prevent object to get a negative height (e.g. -45px).
			frame.setY(frame.y() + oldHeight - 1); // reposition the object
		} else {
			frame.setY(frame.y() - t); // push/pull object to correct position
			frame.setHeight(frame.height() + t);
		}
	}

	// Right
	if(r != 0) {
		frame.setWidth(frame.width() + r);
		if(frame.width() <= 1) { frame.setWidth(1); }
	}

	// Bottom
	if(b != 0) {
		frame.setHeight(frame.height() + b);
		if(frame.height() <= 1) { frame.setHeight(1); }
	}

	// Left
	if(l != 0) {
		if (frame.width() + l < 0) {
			var oldWidth = frame.width();
			frame.setWidth(1);
			frame.setX(frame.x() + oldWidth - 1);
		} else {
			frame.setX(frame.x() - l); // push/pull object to correct position
			frame.setWidth(frame.width() + l);
		}
	}
}

var borderActions = {
	checkOperator : function(layer, color, operator) {
		switch(operator) {
			case '-':
				this.remove(layer);
				break;
			case '+':
				this.add(layer, color);
				break;
			case '#':
			case '=':
				this.setColor(layer, color);
				break;
		}
	},
	setColor : function(layer, color) {
		var style = new sketch.Style(); // requires access to the Sketch js API
        var borders = layer.style().borders();
		
		// check if there's a border, if not add a new one
        if (borders.count() <= 0){
            layer.style().addStylePartOfType(1);
        }
        
        var border = borders.lastObject();
        color = color.replace("#", "");

		border.color = style.colorFromString("#" + color);
	},
	add : function(layer, color) {
        var style = new sketch.Style();
        var border = layer.style().addStylePartOfType(1);
        
		// if no color is given (like bd+) set the color to black
		color = (color !== "") ? color : "000000";
		
		// basic check to find out if the user tries to add a width in stead of a color
		if (color.length > 2) {
            color = color.replace("#", "");
			border.color = style.colorFromString("#" + color);
		}
		else {
			var thickness = color;
            border.thickness = thickness;
		}
	},
	remove : function(layer) {
		var style = new sketch.Style();
		var borderCount = layer.style().borders().length - 1;
		var border = layer.style().removeStyleBorderAtIndex(borderCount);
	},
	radius : function (layer, value, operator) {
		if(layer && layer.isKindOfClass(MSShapeGroup)) {
			var shape=layer.layers().firstObject();
			if(shape && shape.isKindOfClass(MSRectangleShape)) {
                var radius = shape.cornerRadiusFloat();
                shape.cornerRadiusFloat = mathOps(radius, value, operator);
			}
		}
	},
	thickness : function (layer, thickness, operator) {
		thickness = Number(thickness);
        // are there any borders?
        var border = layer.style().borders().lastObject();
        if (border != null) {
    		var borderThickness = layer.style().borders().lastObject().thickness();
            border.thickness = mathOps(borderThickness, thickness, operator);
        }
        else {
            this.add(layer, thickness);
        }
	}
}

var textActions = {
    setSize : function(layer, value, operator) {
        value = Number(value);
        if (layer.className() == "MSTextLayer") {
            var fontSize = layer.fontSize();
            layer.fontSize = mathOps(fontSize, value, operator);
        }
    },
    setLineheight : function(layer, value, operator) {
        value = Number(value);
        if (layer.className() == "MSTextLayer") {
            var lineHeight = layer.lineHeight();
            lineHeight = mathOps(lineHeight, value, operator);
        }
    },
    setValue : function(layer, value, operator) {
        if (layer.className() == "MSTextLayer") {
            var textValue = layer.stringValue();
            
            if (operator == "+") {
                layer.stringValue = textValue + value;
            }
            else if (operator == "-") {
                textValue = textValue.replace(value, "");
                layer.stringValue = textValue;
            }
            else {
                layer.stringValue = value;
            }
        }
    },
    convertLowerCase : function (layer) {
        if (layer.className() == "MSTextLayer") {
            var textValue = layer.stringValue();
            var newValue = textValue.toLowerCase();
            layer.stringValue = newValue;
        }
    },
    convertUpperCase : function (layer) {
        if (layer.className() == "MSTextLayer") {
            var textValue = layer.stringValue();
            var newValue = textValue.toUpperCase();
            layer.stringValue = newValue;
        }
    }
}
var layerActions = {
    rename : function(layer, value, operator) {
        layerName = layer.name();
        layer.nameIsFixed = 1;
        
        if (operator == "+") {
            layer.name = layerName + value;
        }
        else if (operator == "-") {
            layerName = layerName.replace(value, "");
            layer.name = layerName;
        }
        else {
            layer.name = value;
        }
    }
}
    
var fillActions = {
    setColor : function(layer, color) {
        
        if (layer.className() == "MSTextLayer") {
            color = makeColor(color);
            layer.setTextColor(color);
    	} 
        if (layer instanceof MSShapeGroup) {
            var style = new sketch.Style();
            var fills = layer.style().fills();

            // create fill if there are none
            if (fills.count() <= 0){
                fills.addStylePartOfType(0);
            }
            var fill = fills.firstObject();
            color = color.replace("#", "");

            //set color to first fill layer style
            fill.color = style.colorFromString("#" + color);
        }
    },
    // ,
    // copyColor : function() {
    //     
    // },
    setOpacity : function(layer, opacity) {
        opacity = opacity/100;
        layer.style().contextSettings().setOpacity(opacity);
    }
}

//////////////////////////////////////////////////////////////////
//  GENERIC FUNCTIONS                                           //
//////////////////////////////////////////////////////////////////

// simple math operations for - + * / %
function mathOps(input, value, operator) {
    input = Number(input);
    value = Number(value);
    
    if (operator == "+")
        return input + value;
    else if (operator == "-")
        return input - value;
    else if (operator == "*")
        return input * value;
    else if (operator == "/")
        return input / value;
    else if (operator == "%")
        return input * (value / 100);
    else
        return value;
}

// makeColor function to convert hex values to MSColor (from http://sketchplugins.com/d/8-global-colors-gradients/2)
function makeColor(SVGString) {
    return MSImmutableColor.colorWithSVGString(SVGString).newMutableCounterpart();
}
