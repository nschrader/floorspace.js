var os_data;

var renderer, scene, light, scene_objects, scene_edges, object_edges, coincident_objects, back_objects;
var perspectiveCamera, orthographicCamera, perspectiveControls, orthographicControls;
var project, materials, variable;
var dataFolder, dateTimeControl;
var colorBar, colorBarContainer, colorBarHeight, colorBarWidth;
var mouseDownX, mouseDownY;
var dragXStart, dragYStart;

var raycaster;
var mouse;
var headsUp;
var intersected, selected_material, selected_material_back;

var getStringFromLocalStorage = function (key, defaultValue) {
  try {
    value = localStorage.getItem(key);
    if (value == null){
      return defaultValue;
    }else{
      return value;
    }
  } catch(e) {
    return defaultValue;
  }
}

var getBoolFromLocalStorage = function (key, defaultValue) {
  try {
    value = localStorage.getItem(key);
    if (value == null){
      return defaultValue;
    }else{
      return (value == 'true');
    }
  } catch(e) {
    return defaultValue;
  }
}

var getFloatFromLocalStorage = function (key, defaultValue) {
  try {
    value = localStorage.getItem(key);
    if (value == null){
      return defaultValue;
    }else{
      return parseFloat(value);
    }
  } catch(e) {
    return defaultValue;
  }
}

var setLocalStorage = function (key, value) {
  try {
    localStorage.setItem(key, value);
  } catch(e) {
  }
}

var settings = {
  renderBy: 'Surface Type',
  showStory: 'All Stories',
  showFloors: getBoolFromLocalStorage('showFloors', true),
  showWalls: getBoolFromLocalStorage('showWalls', true),
  showRoofCeilings: getBoolFromLocalStorage('showRoofCeilings', true),
  showWindows: getBoolFromLocalStorage('showWindows', true),
  showDoors: getBoolFromLocalStorage('showDoors', true),
  showShading: getBoolFromLocalStorage('showShading', true),
  showPartitions: getBoolFromLocalStorage('showPartitions', true),
  showWireframe: getBoolFromLocalStorage('showWireframe', true),
  xView: function() {setAllCameraAngles(0, 0, 1);},
  yView: function() {setAllCameraAngles(-90, 0, 1);},
  zView: function() {setAllCameraAngles(0, 90, 1);},
  reset: function() {setAllCameraAngles(-30, 30, 1);},
  orthographic: getBoolFromLocalStorage('showWireframe', false),
  xSection: 0,
  ySection: 0,
  zSection: 0,
  variableName: '',
  colorScheme: getStringFromLocalStorage('colorScheme', 'diverging'),
  daySlider: 0,
  hourSlider: 1,
  cycleHour: false,
  cycleSpeed: getFloatFromLocalStorage('cycleSpeed', 1.0),
  rotateColorBar: getBoolFromLocalStorage('rotateColorBar', false),
  dateTime: ''
};

var getColor = function (x, min, max, palette) {

  if (x == null){
    return new THREE.Color(255, 255, 255);
  }

  x = Math.min(Math.max(x, min), max);
  var percent = (x-min)/(max-min);
  var r = 1 - percent;
  var b = 1 - percent;
  var g = 1 - percent;

  switch (palette) {
    case 'sequential':
      r = 1 - 0.392 * (1 + erf((percent - 0.869) / 0.255));
      g = 1.021 - 0.456 * (1 + erf((percent - 0.527) / 0.376));
      b = 1 - 0.493 * (1 + erf((percent - 0.272)/0.309));
      break;
    case 'diverging':
      r = 0.237 - 2.13 * percent + 26.92 * Math.pow(percent, 2) - 65.5 * Math.pow(percent, 3) + 63.5 * Math.pow(percent, 4) - 22.36 * Math.pow(percent, 5);
      g = Math.pow((0.572 + 1.524 * percent - 1.811 * Math.pow(percent, 2)) / (1 - 0.291 * percent + 0.1574 * Math.pow(percent, 2)), 2);
      b = 1 / (1.579 - 4.03 * percent + 12.92 * Math.pow(percent, 2) - 31.4 * Math.pow(percent, 3) + 48.6 * Math.pow(percent, 4) - 23.36 * Math.pow(percent, 5));
      break;
    case 'rainbow':
      r = (0.472 - 0.567 * percent + 4.05 * Math.pow(percent, 2)) / (1 + 8.72 * percent - 19.17 * Math.pow(percent, 2) + 14.1 * Math.pow(percent, 3));
      g = 0.108932 - 1.22635 * percent + 27.284 * Math.pow(percent, 2) - 98.577 * Math.pow(percent, 3) + 163.3 * Math.pow(percent, 4) - 131.395 * Math.pow(percent, 5) + 40.634 * Math.pow(percent, 6);
      b = 1 / (1.97 + 3.54 * percent - 68.5 * Math.pow(percent, 2) + 243 * Math.pow(percent, 3) - 297 * Math.pow(percent, 4) + 125 * Math.pow(percent, 5));
      break;
  }
  return new THREE.Color(r, g, b);
};
function fitInWindow() {
  var container = document.getElementById('color-bar-container');
  var style = container.style;
  if (!settings.rotateColorBar) {
    var height = colorBarHeight + 112;
    var width = colorBarWidth + 42;
    var top = parseInt(style.top);
    var left = parseInt(style.left);
    if (left < 0) {
      style.left = 0;
    } else if (window.innerWidth < (left + width)) {
      style.left = (window.innerWidth - width) + 'px';
    }
    if (top < 0) {
      style.top = 0;
    } else if (window.innerHeight < (top + height)) {
      style.top = (window.innerHeight - height) + 'px';
    }
  } else {
    var half = (colorBarWidth + 42) / 2;
    var height = colorBarWidth + 42;
    var width = colorBarHeight + 112;
    var top = parseInt(style.top) - half;
    var left = parseInt(style.left) + half;
    if (left < 0) {
      style.left = -half + 'px';
    } else if (window.innerWidth < (left + width)) {
      style.left = (window.innerWidth - width - half) + 'px';
    }
    if (top < 0) {
      style.top = half + 'px';
    } else if (window.innerHeight < (top + height)) {
      style.top = (window.innerHeight - height + half) + 'px';
    }
  }
}
function updateColorBarSelection(value) {
  var line = document.getElementById('color-bar-selection-line');
  var text = document.getElementById('color-bar-selection-text');
  if (value != '') {
    var percent = (value - variable.valueMin) / (variable.valueMax - variable.valueMin);
    line.style.left = (20 + colorBarWidth * percent) + 'px';
    text.style.left = (10 + colorBarWidth * percent) + 'px';
    text.innerHTML = Math.round(value * 100) / 100;
  } else {
    line.style.display = 'none';
    text.style.display = 'none';
  }
}
function updateBalloon(object) {
  var span = document.getElementById('balloon-variable-name');
  if (span) span.innerHTML = object.userData.variableName;

  span = document.getElementById('balloon-variable-key-name');
  if (span) span.innerHTML = object.userData.variableKeyName;

  span = document.getElementById('balloon-variable-date');
  if (span) span.innerHTML = object.userData.variableDate;

  span = document.getElementById('balloon-variable-time');
  if (span) span.innerHTML = object.userData.variableTime;

  span = document.getElementById('balloon-variable-value');
  if (span) span.innerHTML = object.userData.variableValue;
}

