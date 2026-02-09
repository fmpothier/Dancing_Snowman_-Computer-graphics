// Frankie Pothier

var canvas;
var gl;

var program;

var near = 1;
var far = 100;

var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; 
var TIME = 0.0;
var dt = 0.0
var prevTime = 0.0;
var headTime = 0.0;
var resetTimerFlag = true;

// disco dancing snowman variable
// angles fro arms
var leftShoulderAngle = [0, 90, 45];
var leftElbowAngle = [0, 90, 90];
var rightShoulderAngle = -45; 
var rightElbowAngle = -45;

// for penguin
var armRotation1 = 0;
var armRotation2 = 0;
var penguinJump = 0;
var feetJump = 0;

// variable for tracking needed changes in movement
var direction = 1;
var switchArms = false; 

// Head movement
var headRotation = [0,-45,0];

// variable used for setting, sorting and making textures
var useTextures = 1;
var textureArray = [] ;
var texSize = 256;

// Create a Procdeural Texture where the center of the texture is a white circle
// with a dark blue background. 
    // Input: Texsize, Used to set width and height of texture
    // Output: textureData, array with all the RGBA data that can then be used to render texture
function generatePenguinTexture(texSize) {
    // Create an array to store RGBA values for each pixel
    const textureData = new Uint8Array(texSize * texSize * 4);
    
    // Define the center, circle radius, and blendwidth (bondery for blending white and blue)
    const center = texSize / 2;
    const radius = texSize * 0.25;         
    const blendWidth = texSize * 0.05;

    // Loop over rows and columns
    for (let y = 0; y < texSize; y++) {
        for (let x = 0; x < texSize; x++) {

            // Calculate distance from the pixel to the center of the texture
            // Using Eulidean distance
            const dx = x - center;
            const dy = y - center;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Create noise for the color variation
            const noise = (Math.random() - 0.5) * 50;

            // Create noise for transition area
            const distNoise = (Math.random() - 0.5) * blendWidth;
            const effectiveDist = dist + distNoise;
            
            // create varibles to hold RGB values
            let red, green, blue;

            // Set pixel colour based on how far they are from the center of the circle
            // if the pixel in side the set radius set to white
            if (effectiveDist < radius - blendWidth) {
                red   = 255 + noise;
                green = 255 + noise;
                blue  = 255 + noise;
            } 

            // if the pixel is out side the set radius set to blue
            else if (effectiveDist > radius + blendWidth) {
                red   = 0 + noise;
                green = 0 + noise;
                blue  = 130 + noise;
            } 
            // if the pixel is in the blending boundary use linear interpolation 
            // to gradually change colour from white to blue + noise to make it look less smooth
            else {
                const t = (effectiveDist - (radius - blendWidth)) / (2 * blendWidth);
                red   = (1 - t) * 255 + t * 0 + noise;
                green = (1 - t) * 255 + t * 0 + noise;
                blue  = (1 - t) * 255 + t * 120 + noise;
            }
            
            // Use min and max to make usre values to not go out side of the range or (0 - 255)
            red   = Math.min(255, Math.max(0, Math.floor(red)));
            green = Math.min(255, Math.max(0, Math.floor(green)));
            blue  = Math.min(255, Math.max(0, Math.floor(blue)));

            // Calculate the index for the current pixel in the array
            const index = (y * texSize + x) * 4;
            textureData[index] = red;
            textureData[index + 1] = green;
            textureData[index + 2] = blue;
            textureData[index + 3] = 255;
        }
    }
    
    return textureData;
}

// Create procedurally generated texture using random colour (noise) 
// Sets RGB colours to a white-light blue range
    // Input: Texsize, Used to set width and height of texture
    // Output: noiseDate, array with all the RGBA data that can then be used to render texture
