var ASPECT_RATIO = 16 / 9;

var window_aspect_ratio = window.innerWidth / window.innerHeight;
if(window_aspect_ratio > ASPECT_RATIO){
	var scene_height = window.innerHeight;
	var scene_width = Math.round(scene_height * ASPECT_RATIO);
} else {
	var scene_width = window.innerWidth;
	var scene_height = Math.round(scene_width / ASPECT_RATIO);
}

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(28, ASPECT_RATIO, 0.1, 1000);

var renderer;

var testcanvas = document.createElement('canvas');
var isWebGL = true;
if(!testcanvas.getContext("webgl") && !window.WebGLRenderingContext) isWebGL = false;

if (isWebGL)
	renderer = new THREE.WebGLRenderer();
else {
	alert("Please enable WebGL in your browser");
	window.location = "http://get.webgl.org/";
	//renderer = new THREE.CanvasRenderer();
}

renderer.setSize(scene_width, scene_height);

function sceneInit(){
	document.getElementById('wrapper').appendChild(renderer.domElement);
	$(renderer.domElement).attr('id', 'gamescreen').css({width: scene_width + 'px', height: scene_height + 'px'});
}

renderer.shadowMapSoft = true;


var Textures;
var jsonLoader;
var Materials;

window.Geometries = new function(){
	this.dice = new THREE.CubeGeometry(1,1,1);
	this.board = new THREE.CubeGeometry(7.2,0.2,7.2)
	this.devil = new THREE.SphereGeometry(0.25);
	this.thunderbolt = new THREE.CylinderGeometry(0.4, 0.4, 6);
}

var Lights = new function(){
	this.pointlight = new THREE.PointLight(0xd0d0d0);
	this.ambient = new THREE.AmbientLight(0x606060); // soft white light
	
	this.init = function(){
		this.pointlight.position.x = 0;
		this.pointlight.position.y = 100;
		this.pointlight.position.z = 80;
		scene.add(this.pointlight);
		
		scene.add(this.ambient);
	}
}

var projector = new THREE.Projector();

function getScreenXY(v){
	// Takes a vector v (point in space) and returns corresponding position on screen (x, y)
	var pv = projector.projectVector(v.clone(), camera);
	var w = renderer.domElement.clientWidth;
	var h = renderer.domElement.clientHeight;
	return {
		x: Math.round((pv.x + 1) * w / 2),
		y: Math.round((1 - pv.y) * h / 2)
	}
}

function initCamera(){
	camera.position.z = 10;
	camera.position.x = 10;
	camera.position.y = 9;
	camera.lookAt(new THREE.Vector3(-0.5,0,0.5));
}

function testCloseup(){
	var lookatface = new THREE.Vector3(0,1,0);
	var cameraposition = camera.position.clone();
	cameraposition.y = 2; // Closer to the ground
	cameraposition.add(devil.Mesh.position).setLength(5).add(devil.Mesh.position);
	console.log(cameraposition);
	camera.position = cameraposition.clone();
	lookatface.add(devil.Mesh.position);
	camera.lookAt(lookatface);
}

function cameraCloseup(state){
	var timelength = 1; // seconds
	if(!state){
		
		var lookatface = new THREE.Vector3(0,1,0);
		lookatface.add(devil.Mesh.position);
		var cameraposition = camera.position.clone();
		cameraposition.y = 2; // Closer to the ground
		cameraposition.add(devil.Mesh.position).setLength(5).add(devil.Mesh.position);
		var c = camera.clone();
		c.position = cameraposition.clone();
		c.lookAt(lookatface);	

		var state = {
			progress: 0,
			position_start: camera.position,
			position_end: c.position,
			rotation_start: camera.rotation,
			rotation_end: c.rotation,
			lookat_start: new THREE.Vector3(-0.5,0,0.5),
			lookat_end: lookatface
		};
		console.log(state);
	}
	state.progress += SPF / timelength;
	if(state.progress > 1) state.progress = 1;
	camera.position = state.position_start.lerp(state.position_end, state.progress);
	//camera.rotation = state.rotation_start.lerp(state.rotation_end, state.progress);
	camera.lookAt(state.lookat_start.lerp(state.lookat_end, state.progress));
	if(state.progress < 1) {
		Animations.start(function(){cameraCloseup(state)});
	}
}

function Render(){
	renderer.render(scene, camera);
}