function removeSelection() {
  selectObject(null);
  headsUp.style.display = 'none';
  document.body.style.cursor = 'auto';
  document.getElementById('color-bar-selection-line').style.display = 'none';
  document.getElementById('color-bar-selection-text').style.display = 'none';
}
function allowDrop(ev) {
  ev.preventDefault();
}
function drag(ev) {
  dragXStart = ev.x;
  dragYStart = ev.y;
}
function drop(ev) {
  ev.preventDefault();
  var container = document.getElementById('color-bar-container')
  container.classList.add('ignore-transition');
  var style = container.style;
  var top = parseInt(style.top) + (ev.y - dragYStart);
  var left = parseInt(style.left) + (ev.x - dragXStart);
  style.top = top + 'px';
  style.left = left + 'px';
  setTimeout(function() {container.classList.remove('ignore-transition');}, 1);
  fitInWindow();
  setLocalStorage('colorBarTop', parseInt(style.top));
  setLocalStorage('colorBarLeft', parseInt(style.left));
}

function parseMaterials(json) {
  var materials = {};
  var loader = new THREE.MaterialLoader();
  for ( var i = 0, l = json.length; i < l; i ++ ) {
    var data = json[ i ];
    var material = loader.parse( data );
    material.uuid = data.uuid;
    material.name = data.name;
    materials[ data.name ] = material;
  }
  return materials;
}

function cameraLookAt() {
  return new THREE.Vector3(os_data.metadata.boundingBox.lookAtX, os_data.metadata.boundingBox.lookAtZ, -os_data.metadata.boundingBox.lookAtY);
}

function cameraRadius() {
  return 4 * os_data.metadata.boundingBox.lookAtR;
}

function setAllCameraAngles(theta, phi, tweenTime) {
  perspectiveTweenTime = tweenTime;
  orthographicTweenTime = tweenTime;
  if (settings.orthographic){
    perspectiveTweenTime = 0;
  }else{
    orthographicTweenTime = 0;
  }
  setCameraAngles(perspectiveCamera, perspectiveControls, theta, phi, perspectiveTweenTime);
  setCameraAngles(orthographicCamera, orthographicControls, theta, phi, orthographicTweenTime);
}

