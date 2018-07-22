import pluginCall from 'sketch-module-web-view/client'
import { initReceivers } from './receivers'
import {
  commands,
  commandList,
  DEBUG,
  DEVMODE,
  BROWSERDEBUG
} from './shared'
export { switchContextAction };

// DEVMODE sets a few variables that are normally received from Sketch
// Useful to debug the webview outside Sketch (using Gulp). 
// Do disable in production!
if (BROWSERDEBUG) {
  // prevUserInput = " ";
  let prevUserInput = "lr100, lr-100, tv=bla, x*200";
  let contextTabs = 0;
  let selectedLayerNameArray = 'testlayer 1,testlayer 2';
  let artboardLayerNameArray = 'testlayer 1,testlayer 2';
};

function returnToSketch(name, args) {
  if (DEBUG) console.log('triggered returnToSketch():' + name + '       Arguments: ' + args);
  if (BROWSERDEBUG) return;
  pluginCall(name, args);
}

var btn = document.querySelector('#btn');
var inputField = document.querySelector('.c-commander');
var replace = document.querySelector('#replace');

var contextTabs = document.querySelectorAll(".c-context-tab__item");
var contextList = document.querySelectorAll(".c-context-list");
var currentContext = 0;
var commandsUl = document.querySelector(".c-commands-list");
var optionsUl = document.querySelector(".c-options-list");

var inputFieldValue = document.querySelector('.c-commander').innerText;
var cyclingThroughOptions = false;

let valueHistory = [];
let caretPos;
let prevInputLength = inputField.textContent.length;
let inputArray = [];


function setInputValue(value) {
  inputField.value = value;
}
inputField.focus();

// Key event listeners
let tabKeyPressed = false;

function getInputValue() {
  return document.querySelector(".c-commander").innerText;
}

inputField.addEventListener('input', onInput);
inputField.addEventListener('keydown', onKeydown, false);

function onInput(e) {
  inputFieldValue = this.innerText;
  valueHistory.unshift(inputFieldValue); // add to history array
  if ( valueHistory.length >= 20 ) valueHistory.pop(); // limit history length
  renderInput();
  
  commands.clear();
  commands.parse(getInputValue());
};

function onKeydown(e) {
  caretPos = getCaretPosition();
  
  // when user presses cmd+z
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    e.preventDefault();
    handleUndo();
  }
  
  // close on keydown enter or escape key
  if (e.keyCode === 27) {
    returnToSketch('closeModal');
  }
  if (e.keyCode === 13) {
    if (cyclingThroughOptions) {
      selectOption();
    } else {
      returnToSketch('returnUserInput', getInputValue());
      returnToSketch('closeExecute', JSON.stringify(commands.get()));
    }
  }
  if (e.keyCode == 9) {
    e.preventDefault();
    if (!cyclingThroughOptions) {
      tabKeyPressed = true;
      if (!e.shiftKey) {
        switchContextAction('next');
      }
    } else {
      selectOption();
    }
  }
  if (e.keyCode == 40) { //down arrow
    e.preventDefault();
    navigateThroughList(+1);
  }
  if (e.keyCode == 38) { //up arrow
    e.preventDefault();
    navigateThroughList(-1);
  }
  if (e.shiftKey && tabKeyPressed) {
    e.preventDefault();
    switchContextAction('prev');
  }
};

inputField.addEventListener('keyup', onKeyup);

function onKeyup(e) {
  if (e.keyCode != 40 && e.keyCode != 38) { //don't parse input on pressing ↑ or ↓ arrow
    parseInput();
  }

  // reset status of the keypress
  if (e.keyCode == 9) {
    tabKeyPressed = false;
  }
};

function renderInput() {
  // create an array of all commands, e.g. ['lr-100', 'x*200']
  if ( !inputFieldValue ) return;
  console.log(inputFieldValue);
  inputArray = inputFieldValue.split(',');
  
  for (const command of inputArray) {
    const operatorRegex = /([\/+\-*%\=])/g;
    var commands = command.split(operatorRegex);
  }
  populateInput();
}

// function to replace current input value with the notation of selected option
function selectOption() {
  var optionsUlNodes = optionsUl.childNodes;
  for (var i = 0; i < optionsUlNodes.length; i++) {
    if ((" " + optionsUlNodes[i].className + " ").replace(/[\n\t]/g, " ").indexOf(" is-active ") > -1) {
      var el = optionsUlNodes[i];
      setInputValue(el.dataset.notation + el.dataset.defaultOperator);
    }
  }
};


function parseInput() {
  inputFieldValue = document.querySelector('.c-commander').innerText;
  const items = commands.get();
  if (DEBUG) console.log(commands.get());
  commandsUl.innerHTML = ''; // remove existing elements


  for (var i = 0; i < items.length; i++) {
    // var commandType = items[i].type;
    // var commandTypeName = commandList.filter(function(commandTypeName) {
    //   return commandTypeName.notation === commandType;
    // })[0];
    // commandTypeName = commandTypeName.name;
    // 
    // // create the list
    // var li = document.createElement('li');
    // li.classList.add('c-commands-list__item');
    // li.innerHTML = commandTypeName + " " + items[i].operator + " " + items[i].amount;
    // commandsUl.append(li);
  }
  // one or more valid commands have been entered
  if (items.length > 0) {
    optionsUl.style.display = "none";
    navigateThroughList('reset');
  } else { // no valid commands entered (yet)
    optionsUl.style.display = "block";
    filterActionlist();
  }

  // inputfield is empty
  if (inputFieldValue == "") {
    navigateThroughList('reset');
  }
}