function generateIceTextureData(texSize) {

    // Create array, representing a matrix, to hold RGBA information
    const noiseData = new Uint8Array(texSize * texSize * 4);

    // loop over rows and columns
    for (let y = 0; y < texSize; y++) {
        for (let x = 0; x < texSize; x++) {

            // Genereate Random value to be used to set pixels colour intensity
            const noise = Math.random();

            // Map the noise value to a light blue to white color range
            // min ensures the values stay in RGB colour range
            let red   = Math.min(Math.floor(noise * 20 + 140), 255);  
            let green = Math.min(Math.floor(noise * 60 + 170), 255); 
            let blue  = Math.min(Math.floor(noise * 70 + 220), 255); 

            // 65% a pixel will be set to white
            // to add random white patches
            if (Math.random() < 0.65) {  
                red = 255;
                green = 255;
                blue = 255;
            }

            // add RGB random (white or blue) values to noiseData
            const index = (y * texSize + x) * 4;
            noiseData[index] = red;
            noiseData[index + 1] = green;
            noiseData[index + 2] = blue;
            noiseData[index + 3] = 255;  // Fully opaque
        }
    }

    return noiseData;
}
   
// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition2) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

// We are going to asynchronously load actual image files this will check if that call if an async call is complete
// You can use this for debugging
function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

// Takes an array of textures and calls render if the textures are created/loaded
// This is useful if you have a bunch of textures, to ensure that those files are
// actually loaded from disk you can wait and delay the render function call
// Notice how we call this at the end of init instead of just calling requestAnimFrame like before
function waitForTextures(texs) {
    setTimeout(
		function() {
			   var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log(texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               		console.log(wtime + " not ready yet") ;
               		waitForTextures(texs) ;
               }
               else
               {
               		console.log("ready to render") ;
					render(0);
               }
		},
	5) ;
}

// This will use an array of existing image data to load and set parameters for a texture
// use this function for procedural textures 
// (function from lab 5 but peramteris were adjusted)
function loadImageTexture(tex, image) {
	//create and initalize a webgl texture object.
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();

	//Binds a texture to a target. Target is then used in future calls.
    gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
	//Generates a set of mipmaps for the texture object.
    gl.generateMipmap(gl.TEXTURE_2D);
	
	//Set texture parameters.
    //texParameteri(GLenum target, GLenum pname, GLint param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true;
}

// (function from lab 5 but adjusted to load my textures)
function initTextures() {
    textureArray.push({}) ;
    loadImageTexture(textureArray[textureArray.length-1],generateIceTextureData(texSize));

    textureArray.push({}) ;
    loadImageTexture(textureArray[textureArray.length-1],generatePenguinTexture(texSize));
}


// Changes which texture is active in the array of texture examples (see initTextures)
function toggleTextures() {
    useTextures = (useTextures + 1) % 2
	gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Cone.init(20,program);
    Sphere.init(36,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );
    
    document.getElementById("textureToggleButton").onclick = function() {
        toggleTextures() ;
        window.requestAnimFrame(render);
    };

	// initialize textures
    initTextures();

    waitForTextures(textureArray);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}
//Function draws the left arm of the smowman
function snowLeftArm(){
    // SNOW MAN LEFT ARMS
    gPush();{
        setColor(vec4(0.4,0.34,0.25, 1.0));
        gTranslate(-1.5, 0, 0);

        // Shoulder rotation
        gTranslate(0.8, 0, 0);
        gRotate(leftShoulderAngle[2], 0, 0, 1);
        gRotate(leftShoulderAngle[1], 0, 1, 0);
        gTranslate(-0.8, 0, 0);

        // scale and draw
        gPush();{
            gRotate(90, 0, 1, 0);
            gRotate(45, 0, 0, 1);
            gScale(0.2, 0.2, 1.5);
            drawCylinder();
        }
        gPop();

        // elbow joint
        gPush();{
            //Translate to spot
            gTranslate(-1.2, 0, 0);

             // Elbow rotation
            gTranslate(0.55, 0, 0);
            gRotate(leftElbowAngle[1], 0, 1, 0);
            gRotate(leftElbowAngle[2], 0, 0, 1);
            gTranslate(-0.55, 0, 0);

            // scale and draw
            gPush();{
                gRotate(90, 0, 1, 0);
                gRotate(45, 0, 0, 1);
                gScale(0.2, 0.2, 1);
                drawCylinder();
            }
            gPop();

            gPush();{
                gTranslate(0.54, 0, 0);
                gScale(0.13, 0.13, 0.13);
                drawSphere();
            }
            gPop();

            // SNOW MANS HAND
            gPush();{
                gTranslate(-0.6, 0, 0);
                gRotate(90, 0, 0, 1);
                gPush();{
                    gScale(0.2, 0.2, 0.2);
                    drawSphere();
                }
                gPop();
                gPush();{
                    gTranslate(0.1, 0.2, 0);
                    gScale(0.05, 0.2, 0.05);
                    drawSphere();

                }
                gPop();
                
            }
            gPop();
        }
        gPop(); 
    } 
    gPop();

}