// theta is rotation about OpenStudio Z in degrees, phi is rotation above ground plane in degrees
function setCameraAngles(camera, controls, theta, phi, tweenTime) {
  var aim = cameraLookAt();

  var startRadius = Math.sqrt(Math.pow(camera.position.x - aim.x, 2) + Math.pow(camera.position.y - aim.y, 2) + Math.pow(camera.position.z - aim.z, 2));
  var endRadius = cameraRadius();
  var endX = endRadius * Math.cos(theta * Math.PI / 180.0) * Math.cos(phi * Math.PI / 180.0) + aim.x; // X in OpenStudio coordinates
  var endY = endRadius * Math.sin(phi * Math.PI / 180.0) + aim.y; // Z in OpenStudio coordinates
  var endZ = -endRadius * Math.sin(theta * Math.PI / 180.0) * Math.cos(phi * Math.PI / 180.0) + aim.z; // Y in OpenStudio coordinates

  var endUpX = 0;
  var endUpY = 1;
  var endUpZ = 0;
  if (phi == 90){
    endUpX = 0;
    endUpY = 1;
    endUpZ = -0.01;
  }

  var target = {
    progress: 0,
    start: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      r: startRadius,
      theta: Math.acos(camera.position.z / startRadius),
      phi: Math.atan2(camera.position.y, camera.position.x),
      upX: camera.up.x,
      upY: camera.up.y,
      upZ: camera.up.z,
      lookAtX: controls.target.x,
      lookAtY: controls.target.y,
      lookAtZ: controls.target.z,
      targetX: controls.target.x,
      targetY: controls.target.y,
      targetZ: controls.target.z,
      zoom: camera.zoom
    },
    end: {
      x: endX,
      y: endY,
      z: endZ,
      r: endRadius,
      theta: Math.acos(endZ / endRadius),
      phi: Math.atan2(endY, endX),
      upX: endUpX,
      upY: endUpY,
      upZ: endUpZ,
      lookAtX: aim.x,
      lookAtY: aim.y,
      lookAtZ: aim.z,
      targetX: aim.x,
      targetY: aim.y,
      targetZ: aim.z,
      zoom: 1
    }
  };

  TweenLite.to(target, tweenTime, {
    progress: 1,
    ease: Power3.easeInOut,
    onUpdate: function (tween) {
      var r = tween.target.start.r + tween.target.progress * (tween.target.end.r - tween.target.start.r);
      var theta = tween.target.start.theta + tween.target.progress * (tween.target.end.theta - tween.target.start.theta);
      var phi = tween.target.start.phi + tween.target.progress * (tween.target.end.phi - tween.target.start.phi);
      var zoom = tween.target.start.zoom + tween.target.progress * (tween.target.end.zoom - tween.target.start.zoom);
      var x = r * Math.sin(theta) * Math.cos(phi);
      var y = r * Math.sin(theta) * Math.sin(phi);
      var z = r * Math.cos(theta);
      var upX = tween.target.start.upX + tween.target.progress * (tween.target.end.upX - tween.target.start.upX);
      var upY = tween.target.start.upY + tween.target.progress * (tween.target.end.upY - tween.target.start.upY);
      var upZ = tween.target.start.upZ + tween.target.progress * (tween.target.end.upZ - tween.target.start.upZ);
      var lookAtX = tween.target.start.lookAtX + tween.target.progress * (tween.target.end.lookAtX - tween.target.start.lookAtX);
      var lookAtY = tween.target.start.lookAtY + tween.target.progress * (tween.target.end.lookAtY - tween.target.start.lookAtY);
      var lookAtZ = tween.target.start.lookAtZ + tween.target.progress * (tween.target.end.lookAtZ - tween.target.start.lookAtZ);
      var targetX = tween.target.start.targetX + tween.target.progress * (tween.target.end.targetX - tween.target.start.targetX);
      var targetY = tween.target.start.targetY + tween.target.progress * (tween.target.end.targetY - tween.target.start.targetY);
      var targetZ = tween.target.start.targetZ + tween.target.progress * (tween.target.end.targetZ - tween.target.start.targetZ);

      camera.position.set(x, y, z);
      camera.zoom = zoom;
      camera.up.set(upX, upY, upZ);
      camera.lookAt(new THREE.Vector3(lookAtX, lookAtY, lookAtZ));
      camera.updateProjectionMatrix();

      controls.target = new THREE.Vector3(targetX, targetY, targetZ);
    },
    onUpdateParams: ["{self}"],
    onComplete: function () {
      camera.position.set(endX, endY, endZ);
      camera.zoom = 1;
      camera.up.set(endUpX, endUpY, endUpZ);
      camera.lookAt(aim);
      camera.updateProjectionMatrix();

      controls.target = aim;
    }
  });
}

