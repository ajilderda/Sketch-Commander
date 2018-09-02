import selection from './commander'
import { commandList, DEBUG, DEVMODE, BROWSERDEBUG } from './shared';

//////////////////////////////////////////////////////////////////
//  SELECT ACTIONS                                              //
//////////////////////////////////////////////////////////////////

var Page =  require('sketch/dom').Page;
var Shape = require('sketch/dom').Shape;
var Group = require('sketch/dom').Group;
var Text = require('sketch/dom').Text;
var Artboard = require('sketch/dom').Artboard;
var SymbolInstance = require('sketch/dom').SymbolInstance;

var document = require('sketch/dom').getSelectedDocument();
const currentPage =  document.selectedPage;

// selection argument is only required for determining current artboard
// scope is either 'document', 'page' or 'artboard'
export function searchLayers( name, scope, selection ) {
  if ( scope === 'page' ) {  
    return loopThroughChildLayers( currentPage, name )
  }
  else if ( scope === 'artboard' ) {
    const searchScope = parentArtboardsFromSelection( selection );
    return loopThroughChildLayers( searchScope, name )
  }
  else if ( scope === 'document' ) {
    return document.getLayersNamed( name );
  }
  else {
    if (DEBUG) console.log('Invalid scope passed to searchLayers');
  }
}

// loop through child layers and optionally filter by layer name
export function loopThroughChildLayers( layerGroup, filter ) {
  let match = [];
  
  function recursiveFn( layerGroup, filter ) {
    layerGroup.layers.forEach( layer => {
      if ( filter && layer.name === filter ) match.push( layer )
      else if ( !filter ) match.push( layer ) // add all layers when no filter is given
      
      // does the layerGroup contain child layers? If so, perform a (recursive) loop
      if ( layer.layers ) recursiveFn( layer, filter );
    })
  }
  // if layerGroup that's passed is an array (f.e. 2 artboards), loop through all of them
  if ( Array.isArray( layerGroup )) layerGroup.forEach( item => recursiveFn( item, filter ) );
  else recursiveFn( layerGroup, filter );
  
  return match;
}


export function selectLayers( name, scope, selection ) {
  // currentPage.changeSelectionBySelectingLayers( searchLayers( name, scope, selection ) )
}

// hacky method to use the parentArtboard()-method that is not present in the Javascript API yet
// After the method is called we turn it into a wrapped object again.
// Difference is we can use the Javascript API again: 
// 'selection.frame.height = 10' in stead of 'selection.frame().setHeight(10);'
// More info: https://developer.sketchapp.com/reference/api/#sketch-components
export function parentArtboardsFromSelection( selection ) {
  let parentArtboards = [];
  
  selection.forEach( layer => {
    const parentArtboard = layer.sketchObject.parentArtboard();
    
    // check if this artboard was already added
    if ( !parentArtboards.includes( parentArtboard ) ) {
      parentArtboards.push( Artboard.fromNative( parentArtboard ) );
    }
  })
  return parentArtboards;
}

// function createNativeLayers( selection ) {
//   let nativeLayers = selection.map( item => {
//     switch ( item.type ) {
//       case 'Group':
//         return Group.fromNative( item );
//       case 'Shape':
//         return Shape.fromNative( item );
//       case 'Text':
//         return Text.fromNative( item );
//       case 'SymbolInstance':
//         return SymbolInstance.fromNative( item );
//       case 'SymbolInstance':
//         return Artboard.fromNative( item );
//     }
//   });
//   return nativeLayers;
// }
// 
// function createSketchObject( selection ) {
//   let sketchObjects = selection.map( item => {
//     return item.sketchObject;
//   });
//   return nativeLayers;
// }