function populateInput() {
  inputField.innerHTML = inputArray.join();
  setCaretPosition();
}

// Stripped/modified version of cpatik's Caret Position Fiddle:
// Demo: https://jsfiddle.net/cpatik/3QAeC/

function setCaretPosition(element) {
  var element = element || inputField;
  let range = document.createRange();
  let sel = window.getSelection();
  
  // see if something was added or removed and set the caret position accordingly
  let newInputLength = inputField.textContent.length;
  let inputDiff = newInputLength - prevInputLength;
  caretPos = caretPos + inputDiff;
  
  if (!inputField.textContent.trim()) {
    newInputLength = 0;
  }
  
  // set caret position
  range.setStart(element.childNodes[0], caretPos);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  
  prevInputLength = newInputLength;
}

function getCaretPosition(element) {
  var element = element || inputField;
  let caretOffset = 0;
  let range = window.getSelection().getRangeAt(0);
  let preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  caretOffset = preCaretRange.toString().length;
  return parseInt(caretOffset, 10);
}

// triggered whenever the user presses cmd + z
function handleUndo() {
  if ( valueHistory[0] ) {
    inputFieldValue = valueHistory[1];
    valueHistory.shift();
    renderInput();
  };
}


// List all commands by default
(function listCommands() {
  for (var key in commandList) {
    var commandTypeName = commandList[key].name;
    var commandNotation = commandList[key].notation;
    var commandTags = commandList[key].tags;
    var commandDefaultOperator = commandList[key].defaultOperator;
    var li = document.createElement('li');

    li.addEventListener("click", function(e) {
      setInputValue(e.target.dataset.notation);
      inputField.focus();
      parseInput();
    });
    li.classList.add('c-options-list__item');
    li.dataset.notation = commandNotation;
    li.dataset.name = commandTypeName;
    li.dataset.tags = commandTags;
    li.dataset.defaultOperator = commandDefaultOperator;
    li.innerHTML = commandTypeName;
    optionsUl.append(li);

    var span = document.createElement('span');
    span.classList.add('c-options-list__notation');
    span.innerHTML = commandNotation;
    li.prepend(span);
  }
})();

// for filtering the action list as long as there are no matching commands found
function filterActionlist() {
  var optionsItems = document.querySelectorAll(".c-options-list__item");
  var optionsArray = Array.from(optionsItems);
  optionsArray.filter(function(el) {
    var filter = inputFieldValue.toLowerCase();
    var filteredItems = el.dataset.notation + " " + el.dataset.name + " " + el.dataset.tags;
    // console.log(el.dataset.name + ":   " + filteredItems.toLowerCase().indexOf(filter));
    if (filteredItems.toLowerCase().indexOf(filter) == -1) {
      el.classList.add("is-hidden");
    } else {
      el.classList.remove("is-hidden");
    }

    var result = optionsArray.sort(function(a, b) {
      if (inputFieldValue === a.dataset.notation) {
        return a.dataset.notation - b.dataset.notation;
      }
      return a.dataset.notation - b.dataset.notation;
    });
    navigateThroughList('selectFirst');
  });
}

// for switching task contexts
function switchContextAction(value) {
  if (value == 'next')
    currentContext = currentContext + 1;
  else if (value == 'prev')
    currentContext = currentContext - 1;
  else
    currentContext = value;

  var length = contextTabs.length;
  var index = mod(currentContext, length);

  contextTabs.forEach(function(el) {
    el.classList.remove('is-active');
  })
  contextList.forEach(function(el) {
    el.classList.remove('is-active');
  })
  // triggers visibility of both active tab as the list below
  contextTabs[index].classList.toggle('is-active');
  contextList[index].classList.toggle('is-active');

  returnToSketch('saveContext', index);
}

// for navigating through the actionlist
var selectedAction = -1;

function navigateThroughList(value) {
  var listItems = document.querySelectorAll(".c-context-list.is-active .c-options-list__item:not(.is-hidden)");

  if (value == 'reset') {
    selectedAction = -1;
  } else if (value == 'selectFirst') { // used when filtering items
    selectedAction = 0;
  } else if (!value) {
    selectedAction++;
  } else {
    if (Number.isInteger(value))
      selectedAction = selectedAction += value;
  }

  var length = listItems.length + 1; // so that it's possible to have nothing selected
  var index = mod(selectedAction, length);
  cyclingThroughOptions = true;

  listItems.forEach(function(el) {
    el.classList.remove('is-active');
  })

  if (listItems[index] != undefined) {
    listItems[index].classList.toggle('is-active');
    // this useful sucker surprisingly works in safari/webview, but lets keep it disabled when debugging in FF
    if (!BROWSERDEBUG) listItems[index].scrollIntoViewIfNeeded(false);
  } else {
    cyclingThroughOptions = false;
  }
}

// lists the selected layers
const listSelectedLayers = function() {
  var selectedLayerList = document.querySelector('.c-selection-list');
  // received array from Sketch is actually a string, lets convert it into a real array again
  if (artboardLayerNameArray) {
    // if (artboardLayerNameArray && selectedLayerNameArray) {
    artboardLayerNameArray = artboardLayerNameArray.split(',');
    selectedLayerNameArray = selectedLayerNameArray.split(',');

    for (var i = 0; i < artboardLayerNameArray.length; i++) {
      // create the list
      var li = document.createElement('li');
      li.classList.add('c-options-list__item');
      li.innerHTML = artboardLayerNameArray[i];
      selectedLayerList.append(li);
    }
  }
};


// http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving/13163436#13163436
var mod = function(n, m) {
  var remain = n % m;
  return Math.floor(remain >= 0 ? remain : remain + m);
};