function init(os_data_in) {

  // set global variable
  os_data = os_data_in;

  var css = document.head.appendChild(document.createElement('style'));
  css.innerHTML = 'body { font:600 12pt monospace; margin:0; overflow:hidden; }';

  // Heads Up
  headsUp = document.body.appendChild(document.createElement('div'));
  headsUp.setAttribute('id', 'heads-up');

  // Color Bar
  colorBarHeight = 40;
  colorBarWidth = 256;
  colorBar = document.createElement('canvas');
  colorBar.setAttribute('id', 'color-bar');
  colorBar.setAttribute('height', colorBarHeight);
  colorBar.setAttribute('width', colorBarWidth);

  document.documentElement.setAttribute('ondrop', 'drop(event)');
  document.documentElement.setAttribute('ondragover', 'allowDrop(event)');

  var top = getFloatFromLocalStorage('colorBarTop', 0);
  var left = getFloatFromLocalStorage('colorBarLeft', 0);
  colorBarContainer = document.body.appendChild(document.createElement('div'));
  colorBarContainer.setAttribute('id', 'color-bar-container');
  colorBarContainer.setAttribute('draggable', 'true');
  colorBarContainer.setAttribute('ondragstart', 'drag(event)');
  colorBarContainer.style.height = (colorBarHeight + 112) + 'px';
  colorBarContainer.style.width = (colorBarWidth + 42) + 'px';
  colorBarContainer.style.top = top + 'px';
  colorBarContainer.style.left = left + 'px';
  if (settings.rotateColorBar) colorBarContainer.classList.add('rotate');
  colorBarContainer.appendChild(colorBar);

  var bar = document.createElement('div');
  bar.classList.add('color-bar-tick');
  bar.style.bottom = (colorBarHeight + 21) + 'px';
  bar.style.left = 20 + 'px';
  colorBarContainer.appendChild(bar);
  bar = bar.cloneNode();
  bar.style.left = 20 + colorBarWidth + 'px';
  colorBarContainer.appendChild(bar);
  bar = bar.cloneNode();
  bar.setAttribute('id', 'color-bar-selection-line');
  bar.style.display = 'none';
  bar.style.bottom = '20px';
  bar.style.height = '56px';
  colorBarContainer.appendChild(bar);

  var text = document.createElement('span');
  text.classList.add('color-bar-text');
  text.setAttribute('id', 'color-bar-min');
  text.style.bottom = (colorBarHeight + 30) + 'px';
  text.style.left = 10 + 'px';
  colorBarContainer.appendChild(text);
  text = text.cloneNode();
  text.setAttribute('id', 'color-bar-max');
  text.style.left = 10 + colorBarWidth + 'px';
  colorBarContainer.appendChild(text);
  text = text.cloneNode();
  text.setAttribute('id', 'color-bar-selection-text');
  colorBarContainer.appendChild(text);

  renderer = new THREE.WebGLRenderer({
    alpha: 1,
    antialias: true,
    clearColor: 0xffffff
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  window.scene = scene;

  aspect = window.innerWidth / window.innerHeight;
  orthographicCamera = new THREE.OrthographicCamera( 4*aspect*os_data.metadata.boundingBox.lookAtR / - 2, 4*aspect*os_data.metadata.boundingBox.lookAtR / 2, 4*os_data.metadata.boundingBox.lookAtR / 2, 4*os_data.metadata.boundingBox.lookAtR / - 2, 1, 5000 );
  scene.add(orthographicCamera); // for light to follow
  orthographicCamera.up.set(0,1,0);
  orthographicCamera.lookAt(cameraLookAt());

  perspectiveCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
  scene.add(perspectiveCamera); // for light to follow
  perspectiveCamera.up.set(0,1,0);
  perspectiveCamera.lookAt(cameraLookAt());

  // Controls
  orthographicControls = new THREE.OrbitControls(orthographicCamera, renderer.domElement);
  orthographicControls.minDistance = 10;
  orthographicControls.maxDistance = 1000;
  orthographicControls.enabled = true;

  perspectiveControls = new THREE.OrbitControls(perspectiveCamera, renderer.domElement);
  perspectiveControls.minDistance = 10;
  perspectiveControls.maxDistance = 1000;
  perspectiveControls.enabled = true;

  // initialize camera and controls
  setAllCameraAngles(-30, 30, 0);

  // Lights
  light = new THREE.AmbientLight(0xbbbbbb);
  scene.add(light);

  // Axes, adapted from AxisHelper.js
  var axisSize = cameraRadius();

  var xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  var xAxisGeometry = new THREE.Geometry();
  xAxisGeometry.vertices.push( new THREE.Vector3(0,0,0), new THREE.Vector3(axisSize,0,0));
  scene.add( new THREE.Line( xAxisGeometry, xAxisMaterial ) );

  var yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  var yAxisGeometry = new THREE.Geometry();
  yAxisGeometry.vertices.push( new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-axisSize));
  scene.add( new THREE.Line( yAxisGeometry, yAxisMaterial ) );

  var zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
  var zAxisGeometry = new THREE.Geometry();
  zAxisGeometry.vertices.push( new THREE.Vector3(0,0,0), new THREE.Vector3(0,axisSize,0));
  scene.add( new THREE.Line( zAxisGeometry, zAxisMaterial ) );

  // scene
  project = new THREE.Object3D();
  scene.add(project);

  var loader = new THREE.ObjectLoader();
  data = loader.parse(os_data);
  project.add(data);

  // scene_objects is an array of THREE.Mesh where each mesh is a real OpenStudio object
  scene_objects = project.children[0].children;

  // temp is a map of OpenStudio handle to scene object
  var temp = {};
  scene_objects.forEach(function(object) {
    temp[object.userData.handle] = object;
  });

  // coincident_objects store references between adjacent objects that are truly coincident, meaning that their vertices are completely the same
  // when an object's coincident object is visible we do not want to show the back object
  coincident_objects = {};
  scene_objects.forEach(function(object) {
    if (object.userData.coincidentWithOutsideObject){
      coincident_objects[object.uuid] = temp[object.userData.outsideBoundaryConditionObjectHandle];
    }
  });

  // back_objects are copies of scene_objects that exist only so we can color their back sides
  scene_edges = [];
  back_objects = {};
  object_edges = {};
  scene_objects.forEach(function(object) {
    edges = new THREE.EdgesHelper( object, 0x000000 );
    scene.add(edges);
    edge = scene.children[scene.children.length-1];
    scene_edges.push(edge);
    object_edges[object.uuid] = edge;

    back_object = object.clone();
    back_object.visible = false;
    back_object.name = back_object.name + ' Back';
    scene.add(back_object);
    back_object = scene.children[scene.children.length-1];
    back_object.geometry = object.geometry.clone();
    back_objects[object.uuid] = back_object;
  });

  // show look at point
  //var sg = new THREE.SphereGeometry( 1, 32, 32 );
  //var sm = new THREE.MeshBasicMaterial( {color: 0xff0000} );
  //var s = new THREE.Mesh( sg, sm );
  //scene.add( s );
  //s.position.set(cameraLookAt().x, cameraLookAt().y, cameraLookAt().z);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  selected_material = new THREE.MeshPhongMaterial({
    name: 'Selected',
    color: 0xffff00,
    ambient: 0xffff00,
    specular: 0xffff00,
    emissive: 0xffff00,
    shininess: 50,
    side: THREE.DoubleSide
  });
  materials = parseMaterials(os_data.materials);

  renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
  renderer.domElement.addEventListener('click', onDocumentMouseClick, false);
}

