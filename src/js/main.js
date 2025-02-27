// 使用 CDN 导入 Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { MDLParser } from './MDLParser.js';

// 添加 JSZip 库
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
document.head.appendChild(script);

let scene, camera, renderer, controls;
let cornerRenderer;  // 新增右上角渲染器
let mdlParser;
let currentModel;
let cornerAxesHelper, cornerCamera, cornerScene;
let mixer;  // 添加动画混合器
let clock;  // 添加时钟对象
let currentActions = [];  // 当前动画动作列表

// 初始化场景
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // 创建主渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 创建右上角渲染器，增大初始大小
    const cornerSize = Math.min(window.innerWidth, window.innerHeight) * 0.2;  // 增大到20%
    cornerRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    cornerRenderer.setSize(cornerSize, cornerSize);
    cornerRenderer.domElement.style.position = 'absolute';
    cornerRenderer.domElement.style.right = '20px';  // 稍微调整位置
    cornerRenderer.domElement.style.top = '20px';
    cornerRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(cornerRenderer.domElement);

    // 创建轨道控制器
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 创建MDL解析器
    mdlParser = new MDLParser();

    // 创建时钟对象
    clock = new THREE.Clock();

    // 添加窗口大小变化监听
    window.addEventListener('resize', onWindowResize, false);
}

// 初始化右上角坐标轴
function initCornerAxes() {
    // 创建右上角的坐标轴，增加轴线长度
    cornerAxesHelper = new THREE.AxesHelper(100);
    cornerAxesHelper.scale.set(1, 1, 1);  // 增大坐标轴整体比例
    
    // 创建一个新的正交相机用于右上角显示，增大视野范围
    cornerCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 1000);
    cornerCamera.position.set(0, 0, 200);
    cornerCamera.lookAt(0, 0, 0);
    
    // 创建一个新的场景用于右上角显示
    cornerScene = new THREE.Scene();
    cornerScene.add(cornerAxesHelper);
}

// 更新场景辅助元素
function updateSceneHelpers(size) {
    // 移除旧的辅助元素
    scene.children = scene.children.filter(child => 
        !(child instanceof THREE.GridHelper || child instanceof THREE.AxesHelper)
    );

    // 计算合适的网格大小（使用模型尺寸的2倍，并向上取整到最接近的2的倍数）
    const gridSize = Math.ceil(Math.max(size.x, size.y, size.z) * 2 / 2) * 2;
    const divisions = 10;  // 网格分段数

    // 添加新的网格辅助线
    const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x444444, 0x444444);
    gridHelper.position.y = -0.001;
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    gridHelper.material.depthWrite = false;
    scene.add(gridHelper);

    // 确保右上角坐标轴已初始化
    if (!cornerAxesHelper) {
        initCornerAxes();
    }
}

// 更新控制界面的值
function updateControlValues(rotation, scale) {
    // 更新旋转控件
    document.getElementById('rotation-x').value = rotation.x * 180 / Math.PI;
    document.getElementById('rotation-x-value').value = rotation.x * 180 / Math.PI;
    document.getElementById('rotation-y').value = rotation.y * 180 / Math.PI;
    document.getElementById('rotation-y-value').value = rotation.y * 180 / Math.PI;
    document.getElementById('rotation-z').value = rotation.z * 180 / Math.PI;
    document.getElementById('rotation-z-value').value = rotation.z * 180 / Math.PI;

    // 更新缩放控件
    document.getElementById('scale').value = scale;
    document.getElementById('scale-value').value = scale;
}

// 更新动画控制界面
function updateAnimationControls(actions) {
    const animationSelect = document.getElementById('animation-select');
    const animationControls = document.getElementById('animation-controls');
    
    // 清空现有选项
    animationSelect.innerHTML = '';
    
    if (actions && actions.length > 0) {
        // 显示动画控制界面
        animationControls.style.display = 'block';
        
        // 添加动画选项
        actions.forEach((action, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = action.getClip().name || `动画 ${index + 1}`;
            animationSelect.appendChild(option);
        });
        
        // 更新当前动画列表
        currentActions = actions;
    } else {
        // 隐藏动画控制界面
        animationControls.style.display = 'none';
        currentActions = [];
    }
}