var Shaders = {
	vAqui: [
	"varying vec2 vUv;",
	"varying vec3 vNormal;",
	"varying vec3 vCamera;",
	"uniform float morphTargetInfluences[ 8 ];",
	"void main() {",
		"vUv = uv;",
		"vNormal = normal;",
		"vNormal = mat3( modelMatrix[ 0 ].xyz, modelMatrix[ 1 ].xyz, modelMatrix[ 2 ].xyz ) * vNormal;", // World normal
		"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
		"vCamera = normalize( cameraPosition - worldPosition.xyz );",
		"vNormal = normalize( vNormal );",
		"vec3 morphed = vec3( 0.0 );",
		"morphed += ( morphTarget0 - position ) * morphTargetInfluences[ 0 ];",
		"morphed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];",
		"morphed += ( morphTarget2 - position ) * morphTargetInfluences[ 2 ];",
		"morphed += ( morphTarget3 - position ) * morphTargetInfluences[ 3 ];",
		"morphed += ( morphTarget4 - position ) * morphTargetInfluences[ 4 ];",
		"morphed += ( morphTarget5 - position ) * morphTargetInfluences[ 5 ];",
		"morphed += ( morphTarget6 - position ) * morphTargetInfluences[ 6 ];",
		"morphed += ( morphTarget7 - position ) * morphTargetInfluences[ 7 ];",
		"morphed += position;",
		"vec4 mvPosition;",
		"mvPosition = modelViewMatrix * vec4( morphed, 1.0 );",
		"gl_Position = projectionMatrix * mvPosition;",
	"}"].join("\n"),
	fAqui: [
	"uniform float opacity;",
	"varying vec2 vUv;",
	"varying vec3 vNormal;",
	"varying vec3 vCamera;",
	"uniform sampler2D map;",
	"void main() {",
		//"vec3 camera = vec3(10,7,10);",
		//"camera = normalize(camera);",
		"float dProd = max(0.0, dot(vNormal, vCamera));",
		"if (dProd > 0.3) { dProd = 1.0; } else { dProd = 0.7; }",
		"gl_FragColor = vec4( vec3 ( dProd ), opacity );",
		"vec4 texelColor = texture2D( map, vUv );",
		"gl_FragColor = gl_FragColor * texelColor;",
	"}"].join("\n"),
	fDice: [
		"uniform float opacity;",
		"uniform vec4 vHighlight;",
		"varying vec3 vLightFront;",
		"#ifdef DOUBLE_SIDED",
			"varying vec3 vLightBack;",
		"#endif",
		"#ifdef USE_COLOR",
			"varying vec3 vColor;",
		"#endif",
		"#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP )",
			"varying vec2 vUv;",
		"#endif",
		"#ifdef USE_MAP",
			"uniform sampler2D map;",
		"#endif",
		"#ifdef USE_LIGHTMAP",
			"varying vec2 vUv2;",
			"uniform sampler2D lightMap;",
		"#endif",
		"#ifdef USE_ENVMAP",
			"uniform float reflectivity;",
			"uniform samplerCube envMap;",
			"uniform float flipEnvMap;",
			"uniform int combine;",
			"#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP )",
				"uniform bool useRefract;",
				"uniform float refractionRatio;",
			"#else",
				"varying vec3 vReflect;",
			"#endif",
		"#endif",
		"#ifdef USE_FOG",
			"uniform vec3 fogColor;",
			"#ifdef FOG_EXP2",
				"uniform float fogDensity;",
			"#else",
				"uniform float fogNear;",
				"uniform float fogFar;",
			"#endif",
		"#endif",
		"#ifdef USE_SHADOWMAP",
			"uniform sampler2D shadowMap[ MAX_SHADOWS ];",
			"uniform vec2 shadowMapSize[ MAX_SHADOWS ];",
			"uniform float shadowDarkness[ MAX_SHADOWS ];",
			"uniform float shadowBias[ MAX_SHADOWS ];",
			"varying vec4 vShadowCoord[ MAX_SHADOWS ];",
			"float unpackDepth( const in vec4 rgba_depth ) {",
				"const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );",
				"float depth = dot( rgba_depth, bit_shift );",
				"return depth;",
			"}",
		"#endif",
		"#ifdef USE_SPECULARMAP",
			"uniform sampler2D specularMap;",
		"#endif",
		"void main() {",
			"gl_FragColor = vec4( vec3 ( 1.0 ), opacity );",
			"#ifdef USE_MAP",
				"vec4 texelColor = texture2D( map, vUv );",
				"#ifdef GAMMA_INPUT",
					"texelColor.xyz *= texelColor.xyz;",
				"#endif",
				"gl_FragColor = gl_FragColor * texelColor;",
			"#endif",
			"#ifdef ALPHATEST",
				"if ( gl_FragColor.a < ALPHATEST ) discard;",
			"#endif",
			"float specularStrength;",
			"#ifdef USE_SPECULARMAP",
				"vec4 texelSpecular = texture2D( specularMap, vUv );",
				"specularStrength = texelSpecular.r;",
			"#else",
				"specularStrength = 1.0;",
			"#endif",
			"#ifdef DOUBLE_SIDED",
				"if ( gl_FrontFacing )",
				"gl_FragColor.xyz *= vLightFront;",
				"else",
				"gl_FragColor.xyz *= vLightBack;",
			"#else",
				"gl_FragColor.xyz *= vLightFront;",
			"#endif",
			"#ifdef USE_LIGHTMAP",
				"gl_FragColor = gl_FragColor * texture2D( lightMap, vUv2 );",
			"#endif",
			"#ifdef USE_COLOR",
				"gl_FragColor = gl_FragColor * vec4( vColor, opacity );",
			"#endif",
			"#ifdef USE_ENVMAP",
				"vec3 reflectVec;",
			"#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP )",
				"vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );",
				"if ( useRefract ) {",
				"reflectVec = refract( cameraToVertex, normal, refractionRatio );",
				"} else { ",
				"reflectVec = reflect( cameraToVertex, normal );",
				"}",
			"#else",
				"reflectVec = vReflect;",
			"#endif",
			"#ifdef DOUBLE_SIDED",
				"float flipNormal = ( -1.0 + 2.0 * float( gl_FrontFacing ) );",
				"vec4 cubeColor = textureCube( envMap, flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );",
			"#else",
				"vec4 cubeColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );",
			"#endif",
			"#ifdef GAMMA_INPUT",
				"cubeColor.xyz *= cubeColor.xyz;",
			"#endif",
				"if ( combine == 1 ) {",
				"gl_FragColor.xyz = mix( gl_FragColor.xyz, cubeColor.xyz, specularStrength * reflectivity );",
				"} else if ( combine == 2 ) {",
				"gl_FragColor.xyz += cubeColor.xyz * specularStrength * reflectivity;",
				"} else {",
				"gl_FragColor.xyz = mix( gl_FragColor.xyz, gl_FragColor.xyz * cubeColor.xyz, specularStrength * reflectivity );",
				"}",
			"#endif",
			"#ifdef USE_SHADOWMAP",
				"#ifdef SHADOWMAP_DEBUG",
					"vec3 frustumColors[3];",
					"frustumColors[0] = vec3( 1.0, 0.5, 0.0 );",
					"frustumColors[1] = vec3( 0.0, 1.0, 0.8 );",
					"frustumColors[2] = vec3( 0.0, 0.5, 1.0 );",
				"#endif",
				"#ifdef SHADOWMAP_CASCADE",
					"int inFrustumCount = 0;",
					"#endif",
				"float fDepth;",
				"vec3 shadowColor = vec3( 1.0 );",
				"for( int i = 0; i < MAX_SHADOWS; i ++ ) {",
					"vec3 shadowCoord = vShadowCoord[ i ].xyz / vShadowCoord[ i ].w;",
					"bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );",
					"bool inFrustum = all( inFrustumVec );",
					"#ifdef SHADOWMAP_CASCADE",
						"inFrustumCount += int( inFrustum );",
						"bvec3 frustumTestVec = bvec3( inFrustum, inFrustumCount == 1, shadowCoord.z <= 1.0 );",
					"#else",
						"bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );",
					"#endif",
					"bool frustumTest = all( frustumTestVec );",
					"if ( frustumTest ) {",
						"shadowCoord.z += shadowBias[ i ];",
						"#if defined( SHADOWMAP_TYPE_PCF )",
							"float shadow = 0.0;",
							"const float shadowDelta = 1.0 / 9.0;",
							"float xPixelOffset = 1.0 / shadowMapSize[ i ].x;",
							"float yPixelOffset = 1.0 / shadowMapSize[ i ].y;",
							"float dx0 = -1.25 * xPixelOffset;",
							"float dy0 = -1.25 * yPixelOffset;",
							"float dx1 = 1.25 * xPixelOffset;",
							"float dy1 = 1.25 * yPixelOffset;",
							"fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy0 ) ) );",
							"if ( fDepth < shadowCoord.z ) shadow += shadowDelta;",
							"fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy0 ) ) );",
							"if ( fDepth < shadowCoord.z ) shadow += shadowDelta;",
							"fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy0 ) ) );",
							"if ( fDepth < shadowCoord.z ) shadow += shadowDelta;",
							"fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, 0.0 ) ) );",
							"if ( fDepth < shadowCoord.z ) shadow += shadowDelta;",
							"fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy ) );",
							"if ( fDepth < shadowCoord.z ) shadow += shadowDelta;",
							"fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, 0.0 ) ) );",
							"if ( fDepth < shadowCoord.z ) shadow += shadowDelta;",
							"fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy1 ) ) );",
							"if ( fDepth < shadowCoord.z ) shadow += shadowDelta;",
							"fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy1 ) ) );",
							"if ( fDepth < shadowCoord.z ) shadow += shadowDelta;",
							"fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy1 ) ) );",
							"if ( fDepth < shadowCoord.z ) shadow += shadowDelta;",
							"shadowColor = shadowColor * vec3( ( 1.0 - shadowDarkness[ i ] * shadow ) );",
						"#elif defined( SHADOWMAP_TYPE_PCF_SOFT )",
							"float shadow = 0.0;",
							"float xPixelOffset = 1.0 / shadowMapSize[ i ].x;",
							"float yPixelOffset = 1.0 / shadowMapSize[ i ].y;",
							"float dx0 = -1.0 * xPixelOffset;",
							"float dy0 = -1.0 * yPixelOffset;",
							"float dx1 = 1.0 * xPixelOffset;",
							"float dy1 = 1.0 * yPixelOffset;",
							"mat3 shadowKernel;",
							"mat3 depthKernel;",
							"depthKernel[0][0] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy0 ) ) );",
							"if ( depthKernel[0][0] < shadowCoord.z ) shadowKernel[0][0] = 0.25;",
							"else shadowKernel[0][0] = 0.0;",
							"depthKernel[0][1] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, 0.0 ) ) );",
							"if ( depthKernel[0][1] < shadowCoord.z ) shadowKernel[0][1] = 0.25;",
							"else shadowKernel[0][1] = 0.0;",
							"depthKernel[0][2] = unpackDepth( texture2D( shadowMap[ i], shadowCoord.xy + vec2( dx0, dy1 ) ) );",
							"if ( depthKernel[0][2] < shadowCoord.z ) shadowKernel[0][2] = 0.25;",
							"else shadowKernel[0][2] = 0.0;",
							"depthKernel[1][0] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy0 ) ) );",
							"if ( depthKernel[1][0] < shadowCoord.z ) shadowKernel[1][0] = 0.25;",
							"else shadowKernel[1][0] = 0.0;",
							"depthKernel[1][1] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy ) );",
							"if ( depthKernel[1][1] < shadowCoord.z ) shadowKernel[1][1] = 0.25;",
							"else shadowKernel[1][1] = 0.0;",
							"depthKernel[1][2] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy1 ) ) );",
							"if ( depthKernel[1][2] < shadowCoord.z ) shadowKernel[1][2] = 0.25;",
							"else shadowKernel[1][2] = 0.0;",
							"depthKernel[2][0] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy0 ) ) );",
							"if ( depthKernel[2][0] < shadowCoord.z ) shadowKernel[2][0] = 0.25;",
							"else shadowKernel[2][0] = 0.0;",
							"depthKernel[2][1] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, 0.0 ) ) );",
							"if ( depthKernel[2][1] < shadowCoord.z ) shadowKernel[2][1] = 0.25;",
							"else shadowKernel[2][1] = 0.0;",
							"depthKernel[2][2] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy1 ) ) );",
							"if ( depthKernel[2][2] < shadowCoord.z ) shadowKernel[2][2] = 0.25;",
							"else shadowKernel[2][2] = 0.0;",
							"vec2 fractionalCoord = 1.0 - fract( shadowCoord.xy * shadowMapSize[i].xy );",
							"shadowKernel[0] = mix( shadowKernel[1], shadowKernel[0], fractionalCoord.x );",
							"shadowKernel[1] = mix( shadowKernel[2], shadowKernel[1], fractionalCoord.x );",
							"vec4 shadowValues;",
							"shadowValues.x = mix( shadowKernel[0][1], shadowKernel[0][0], fractionalCoord.y );",
							"shadowValues.y = mix( shadowKernel[0][2], shadowKernel[0][1], fractionalCoord.y );",
							"shadowValues.z = mix( shadowKernel[1][1], shadowKernel[1][0], fractionalCoord.y );",
							"shadowValues.w = mix( shadowKernel[1][2], shadowKernel[1][1], fractionalCoord.y );",
							"shadow = dot( shadowValues, vec4( 1.0 ) );",
							"shadowColor = shadowColor * vec3( ( 1.0 - shadowDarkness[ i ] * shadow ) );",
						"#else",
							"vec4 rgbaDepth = texture2D( shadowMap[ i ], shadowCoord.xy );",
							"float fDepth = unpackDepth( rgbaDepth );",
							"if ( fDepth < shadowCoord.z )",
							"shadowColor = shadowColor * vec3( 1.0 - shadowDarkness[ i ] );",
						"#endif",
					"}",
					"#ifdef SHADOWMAP_DEBUG",
						"#ifdef SHADOWMAP_CASCADE",
							"if ( inFrustum && inFrustumCount == 1 ) gl_FragColor.xyz *= frustumColors[ i ];",
						"#else",
							"if ( inFrustum ) gl_FragColor.xyz *= frustumColors[ i ];",
						"#endif",
					"#endif",
				"}",
				"#ifdef GAMMA_OUTPUT",
					"shadowColor *= shadowColor;",
				"#endif",
				"gl_FragColor.xyz = gl_FragColor.xyz * shadowColor;",
			"#endif",
			"#ifdef GAMMA_OUTPUT",
				"gl_FragColor.xyz = sqrt( gl_FragColor.xyz );",
			"#endif",
			"#ifdef USE_FOG",
				"float depth = gl_FragCoord.z / gl_FragCoord.w;",
				"#ifdef FOG_EXP2",
					"const float LOG2 = 1.442695;",
					"float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );",
					"fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );",
				"#else",
					"float fogFactor = smoothstep( fogNear, fogFar, depth );",
				"#endif",
				"gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );",
			"#endif",

			// Here goes highlighting
			"if(vHighlight.r > 0.0 || vHighlight.g > 0.0 || vHighlight.b > 0.0) {",

				"float hlum = vHighlight.r * 0.3 + vHighlight.g * 0.59 + vHighlight.b * 0.11;",
				"float flum = gl_FragColor.r * 0.3 + gl_FragColor.g * 0.59 + gl_FragColor.b * 0.11;",
				"flum *= 0.8;", // darker
				"float diff = flum - hlum;",
				"gl_FragColor.rgb = vec3(vHighlight.r + diff, vHighlight.g + diff, vHighlight.b + diff);",

				"float cMin = min(gl_FragColor.r, gl_FragColor.g);",
				"cMin = min(cMin, gl_FragColor.b);",

				"float cMax = max(gl_FragColor.r, gl_FragColor.g);",
				"cMax = max(cMax, gl_FragColor.b);",

				"if(cMin < 0.0){",
				"	gl_FragColor.r = flum + (((gl_FragColor.r - flum) * flum) / (flum - cMin));",
				"	gl_FragColor.g = flum + (((gl_FragColor.g - flum) * flum) / (flum - cMin));",
				"	gl_FragColor.b = flum + (((gl_FragColor.b - flum) * flum) / (flum - cMin));",
				"}",

				"if(cMax > 1.0){",
				"	gl_FragColor.r = flum + (((gl_FragColor.r - flum) * (1.0 - flum)) / (cMax - flum));",
				"	gl_FragColor.g = flum + (((gl_FragColor.g - flum) * (1.0 - flum)) / (cMax - flum));",
				"	gl_FragColor.b = flum + (((gl_FragColor.b - flum) * (1.0 - flum)) / (cMax - flum));",
				"}",

			"}",
		"}"
	].join("\n")
}