function setSelectedMaterial(object) {
  //console.log("Selecting " + object.name);

  object.wasVisible = object.visible;
  object.lastMaterial = object.material;
  object.visible = true;
  object.material = selected_material;
  object.material.needsUpdate = true;
}

function removeMaterial(object) {
  //console.log("Removing material from " + object.name);

  object.wasVisible = object.visible;
  object.lastMaterial = object.material;
  object.visible = false;
  object.material = null;
}

function restoreLastMaterial(object) {
  //console.log("Restoring last material to " + object.name);

  object.visible = object.wasVisible;
  object.material = object.lastMaterial;
  if (object.material){
    object.material.needsUpdate = true;
  }
  object.lastMaterial = null;
}

function selectObject(object) {
  renderBy = settings.renderBy;
  isData = (renderBy == 'Data');

  if (intersected != object){

    // restore material on currently selected
    if (intersected){
      edges = object_edges[intersected.uuid];
      if (edges){
        edges.material.color.setRGB(0,0,0);
        edges.material.linewidth = 1;
        edges.material.needsUpdate = true;
      }
    }
    if (!isData && intersected) {
      restoreLastMaterial(intersected);

      coincident_intersected = coincident_objects[intersected.uuid];
      if (coincident_intersected) {
        restoreLastMaterial(coincident_intersected);
      }

      back_intersected = back_objects[intersected.uuid];
      if (back_intersected) {
        restoreLastMaterial(back_intersected);
      }
    }

    // set the new intersected objects
    intersected = object;

    // save last material and set new one
    if (intersected){
      edges = object_edges[intersected.uuid];
      if (edges){
        edges.material.color.setRGB(0,255,0);
        edges.material.linewidth = 4;
        edges.material.needsUpdate = true;
      }
    }
    if (!isData && intersected) {
      setSelectedMaterial(intersected);

      coincident_intersected = coincident_objects[intersected.uuid];
      if (coincident_intersected) {
        removeMaterial(coincident_intersected);
      }

      back_intersected = back_objects[intersected.uuid];
      if (back_intersected) {
        removeMaterial(back_intersected);
      }
    }
    if (isData && intersected) {
      update();
    }
  }
}

function onDocumentMouseDown(event) {
  mouseDownX = event.clientX;
  mouseDownY = event.clientY;
}
function onDocumentMouseClick(event) {
  // Only act on the mouse click if it was an actual click, not a drag to orbit the camera
  if (mouseDownX == event.clientX && mouseDownY == event.clientY) {
    mouse.x = (event.clientX / renderer.domElement.width) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.height) * 2 + 1;

    if (settings.orthographic){
      raycaster.setFromCamera(mouse, orthographicCamera);
    }else{
      raycaster.setFromCamera(mouse, perspectiveCamera);
    }

    // raycaster intersects invisible objects so filter first
    var pickable = scene_objects.filter(function(x){return x.visible;});
    intersects = raycaster.intersectObjects(pickable);
    if (intersects.length) {

      selectObject(intersects[0].object);

      headsUp.style.left = 10 + 0.5 * window.innerWidth + mouse.x * 0.5 * window.innerWidth + 'px';
      headsUp.style.top = -10 + 0.5 * window.innerHeight - mouse.y * 0.5 * window.innerHeight + 'px';
      headsUp.style.display = 'block';
      document.getElementById('color-bar-selection-line').style.display = 'block';
      document.getElementById('color-bar-selection-text').style.display = 'inline-block';

      var txt = 'Name: ' + intersected.userData.name + '<br>';
      switch (settings.renderBy) {
        case "Surface Type":
          txt += 'Surface Type: ' + intersected.userData.surfaceType + '<br>';
          if (intersected.userData.spaceName){
            txt += 'Space Name: ' + intersected.userData.spaceName;
          }
          break;
        case "Normal":
          txt += 'Surface Type: ' + intersected.userData.surfaceType + '<br>'
          if (intersected.userData.spaceName){
            txt += 'Space Name: ' + intersected.userData.spaceName;
          }
          break;
        case "Boundary":
          if (intersected.userData.outsideBoundaryCondition){
            txt += 'Outside Boundary Condition: ' + intersected.userData.outsideBoundaryCondition + '<br>';
          }
          txt += 'Sun Exposure: ' + intersected.userData.sunExposure + '<br>';
          txt += 'Wind Exposure: ' + intersected.userData.windExposure;
          break;
        case "Construction":
          if (intersected.userData.constructionName){
            txt += 'Construction Name: ' + intersected.userData.constructionName;
          }
          break;
        case "Thermal Zone":
          if (intersected.userData.thermalZoneName){
            txt += 'Thermal Zone: ' + intersected.userData.thermalZoneName;
          }
          break;
        case "Space Type":
          if (intersected.userData.spaceTypeName){
            txt += 'Space Type: ' + intersected.userData.spaceTypeName;
          }
          break;
        case "Building Story":
          if (intersected.userData.buildingStoryName){
            txt += 'Story Name: ' + intersected.userData.buildingStoryName;
          }
          break;
        case "Data":
          // in javascript (0 == '' == false)
          if (intersected.userData.variableValue !== '') {
            txt += 'Variable: <span id="balloon-variable-name">' + intersected.userData.variableName + '</span><br>';
            txt += 'Key: <span id="balloon-variable-key-name">' + intersected.userData.variableKeyName + '</span><br>';
            txt += 'Date: <span id="balloon-variable-date">' + intersected.userData.variableDate + '</span><br>';
            txt += 'Time: <span id="balloon-variable-time">' + intersected.userData.variableTime + '</span><br>';
            txt += 'Value: <span id="balloon-variable-value">' + intersected.userData.variableValue + '</span> ' + intersected.userData.variableUnits;
          }
          updateColorBarSelection(intersected.userData.variableValue);
          break;
      }

      headsUp.innerHTML = txt;
      document.body.style.cursor = 'pointer';
    } else {
      removeSelection();
    }
  }
}