// 设置控制界面的事件处理
function setupControls() {
    // 旋转 X 轴控制
    const rotationX = document.getElementById('rotation-x');
    const rotationXValue = document.getElementById('rotation-x-value');
    rotationX.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) * Math.PI / 180;
        rotationXValue.value = e.target.value;
        mdlParser.setRotation(value, mdlParser.getRotation().y, mdlParser.getRotation().z);
    });
    rotationXValue.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value) * Math.PI / 180;
        rotationX.value = e.target.value;
        mdlParser.setRotation(value, mdlParser.getRotation().y, mdlParser.getRotation().z);
    });

    // 旋转 Y 轴控制
    const rotationY = document.getElementById('rotation-y');
    const rotationYValue = document.getElementById('rotation-y-value');
    rotationY.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) * Math.PI / 180;
        rotationYValue.value = e.target.value;
        mdlParser.setRotation(mdlParser.getRotation().x, value, mdlParser.getRotation().z);
    });
    rotationYValue.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value) * Math.PI / 180;
        rotationY.value = e.target.value;
        mdlParser.setRotation(mdlParser.getRotation().x, value, mdlParser.getRotation().z);
    });

    // 旋转 Z 轴控制
    const rotationZ = document.getElementById('rotation-z');
    const rotationZValue = document.getElementById('rotation-z-value');
    rotationZ.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) * Math.PI / 180;
        rotationZValue.value = e.target.value;
        mdlParser.setRotation(mdlParser.getRotation().x, mdlParser.getRotation().y, value);
    });
    rotationZValue.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value) * Math.PI / 180;
        rotationZ.value = e.target.value;
        mdlParser.setRotation(mdlParser.getRotation().x, mdlParser.getRotation().y, value);
    });

    // 缩放控制
    const scale = document.getElementById('scale');
    const scaleValue = document.getElementById('scale-value');
    scale.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        scaleValue.value = value;
        mdlParser.setScale(value);
    });
    scaleValue.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        scale.value = value;
        mdlParser.setScale(value);
    });

    // 文件输入控制
    const fileInput = document.getElementById('file-input');
    const fileName = document.getElementById('file-name');
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 显示文件名
            fileName.textContent = file.name;
            
            try {
                const buffer = await file.arrayBuffer();
                // 如果场景中已有模型，先移除它
                if (currentModel) {
                    scene.remove(currentModel);
                }
                
                // 停止之前的动画混合器
                if (mixer) {
                    mixer.stopAllAction();
                }
                
                // 解析并添加新模型
                const result = await mdlParser.parse(buffer, {
                    rotationX: -Math.PI / 2,
                    rotationY: 0,
                    rotationZ: 0
                });
                
                currentModel = result.group;
                mixer = result.mixer;  // 保存新的动画混合器
                
                // 更新动画控制界面
                updateAnimationControls(result.actions);

                // 计算模型包围盒
                const box = new THREE.Box3().setFromObject(currentModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                // 将模型底部中心对齐到 XY 平面
                currentModel.position.set(
                    -center.x,
                    -box.min.y,  // 使用包围盒的最低点
                    -center.z
                );

                scene.add(currentModel);

                // 更新场景辅助元素以适应模型大小
                updateSceneHelpers(size);

                // 调整相机位置以适应模型大小
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;
                
                // 调整相机位置，使其对准模型中心
                camera.position.set(0, maxDim * 0.5, cameraZ);
                camera.lookAt(0, maxDim * 0.25, 0);
                controls.target.set(0, maxDim * 0.25, 0);
                controls.update();
                
                // 更新控制界面的值
                updateControlValues(mdlParser.getRotation(), mdlParser.getScale());
            } catch (error) {
                console.error('Error loading MDL file:', error);
                alert('加载模型时出错：' + error.message);
                fileName.textContent = '加载失败';
            }
        }
    });

    // 渲染模式切换
    const renderModeInputs = document.getElementsByName('render-mode');
    renderModeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (mdlParser) {
                mdlParser.setRenderMode(e.target.value);
            }
        });
    });
}