function aquiLoaded(geometry, materials){
	
	//console.log(materials[0].fragmentShader);
	//console.log(materials);
	Geometries.aqui = geometry;
	
	//Materials.aquired = new THREE.MeshFaceMaterial(materials);
	
	var uniforms = {
		map: {type: "t", value: materials[0].map }
	}
	
	var aquitoon = new THREE.ShaderMaterial({
		uniforms: uniforms,
	    vertexShader: Shaders.vAqui,
	    fragmentShader: Shaders.fAqui
	});
	
	Materials.aquired = new THREE.MeshFaceMaterial(new Array(aquitoon));
	$(document).trigger('eigh.aqui.loaded');
	window.aquiLoaded = true;
}
function cubeLoaded(geometry, materials){
	Geometries.roundcube = geometry;

	var lambertShader = THREE.ShaderLib['lambert'];
	var uniforms = THREE.UniformsUtils.clone(lambertShader.uniforms);

	// Modifying lambertShader

	var postprocess = "if(vHighlight.r > 0 || vHighlight.g > 0 || vHighlight.b > 0) {";
	postprocess += "gl_FragColor.xyz = vHighlight.rgb;";
	postprocess += "}";

	lambertShader.fragmentShader = "uniform vec4 vHighlight;\n" + lambertShader.fragmentShader;


	// ---

	uniforms['map'].value = materials[0].map;
	uniforms['vHighlight'] = {type: "v4", value: new THREE.Vector4( 0, 0, 0, 1)};
	
	var cubematerial = new THREE.ShaderMaterial({
		uniforms: uniforms,
	    vertexShader: lambertShader.vertexShader,
	    fragmentShader: Shaders.fDice,
	    lights: true,
	    color: 0xcccccc
	});
	cubematerial.map = true;

	//Materials.roundcube = new THREE.MeshFaceMaterial(materials);
	Materials.roundcube = new THREE.MeshFaceMaterial(new Array(cubematerial));

	var material_chained = cubematerial.clone();
	var material_sinked = cubematerial.clone();

	material_chained.map = true;
	material_sinked.map = true;
	material_chained.uniforms['map'].value = materials[0].map;
	material_sinked.uniforms['map'].value = materials[0].map;
	
	material_chained.uniforms['vHighlight'].value = new THREE.Vector4( 1, 0, 0, 1); // should be player color
	material_sinked.uniforms['vHighlight'].value = new THREE.Vector4( 1, 0, 0, 1); // should be player color
	material_sinked.transparent = true;
	material_sinked.opacity = 0.5;
	material_sinked.uniforms['opacity'].value = 0.5;
	

	Materials.roundcubechained = new THREE.MeshFaceMaterial(new Array(material_chained));
	Materials.roundcubesinked = new THREE.MeshFaceMaterial(new Array(material_sinked));

	//console.log('Material:', Materials.roundcubechained);
	//console.log(new Array(material_chained));

	$(document).trigger('eigh.cube.loaded');
}