function animate(timestamp) {
  requestAnimationFrame(animate);
  orthographicControls.update();
  perspectiveControls.update();
  if (settings.orthographic){
    renderer.render(scene, orthographicCamera);
  }else{
    renderer.render(scene, perspectiveCamera);
  }
}

function erf(x) {
  // constants
  var a1 =  0.254829592;
  var a2 = -0.284496736;
  var a3 =  1.421413741;
  var a4 = -1.453152027;
  var a5 =  1.061405429;
  var p  =  0.3275911;

  // Save the sign of x
  var sign = 1;
  if (x < 0) {
    sign = -1;
  }
  x = Math.abs(x);

  // A&S formula 7.1.26
  var t = 1.0/(1.0 + p*x);
  var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);

  return sign*y;
}

var updateColorBar = function() {
  var ctx = colorBar.getContext('2d');
  var colorBarData = ctx.createImageData(colorBarWidth, colorBarHeight);
  var colorBarRow = [];
  for (var i = 0; i < colorBarWidth; i++) {
    var pixel = getColor(i, 0, colorBarWidth - 1, settings.colorScheme);
    colorBarRow[i*4]   = pixel.r * 255;
    colorBarRow[i*4+1] = pixel.g * 255;
    colorBarRow[i*4+2] = pixel.b * 255;
    colorBarRow[i*4+3] = 255;
  }
  for (var i = 0; i < colorBarData.data.length; i++) {
    colorBarData.data[i] = colorBarRow[i % (colorBarWidth*4)];
  }
  ctx.putImageData(colorBarData, 0, 0);

  document.getElementById('color-bar-min').innerHTML = Math.round(variable.valueMin * 100) / 100;
  document.getElementById('color-bar-max').innerHTML = Math.round(variable.valueMax * 100) / 100;
};
function cycleHour() {
  if (settings.cycleHour) {
    settings.hourSlider = settings.hourSlider % 24 + 1;
    update();
    setTimeout(cycleHour, 1000 / settings.cycleSpeed);
  }
}

