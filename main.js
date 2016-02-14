var red = new Uint8Array([255, 0, 0, 255]);
var green = new Uint8Array([0, 255, 0, 255]);
var blue = new Uint8Array([0, 0, 255, 255]);
var cyan = new Uint8Array([0, 255, 255, 255]);
var magenta = new Uint8Array([255, 0, 255, 255]);
var yellow = new Uint8Array([255, 255, 0, 255]);

var cubeMap;
var myEnvironment;
var theta = 0;
var phi = 20;
var sigma = 0;



var gridN = 256;
var gl;
var canvas;
var shaderProgram;
var shaderProgram2;
var shaderProgram3;
var phongProgram;

var vertexPositionBuffer;
// Create a place to store terrain geometry
var tVertexPositionBuffer;
//Create a place to store normals for shading
var tVertexNormalBuffer;
// Create a place to store the terrain triangles
var tIndexTriBuffer;
//Create a place to store the traingle edges
var tIndexEdgeBuffer;
// View parameters

var teapotVertexPositionBuffer;
var teapotVertexNormalBuffer;
var teapotIndexTriBuffer;


var eyePt = vec3.fromValues(0.0,0.0,0.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);
// Create the normal
var nMatrix = mat3.create();
// Create ModelView matrix
var mvMatrix = mat4.create();
//Create Projection matrix
var pMatrix = mat4.create();
var mvMatrixStack = [];

//TODO: load
var myExLoad;

function drawTeapot(shaderName){
	gl.useProgram(shaderName);
	//Draw teapot
	var teapotTransformVec = vec3.create();
	var teapotScaleVec = vec3.create();
	var teapotRotate = vec3.create();
	mvPushMatrix();
    //vec3.set(teapotTransformVec,0.0,0.2,-3.0);
	vec3.set(teapotTransformVec,0.0,-0.08,-3.0);
	vec3.set(teapotScaleVec,0.25,0.25,0.25);
	
    mat4.translate(mvMatrix, mvMatrix,teapotTransformVec);
	mat4.scale(mvMatrix, mvMatrix,teapotScaleVec);
	mat4.rotateX(mvMatrix, mvMatrix, degToRad(phi));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(sigma)); 
	mat4.rotateY(mvMatrix, mvMatrix, degToRad(theta));
    
    setMatrixUniforms(shaderName);
	uploadLightsToShader([4,1,0],[0.5,0.5,0.5],[2.0,0.0,2.0],[1.0,1.0,0.0], shaderName);
   
	gl.polygonOffset(0,0);
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
	gl.vertexAttribPointer(shaderName.vertexPositionAttribute, 		 teapotVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
 gl.vertexAttribPointer(shaderName.vertexNormalAttribute, 
                           teapotVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, teapotIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);

	 mvPopMatrix();      
}


//-------------------------------------------------------------------------
function drawTerrain(shaderName){
	gl.useProgram(shaderName);
	
	var transformVec = vec3.create();
	
	var scaleVec = vec3.create();
	
	

	mvPushMatrix();
    vec3.set(transformVec,0.0,-1.0,-4.0);
	vec3.set(scaleVec,1.5,1.5,1.5);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
	mat4.scale(mvMatrix, mvMatrix,scaleVec);

    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(25));     
    setMatrixUniforms(shaderName);

	uploadLightsToShader([0,1,1],[0.5,0.5,0.5],[1.0,0.5,0.0],[0.0,0.0,0.0],shaderName);
   /** 
    if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
    {
      uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[1.0,0.5,0.0],[0.0,0.0,0.0],shaderProgram);
      drawTerrain();
    }
    
    if(document.getElementById("wirepoly").checked){
      uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0],shaderProgram);
      drawTerrainEdges();
    }

    if(document.getElementById("wireframe").checked){
      uploadLightsToShader([0,1,1],[1.0,1.0,1.0],[0.0,0.0,0.0],[0.0,0.0,0.0],shaderProgram);
      drawTerrainEdges();
    }
**/
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderName.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);
	
	// Set the texture coordinates attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, terrainTCoordBuffer);
  gl.vertexAttribPointer(shaderName.texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  // Specify the texture to map onto the faces.

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  gl.uniform1i(gl.getUniformLocation(shaderName, "uSampler"), 0);


 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderName.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0); 

	mvPopMatrix();     
}

//----------------------------------------------------------------------------------
function draw() {  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
	//Draw Objects
	drawTerrain(shaderProgram);
	drawTeapot(shaderProgram2);
}
//----------------------------------------------------------------------------------
function animate() {
	theta +=   0.2;
	phi +=   0.4;
	sigma +=   0.8;
}
//----------------------------------------------------------------------------------
function startup() {
  	canvas = document.getElementById("myGLCanvas");
  	gl = createGLContext(canvas);
  	setupTeapotShaders();
	setupTerrainShaders();
	setupCubeShaders();
	//setupPhongShader();
	
  	setupBuffers();
	setTexcoords();
	setupTextures();
	//configureCubeMap();
	initEnvironmentCubeMap();
	//loadCubeMap();
	//initEnvironmentCubeMapWANG()

	//TODO:
	

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	tick();
}
//----------------------------------------------------------------------------------
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

