import * as THREE from 'three';

// 添加 Buffer 类
class Buffer {
    constructor(arrayBuffer) {
        this.dataView = new DataView(arrayBuffer);
        this.offset = 0;
    }

    seek(offset) {
        if (offset < 0 || offset >= this.dataView.byteLength) {
            throw new Error(`Invalid seek offset: ${offset}`);
        }
        this.offset = offset;
    }

    getPosition() {
        return this.offset;
    }

    readInt32() {
        if (this.offset + 4 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Int32 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUint32() {
        if (this.offset + 4 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Uint32 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readInt16() {
        if (this.offset + 2 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Int16 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getInt16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readUint16() {
        if (this.offset + 2 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Uint16 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readFloat32() {
        if (this.offset + 4 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Float32 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readString(length) {
        if (this.offset + length > this.dataView.byteLength) {
            throw new Error(`Attempt to read string of length ${length} at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const bytes = new Uint8Array(this.dataView.buffer.slice(this.offset, this.offset + length));
        this.offset += length;
        // 找到第一个 null 字节的位置
        let nullPos = bytes.indexOf(0);
        if (nullPos === -1) nullPos = length;
        // 只解码到 null 字节
        return new TextDecoder().decode(bytes.slice(0, nullPos));
    }

    readUint8Array(count) {
        if (this.offset + count > this.dataView.byteLength) {
            throw new Error(`Attempt to read Uint8Array of length ${count} at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const array = new Uint8Array(this.dataView.buffer.slice(this.offset, this.offset + count));
        this.offset += count;
        return array;
    }

    readVector3() {
        return new THREE.Vector3(
            this.readFloat32(),
            this.readFloat32(),
            this.readFloat32()
        );
    }
}

export class MDLParser {
    constructor() {
        this.buffer = null;
        this.currentRotation = { x: -Math.PI / 2, y: 0, z: 0 };  // 默认 X 轴旋转 -90 度
        this.currentScale = 0.1;
        this.renderMode = 'textured';  // 'textured' 或 'wireframe'
        this.textureSizes = {};
    }

    // 读取基本数据类型
    readInt32() {
        if (this.offset + 4 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Int32 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUint32() {
        if (this.offset + 4 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Uint32 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUint16() {
        if (this.offset + 2 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Uint16 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readFloat32() {
        if (this.offset + 4 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Float32 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readString(length) {
        if (this.offset + length > this.dataView.byteLength) {
            throw new Error(`Attempt to read string of length ${length} at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const bytes = new Uint8Array(this.dataView.buffer.slice(this.offset, this.offset + length));
        this.offset += length;
        // 找到第一个 null 字节的位置
        let nullPos = bytes.indexOf(0);
        if (nullPos === -1) nullPos = length;
        // 只解码到 null 字节
        return new TextDecoder().decode(bytes.slice(0, nullPos));
    }

    readVector3() {
        return new THREE.Vector3(
            this.readFloat32(),
            this.readFloat32(),
            this.readFloat32()
        );
    }

    readInt16() {
        if (this.offset + 2 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Int16 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getInt16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readFloat32Array(count) {
        if (this.offset + count * 4 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Float32Array of length ${count} at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const array = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            array[i] = this.dataView.getFloat32(this.offset + i * 4, true);
        }
        this.offset += count * 4;
        return array;
    }

    readUint8Array(count) {
        if (this.offset + count > this.dataView.byteLength) {
            throw new Error(`Attempt to read Uint8Array of length ${count} at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const array = new Uint8Array(this.dataView.buffer.slice(this.offset, this.offset + count));
        this.offset += count;
        return array;
    }

    readUint8() {
        if (this.offset + 1 > this.dataView.byteLength) {
            throw new Error(`Attempt to read Uint8 at offset ${this.offset} exceeds buffer length ${this.dataView.byteLength}`);
        }
        const value = this.dataView.getUint8(this.offset);
        this.offset += 1;
        return value;
    }

    // 解析 MDL 文件头
    parseHeader(buffer) {
        const magic = buffer.readString(4);
        if (magic !== 'IDST') {
            throw new Error('Invalid MDL file format');
        }

        const version = buffer.readInt32();
        if (version !== 10) {
            throw new Error(`Unsupported MDL version: ${version}`);
        }
        
        const name = buffer.readString(64);
        const fileSize = buffer.readInt32();

        if (fileSize !== buffer.dataView.byteLength) {
            console.warn(`File size mismatch: header claims ${fileSize} bytes but buffer is ${buffer.dataView.byteLength} bytes`);
        }

        const eyePosition = buffer.readVector3();
        const min = buffer.readVector3();
        const max = buffer.readVector3();
        const bbmin = buffer.readVector3();
        const bbmax = buffer.readVector3();

        const flags = buffer.readInt32();
        
        const boneCount = buffer.readInt32();
        const boneOffset = buffer.readInt32();
        
        const boneControllerCount = buffer.readInt32();
        const boneControllerOffset = buffer.readInt32();
        
        const hitboxCount = buffer.readInt32();
        const hitboxOffset = buffer.readInt32();
        
        const sequenceCount = buffer.readInt32();
        const sequenceOffset = buffer.readInt32();
        
        const sequenceGroupCount = buffer.readInt32();
        const sequenceGroupOffset = buffer.readInt32();
        
        const textureCount = buffer.readInt32();
        const textureOffset = buffer.readInt32();
        const textureDataOffset = buffer.readInt32();

        const skinReferenceCount = buffer.readInt32();
        const skinFamilyCount = buffer.readInt32();
        const skinOffset = buffer.readInt32();

        const bodyPartCount = buffer.readInt32();
        const bodyPartOffset = buffer.readInt32();

        const attachmentCount = buffer.readInt32();
        const attachmentOffset = buffer.readInt32();

        const soundCount = buffer.readInt32();
        const soundOffset = buffer.readInt32();
        const soundGroupCount = buffer.readInt32();
        const soundGroupOffset = buffer.readInt32();

        const transitionCount = buffer.readInt32();
        const transitionOffset = buffer.readInt32();

        // 验证所有偏移值
        const offsets = {
            bone: boneOffset,
            boneController: boneControllerOffset,
            hitbox: hitboxOffset,
            sequence: sequenceOffset,
            sequenceGroup: sequenceGroupOffset,
            texture: textureOffset,
            textureData: textureDataOffset,
            skin: skinOffset,
            bodyPart: bodyPartOffset,
            attachment: attachmentOffset,
            sound: soundOffset,
            soundGroup: soundGroupOffset,
            transition: transitionOffset
        };

        for (const [name, offset] of Object.entries(offsets)) {
            if (offset < 0 || offset >= buffer.dataView.byteLength) {
                throw new Error(`Invalid ${name} offset: ${offset}`);
            }
        }

        return {
            version,
            name,
            fileSize,
            eyePosition,
            min,
            max,
            bbmin,
            bbmax,
            flags,
            boneCount,
            boneOffset,
            boneControllerCount,
            boneControllerOffset,
            hitboxCount,
            hitboxOffset,
            sequenceCount,
            sequenceOffset,
            sequenceGroupCount,
            sequenceGroupOffset,
            textureCount,
            textureOffset,
            textureDataOffset,
            skinReferenceCount,
            skinFamilyCount,
            skinOffset,
            bodyPartCount,
            bodyPartOffset,
            attachmentCount,
            attachmentOffset,
            soundCount,
            soundOffset,
            soundGroupCount,
            soundGroupOffset,
            transitionCount,
            transitionOffset
        };
    }

    // 解析骨骼数据
    parseBones(header) {
        const bones = [];
        this.buffer.seek(header.boneOffset);

        for (let i = 0; i < header.boneCount; i++) {
            try {
                const name = this.buffer.readString(32);
                const parent = this.buffer.readInt32();
                const flags = this.buffer.readInt32();
                const boneControllers = [
                    this.buffer.readInt32(),
                    this.buffer.readInt32(),
                    this.buffer.readInt32(),
                    this.buffer.readInt32(),
                    this.buffer.readInt32(),
                    this.buffer.readInt32()
                ];
                const pos = this.buffer.readVector3();
                const rot = this.buffer.readVector3();
                const posScale = this.buffer.readVector3();
                const rotScale = this.buffer.readVector3();

                bones.push({
                    name,
                    parent,
                    flags,
                    boneControllers,
                    pos,
                    rot,
                    posScale,
                    rotScale
                });
            } catch (error) {
                console.error(`Error parsing bone ${i}:`, error);
                throw error;
            }
        }

        return bones;
    }

    // 解析纹理数据
    parseTextures(header) {
        const textures = [];
        this.buffer.seek(header.textureOffset);

        for (let i = 0; i < header.textureCount; i++) {
            const name = this.buffer.readString(64);
            const flags = this.buffer.readInt32();
            const width = this.buffer.readInt32();
            const height = this.buffer.readInt32();
            const dataOffset = this.buffer.readInt32();

            // 存储纹理信息
            textures.push({
                name,
                flags,
                width,
                height,
                dataOffset,
                index: i
            });

            // 记录纹理尺寸映射
            this.textureSizes[i] = { width, height };
        }

        return textures;
    }

    // 解析网格数据
    parseMeshData(buffer) {
        try {
            const triCount = buffer.readInt32();
            const triOffset = buffer.readInt32();
            const skinRef = buffer.readInt32();
            const normalCount = buffer.readInt32();
            const normalOffset = buffer.readInt32();

            // 保存当前位置
            const currentPos = buffer.getPosition();

            // 跳转到三角形数据位置
            buffer.seek(triOffset);

            const triangles = [];
            const uvs = [];

            // 读取三角形数据
            let totalTriangles = 0;
            while (totalTriangles < triCount) {
                const trivertCount = buffer.readInt16();
                if (trivertCount === 0) break;

                const isFan = trivertCount < 0;
                const absCount = Math.abs(trivertCount);

                const triverts = [];
                for (let i = 0; i < absCount; i++) {
                    const vertexIndex = buffer.readUint16();
                    const normalIndex = buffer.readUint16();
                    const s = buffer.readInt16();
                    const t = buffer.readInt16();

                    triverts.push({
                        vertexIndex,
                        normalIndex,
                        s,
                        t
                    });
                }

                // 处理三角形扇形或带
                if (isFan) {
                    for (let i = 1; i < absCount - 1; i++) {
                        triangles.push([
                            triverts[0].vertexIndex,
                            triverts[i].vertexIndex,
                            triverts[i + 1].vertexIndex
                        ]);
                        uvs.push([
                            { s: triverts[0].s, t: triverts[0].t },
                            { s: triverts[i].s, t: triverts[i].t },
                            { s: triverts[i + 1].s, t: triverts[i + 1].t }
                        ]);
                        totalTriangles++;
                    }
                } else {
                    for (let i = 0; i < absCount - 2; i++) {
                        if (i % 2 === 0) {
                            triangles.push([
                                triverts[i].vertexIndex,
                                triverts[i + 1].vertexIndex,
                                triverts[i + 2].vertexIndex
                            ]);
                            uvs.push([
                                { s: triverts[i].s, t: triverts[i].t },
                                { s: triverts[i + 1].s, t: triverts[i + 1].t },
                                { s: triverts[i + 2].s, t: triverts[i + 2].t }
                            ]);
                        } else {
                            triangles.push([
                                triverts[i].vertexIndex,
                                triverts[i + 2].vertexIndex,
                                triverts[i + 1].vertexIndex
                            ]);
                            uvs.push([
                                { s: triverts[i].s, t: triverts[i].t },
                                { s: triverts[i + 2].s, t: triverts[i + 2].t },
                                { s: triverts[i + 1].s, t: triverts[i + 1].t }
                            ]);
                        }
                        totalTriangles++;
                    }
                }
            }

            // 恢复位置
            buffer.seek(currentPos);

            return {
                triangles,
                uvs,
                skinRef,
                normalCount,
                normalOffset
            };
        } catch (error) {
            console.error('Error parsing mesh data:', error);
            return null;
        }
    }

    // 解析身体部件
    parseBodyParts(buffer, header) {
        const bodyParts = [];
        buffer.seek(header.bodyPartOffset);

        for (let i = 0; i < header.bodyPartCount; i++) {
            try {
                const name = buffer.readString(64);
                const modelCount = buffer.readInt32();
                const base = buffer.readInt32();
                const modelOffset = buffer.readInt32();

                // 保存当前位置
                const currentPos = buffer.getPosition();

                // 跳转到模型数据位置
                buffer.seek(modelOffset);

                const models = [];
                for (let j = 0; j < modelCount; j++) {
                    const model = this.parseModel(buffer);
                    if (model) {
                        models.push(model);
                    }
                }

                // 如果没有找到有效的模型，创建一个空模型
                if (models.length === 0) {
                    console.warn(`No valid models found in body part ${name}, creating empty model`);
                    models.push({
                        name: `${name}_empty`,
                        type: 0,
                        meshCount: 0,
                        meshOffset: 0,
                        vertexCount: 0,
                        vertexOffset: 0,
                        normalCount: 0,
                        normalOffset: 0,
                        groups: 0,
                        meshes: []
                    });
                }

                bodyParts.push({
                    name,
                    modelCount,
                    base,
                    modelOffset,
                    models
                });

                // 恢复位置以继续读取下一个 body part
                buffer.seek(currentPos);
            } catch (error) {
                console.error(`Error parsing body part ${i}:`, error);
                // 继续处理下一个 body part
                continue;
            }
        }

        return bodyParts;
    }

    parseModel(buffer) {
        try {
            const name = buffer.readString(64);
            const type = buffer.readInt32();
            const boundingRadius = buffer.readFloat32();
            const meshCount = buffer.readInt32();
            const meshOffset = buffer.readInt32();
            const vertexCount = buffer.readInt32();
            const vertexInfoOffset = buffer.readInt32();
            const vertexOffset = buffer.readInt32();
            const normalCount = buffer.readInt32();
            const normalInfoOffset = buffer.readInt32();
            const normalOffset = buffer.readInt32();
            const groupCount = buffer.readInt32();
            const groupOffset = buffer.readInt32();

            // 保存当前位置
            const currentPos = buffer.getPosition();

            // 读取顶点数据
            buffer.seek(vertexOffset);
            const vertices = [];
            for (let i = 0; i < vertexCount; i++) {
                vertices.push(buffer.readVector3());
            }

            // 读取法线数据
            buffer.seek(normalOffset);
            const normals = [];
            for (let i = 0; i < normalCount; i++) {
                normals.push(buffer.readVector3());
            }

            // 读取网格数据
            const meshes = [];
            if (meshOffset > 0 && meshCount > 0) {
                buffer.seek(meshOffset);
                for (let i = 0; i < meshCount; i++) {
                    const mesh = this.parseMeshData(buffer);
                    if (mesh) {
                        meshes.push(mesh);
                    }
                }
            }

            // 恢复位置
            buffer.seek(currentPos);

            return {
                name,
                type,
                boundingRadius,
                meshCount,
                meshOffset,
                vertexCount,
                vertexOffset,
                normalCount,
                normalOffset,
                groupCount,
                groupOffset,
                vertices,
                normals,
                meshes
            };
        } catch (error) {
            console.error('Error parsing model:', error);
            return null;
        }
    }

    // 添加纹理标志常量
    static TextureFlags = {
        FLAT_SHADE: 0x0001,
        CHROME: 0x0002,
        FULL_BRIGHT: 0x0004,
        NO_MIPS: 0x0008,
        ALPHA: 0x0010,
        ADDITIVE: 0x0020,
        MASKED: 0x0040
    };

    // 修改纹理数据解析函数
    parseTextureData(texture, header) {
        const { width, height, dataOffset, name, flags } = texture;
        
        const savedOffset = this.buffer.getPosition();
        
        try {
            // 验证纹理尺寸
            if (width <= 0 || height <= 0 || width > 2048 || height > 2048) {
                console.warn(`Invalid texture dimensions for ${name}: ${width}x${height}, using default texture`);
                return this.createDefaultTextureData(Math.min(width, 2048), Math.min(height, 2048));
            }

            // v10 版本的纹理数据偏移计算
            let textureStart;
            if (header.version === 10) {
                // v10 版本使用相对偏移
                textureStart = dataOffset;
                if (textureStart <= 0) {
                    console.warn(`Invalid texture data offset for ${name}: ${textureStart}, using default texture`);
                    return this.createDefaultTextureData(width, height);
                }
            } else {
                // 其他版本使用绝对偏移
                textureStart = header.textureDataOffset + dataOffset;
            }

            // 验证偏移是否有效
            if (textureStart >= this.buffer.dataView.byteLength) {
                console.warn(`Texture data offset out of bounds for ${name}: ${textureStart}, using default texture`);
                return this.createDefaultTextureData(width, height);
            }

            // 计算所需的缓冲区大小
            const requiredSize = width * height + 256 * 3;
            const availableSize = this.buffer.dataView.byteLength - textureStart;

            // 检查是否有足够的数据
            if (availableSize < requiredSize) {
                console.warn(`Texture data truncated for ${name}, available: ${availableSize}, required: ${requiredSize}`);
                return this.readPartialTextureData(textureStart, width, height, availableSize);
            }

            this.buffer.seek(textureStart);

            // 读取索引数据
            const indices = this.buffer.readUint8Array(width * height);
            
            // 读取调色板数据
            const palette = this.buffer.readUint8Array(256 * 3);
            
            // 创建RGBA颜色数据
            const colors = new Uint8Array(width * height * 4);
            
            // 检查纹理标志
            const isMasked = (flags & MDLParser.TextureFlags.MASKED) !== 0;
            const isAdditive = (flags & MDLParser.TextureFlags.ADDITIVE) !== 0;
            const isAlpha = (flags & MDLParser.TextureFlags.ALPHA) !== 0;
            
            // v10 版本的特殊处理
            const isV10 = header.version === 10;
            
            for (let i = 0; i < width * height; i++) {
                const index = indices[i];
                if (index >= 256) continue;
                
                const baseColorIndex = index * 3;
                const baseOutputIndex = i * 4;
                
                const r = palette[baseColorIndex];
                const g = palette[baseColorIndex + 1];
                const b = palette[baseColorIndex + 2];
                
                // v10 版本的特殊颜色处理
                if (isV10 && index === 255) {
                    // v10 版本中 255 是完全透明
                    colors[baseOutputIndex] = 0;
                    colors[baseOutputIndex + 1] = 0;
                    colors[baseOutputIndex + 2] = 0;
                    colors[baseOutputIndex + 3] = 0;
                    continue;
                }
                
                // 处理不同类型的纹理
                if (isMasked && r === 0 && g === 0 && b === 255) {
                    // 遮罩纹理的透明部分
                    colors[baseOutputIndex] = 0;
                    colors[baseOutputIndex + 1] = 0;
                    colors[baseOutputIndex + 2] = 0;
                    colors[baseOutputIndex + 3] = 0;
                } else if (isAdditive) {
                    // 加法混合纹理
                    colors[baseOutputIndex] = r;
                    colors[baseOutputIndex + 1] = g;
                    colors[baseOutputIndex + 2] = b;
                    colors[baseOutputIndex + 3] = Math.max(r, g, b);
                } else if (isAlpha) {
                    // Alpha 纹理
                    colors[baseOutputIndex] = r;
                    colors[baseOutputIndex + 1] = g;
                    colors[baseOutputIndex + 2] = b;
                    colors[baseOutputIndex + 3] = (r + g + b) / 3;
                } else {
                    // 普通纹理
                    colors[baseOutputIndex] = r;
                    colors[baseOutputIndex + 1] = g;
                    colors[baseOutputIndex + 2] = b;
                    colors[baseOutputIndex + 3] = 255;
                }
            }
            
            // 垂直翻转图像数据
            const flippedColors = new Uint8Array(width * height * 4);
            for (let y = 0; y < height; y++) {
                const srcRow = (height - 1 - y) * width * 4;
                const dstRow = y * width * 4;
                for (let x = 0; x < width * 4; x++) {
                    flippedColors[dstRow + x] = colors[srcRow + x];
                }
            }
            
            return flippedColors;
        } catch (error) {
            console.warn(`Error processing texture ${name}:`, error);
            return this.createDefaultTextureData(width, height);
        } finally {
            this.buffer.seek(savedOffset);
        }
    }

    // 读取部分纹理数据
    readPartialTextureData(offset, width, height, availableSize) {
        this.buffer.seek(offset);
        const colors = new Uint8Array(width * height * 4);
        
        try {
            // 计算可以读取的像素数量
            const maxPixels = Math.floor((availableSize - 768) / 1); // 减去调色板大小
            const pixelCount = Math.min(width * height, maxPixels);
            
            // 读取可用的索引数据
            const indices = this.buffer.readUint8Array(pixelCount);
            
            // 读取调色板数据
            const palette = this.buffer.readUint8Array(Math.min(256 * 3, availableSize - pixelCount));
            
            // 填充颜色数据
            for (let i = 0; i < pixelCount; i++) {
                const index = indices[i];
                if (index >= palette.length / 3) continue;
                
                const baseColorIndex = index * 3;
                const baseOutputIndex = i * 4;
                
                colors[baseOutputIndex] = palette[baseColorIndex];
                colors[baseOutputIndex + 1] = palette[baseColorIndex + 1];
                colors[baseOutputIndex + 2] = palette[baseColorIndex + 2];
                colors[baseOutputIndex + 3] = 255;
            }
            
            // 填充剩余部分为默认颜色
            for (let i = pixelCount; i < width * height; i++) {
                const baseIndex = i * 4;
                colors[baseIndex] = 128;
                colors[baseIndex + 1] = 128;
                colors[baseIndex + 2] = 128;
                colors[baseIndex + 3] = 255;
            }
            
            return colors;
        } catch (error) {
            console.warn('Error reading partial texture data:', error);
            return this.createDefaultTextureData(width, height);
        }
    }

    // 创建默认纹理数据
    createDefaultTextureData(width, height) {
        const defaultColors = new Uint8Array(width * height * 4);
        const checkerSize = 8; // 棋盘格大小
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const baseIndex = (y * width + x) * 4;
                const isChecker = ((Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2) === 0;
                const color = isChecker ? 128 : 64; // 深浅灰色交替
                
                defaultColors[baseIndex] = color;
                defaultColors[baseIndex + 1] = color;
                defaultColors[baseIndex + 2] = color;
                defaultColors[baseIndex + 3] = 255;
            }
        }
        
        return defaultColors;
    }

    // 修改 createGeometry 方法
    createGeometry(model, textures, options) {
        const meshGeometries = [];

        // 读取顶点的骨骼信息
        const vertexBoneInfo = new Uint8Array(model.vertexCount);
        const savedPosition = this.buffer.getPosition();
        
        try {
            if (model.vertexInfoOffset > 0) {
                this.buffer.seek(model.vertexInfoOffset);
                const boneData = this.buffer.readUint8Array(model.vertexCount);
                vertexBoneInfo.set(boneData);
            } else {
                // 如果没有骨骼信息，将所有顶点分配给骨骼0
                vertexBoneInfo.fill(0);
            }
        } catch (error) {
            console.warn('Error reading vertex bone info:', error);
            vertexBoneInfo.fill(0);
        } finally {
            this.buffer.seek(savedPosition);
        }

        for (const mesh of model.meshes) {
            const texture = textures[mesh.skinRef];
            if (!texture) {
                console.warn('No texture found for mesh:', mesh.skinRef);
                continue;
            }

            const finalPositions = [];
            const finalNormals = [];
            const finalUvs = [];
            const finalIndices = [];
            const finalSkinIndices = [];
            const finalSkinWeights = [];
            let vertexCount = 0;

            // 遍历所有三角形
            for (let i = 0; i < mesh.triangles.length; i++) {
                const triangle = mesh.triangles[i];
                const uvs = mesh.uvs[i];

                if (!triangle || !uvs || triangle.length !== 3 || uvs.length !== 3) {
                    continue;
                }

                let isValidTriangle = true;
                for (let j = 0; j < 3; j++) {
                    const vertexIndex = triangle[j];
                    if (vertexIndex < 0 || vertexIndex >= model.vertices.length) {
                        isValidTriangle = false;
                        break;
                    }
                }

                if (!isValidTriangle) continue;

                for (let j = 0; j < 3; j++) {
                    const vertexIndex = triangle[j];
                    const vertex = model.vertices[vertexIndex];
                    const normal = vertexIndex < model.normals.length ? model.normals[vertexIndex] : new THREE.Vector3(0, 1, 0);

                    // 使用 vertexBoneInfo 获取骨骼索引
                    const boneIndex = vertexBoneInfo[vertexIndex];

                    finalPositions.push(vertex.x, vertex.y, vertex.z);
                    
                    // 正确处理法线
                    // 1. 创建法线向量副本
                    const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z);
                    // 2. 标准化法线
                    normalVector.normalize();
                    // 3. 应用模型变换（如果需要）
                    finalNormals.push(normalVector.x, normalVector.y, normalVector.z);

                    // 使用纹理尺寸来标准化 UV 坐标
                    const uv = uvs[j];
                    if (uv && typeof uv.s === 'number' && typeof uv.t === 'number') {
                        finalUvs.push(
                            uv.s / texture.width,
                            1 - (uv.t / texture.height)
                        );
                    } else {
                        finalUvs.push(0, 0);
                    }

                    // 设置骨骼索引和权重
                    finalSkinIndices.push(boneIndex, 0, 0, 0);
                    finalSkinWeights.push(1, 0, 0, 0);
                    
                    finalIndices.push(vertexCount++);
                }
            }

            if (finalPositions.length === 0) {
                console.warn('No valid geometry data found for mesh');
                continue;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(finalPositions, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(finalNormals, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(finalUvs, 2));
            geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(finalSkinIndices, 4));
            geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(finalSkinWeights, 4));
            geometry.setIndex(finalIndices);

            meshGeometries.push({
                geometry,
                skinRef: mesh.skinRef
            });
        }

        return meshGeometries;
    }

    // 设置模型旋转（弧度）
    setRotation(x = 0, y = 0, z = 0) {
        this.currentRotation.x = x;
        this.currentRotation.y = y;
        this.currentRotation.z = z;
        if (this.lastGroup) {
            this.lastGroup.rotation.set(x, y, z);
            this.lastGroup.updateMatrixWorld(true);
        }
    }

    // 设置模型缩放
    setScale(scale = 0.1) {
        this.currentScale = scale;
        if (this.lastGroup) {
            this.lastGroup.traverse((object) => {
                if (object.type === 'SkinnedMesh') {
                    object.scale.set(scale, scale, scale);
                }
            });
            this.lastGroup.updateMatrixWorld(true);
        }
    }

    // 获取当前旋转（弧度）
    getRotation() {
        return { ...this.currentRotation };
    }

    // 获取当前缩放
    getScale() {
        return this.currentScale;
    }

    // 解析调色板数据
    parsePalette() {
        // Half-Life 默认调色板
        const defaultPalette = new Uint8Array([
            0,0,0, 15,15,15, 31,31,31, 47,47,47, 63,63,63, 75,75,75, 91,91,91, 107,107,107, 123,123,123, 139,139,139, 155,155,155, 171,171,171, 187,187,187, 203,203,203, 219,219,219, 235,235,235,
            15,11,7, 23,15,11, 31,23,11, 39,27,15, 47,35,19, 55,43,23, 63,47,23, 75,55,27, 83,59,27, 91,67,31, 99,75,31, 107,83,31, 115,87,31, 123,95,35, 131,103,35, 143,111,35,
            11,11,15, 19,19,27, 27,27,39, 39,39,51, 47,47,63, 55,55,75, 63,63,87, 71,71,103, 79,79,115, 91,91,127, 99,99,139, 107,107,151, 115,115,163, 123,123,175, 131,131,187, 139,139,203,
            0,0,17, 0,0,35, 0,0,47, 0,0,63, 0,0,79, 0,0,95, 0,0,111, 0,0,127, 0,0,147, 0,0,163, 0,0,179, 0,0,199, 0,0,215, 0,0,235, 0,0,255, 0,0,255,
            13,0,0, 27,0,0, 43,0,0, 55,0,0, 71,0,0, 87,0,0, 103,0,0, 119,0,0, 139,0,0, 155,0,0, 175,0,0, 191,0,0, 211,0,0, 231,0,0, 255,0,0, 255,0,0,
            0,13,0, 0,27,0, 0,43,0, 0,55,0, 0,71,0, 0,87,0, 0,103,0, 0,119,0, 0,139,0, 0,155,0, 0,175,0, 0,191,0, 0,211,0, 0,231,0, 0,255,0, 0,255,0,
            13,13,0, 27,27,0, 43,43,0, 55,55,0, 71,71,0, 87,87,0, 103,103,0, 119,119,0, 139,139,0, 155,155,0, 175,175,0, 191,191,0, 211,211,0, 231,231,0, 255,255,0, 255,255,0,
            16,16,16, 32,32,32, 48,48,48, 64,64,64, 80,80,80, 96,96,96, 112,112,112, 128,128,128, 144,144,144, 160,160,160, 176,176,176, 192,192,192, 208,208,208, 224,224,224, 240,240,240, 255,255,255
        ]);
        return defaultPalette;
    }

    // 验证纹理数据
    validateTextureData(textureData, width, height, palette) {
        const stats = {
            totalPixels: width * height,
            validPixels: 0,
            invalidIndices: 0,
            transparentPixels: 0,
            uniqueIndices: new Set(),
            maxIndex: -1,
            minIndex: 256,
            paletteSize: palette.length
        };

        // 分析纹理数据
        for (let i = 0; i < textureData.length; i++) {
            const index = textureData[i];
            stats.uniqueIndices.add(index);
            stats.maxIndex = Math.max(stats.maxIndex, index);
            stats.minIndex = Math.min(stats.minIndex, index);

            if (index === 255) {
                stats.transparentPixels++;
            } else if (index * 3 + 2 >= palette.length) {
                stats.invalidIndices++;
            } else {
                stats.validPixels++;
            }
        }

        // 计算百分比
        stats.validPercentage = (stats.validPixels / stats.totalPixels * 100).toFixed(2) + '%';
        stats.invalidPercentage = (stats.invalidIndices / stats.totalPixels * 100).toFixed(2) + '%';
        stats.transparentPercentage = (stats.transparentPixels / stats.totalPixels * 100).toFixed(2) + '%';
        stats.uniqueIndicesCount = stats.uniqueIndices.size;

        // 检查数据有效性
        const isValid = stats.validPixels > 0 && stats.maxIndex * 3 + 2 < palette.length;

        return isValid;
    }

    // 处理纹理透明度
    processTextureTransparency(textureData) {
        return textureData.some(color => color === 255);  // 255 通常是透明色
    }

    // 创建纹理
    createTexture(textureData, width, height) {
        const texture = new THREE.DataTexture(
            textureData,
            width,
            height,
            THREE.RGBAFormat,
            THREE.UnsignedByteType
        );

        // 设置纹理参数
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.generateMipmaps = true;
        texture.flipY = false; // 已经在parseTextureData中翻转过了
        texture.needsUpdate = true;

        return texture;
    }

    // 设置渲染模式
    setRenderMode(mode) {
        this.renderMode = mode;
        if (this.lastGroup) {
            this.lastGroup.traverse((object) => {
                if (object.material) {
                    object.material.wireframe = mode === 'wireframe';
                    object.material.needsUpdate = true;
                }
            });
        }
    }

    // 获取当前渲染模式
    getRenderMode() {
        return this.renderMode;
    }

    // 修改材质创建函数
    createMaterial(texture) {
        const material = new THREE.MeshStandardMaterial({
            map: this.renderMode === 'textured' ? texture : null,
            wireframe: this.renderMode === 'wireframe',
            color: this.renderMode === 'wireframe' ? 0xffffff : 0xffffff,
            side: THREE.DoubleSide,
            metalness: 0.0,
            roughness: 0.8,
            envMapIntensity: 1.0,
            transparent: true,
            alphaTest: 0.5
        });

        // 设置材质参数
        material.needsUpdate = true;
        material.name = texture.name || 'MDLMaterial';

        // 添加错误处理
        texture.addEventListener('error', () => {
            console.warn(`Texture failed to load: ${texture.name}`);
            material.map = null;
            material.color.setHex(0xcccccc);
            material.needsUpdate = true;
        });

        return material;
    }

    // 创建默认材质
    createDefaultMaterial() {
        const material = new THREE.MeshStandardMaterial({
            color: this.renderMode === 'wireframe' ? 0xffffff : 0xcccccc,
            wireframe: this.renderMode === 'wireframe',
            side: THREE.DoubleSide,
            metalness: 0.0,
            roughness: 0.8,
            envMapIntensity: 1.0
        });

        // 线框模式下的特殊设置
        if (this.renderMode === 'wireframe') {
            material.wireframeLinewidth = 1;
            material.wireframeLinecap = 'round';
            material.wireframeLinejoin = 'round';
        }

        material.name = 'DefaultMDLMaterial';
        return material;
    }

    // 添加序列相关的常量
    static SequenceFlags = {
        LOOPING: 0x0001,    // 循环播放
        NON_INTERP: 0x0002  // 不进行插值
    };

    // 解析序列数据
    parseSequences(header) {
        const sequences = [];
        
        // 如果没有序列数据，直接返回空数组
        if (header.sequenceCount <= 0 || header.sequenceOffset <= 0) {
            return sequences;
        }

        try {
            // 验证序列偏移量
            if (header.sequenceOffset >= this.buffer.dataView.byteLength) {
                console.warn('Invalid sequence offset');
                return sequences;
            }

            this.buffer.seek(header.sequenceOffset);

            for (let i = 0; i < header.sequenceCount; i++) {
                const currentPosition = this.buffer.getPosition();
                
                try {
                    const name = this.buffer.readString(32);
                    const fps = this.buffer.readFloat32();
                    const flags = this.buffer.readInt32();
                    const activity = this.buffer.readInt32();
                    const actWeight = this.buffer.readInt32();
                    const eventCount = this.buffer.readInt32();
                    const eventOffset = this.buffer.readInt32();
                    
                    const bbmin = this.buffer.readVector3();
                    const bbmax = this.buffer.readVector3();
                    
                    const blendCount = this.buffer.readInt32();
                    const animOffset = this.buffer.readInt32();
                    const motiontype = this.buffer.readInt32();
                    const motionbone = this.buffer.readInt32();
                    const linearmovement = this.buffer.readVector3();
                    const automovement = this.buffer.readInt32();
                    const frameCount = this.buffer.readInt32();
                    const pivotCount = this.buffer.readInt32();
                    const pivotOffset = this.buffer.readInt32();
                    
                    const savedOffset = this.buffer.getPosition();
                    
                    // 读取帧数据
                    const frames = [];
                    if (animOffset > 0 && frameCount > 0) {
                        try {
                            const absoluteAnimOffset = header.sequenceOffset + animOffset;
                            
                            if (absoluteAnimOffset < this.buffer.dataView.byteLength) {
                                const frameDataSize = frameCount * header.boneCount * 24;
                                
                                if (absoluteAnimOffset + frameDataSize <= this.buffer.dataView.byteLength) {
                                    this.buffer.seek(absoluteAnimOffset);
                                    
                                    for (let bone = 0; bone < header.boneCount; bone++) {
                                        const boneFrames = {
                                            pos: [],
                                            rot: []
                                        };
                                        
                                        for (let frame = 0; frame < frameCount; frame++) {
                                            if (this.buffer.getPosition() + 24 <= this.buffer.dataView.byteLength) {
                                                const pos = this.buffer.readVector3();
                                                const rot = this.buffer.readVector3();
                                                boneFrames.pos.push(pos);
                                                boneFrames.rot.push(rot);
                                            } else {
                                                break;
                                            }
                                        }
                                        
                                        frames.push(boneFrames);
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn(`Error reading animation data for sequence ${i} (${name}):`, error);
                        }
                    }
                    
                    // 读取事件数据
                    const events = [];
                    if (eventOffset > 0 && eventCount > 0) {
                        try {
                            const absoluteEventOffset = header.sequenceOffset + eventOffset;
                            
                            if (absoluteEventOffset < this.buffer.dataView.byteLength) {
                                const eventDataSize = eventCount * 72;
                                
                                if (absoluteEventOffset + eventDataSize <= this.buffer.dataView.byteLength) {
                                    this.buffer.seek(absoluteEventOffset);
                                    
                                    for (let j = 0; j < eventCount; j++) {
                                        if (this.buffer.getPosition() + 72 <= this.buffer.dataView.byteLength) {
                                            const frame = this.buffer.readInt32();
                                            const eventType = this.buffer.readInt32();
                                            const options = this.buffer.readString(64);
                                            events.push({ frame, eventType, options });
                                        } else {
                                            break;
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            // 不输出警告，因为这是正常情况
                        }
                    }
                    
                    sequences.push({
                        name,
                        fps,
                        flags,
                        activity,
                        actWeight,
                        frames,
                        events,
                        frameCount,
                        bbmin,
                        bbmax,
                        blendCount,
                        motiontype,
                        motionbone,
                        linearmovement,
                        automovement
                    });
                    
                    // 恢复位置以继续读取下一个序列
                    this.buffer.seek(savedOffset);
                    
                } catch (error) {
                    console.warn(`Error parsing sequence ${i}:`, error);
                    // 尝试恢复到下一个序列的位置
                    const skipBytes = 176;
                    const nextSequencePosition = currentPosition + skipBytes;
                    if (nextSequencePosition < this.buffer.dataView.byteLength) {
                        this.buffer.seek(nextSequencePosition);
                    } else {
                        break;
                    }
                }
            }
        } catch (error) {
            console.warn('Error parsing sequences:', error);
        }
        
        return sequences;
    }

    // 创建动画剪辑
    createAnimationClips(sequences, skeleton) {
        const clips = [];
        
        for (const sequence of sequences) {
            const tracks = [];
            const duration = sequence.frameCount / sequence.fps;
            
            // 为每个骨骼创建关键帧轨道
            sequence.frames.forEach((boneFrames, boneIndex) => {
                const bone = skeleton.bones[boneIndex];
                if (!bone) return;
                
                const times = new Float32Array(sequence.frameCount);
                const posValues = new Float32Array(sequence.frameCount * 3);
                const rotValues = new Float32Array(sequence.frameCount * 4);
                
                for (let frame = 0; frame < sequence.frameCount; frame++) {
                    const time = frame / sequence.fps;
                    times[frame] = time;
                    
                    // 位置数据
                    const pos = boneFrames.pos[frame];
                    posValues[frame * 3] = pos.x;
                    posValues[frame * 3 + 1] = pos.y;
                    posValues[frame * 3 + 2] = pos.z;
                    
                    // 旋转数据 - 转换为四元数
                    const rot = boneFrames.rot[frame];
                    const quat = new THREE.Quaternion().setFromEuler(
                        new THREE.Euler(rot.x, rot.y, rot.z)
                    );
                    rotValues[frame * 4] = quat.x;
                    rotValues[frame * 4 + 1] = quat.y;
                    rotValues[frame * 4 + 2] = quat.z;
                    rotValues[frame * 4 + 3] = quat.w;
                }
                
                // 创建位置和旋转轨道
                tracks.push(
                    new THREE.VectorKeyframeTrack(
                        `${bone.name}.position`,
                        times,
                        posValues
                    )
                );
                
                tracks.push(
                    new THREE.QuaternionKeyframeTrack(
                        `${bone.name}.quaternion`,
                        times,
                        rotValues
                    )
                );
            });
            
            // 创建动画剪辑
            const clip = new THREE.AnimationClip(
                sequence.name,
                duration,
                tracks,
                sequence.flags & MDLParser.SequenceFlags.LOOPING ? THREE.LoopRepeat : THREE.LoopOnce
            );
            
            clips.push(clip);
        }
        
        return clips;
    }

    // 主解析函数
    async parse(arrayBuffer, options = {}) {
        const {
            rotationX = this.currentRotation.x,
            rotationY = this.currentRotation.y,
            rotationZ = this.currentRotation.z,
            scale = this.currentScale,
            renderMode = this.renderMode
        } = options;

        // 更新当前值
        this.currentRotation = { x: rotationX, y: rotationY, z: rotationZ };
        this.currentScale = scale;
        this.renderMode = renderMode;

        // 创建 Buffer 实例
        this.buffer = new Buffer(arrayBuffer);

        const header = this.parseHeader(this.buffer);
        const bones = this.parseBones(header);
        const textures = this.parseTextures(header);
        const bodyParts = this.parseBodyParts(this.buffer, header);

        // 创建骨骼系统
        const boneObjects = [];
        const boneMatrices = [];

        // 创建骨骼对象
        bones.forEach((bone, index) => {
            const boneObj = new THREE.Bone();
            boneObj.name = bone.name;
            
            // 存储原始变换
            const initialPosition = new THREE.Vector3().copy(bone.pos);
            const initialRotation = new THREE.Euler(bone.rot.x, bone.rot.y, bone.rot.z);
            
            // 应用初始变换
            boneObj.position.copy(initialPosition);
            boneObj.quaternion.setFromEuler(initialRotation);
            
            // 存储初始矩阵
            const matrix = new THREE.Matrix4();
            matrix.compose(initialPosition, boneObj.quaternion, new THREE.Vector3(1, 1, 1));
            boneMatrices[index] = matrix;
            
            boneObjects.push(boneObj);
        });

        // 创建骨架容器
        const rootBone = new THREE.Bone();
        rootBone.name = 'root';
        
        // 设置骨骼层级关系
        bones.forEach((bone, i) => {
            if (bone.parent === -1) {
                rootBone.add(boneObjects[i]);
            } else {
                boneObjects[bone.parent].add(boneObjects[i]);
                
                // 调整子骨骼的位置为相对于父骨骼的位置
                const parentMatrix = boneMatrices[bone.parent];
                const parentInverse = new THREE.Matrix4().copy(parentMatrix).invert();
                const localMatrix = new THREE.Matrix4().multiplyMatrices(parentInverse, boneMatrices[i]);
                
                // 从局部矩阵中提取变换
                const position = new THREE.Vector3();
                const quaternion = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                localMatrix.decompose(position, quaternion, scale);
                
                boneObjects[i].position.copy(position);
                boneObjects[i].quaternion.copy(quaternion);
            }
        });

        // 创建骨骼系统
        const skeleton = new THREE.Skeleton(boneObjects);

        // 更新所有骨骼的矩阵
        rootBone.updateMatrixWorld(true);
        
        // 设置绑定矩阵
        skeleton.bones.forEach((bone, index) => {
            // 计算绑定矩阵的逆矩阵
            const bindMatrix = new THREE.Matrix4();
            bindMatrix.copy(bone.matrixWorld);
            
            bone.matrix.copy(bindMatrix);
            bone.matrix.invert();
            
            // 更新骨骼的世界矩阵
            bone.updateMatrixWorld(true);
        });

        // 创建模型组
        const group = new THREE.Group();

        // 解析调色板
        const palette = this.parsePalette();

        // 处理纹理
        const textureObjects = [];
        for (const texture of textures) {
            try {
                const textureData = this.parseTextureData(texture, header);
                const threeTexture = this.createTexture(textureData, texture.width, texture.height);
                threeTexture.name = texture.name;
                textureObjects.push(threeTexture);
            } catch (error) {
                console.warn('Error processing texture:', error);
                const defaultTexture = new THREE.DataTexture(
                    new Uint8Array([128, 128, 128, 255]),
                    1, 1, THREE.RGBAFormat
                );
                defaultTexture.name = 'default';
                textureObjects.push(defaultTexture);
            }
        }

        // 为每个身体部件创建网格
        for (const bodyPart of bodyParts) {
            for (const model of bodyPart.models) {
                // 获取所有网格的几何体
                const meshGeometries = this.createGeometry(model, textures, {
                    bones: bones,
                    boneCount: header.boneCount
                });
                
                // 为每个网格创建独立的 Mesh
                for (const meshData of meshGeometries) {
                    const texture = textureObjects[meshData.skinRef];
                    const material = this.createMaterial(texture);
                    
                    // 创建蒙皮网格
                    const mesh = new THREE.SkinnedMesh(meshData.geometry, material);
                    mesh.name = `mesh_${meshData.skinRef}`;
                    mesh.add(rootBone);
                    mesh.bind(skeleton);
                    
                    // 设置缩放
                    mesh.scale.set(this.currentScale, this.currentScale, this.currentScale);
                    
                    // 添加到模型组
                    group.add(mesh);
                }
            }
        }

        // 设置模型组的旋转
        group.rotation.set(
            this.currentRotation.x,
            this.currentRotation.y,
            this.currentRotation.z
        );

        // 更新整个组的矩阵
        group.updateMatrixWorld(true);

        // 保存最后创建的组
        this.lastGroup = group;

        // 解析序列数据
        const sequences = this.parseSequences(header);
        
        // 创建动画剪辑
        const animationClips = this.createAnimationClips(sequences, skeleton);
        
        // 创建动画混合器
        const mixer = new THREE.AnimationMixer(group);
        
        // 为每个动画剪辑创建动作
        const actions = animationClips.map(clip => mixer.clipAction(clip));
        
        // 设置序列0为默认姿势
        if (actions.length > 0) {
            const defaultAction = actions[0];
            // 设置权重为1,确保完全应用该动作
            defaultAction.setEffectiveWeight(1);
            // 立即跳转到第一帧
            defaultAction.play().paused = true;
            defaultAction.time = 0;
            // 立即更新混合器以应用姿势
            mixer.update(0);
        }

        return {
            header,
            bones,
            textures,
            bodyParts,
            group,
            skeleton,
            sequences,
            animationClips,
            mixer,
            actions
        };
    }
} 