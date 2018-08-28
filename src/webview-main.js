import pluginCall from 'sketch-module-web-view/client'

function returnToSketch( name, args ) {
  if ( DEBUG ) console.log( 'triggered returnToSketch():' + name + '       Arguments: ' + args );
  if ( DEBUG ) pluginCall( 'nativeLog', 'CALLED: ' + name );
  if ( DEBUG && args ) pluginCall( 'nativeLog', 'ARGUMENTS: '+ args );
  if ( BROWSERDEBUG ) return;
  
  // call function in Sketch
  pluginCall(name, args);
}

var btn = document.querySelector('#btn');
var inputField = document.querySelector('.c-commander');
var replace = document.querySelector('#replace');

var commandsUl = document.querySelector(".c-commands-list");

var inputFieldValue = document.querySelector('.c-commander').innerText;
var cyclingThroughOptions = false;

let undoHistory = [];
let prevInputLength = inputField.textContent.length;
let inputArray = [];


function setInputValue( value, append) {
  if ( append ) inputField.innerHTML = inputField.innerHTML + value;
  else inputField.innerHTML = value;
  setCaretPosToEnd();
  parseInput();
}
inputField.focus();

// Key event listeners
function getInputValue() {
  return document.querySelector(".c-commander").innerText.replace(/\n/g,'');
}

inputField.addEventListener('input', onInput);
inputField.addEventListener('keydown', onKeydown, false);

function onInput(e) {
  inputField.classList.remove('has-previous-user-input');
  inputFieldValue = this.innerText;
  
  undoHistory.unshift(inputFieldValue); // add to history array
  if ( undoHistory.length >= 50 ) undoHistory.pop(); // limit history length
  
  parseInput();
};

function onKeydown(e) {
  
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
    if ( !cyclingThroughOptions ) {
      returnToSketch('returnUserInput', getInputValue());
      returnToSketch('closeExecute', JSON.stringify(commands.get()));
    }
  }
};

function parseInput() {
  inputFieldValue = getInputValue();
  if ( !inputFieldValue ) listCommands.active = true;
  commands.clear();
  commands.parse( getInputValue() );
  renderInput();
}

function renderInput() {
  var caretPos = getCaretPos(inputField);
  
  const commandsLength = commands.get().length;
  
  let html = '';
  commands.get().forEach( function(item, index) {
    let inputLiteral = item.input.literal;
    let inputSplit = item.input.split;
    let type = item.type;
    let element = '';
    const notLastNotOnly = commandsLength > 0 && commandsLength - 1 !== index;

    // * ⚠️ BEWARE: don't try to format the elements below nicely, since it will be interpreted as text and mess up the caret positioning
    // by default just output the users' literal input
    let input = item.input.literal;
    // format the input differently when the default operator is applied
    if ( type && item.defaultOperator === true ) {
      input = `<span class="c-command__type" data-default-operator='${item.operator}'>${inputSplit[0]}</span>${inputSplit[1] ? inputSplit[1] : ''}`;
    }
    if ( inputLiteral ) {
      element = `<span class="c-command  ${item.isValid ? 'c-command--is-valid' : '' }"  ${item.isValid && item.operator === '#' ? `style="background-color: #${item.value}"` : '' }>${input}</span>`
    }
    
    html += element;
    // we append the , comma again when it's not the last and only command
    if ( notLastNotOnly ) html += '<span class=c-command__seperator>,</span>';
  })
  
  inputField.innerHTML = html.trim().replace(/\n/g,'');
  
  caret.position = caretPos;
}


// triggered whenever the user presses cmd + z
// (this is what you get when you don't rely on native inputs, but like it to behave like one...)
function handleUndo() {
  if ( undoHistory[1] ) {
    inputField.innerHTML = undoHistory[1];
    undoHistory.shift();
    parseInput();
    setCaretPosToEnd();
  };
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