var gui = null;
var dataFolder = null;
var update = function (value) {
  renderBy = settings.renderBy;
  isData = (renderBy == 'Data');
  if (isData && !dataFolder){
    variable_names = [];
    os_data.variables.forEach(function(os_data_var) {
      variable_names.push(os_data_var.name);
    });
    variable = os_data.variables[0];
    settings.variableName = variable.name;

    dataFolder = gui.addFolder('Data Rendering');
    dataFolder.add(settings, 'variableName', variable_names).name('Variable').onChange(updateVariable);
    dataFolder.add(settings, 'colorScheme', {'Grayscale': 'grayscale', 'Sequential': 'sequential', 'Diverging': 'diverging', 'Rainbow': 'rainbow'}).name('Color Scheme').onChange(function(value) {
      setLocalStorage('colorScheme', value);
      updateColorBar();
      update(value);
    });
    dataFolder.add(settings, 'daySlider', 0, variable.numDays-1, 1).name('Day').onChange(update);
    dataFolder.add(settings, 'hourSlider', variable.hoursPerInterval, 24).step(variable.hoursPerInterval).name('Hour').listen().onChange(update);
    dateTimeControl = dataFolder.add(settings, 'dateTime').name('Date Time').listen();
    dataFolder.add(settings, 'rotateColorBar').name('Rotate Color Bar').onChange(function(value) {
      if (value) {
        colorBarContainer.classList.add('rotate');
      } else {
        colorBarContainer.classList.remove('rotate');
      }
      fitInWindow();
      setLocalStorage('rotateColorBar', value);
    });
    dataFolder.add(settings, 'cycleHour').name('Cycle Hour').onChange(function(cycleHourValue) {
      if (cycleHourValue) {
        cycleHour();
      }
    });
    dataFolder.add(settings, 'cycleSpeed', 1, 10).name('Cycle Speed').onChange(function(value) {
      setLocalStorage('cycleSpeed', value);
    });
    dataFolder.open();
    document.getElementById('color-bar-container').style.display = 'block';
    fitInWindow();
    updateColorBar();
  } else if (!isData && dataFolder) {
    gui.removeFolder('Data Rendering');
    dataFolder = null;
    if (settings.cycleHour) {
      settings.cycleHour = false;
    }
    document.getElementById('color-bar-container').style.display = 'none';
  }

  var i = null;
  var date = '';
  var time = '';
  var units = '';
  if (isData && variable){
    i = Math.floor(variable.intervalsPerDay*Math.floor(settings.daySlider) + variable.intervalsPerHour*Math.floor(settings.hourSlider)) - 1;
    t = os_data.times[variable.timeIndex][i];
    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    d.setUTCSeconds(t);

    date = ('0' + (d.getUTCMonth()+1)).slice(-2) + '/' + ('0'+d.getUTCDate()).slice(-2);
    time = ('0' + d.getUTCHours()).slice(-2) + ':' + ('0'+d.getUTCMinutes()).slice(-2);

    settings.dateTime = date + ' - ' + time;
    dateTimeControl.updateDisplay();

    if (variable.units.length) {
      units = '(' + variable.units + ')';
    }
  }

  scene_objects.forEach(function(object) {

    surfaceType = object.userData.surfaceType;

    object.visible = true;

    if (settings.showStory == 'All Stories' || settings.showStory == object.userData.buildingStoryName){
      // no-op
    }else{
      object.visible = false;
    }

    if (!settings.showFloors && surfaceType == 'Floor'){
      object.visible = false;
    }else if (!settings.showWalls && surfaceType == 'Wall'){
      object.visible = false;
    }else if (!settings.showRoofCeilings && surfaceType == 'RoofCeiling'){
      object.visible = false;
    }else if (!settings.showWindows && surfaceType.indexOf('Window') > -1){
      object.visible = false;
    }else if (!settings.showWindows && surfaceType.indexOf('GlassDoor') > -1){
      // hide these with doors
      //object.visible = false;
    }else if (!settings.showWindows && surfaceType.indexOf('Skylight') > -1){
      object.visible = false;
    }else if (!settings.showWindows && surfaceType.indexOf('TubularDaylight') > -1){
      object.visible = false;
    }else if (!settings.showDoors && surfaceType.indexOf('Door') > -1){
      object.visible = false;
    }else if (!settings.showShading && (surfaceType.indexOf('Shading') > -1)){
      object.visible = false;
    }else if (!settings.showPartitions && (surfaceType == 'InteriorPartitionSurface')){
      object.visible = false;
    }

    var material = null;
    var material_double_sided = null;
    var material_back = null;
    switch (renderBy) {
      case "Surface Type":
        material = materials[object.userData.surfaceTypeMaterialName];
        material_double_sided = material;
        if (coincident_objects[object.uuid]){
          // coincident object present, only show inside face
          material = materials[object.userData.surfaceTypeMaterialName + '_Int'];
        }
        material_back = materials[object.userData.surfaceTypeMaterialName + '_Int'];
        break;
      case "Normal":
        material = materials.NormalMaterial;
        material_double_sided = material;
        if (coincident_objects[object.uuid]){
          // coincident object present, only show inside face
          material = materials.NormalMaterial_Int;
        }
        material_back = materials.NormalMaterial_Int;
        break;
      case "Boundary":
        material = materials[object.userData.boundaryMaterialName];
        break;
      case "Construction":
        material = materials[object.userData.constructionMaterialName];
        break;
      case "Thermal Zone":
        material = materials[object.userData.thermalZoneMaterialName];
        break;
      case "Space Type":
        material = materials[object.userData.spaceTypeMaterialName];
        break;
      case "Building Story":
        material = materials[object.userData.buildingStoryMaterialName];
        break;
      case "Data":
        var value = null;
        var keyName = '';
        var object_variables = object.userData.variables.filter(function(x){return x.name == settings.variableName;});
        if (object_variables.length > 0){
          var object_variable = object_variables[0];
          if (object_variable.valueIndex !== null){
            value = variable.values[object_variable.valueIndex][i];
          }
          if (object_variable.keyName !== null){
            keyName = object_variable.keyName;
          }
        }

        if (value !== null) {
          object.userData.variableName = settings.variableName;
          object.userData.variableDate = date;
          object.userData.variableTime = time;
          object.userData.variableKeyName = keyName;
          object.userData.variableValue = value;
          object.userData.variableUnits = units;
        }else{
          object.userData.variableName = settings.variableName;
          object.userData.variableDate = date;
          object.userData.variableTime = time;
          object.userData.variableKeyName = keyName;
          object.userData.variableValue = '';
          object.userData.variableUnits = units;
        }

        material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
        material.color.set(getColor(value, variable.valueMin, variable.valueMax, settings.colorScheme));
        break;
    }

    if (intersected) {
      updateBalloon(intersected);
      updateColorBarSelection(intersected.userData.variableValue);
    }

    if (!material){
      material = materials.Undefined;
      console.log(renderBy + ": could not find material for " + JSON.stringify(object.userData));
    }
    if (!material_double_sided){
      material_double_sided = material;
    }
    if (!material_back){
      material_back = material;
    }

    object.material = material;
    object.material_double_sided = material_double_sided;
    if ( material !== null){
      object.material.needsUpdate = true;
    }

    var edge = object_edges[object.uuid];
    if (settings.showWireframe || object.visible){
      edge.visible = true;
    }else{
      edge.visible = false;
    }

    back_object = back_objects[object.uuid];
    if (back_object){
      back_object.material = material_back;
      if ( material_back !== null){
        back_object.visible = object.visible;
        back_object.material.needsUpdate = true;
      }else{
        back_object.visible = false;
      }
    }
  });

  // turn off back objects where coincident objects are visible
  scene_objects.forEach(function(object) {
    if (object.visible){
      coincident_object = coincident_objects[object.uuid];
      if (coincident_object){
        back_object = back_objects[object.uuid];
        if (back_object){
          if (coincident_object.visible){
            // coincident object is visible, hide back object
            back_object.visible = false;
          }else{
            // coincident object is not visible, show back object
            back_object.visible = true;

            if (object.material_double_sided){
              // switch to double sided material so we can select this
              object.material = object.material_double_sided;
              object.material.needsUpdate = true;
            }
          }
        }
      }
    }
  });
};

