import pluginCall from 'sketch-module-web-view/client'
import {
  commands,
  commandList,
  DEBUG,
  DEVMODE,
  BROWSERDEBUG
} from './shared'


function returnToSketch(name, args) {
  console.log(args);
  console.log('triggered returnToSketch()');
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

var inputFieldValue = document.querySelector('.c-commander').value;
var cyclingThroughOptions = false;


function setInputValue(value) {
  inputField.value = value;
}
inputField.focus();

// Key event listeners
var keys = {
  shift: false,
  tab: false
};

inputField.addEventListener('input', function(e) {
  commands.clear();
  commands.parse();
  console.log(commands.get());
})

inputField.addEventListener('keydown', function(e) {
  // close on keydown enter or escape key
  if (e.keyCode === 27) {
    returnToSketch('closeModal');
  }
  if (e.keyCode === 13) {
    if (cyclingThroughOptions) {
      selectOption();
    } else {
      returnToSketch('returnUserInput', inputField.value);
      returnToSketch('closeExecute', commands.get());
    }
  }
  if (e.keyCode == 9) {
    e.preventDefault();
    if (!cyclingThroughOptions) {
      keys["tab"] = true;
      if (!keys["shift"]) {
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
  if (e.keyCode == 16) { //shift
    keys["shift"] = true;
  }
  if (keys["shift"] && keys["tab"]) {
    e.preventDefault();
    switchContextAction('prev');
  }
}, false);

inputField.addEventListener('keyup', function(e) {
  if (e.keyCode != 40 && e.keyCode != 38) { //don't parse input on pressing ↑ or ↓ arrow
    parseInput();
  }

  // reset status of the keypress
  if (e.keyCode == 9) {
    keys["tab"] = false;
  }
  if (e.keyCode == 16) { //shift
    keys["shift"] = false;
  }
});

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
  inputFieldValue = document.querySelector('.c-commander').value;
  const items = commands.get();
  // if (DEBUG) console.log(commands.get());
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



function listCommands() {
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
};
listCommands();

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

// sets the active context when opening the webview (only runs once)
var setActiveContextOnInit = (function() {
  // wait until there's an active context__item which is set in index.html. This can probably done with promises, but this ugly hack works...
  var waitTillActiveClassIsApplied = window.setInterval(function() {
    var elements = document.querySelectorAll('.c-context-tab__item');
    var isActive = document.querySelector('.c-context-tab__item.is-active');

    for (var i = 0; i < elements.length; i++) {
      if (elements[i].classList.contains("is-active")) {
        switchContextAction(i);
        if (DEBUG) console.log("currentContext = " + currentContext);
        clearInterval(waitTillActiveClassIsApplied);
      }
    }
  }, 1);
  setActiveContextOnInit = function() {}; // overwrite self-invoked function so that it can only run once
})();

// lists the selected layers
var listSelectedLayers = (function() {
  var selectedLayerList = document.querySelector('.c-selection-list');
  // wait until there's input received from Sketch in index.html. This can probably done with promises, but this ugly hack works...
  var waitTillSketchInputIsReceived = window.setInterval(function() {
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
      clearInterval(waitTillSketchInputIsReceived);
    }
  }, 10);
  listSelectedLayers = function() {}; // overwrite self-invoked function so that it can only run once
})();


// http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving/13163436#13163436
var mod = function(n, m) {
  var remain = n % m;
  return Math.floor(remain >= 0 ? remain : remain + m);
};