function snowRightArm(){
    // SNOW MAN LEFT ARMS
    gPush();{
        setColor(vec4(0.4,0.34,0.25, 1.0));
        gTranslate(1, 0.2, 0);

        gTranslate(-0.6, 0, 0);
        gRotate(-45, 0, 0, 1);
        gTranslate(0.6, 0, 0);

        // scale and draw
        gPush();{
            gRotate(90, 0, 1, 0);
            gScale(0.2, 0.2, 1.5);
            drawCylinder();
        }gPop();

        // elbow joint
        gPush();{
            //Translate to spot
            gTranslate(0.8, -0.4, 0);

            // scale and draw
            gPush();{
                gRotate(90, 0, 1, 0);
                gRotate(90, 1, 0, 0);
                gScale(0.2, 0.2, 1);
                drawCylinder();
            }gPop();

            gPush();{
                gTranslate(0, 0.4, 0);
                gScale(0.13, 0.13, 0.13);
                drawSphere();
            }gPop();

            // SNOW MANS HAND
            gPush();{
                gTranslate(0.1, -0.4, 0);
                gScale(0.2, 0.2, 0.2);
                drawSphere();
            }
            gPop();

        }
        gPop(); 
    } 
    gPop();

}
function drawPenguin(){
    // Draw dancing penguin
    gPush();{
        gPush();{
            gTranslate(2, -1.1, 0);
            gTranslate(0, penguinJump, 0);

            // Rotate, Scale, and draw
            gPush();{
                gRotate(90, 0, 1, 0);
                gScale(0.9, 1.1, 0.8);
                drawSphere();
            }gPop();

            // arms 1
            gPush();{
                gTranslate(0.85, 0, 0);
                gTranslate(-0.5,0.5, 0);
                gRotate(armRotation1, 0, 0, 1); // swing arm
                gTranslate(0.5, -0.5, 0);

                gRotate(25, 0, 0, 1);
                gScale(0.25, 0.7, 0.4);
                drawSphere();

            }gPop(); // arm 1

            // arms 2
            gPush();{
                gTranslate(-0.85, 0, 0);
                gTranslate(0.5,0.5, 0);
                gRotate(armRotation2, 0, 0, 1); // swing arm
                gTranslate(-0.5, -0.5, 0);

                gRotate(180, 0, 1, 0);
                gRotate(25, 0, 0, 1);
                gScale(0.25, 0.7, 0.4);
                drawSphere();

            }gPop(); // arm 2

            // add BowTie
            gPush();{
                // UnSet Snow Texture to draw snow Man with Colour
                gl.bindTexture(gl.TEXTURE_2D, null);  
                gl.uniform1i(gl.getUniformLocation(program, "useTextures"), 1); 

                setColor(vec4(0.4,0.0,0.8,1.0)); 
                gTranslate(0, 0.9, 0.6);
                gPush();{
                    gScale(0.14, 0.14, 0.14);
                    drawSphere();
                }gPop();

                // bow 1
                gPush();{
                    gTranslate(-0.24, 0, 0);
                    gRotate(90, 0, 1, 0);
                    gScale(0.14, 0.18, 0.25);
                    drawCone();
                }gPop(); // bow 1

                // bow 1
                gPush();{
                    gTranslate(0.24, 0, 0);
                    gRotate(-90, 0, 1, 0);
                    gScale(0.14, 0.18, 0.25);
                    drawCone();
                }gPop(); // bow 1
               

            }gPop(); // bow tie

            //foot 1.1
            //foot movement
            gPush();{
                gRotate(feetJump, 1, 0, 0);
                gPush();{
                    setColor(vec4(1.0,0.45,0.24,1.0));
                    gTranslate(-0.44, -0.85, 0.6);
                    gRotate(-45, 0, 1, 0);
                    gScale(0.11, 0.11, 0.25);
                    drawSphere();

                }gPop(); // foot 1.1

                //foot 1.2
                gPush();{
                    setColor(vec4(1.0,0.45,0.24,1.0));
                    gTranslate(-0.29, -0.85, 0.6);
                    gScale(0.11, 0.11, 0.25);
                    drawSphere();

                }gPop(); // foot 1.2

                //foot 1.3
                gPush();{
                    setColor(vec4(1.0,0.45,0.24,1.0));
                    gTranslate(-0.19, -0.85, 0.6);
                    gRotate(45, 0, 1, 0);
                    gScale(0.11, 0.11, 0.25);
                    drawSphere();

                }gPop(); // foot 1.3

                 //foot 2.1
                gPush();{
                    setColor(vec4(1.0,0.45,0.24,1.0));
                    gTranslate(0.44, -0.85, 0.6);
                    gRotate(45, 0, 1, 0);
                    gScale(0.11, 0.11, 0.25);
                    drawSphere();

                }gPop(); // foot 2.1

                //foot 2.2
                gPush();{
                    setColor(vec4(1.0,0.45,0.24,1.0));
                    gTranslate(0.29, -0.85, 0.6);
                    gScale(0.11, 0.11, 0.25);
                    drawSphere();

                }gPop(); // foot 2.2

                //foot 2.3
                gPush();{
                    setColor(vec4(1.0,0.45,0.24,1.0));
                    gTranslate(0.19, -0.85, 0.6);
                    gRotate(-45, 0, 1, 0);
                    gScale(0.11, 0.11, 0.25);
                    drawSphere();

                }gPop(); // foot 2.3
            }gPop(); // foot movement

            //Head
            gPush();{
                // Head movement here
                // Set snow texture for ground
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
                gl.uniform1i(gl.getUniformLocation(program, "useTextures"), 0);
                gTranslate(0, 1.3, 0);
                gRotate(headRotation[1],0,1,0);
                gRotate(headRotation[2],0,0,2);
               
                // Rotate, Scale, and draw
                gPush();{
                    gRotate(90, 0, 1, 0);
                    gRotate(45, 0, 0, 1);
                    gScale(0.5, 0.5, 0.5);
                    drawSphere();
                }gPop();

                //eyes
                gPush();{
                    // UnSet penguin Texture 
                    gl.bindTexture(gl.TEXTURE_2D, null);  
                    gl.uniform1i(gl.getUniformLocation(program, "useTextures"), 1); 

                    // Set Colour
                    setColor(vec4(0.14,0.14,0.24,1.0));

                    gTranslate(-0.15, 0.15, 0.4);
                    gScale(0.07, 0.09, 0.09);
                    drawSphere();

                }gPop(); //eye 1

                gPush();{
                    gTranslate(0.15, 0.15, 0.4);
                    gScale(0.07, 0.09, 0.09);
                    drawSphere();
                }gPop(); //eye 2

                // nose
                gPush();{
                    setColor(vec4(1.0,0.45,0.24,1.0));
                    gTranslate(0, -0.05, 0.5);
                    gScale(0.25, 0.15, 0.8);
                    drawCone();

                }gPop(); // nose

                // ADD HAT
                gPush();{
                    gScale(0.8, 0.8, 0.8);
                    gPush();{
                        setColor(vec4(0.4,0.0,0.8,1.0)); 
                        gTranslate(0, 0.2, -0.1);

                        gPush();{
                            gRotate(-25, 1, 0, 0);  
                            gScale(1, 0.07, 1);
                            drawSphere();
                        }gPop();

                        gPush();{
                            gTranslate(0, 0.5, -0.2);
                            gRotate(90, 1, 0, 0);  
                            gRotate(-25, 1, 0, 0); 
                            gScale(1.07, 1.07, 1.07); 
                            drawCylinder();
                        }gPop();

                        gPush();{
                            setColor(vec4(0.95,0.9,1.0,1.0)); 
                            gTranslate(0, 0.2, -0.05);
                            gRotate(90, 1, 0, 0);  
                            gRotate(-25, 1, 0, 0); 
                            gScale(1.17, 1.17, 0.37); 
                            drawCylinder();
                        } gPop();   
                    }gPop();
                }gPop();
            }gPop(); // head
            
        }gPop(); // Penguin body
    }gPop(); //Jumpying pop
}
function drawSnowMan(){
     gPush();{
        setColor(vec4(1.0,1.0,1.0,1.0));
        gTranslate(0, -1.5, 0);
        drawSphere();

        // MIDDLE SNOW BALL
        gPush();{
            gTranslate(0, 1.5, 0);

            // scale and draw
            gPush();{
                gScale(0.8, 0.8, 0.8);
                drawSphere();
            }gPop(); 

            gPush();{
                setColor(vec4(0.14,0.14,0.24,1.0));
                gTranslate(0, 0.4, 0.7);
                gScale(0.1, 0.1, 0.1);
                drawSphere();
            }gPop();

            gPush();{
                setColor(vec4(0.14,0.14,0.24,1.0));
                gTranslate(0, 0, 0.8);
                gScale(0.1, 0.1, 0.1);
                drawSphere();
            }gPop();

            gPush();{
                setColor(vec4(0.14,0.14,0.24,1.0));
                gTranslate(0, -0.4, 0.7);
                gScale(0.1, 0.1, 0.1);
                drawSphere();
            }gPop();

            // SNOW MAN ARMS
            snowLeftArm();
            snowRightArm();

            // HEAD
            //disco head movement
            gPush();{
                // Head movement here
                gRotate(headRotation[1],0,1,0);
                gRotate(headRotation[2],0,0,2);

                gPush();{
                    setColor(vec4(1.0,1.0,1.0,1.0));
                    gTranslate(0, 1.1, 0);

                    gPush();{
                        gScale(0.54, 0.54, 0.54);
                        drawSphere();
                    }gPop();

                    // face
                    // left eye
                    gPush();{
                        setColor(vec4(0.14,0.14,0.24,1.0));
                        gTranslate(-0.15, 0.25, 0.45);
                        gScale(0.08, 0.08, 0.08);
                        drawSphere();

                    }gPop();
                    // right eye
                    gPush();{
                        setColor(vec4(0.14,0.14,0.24,1.0));
                        gTranslate(0.17, 0.25, 0.45);
                        gScale(0.08, 0.08, 0.08);
                        drawSphere();

                    }gPop();

                    // Nose
                    gPush();{
                        setColor(vec4(1.0,0.45,0.24,1.0));
                        gTranslate(0, 0.1, 0.6);
                        gScale(0.15, 0.15, 1);
                        drawCone();
                    }gPop();

                    // smile :)
                    gPush();{
                        setColor(vec4(0.14,0.14,0.24,1.0));
                        gTranslate(0.25, -0.1, 0.48);
                        gScale(0.07, 0.07, 0.07);
                        drawSphere();

                    }gPop();

                    gPush();{
                        gTranslate(0.13, -0.15, 0.5);
                        gScale(0.07, 0.07, 0.07);
                        drawSphere();

                    }gPop();

                    gPush();{
                        gTranslate(0, -0.17, 0.5);
                        gScale(0.07, 0.07, 0.07);
                        drawSphere();

                    }gPop();

                    gPush();{
                        gTranslate(-0.13, -0.15, 0.5);
                        gScale(0.07, 0.07, 0.07);
                        drawSphere();

                    }gPop();

                    //other size of the smile
                    gPush();{
                        setColor(vec4(0.14,0.14,0.24,1.0));
                        gTranslate(-0.25, -0.1, 0.48);
                        gScale(0.07, 0.07, 0.07);
                        drawSphere();

                    }gPop();

                    // ADD HAT
                    gPush();{
                        setColor(vec4(0.14,0.14,0.24,1.0)); 
                        gTranslate(0, 0.4, -0.1);

                        gPush();{
                            gRotate(-20, 1, 0, 0);  
                            gScale(1, 0.07, 1);
                            drawSphere();
                        }gPop();

                        gPush();{
                            gTranslate(0, 0.5, -0.1);
                            gRotate(90, 1, 0, 0);  
                            gRotate(-20, 1, 0, 0);  
                            drawCylinder();
                        }gPop();

                        gPush();{
                            setColor(vec4(1.0,0.0,0.0,1.0)); 
                            gTranslate(0, 0.2, 0);
                            gRotate(90, 1, 0, 0);  
                            gRotate(-20, 1, 0, 0); 
                            gScale(1.1, 1.1, 0.3); 
                            drawCylinder();
                        } gPop();   
                    }gPop();
                }gPop();
            }gPop();// snowman Head
        }gPop();

    }gPop();
}