var updateVariable = function (variableName) {
  var variables = os_data.variables.filter(function(x){return x.name == variableName;});
  if (variables.length){
    variable = variables[0];
  }
  updateColorBar();
  update();
};

var initDatGui = function () {
  var has_data = (os_data.metadata.variables && os_data.metadata.variables.length);

  dat.GUI.prototype.removeFolder = function(name) {
    this.__folders[name].close();
    this.__folders[name].domElement.parentNode.parentNode.removeChild(this.__folders[name].domElement.parentNode);
    this.__folders[name] = undefined;
    this.onResize();
  };

  gui = new dat.GUI();
  // DLM: support reduce list
  //var render_modes = ['Surface Type', 'Normal', 'Boundary', 'Construction', 'Thermal Zone', 'Space Type', 'Building Story'];
  var render_modes = ['Surface Type', 'Normal', 'Thermal Zone', 'Space Type', 'Building Story'];
  if (has_data){
    render_modes.push('Data');
  }
  gui.add(settings, 'renderBy', render_modes).name('Render By').onChange(function(value) {
    removeSelection();
    update(value);
  });

  building_story_names = os_data.metadata.buildingStoryNames;
  building_story_names.unshift('All Stories');
  gui.add(settings, 'showStory', building_story_names).name('Show Story').onChange(function(value) {
    removeSelection();
    update(value);
  });

  var f1 = gui.addFolder('Surface Filters');
  f1.add(settings, 'showFloors').name('Show Floors').onChange(function(value) {
    removeSelection();
    setLocalStorage('showFloors', value);
    update(value);
  });
  f1.add(settings, 'showWalls').name('Show Walls').onChange(function(value) {
    removeSelection();
    setLocalStorage('showWalls', value);
    update(value);
  });
  f1.add(settings, 'showRoofCeilings').name('Show Roofs').onChange(function(value) {
    removeSelection();
    setLocalStorage('showRoofCeilings', value);
    update(value);
  });
  f1.add(settings, 'showWindows').name('Show Windows').onChange(function(value) {
    removeSelection();
    setLocalStorage('showWindows', value);
    update(value);
  });
  f1.add(settings, 'showDoors').name('Show Doors').onChange(function(value) {
    removeSelection();
    setLocalStorage('showDoors', value);
    update(value);
  });
  f1.add(settings, 'showShading').name('Show Shading').onChange(function(value) {
    removeSelection();
    setLocalStorage('showShading', value);
    update(value);
  });
  f1.add(settings, 'showPartitions').name('Show Partitions').onChange(function(value) {
    removeSelection();
    setLocalStorage('showPartitions', value);
    update(value);
  });
  f1.add(settings, 'showWireframe').name('Show Wireframe').onChange(function(value) {
    removeSelection();
    setLocalStorage('showWireframe', value);
    update(value);
  });
  f1.open();

  var f2 = gui.addFolder('Camera');
  f2.add(settings, 'orthographic').name('Orthographic').onChange(function(value) {
    setLocalStorage('orthographic', value);
  });
  f2.add(settings, 'xView').name('X View');
  f2.add(settings, 'yView').name('Y View');
  f2.add(settings, 'zView').name('Z View');
  f2.add(settings, 'reset').name('Reset');
  f2.open();

  /*var f2 = gui.addFolder('Section Cut');
  f2.add(settings, 'xSection', 0, 360).name('X Section').onChange(function (value) {
    console.log('X cut: ' + value);
  });
  f2.add(settings, 'ySection', 0, 360).name('Y Section').onChange(function (value) {
    console.log('Y cut: ' + value);
  });
  f2.add(settings, 'zSection', 0, 360).name('Z Section').onChange(function (value) {
    console.log('Z cut: ' + value);
  });
  f2.open();*/

  update();
};


const storageKey = 'floorplan3DExport';
Module.addOnPostRun(() => {
  const floorplanStr = localStorage.getItem(storageKey);
  if (floorplanStr) {
    const threejsStr = Module.floorplanToThreeJS(floorplanStr, false);
    const threejs = JSON.parse(threejsStr);
    init(threejs);
    animate();
    initDatGui();
  }

  window.onstorage = (event) => {
    if (event.key === storageKey) {
      location.reload();
    }
  };
});