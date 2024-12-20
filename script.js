import * as THREE from 'three';

const video = document.getElementById('input');
const output = document.getElementById('output');

const charsFixed = [
  "_", "@", "@", "@", "@", "#", "#", "#", "#", "#", "$", "$", "$", "$", "%", "%", "&", "&", "8", "8", "B",
  ["0", "0"], ["o", "o", "*", "+", "+", "="], ["i", "☹︎"], ":", [":", "-"], ["d", "e", "a"], "'"
];
const chars = [...charsFixed];
const charsLength = chars.length;

const canvasWidth = 192;  
const canvasHeight = 64;

const videoTexture = new THREE.VideoTexture(video);
videoTexture.flipY = true;  

const renderTarget = new THREE.WebGLRenderTarget(canvasWidth, canvasHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.UnsignedByteType,
});

const material = new THREE.ShaderMaterial({
  uniforms: {
    videoTexture: { value: videoTexture },
    resolution: { value: new THREE.Vector2(canvasWidth, canvasHeight) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D videoTexture;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(videoTexture, vec2(vUv.x, 1.0 - vUv.y)); // Переворачиваем текстуру
      float brightness = (color.r + color.g + color.b) / 3.0;
      gl_FragColor = vec4(vec3(brightness), 1.0);
    }
  `
});

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(canvasWidth, canvasHeight);

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function brightnessToChar(brightness) {
  const index = Math.floor(brightness * (charsLength - 1));
  const char = chars[index];
  if (Array.isArray(char)) {
    return char[Math.floor(Math.random() * char.length)];
  }
  return char;
}

function animate() {
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  const pixels = new Uint8Array(canvasWidth * canvasHeight * 4);
  renderer.readRenderTargetPixels(renderTarget, 0, 0, canvasWidth, canvasHeight, pixels);

  let asciiOutput = '';
  for (let y = 0; y < canvasHeight; y++) {
    let row = '';
    for (let x = 0; x < canvasWidth; x++) {
      const i = (y * canvasWidth + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const brightness = (r + g + b) / (3 * 255);
      const char = brightnessToChar(brightness);
      row += `<span style="color: rgb(${r+30}, ${g-30}, ${b-30});">${char}</span>`;
    }
    asciiOutput += `<div>${row}</div>`;
  }

  output.innerHTML = asciiOutput;

  // Ограничиваем FPS до 30 кадров в секунду
  setTimeout(() => requestAnimationFrame(animate), 24);
}

video.onloadeddata = () => {
  video.play();
  video.playbackRate = 1 ; // Устанавливаем замедление в 2 раза
  animate();
};