function drawSun(){
    gPush();{
        // UnSet Snow Texture to draw snow Man with Colour
        gl.bindTexture(gl.TEXTURE_2D, null);  
        gl.uniform1i(gl.getUniformLocation(program, "useTextures"), 1); 

        // Set the glowColor uniform to a bright yellow glow
        var glowColorLocation = gl.getUniformLocation(program, "glowColor");
        gl.uniform4f(glowColorLocation, 1.0, 0.7, 0.0, 1.0); // Yellow glow

        setColor(vec4(1.0,0.9,0.3,1.0));
        gTranslate(3, 5, -3); 
        drawSphere();

        // Set the glowColor uniform to a bright yellow glow
        var glowColorLocation = gl.getUniformLocation(program, "glowColor");
        gl.uniform4f(glowColorLocation, 1.0, 0.3, 0.0, 1.0); // Yellow-orangey glow

        // Draw sun spike top
        gPush();{
            gTranslate(0, 1.3, 0);
            gRotate(-90, 1, 0, 0);
            gScale(0.2, 0.2, 0.8);
            drawCone();
        }gPop(); // spike top

        // Draw sun spike right
        gPush();{
            gTranslate(1.3, 0, 0); 
            gRotate(90, 0, 1, 0);
            gScale(0.2, 0.2, 0.8);
            drawCone();
        }gPop(); // spike right


        // Draw sun spike left
        gPush();{
            gTranslate(-1.3, 0, 0); 
            gRotate(-90, 0, 1, 0);
            gScale(0.2, 0.2, 0.8);
            drawCone();
        }gPop(); // spike left

        // Draw sun spike bottem
        gPush();{
            gTranslate(0, -1.3, 0);
            gRotate(90, 1, 0, 0);
            gScale(0.2, 0.2, 0.8);
            drawCone();
        }gPop(); // spike bottom

        // Draw sun spike top left
        gPush();{
            gTranslate(-0.65, 0.65, 0);
            gRotate(-90, 1, 1, 0);
            gScale(0.2, 0.2, 0.8);
            drawCone();
        }gPop(); // spike top left

        // Draw sun spike top right
        gPush();{
            gTranslate(0.65, 0.65, 0); 
            gRotate(90, 0, 1, 0);
            gRotate(-45, 1, 0, 0);
            gScale(0.2, 0.2, 0.8);
            drawCone();
        }gPop(); // spike top right


        // Draw sun spike bottem right
        gPush();{
            gTranslate(0.65, -0.65, 0); 
            gRotate(90, 1, 1, 0);
            gScale(0.2, 0.2, 0.8);
            drawCone();
        }gPop(); // spike bottem right

        // Draw sun spike bottem
        gPush();{
            gTranslate(-0.65, -0.65, 0);
            gRotate(-90, 0, 1, 0);
            gRotate(45, 1, 0, 0);
            gScale(0.2, 0.2, 0.8);
            drawCone();
        }gPop(); // spike bottom

    }gPop(); //sun
}
// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