//----------------------------------------------------------------------------------
function setupBuffers() {
    setupTerrainBuffers(gridN);
	setupTeapotBuffers();
}
//----------------------------------------------------------------------------------
function setTexcoords() {
	terrainTCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, terrainTCoordBuffer);
	var columNum = gridN + 1;
	var textureCoordinates =[];
	var unit = 1 / columNum;
	for (var i = 0; i < columNum ; i++){
		for (var j = 0; j < columNum ; j++){
			textureCoordinates.push(unit * i);
			textureCoordinates.push(unit * j);
		}
	}
	 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);
	terrainTCoordBuffer.itemSize = 2;
    terrainTCoordBuffer.numItems = columNum * columNum;
}

function setupTextures() {
	cubeTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
	// Fill the texture with a 1x1 blue pixel.
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
	cubeImage = new Image();
	cubeImage.onload = function() { handleTextureLoaded(cubeImage, cubeTexture); }
	cubeImage.src = "heightMap2.png";
   // https://goo.gl/photos/SUo7Zz9US1AKhZq49
}





function initEnvironmentCubeMap() {

            myEnvironment = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, myEnvironment);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

           
			
			var cubeFaces = [
                ["images/posX.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
                ["images/negX.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
                ["images/posY.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
                ["images/negY.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                ["images/posZ.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
                ["images/negZ.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
            ];
			

            for (var i = 0; i < cubeFaces.length; i++) {

                var image = new Image();
                image.src = cubeFaces[i][0];
                image.onload = function(texture, face, image) {

                    return function() {
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
                        gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    }
                } (myEnvironment, cubeFaces[i][1], image);
            }
}


                









//TODO: NO change
//-------------------------------------------------------------------------
function drawTerrainEdges(){
 gl.polygonOffset(1,1);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
 gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader(shaderName) {
  gl.uniformMatrix4fv(shaderName.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader(shaderName) {
  gl.uniformMatrix4fv(shaderName.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
function uploadNormalMatrixToShader(shaderName) {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderName.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
function setMatrixUniforms(shaderName) {
    uploadModelViewMatrixToShader(shaderName);
    uploadNormalMatrixToShader(shaderName);
    uploadProjectionMatrixToShader(shaderName);
}

function uploadLightsToShader(loc,a,d,s,shaderName) {
  gl.uniform3fv(shaderName.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderName.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderName.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderName.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}



//---------------------------------------------------------------------------------

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

//---------------------------------------------------------------------------------

function handleTextureLoaded(image, texture) {
  console.log("handleTextureLoaded, image = " + image);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  // Check if the image is a power of 2 in both dimensions.
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
     // Yes, it's a power of 2. Generate mips.
     gl.generateMipmap(gl.TEXTURE_2D);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
     console.log("Loaded power of 2 texture");
  } else {
     // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     console.log("Loaded non-power of 2 texture");
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}



function setupTeapotBuffers(){
	//myExLoad = new exampleLoad();
    //myExLoad.loadResources();
	//var teapotStr = this.RL.RLStorage.TEXT[0];a

	teapot = loadObjFile ("teapot_0.obj");
	teapot.normals = computeNormals(teapot.vertices, teapot.faces);
	
	//set vertex buffer
	teapotVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.vertices), gl.STATIC_DRAW);
    teapotVertexPositionBuffer.itemSize = 3;
    teapotVertexPositionBuffer.numItems = teapot.vertices.length / 3;

	//set normal buffer
	teapotVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.normals),
                  gl.STATIC_DRAW);
    teapotVertexNormalBuffer.itemSize = 3;
    teapotVertexNormalBuffer.numItems = teapot.normals.length / 3;

	// set faces
    teapotIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapot.faces),
                  gl.STATIC_DRAW);
    teapotIndexTriBuffer.itemSize = 1;
    teapotIndexTriBuffer.numItems = teapot.faces.length;
	
	
	//console.log ("vertexNUM:", teapot.vertices.length);
	//console.log ("faceNUM:", teapot.faces.length);
	//console.log ("normalNUM:", teapot.normals.length);
	
}



//-------------------------------------------------------------------------
function setupTerrainBuffers(gridN) {
    var vTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    //var gridN=2;
    
    var numT = terrainFromIteration(gridN, -1,1,-1,1, vTerrain, fTerrain, nTerrain);
    console.log("Generated ", numT, " triangles"); 
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain),
                  gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain),
                  gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;
    
    //Setup Edges
     generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
     tIndexEdgeBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain),
                  gl.STATIC_DRAW);
     tIndexEdgeBuffer.itemSize = 1;
     tIndexEdgeBuffer.numItems = eTerrain.length;
}



function setupTerrainShaders() {
  vertexShader = loadShaderFromDOM("shader-vs-terrain");
  fragmentShader = loadShaderFromDOM("shader-fs-terrain");
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaderS");
  }
	//Enable texture
	shaderProgram.texCoordAttribute = gl.getAttribLocation(shaderProgram, "a_texcoord");
	console.log("Tex coord attrib: ", shaderProgram.texCoordAttribute);
	gl.enableVertexAttribArray(shaderProgram.texCoordAttribute);
	//------------------------------------------------------------------------------------

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
}