var scene3d = new function(){
	this.init = function(){
		// Дополняем класс параметрами из вызова
		var properties = window.components.getProperties('scene');
		$.extend(self, properties);

		Textures = new function(){
			this.dice1 = new THREE.ImageUtils.loadTexture(imgdir + 'c1.png');
			this.dice2 = new THREE.ImageUtils.loadTexture(imgdir + 'c2.png');
			this.dice3 = new THREE.ImageUtils.loadTexture(imgdir + 'c3.png');
			this.dice4 = new THREE.ImageUtils.loadTexture(imgdir + 'c4.png');
			this.dice5 = new THREE.ImageUtils.loadTexture(imgdir + 'c5.png');
			this.dice6 = new THREE.ImageUtils.loadTexture(imgdir + 'c6.png');
			this.diceframe = new THREE.ImageUtils.loadTexture(imgdir + 'frame.png');
			this.marbleboard = new THREE.ImageUtils.loadTexture(imgdir + 'board.jpg', new THREE.UVMapping(), function(){
				$(document).trigger('Textures.loaded');
			});
		}

		jsonLoader = new THREE.JSONLoader();
		jsonLoader.load(JS_DIR + "cube.js", cubeLoaded);
		jsonLoader.load(JS_DIR + "Aqui_anim.js", aquiLoaded);

		Materials = new function(){

			var marbleboard = new THREE.MeshLambertMaterial({ambient: 0xdcdcdc, map: Textures.marbleboard});
			var grayboard = new THREE.MeshLambertMaterial({color: 0x999999});

			this.dummy = new THREE.MeshPhongMaterial({color: 0xdd0000});

			this.thunderbolt = new THREE.MeshLambertMaterial({emissive: 0xa6e9ff, color: 0xa6e9ff, transparent: true, opacity: 0.9});

			this.board = new THREE.MeshFaceMaterial([grayboard, grayboard, marbleboard, grayboard, grayboard, grayboard]);

			this.diceframe = new THREE.SpriteMaterial({
		  		map: Textures.diceframe,
		  		transparent: true,
		  		useScreenCoordinates: true,
		  		alignment: THREE.SpriteAlignment.topLeft
			});
		}

		window.components.loaded('scene');
	}
}
window.components.require(['config', 'constants'], scene3d.init);

