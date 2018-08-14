// Array containing all instances created with List
let listInstances = [];

class List {
  constructor() {
    this.data;
    this.filteredData;
    this._active = false;
    listInstances.push(this);
  }
  set active( state ) {
    if ( this._active !== state ) {
      this.changeState( state )
      console.log('state changed');
    };
    this._active = state;
  }
  get active() {
    return this._active;
  }
  
  changeState( active ) {
    const activeClass = 'is-active'
    if ( active === true ) this.element.classList.add( activeClass )
    else this.element.classList.remove( activeClass )
  }
  
  filterList( wordToMatch, filterBy ) {
    // see if filter value was provided.
    if ( !wordToMatch ) return this.data;
    // property to filter by, (name) by default
    const prop = filterBy || 'name';
    
    // filter and sort results
    return this.data.filter( item => {
      const regex = new RegExp( wordToMatch, 'gi' );
      
      // add the ability to pass an array of 2 props to match by
      if ( trueTypeOf(prop) === 'array' && prop.length === 2 ) {
        return item[prop[0]].match(regex) || item[prop[1]].match(regex)
      }
      return item[prop].match(regex);
    }).sort( function( a, b ) {
      // TODO: exact match = highest score
      // if (inputFieldValue === a[prop]) {
      //   return a[prop] - b[prop];
      // }
      
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })
    
  }
  
  render( wordToMatch ) {
    let data;
    if ( wordToMatch ) data = listCommands.filterList( wordToMatch, [ 'name', 'notation' ] );
    else data = this.data;
    
    // render markup into element
    this.element.innerHTML = `${this.template( data )}`;
    
    // setup event listeners
    const items = Array.from( this.element.querySelectorAll('[data-item]') );
    items.forEach( item => item.addEventListener('click', function(e) {
      console.log('clicked item in list');
    }))
  }
  
  // only continue when ↑ & ↓ keys are pressed 
  onKeydown( e ) {
    if ( !this.active ) return false;
    // only continue when ↑ & ↓ keys are pressed
    if ( e.keyCode !== 40 && e.keyCode !== 38 ) return false;
    e.preventDefault();
    
    let increment = -1; // have nothing selected by default
    const listItems = this.element.querySelectorAll( '[data-item]' );
    const length = listItems.length + 1; // so that it's possible to have nothing selected
    
    // check if there already is an element selected, so that we can use its index;
    listItems.forEach( ( el, elIndex ) => {
      if ( el.classList.contains('is-active') === true ) increment = elIndex;
    });
    increment = e.keyCode === 40 ? increment += 1 : increment = increment - 1;
    
    const index = mod( increment, length );
    cyclingThroughOptions = true;

    listItems.forEach( el => el.classList.remove( 'is-active' ) );

    if ( listItems[index] != undefined ) {
      listItems[index].classList.toggle('is-active');
      // this useful sucker surprisingly works in safari/webview. Keep it disabled when debugging in FF
      if ( !BROWSERDEBUG ) listItems[index].scrollIntoViewIfNeeded( false );
    } 
    else cyclingThroughOptions = false;
  }
}

document.addEventListener('keydown', navigateList);
function navigateList(e) {
  listCommands.onKeydown( e );
}


function handleListsState() {
  const node = getCaretNode().node;
  let parent;
  if ( node ) parent = node.parentNode;
  
  // is caret at '>|'? Then open layer select list
  if ( parent && parent.classList.contains( 'c-command' ) && !parent.childElementCount && node.nodeValue[0] === '>') {
    if (DEBUG) console.log('Command started with >, request page layers from Sketch');
    
    listCommands.active = true;
    
    // request pagelayers from Sketch, unless browser debug mode is active
    if ( !BROWSERDEBUG ) returnToSketch('requestPageLayers');
    else setPageLayers();
  } else {
    listCommands.active = false;
  }
}

//////////////////////////////////////////////////////////////////
//  LIST: Commands                                              //
//////////////////////////////////////////////////////////////////

const listCommands = new List();
listCommands.data = commandList;
listCommands.element = document.querySelector('[data-list="commands"]');
listCommands.template = function( data ) {
  return `
    <ul class="c-list">
      ${data.map(item => `
        <li class="c-list__item" data-item>
          <span class="c-list__notation">${item.notation}</span>
          ${item.name}
        </li>
      `).join('')}
    </ul>
  `
};
listCommands.render();


//////////////////////////////////////////////////////////////////
//  LIST: layers                                                //
//////////////////////////////////////////////////////////////////

function createLayerList() {  
  const listLayers = new List();
  listLayers.data = window.pageLayers;
  listLayers.element = document.querySelector('[data-list="layers"]');
  listLayers.template = function( data ) {
    return `
      <ul class="c-list">
        ${data.map(item => `
          <li class="c-list__item" data-item>
            <span class="c-list__notation">${item.type}</span>
            ${item.name}
          </li>
        `).join('')}
      </ul>
    `
  };
  listLayers.render();
}