function render(timestamp) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute delta time
    dt = (timestamp - prevTime) / 1000.0;
    prevTime = timestamp;
    
    // Calcuate angle, set radius and speed of eye
    const radius = 10.0;
    const camSpeed = 0.4; 
    let angle = camSpeed * timestamp / 1000.0;
    
    // Calculate new camera position on the circle.
    let camX = radius * Math.sin(angle);
    let camZ = radius * Math.cos(angle);
    
    // Set eye, up and at
    eye = vec3(camX, 5, camZ);
    at = vec3(0, 1, 0);
    up = vec3(0, 1, 0);

    // Reset the modeling matrix stack and initialize to identity.
    MS = [];
    modelMatrix = mat4();
    
    // Set the camera view so that the camera always looks at the showman.
    viewMatrix = lookAt(eye, at, up);
    
    // Set the projection matrix 
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    // Set all matrices 
    setAllMatrices();
    
    // DISCO DANCING SNOWMAN
    const speed = 120;

    // DICSO arm movement
    if (!switchArms) {
        leftShoulderAngle[1] += speed * dt * direction;
        leftShoulderAngle[2] += speed * dt * direction;
        leftElbowAngle[1] += speed * dt * direction;
        leftElbowAngle[2] += speed * dt * direction;
    } 

    // Reverse direction when reaching limits 
    if (leftShoulderAngle[2] >= 45 || leftShoulderAngle[2] <= -60 
        || leftShoulderAngle[1] >= 120 || leftShoulderAngle[1] <= 0) {
        direction *= -1;
    }

    // DISCO HEAD movement  
    headRotation[1] += speed * dt * (-direction);

	// Set snow texture for ground
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
	gl.uniform1i(gl.getUniformLocation(program, "useTextures"), 0);

    // Add slight Blue glow
    var glowColorLocation = gl.getUniformLocation(program, "glowColor");
    gl.uniform4f(glowColorLocation, 0.0, 0.0, 0.1, 0.1);

    // penguin Dance
    // Arm Movement
    let armSpeed = 0.02; 
    let armAmplitude = 15; 

    armRotation1 = Math.sin(prevTime * armSpeed) * armAmplitude;
    armRotation2 = -Math.sin(prevTime * armSpeed) * armAmplitude;

    // Jump movement
    let jumpSpeed = 0.005; 
    let jumpAmplitude = 0.5; 
    let footAmplitude = 7.5; 

    penguinJump = Math.max(0, Math.sin(prevTime * jumpSpeed) * jumpAmplitude);
    feetJump = Math.sin((prevTime * jumpSpeed) + Math.PI / 2) * footAmplitude;

    // Draw Ground
	gPush();
	{
        gTranslate(0, -3, 0);
	    gRotate(30,0,1,0);
        gScale(6.5,0.8,6.6);
		drawCube();
	}
	gPop();

    // UnSet Snow Texture to draw snow Man with Colour
    gl.bindTexture(gl.TEXTURE_2D, null);  
    gl.uniform1i(gl.getUniformLocation(program, "useTextures"), 1); 

    // Draw Disco Dancing Snowman
    gPush();{
        gTranslate(-1, -0.5, 0);
        gScale(0.8, 0.8, 0.8);
        drawSnowMan();
    }gPop();

    // Set penguin texture for penguin body
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "useTextures"), 0);

    gPush();{
        gTranslate(0.2, -0.5, 1);
        gScale(0.8, 0.8, 0.8);
        drawPenguin();
    }gPop();

    // Draw sun
    drawSun();
    window.requestAnimFrame(render);
}