//----------------------------------------------------------------------------------
function setupTeapotShaders() {
  vertexShader2 = loadShaderFromDOM("shader-vs-teapot");
  fragmentShader2 = loadShaderFromDOM("shader-fs-teapot");
  
  shaderProgram2 = gl.createProgram();
  gl.attachShader(shaderProgram2, vertexShader2);
  gl.attachShader(shaderProgram2, fragmentShader2);
  gl.linkProgram(shaderProgram2);

  if (!gl.getProgramParameter(shaderProgram2, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  shaderProgram2.vertexPositionAttribute = gl.getAttribLocation(shaderProgram2, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram2.vertexPositionAttribute);

  shaderProgram2.vertexNormalAttribute = gl.getAttribLocation(shaderProgram2, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram2.vertexNormalAttribute);

  shaderProgram2.mvMatrixUniform = gl.getUniformLocation(shaderProgram2, "uMVMatrix");
  shaderProgram2.pMatrixUniform = gl.getUniformLocation(shaderProgram2, "uPMatrix");
  shaderProgram2.nMatrixUniform = gl.getUniformLocation(shaderProgram2, "uNMatrix");
  shaderProgram2.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram2, "uLightPosition");    
  shaderProgram2.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram2, "uAmbientLightColor");  
  shaderProgram2.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram2, "uDiffuseLightColor");
  shaderProgram2.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram2, "uSpecularLightColor");
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function setupCubeShaders() {
  vertexShader3 = loadShaderFromDOM("shader-vs-cube");
  fragmentShader3 = loadShaderFromDOM("shader-fs-cube");
  shaderProgram3 = gl.createProgram();
  gl.attachShader(shaderProgram3, vertexShader3);
  gl.attachShader(shaderProgram3, fragmentShader3);
  gl.linkProgram(shaderProgram3);
  if (!gl.getProgramParameter(shaderProgram3, gl.LINK_STATUS)) {
    alert("Failed to setup shaders PROGRAM3");
  }

  shaderProgram3.vertexPositionAttribute = gl.getAttribLocation(shaderProgram3, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram3.vertexPositionAttribute);

  shaderProgram3.vertexNormalAttribute = gl.getAttribLocation(shaderProgram3, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram3.vertexNormalAttribute);

	

  shaderProgram3.mvMatrixUniform = gl.getUniformLocation(shaderProgram3, "uMVMatrix");
  shaderProgram3.pMatrixUniform = gl.getUniformLocation(shaderProgram3, "uPMatrix");

 shaderProgram3.nMatrixUniform = gl.getUniformLocation(shaderProgram3, "uNMatrix");
	shaderProgram3.cubeMapSampler = gl.getUniformLocation(shaderProgram, "texMap");
/**
  shaderProgram3.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram3, "uLightPosition");    
  shaderProgram2.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram3, "uAmbientLightColor");  
  shaderProgram2.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram3, "uDiffuseLightColor");
  shaderProgram2.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram3, "uSpecularLightColor");
**/
}
//----------------------------------------------------------------------------------


//----------------------------------------------------------------------------------
function setupPhongShader() {
  phongVertexShader = loadShaderFromDOM("shader-vs-fragment");
  phongFragmentShader = loadShaderFromDOM("shader-fs-fragment");
  
  phongProgram = gl.createProgram();
  gl.attachShader(phongProgram, phongVertexShader);
  gl.attachShader(phongProgram, phongFragmentShader);
  gl.linkProgram(phongProgram);

  if (!gl.getProgramParameter(phongProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  phongProgram.vertexPositionAttribute = gl.getAttribLocation(phongProgram, "vPosition");
  gl.enableVertexAttribArray(phongProgram.vertexPositionAttribute);

  phongProgram.vertexNormalAttribute = gl.getAttribLocation(phongProgram, "vNormal");
  gl.enableVertexAttribArray(phongProgram.vertexNormalAttribute);

  phongProgram.mvMatrixUniform = gl.getUniformLocation(phongProgram, "modelViewMatrix");
  phongProgram.pMatrixUniform = gl.getUniformLocation(phongProgram, "projectionMatrix");
	
  phongProgram.uniformLightPositionLoc = gl.getUniformLocation(phongProgram, "lightPosition");    
  phongProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(phongProgram, "ambientProduct");  
  phongProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(phongProgram, "diffuseProduct");
  phongProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(phongProgram, "specularProduct");
}
//----------------------------------------------------------------------------------



function loadPic(texture, face, image) {
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
                        gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}

function configureCubeMap() {

    cubeMap = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, red);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, green);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, blue);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, cyan);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, yellow);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, magenta);


    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
}