// 设置动画控制界面的事件处理
function setupAnimationControls() {
    const animationSelect = document.getElementById('animation-select');
    const playButton = document.getElementById('animation-play');
    const stopButton = document.getElementById('animation-stop');
    const speedControl = document.getElementById('animation-speed');
    const loopToggle = document.getElementById('animation-loop');
    
    // 动画选择
    animationSelect.addEventListener('change', (e) => {
        const index = parseInt(e.target.value);
        if (currentActions[index]) {
            // 停止所有动画
            currentActions.forEach(action => action.stop());
            // 播放选中的动画
            const action = currentActions[index];
            action.setLoop(loopToggle.checked ? THREE.LoopRepeat : THREE.LoopOnce);
            action.setEffectiveTimeScale(parseFloat(speedControl.value));
            action.play();
        }
    });
    
    // 播放按钮
    playButton.addEventListener('click', () => {
        const index = parseInt(animationSelect.value);
        if (currentActions[index]) {
            currentActions[index].play();
        }
    });
    
    // 停止按钮
    stopButton.addEventListener('click', () => {
        const index = parseInt(animationSelect.value);
        if (currentActions[index]) {
            currentActions[index].stop();
        }
    });
    
    // 速度控制
    speedControl.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        const index = parseInt(animationSelect.value);
        if (currentActions[index]) {
            currentActions[index].setEffectiveTimeScale(speed);
        }
    });
    
    // 循环控制
    loopToggle.addEventListener('change', (e) => {
        const index = parseInt(animationSelect.value);
        if (currentActions[index]) {
            currentActions[index].setLoop(e.target.checked ? THREE.LoopRepeat : THREE.LoopOnce);
        }
    });
}

// 窗口大小变化处理
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 更新右上角渲染器大小，增大显示区域
    const cornerSize = Math.min(window.innerWidth, window.innerHeight) * 0.2;  // 增大到20%
    cornerRenderer.setSize(cornerSize, cornerSize);
    
    // 更新右上角相机，保持更大的视野范围
    if (cornerCamera) {
        cornerCamera.left = -100;
        cornerCamera.right = 100;
        cornerCamera.top = 100;
        cornerCamera.bottom = -100;
        cornerCamera.updateProjectionMatrix();
    }
}

// 修改动画循环函数
function animate() {
    requestAnimationFrame(animate);
    
    // 更新动画混合器
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }
    
    controls.update();
    
    // 主场景渲染
    renderer.render(scene, camera);
    
    // 如果右上角坐标轴已初始化，则渲染它
    if (cornerAxesHelper) {
        cornerAxesHelper.rotation.copy(camera.rotation);
        cornerRenderer.render(cornerScene, cornerCamera);
    }
}

// 简化导出功能
window.exportModel = async function(format) {
    if (!currentModel) {
        showExportStatus('请先加载模型！', true);
        return;
    }

    try {
        const gltfExporter = new GLTFExporter();
        const result = await new Promise((resolve, reject) => {
            gltfExporter.parse(currentModel, 
                (gltf) => resolve(gltf),
                (error) => reject(error),
                { 
                    binary: true,
                    embedImages: true // 嵌入纹理
                }
            );
        });

        // 下载 GLB 文件
        const blob = new Blob([result], { type: 'application/octet-stream' });
        downloadFile(blob, 'model.glb');

        showExportStatus('模型已成功导出为 GLB 格式');
    } catch (error) {
        console.error('导出错误:', error);
        showExportStatus(`导出失败: ${error.message}`, true);
    }
}

// 将纹理转换为图片数据
async function textureToImage(texture) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        const context = canvas.getContext('2d');
        context.drawImage(texture.image, 0, 0);
        resolve(canvas.toDataURL('image/png'));
    });
}

// 下载文件
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 显示导出状态提示
function showExportStatus(message, isError = false) {
    let statusElement = document.querySelector('.export-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.className = 'export-status';
        document.body.appendChild(statusElement);
    }

    statusElement.textContent = message;
    statusElement.style.background = isError ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,0,0.8)';
    statusElement.classList.add('show');

    // 移除动画类并重新添加以触发动画
    void statusElement.offsetWidth;
    statusElement.classList.remove('show');
    void statusElement.offsetWidth;
    statusElement.classList.add('show');

    // 3秒后隐藏提示
    setTimeout(() => {
        statusElement.classList.remove('show');
    }, 3000);
}

// 启动应用
init();
setupControls();
setupAnimationControls();  // 添加动画控制界面设置
animate(); 