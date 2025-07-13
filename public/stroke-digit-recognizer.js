/**
 * Stroke-based Digit Recognizer
 * 
 * A pure JavaScript library for recognizing handwritten digits using stroke-based segmentation.
 * No ML models required for segmentation - uses geometric analysis of pen strokes.
 * 
 * @version 1.0.0
 * @author Claude & Human Collaboration
 * @license MIT
 */

class StrokeDigitRecognizer {
    /**
     * Create a new StrokeDigitRecognizer instance
     * @param {Object} options - Configuration options
     * @param {string} options.modelPath - Path to ONNX digit recognition model
     * @param {HTMLCanvasElement} options.canvas - Canvas element for drawing
     * @param {Object} options.segmentation - Segmentation parameters
     * @param {boolean} options.debug - Enable debug logging
     * @param {Function} options.onStrokeComplete - Callback when stroke is completed
     * @param {Function} options.onRecognitionComplete - Callback when recognition is completed
     */
    constructor(options = {}) {
        // Configuration
        this.config = {
            modelPath: options.modelPath || './models/digit_recognition.onnx',
            debug: options.debug || false,
            autoRecognitionDelay: options.autoRecognitionDelay || 800,
            segmentation: {
                proximityThreshold: 15,
                connectivityThreshold: 0.6,
                maxStrokesPerDigit: 4,
                minStrokeLength: 10,
                aspectRatioRange: [0.3, 3.0],
                ...options.segmentation
            },
            callbacks: {
                onStrokeComplete: options.onStrokeComplete || (() => {}),
                onRecognitionComplete: options.onRecognitionComplete || (() => {}),
                onDebugLog: options.onDebugLog || ((section, message, type) => {
                    if (this.config.debug) {
                        console.log(`[${section}] ${message}`);
                    }
                })
            }
        };

        // State
        this.session = null;
        this.canvas = options.canvas;
        this.ctx = null;
        this.strokes = [];
        this.currentStroke = null;
        this.isDrawing = false;
        this.recognitionTimeout = null;
        this.lastRecognitionTime = 0;
        this.isModelLoaded = false;

        // Initialize if canvas provided
        if (this.canvas) {
            this.initializeCanvas();
        }

        // Load model
        this.loadModel();
    }

    /**
     * Initialize canvas for drawing
     * @param {HTMLCanvasElement} canvas - Canvas element (optional if provided in constructor)
     */
    initializeCanvas(canvas = null) {
        if (canvas) {
            this.canvas = canvas;
        }

        if (!this.canvas) {
            throw new Error('Canvas element is required');
        }

        this.ctx = this.canvas.getContext('2d');
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        this.clearCanvas();
        this.setupEventListeners();
        
        this.debugLog('INITIALIZATION', 'Canvas initialized successfully');
    }

    /**
     * Setup pointer event listeners for drawing
     */
    setupEventListeners() {
        if (!this.canvas) return;

        // Remove existing listeners to prevent duplicates
        this.removeEventListeners();

        // Bind methods to preserve context
        this.boundPointerDown = this.handlePointerDown.bind(this);
        this.boundPointerMove = this.handlePointerMove.bind(this);
        this.boundPointerUp = this.handlePointerUp.bind(this);

        this.canvas.addEventListener('pointerdown', this.boundPointerDown);
        this.canvas.addEventListener('pointermove', this.boundPointerMove);
        this.canvas.addEventListener('pointerup', this.boundPointerUp);
        this.canvas.addEventListener('pointercancel', this.boundPointerUp);
        this.canvas.addEventListener('pointerout', this.boundPointerUp);
    }

    /**
     * Remove event listeners
     */
    removeEventListeners() {
        if (!this.canvas) return;

        this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
        this.canvas.removeEventListener('pointermove', this.boundPointerMove);
        this.canvas.removeEventListener('pointerup', this.boundPointerUp);
        this.canvas.removeEventListener('pointercancel', this.boundPointerUp);
        this.canvas.removeEventListener('pointerout', this.boundPointerUp);
    }

    /**
     * Handle pointer down event
     */
    handlePointerDown(e) {
        e.preventDefault();
        this.isDrawing = true;
        
        const point = this.getPointerPosition(e);
        
        this.currentStroke = {
            points: [{...point, timestamp: Date.now()}],
            boundingBox: {minX: point.x, maxX: point.x, minY: point.y, maxY: point.y},
            startTime: Date.now()
        };
        
        // Draw starting point
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.ctx.lineWidth/2, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.debugLog('STROKE_COLLECTION', `Stroke ${this.strokes.length + 1} started at (${point.x.toFixed(0)}, ${point.y.toFixed(0)})`);
    }

    /**
     * Handle pointer move event
     */
    handlePointerMove(e) {
        if (!this.isDrawing || !this.currentStroke) return;
        
        e.preventDefault();
        const point = this.getPointerPosition(e);
        const lastPoint = this.currentStroke.points[this.currentStroke.points.length - 1];
        
        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(lastPoint.x, lastPoint.y);
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();
        
        // Add point to stroke
        this.currentStroke.points.push({...point, timestamp: Date.now()});
        
        // Update bounding box
        this.updateBoundingBox(this.currentStroke, point);
    }

    /**
     * Handle pointer up event
     */
    handlePointerUp(e) {
        if (!this.isDrawing || !this.currentStroke) return;
        
        this.isDrawing = false;
        
        // Validate stroke (minimum points for noise filtering)
        if (this.currentStroke.points.length >= 3) {
            this.calculateStrokeFeatures(this.currentStroke);
            
            // Filter out very short strokes
            if (this.currentStroke.length >= this.config.segmentation.minStrokeLength) {
                this.strokes.push(this.currentStroke);
                
                this.debugLog('STROKE_COLLECTION', 
                    `Stroke ${this.strokes.length} completed: ${this.currentStroke.points.length} points, ` +
                    `length: ${this.currentStroke.length.toFixed(0)}px, ` +
                    `size: ${this.currentStroke.width.toFixed(0)}×${this.currentStroke.height.toFixed(0)}`
                );
                
                // Trigger callback
                this.config.callbacks.onStrokeComplete(this.currentStroke, this.strokes.length);
                
                // Auto recognition
                this.scheduleAutoRecognition();
            } else {
                this.debugLog('STROKE_COLLECTION', 'Stroke too short, discarded');
            }
        }
        
        this.currentStroke = null;
    }

    /**
     * Get pointer position relative to canvas
     */
    getPointerPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /**
     * Update bounding box with new point
     */
    updateBoundingBox(stroke, point) {
        stroke.boundingBox.minX = Math.min(stroke.boundingBox.minX, point.x);
        stroke.boundingBox.maxX = Math.max(stroke.boundingBox.maxX, point.x);
        stroke.boundingBox.minY = Math.min(stroke.boundingBox.minY, point.y);
        stroke.boundingBox.maxY = Math.max(stroke.boundingBox.maxY, point.y);
    }

    /**
     * Calculate geometric features for a stroke
     */
    calculateStrokeFeatures(stroke) {
        const points = stroke.points;
        
        // Basic properties
        stroke.startPoint = points[0];
        stroke.endPoint = points[points.length - 1];
        
        // Calculate stroke length
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i-1].x;
            const dy = points[i].y - points[i-1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        stroke.length = length;
        
        // Bounding box dimensions
        stroke.width = stroke.boundingBox.maxX - stroke.boundingBox.minX;
        stroke.height = stroke.boundingBox.maxY - stroke.boundingBox.minY;
        
        // Center point
        stroke.centerX = (stroke.boundingBox.minX + stroke.boundingBox.maxX) / 2;
        stroke.centerY = (stroke.boundingBox.minY + stroke.boundingBox.maxY) / 2;
        
        // Direction vector
        stroke.direction = {
            x: stroke.endPoint.x - stroke.startPoint.x,
            y: stroke.endPoint.y - stroke.startPoint.y
        };
        
        // Duration
        stroke.duration = stroke.endPoint.timestamp - stroke.startPoint.timestamp;
    }

    /**
     * Schedule automatic recognition after delay
     */
    scheduleAutoRecognition() {
        clearTimeout(this.recognitionTimeout);
        this.recognitionTimeout = setTimeout(() => {
            this.recognizeDigits();
        }, this.config.autoRecognitionDelay);
    }

    /**
     * Recognize digits from current strokes
     * @returns {Promise<Object>} Recognition result
     */
    async recognizeDigits() {
        // Throttle recognition calls
        const now = Date.now();
        if (now - this.lastRecognitionTime < 300) {
            return null;
        }
        this.lastRecognitionTime = now;

        if (!this.isModelLoaded) {
            this.debugLog('RECOGNITION', 'Model not loaded yet', 'warning');
            return null;
        }

        if (this.strokes.length === 0) {
            this.debugLog('RECOGNITION', 'No strokes to recognize', 'warning');
            return null;
        }

        const startTime = performance.now();
        
        try {
            this.debugLog('RECOGNITION', `Starting recognition with ${this.strokes.length} strokes`, 'highlight');
            
            // 1. Group strokes into characters
            const characterGroups = this.groupStrokesIntoCharacters();
            this.debugLog('SEGMENTATION', `Created ${characterGroups.length} character groups`);

            if (characterGroups.length === 0) {
                this.debugLog('SEGMENTATION', 'No valid character groups found', 'warning');
                return null;
            }

            // 2. Recognize each group
            const results = [];
            for (let i = 0; i < characterGroups.length; i++) {
                this.debugLog('INFERENCE', `Recognizing group ${i + 1}/${characterGroups.length}`);
                
                const group = characterGroups[i];
                const result = await this.recognizeCharacterGroup(group);
                results.push(result);
                
                this.debugLog('INFERENCE', 
                    `Group ${i + 1} result: ${result.prediction} (${result.confidence.toFixed(1)}%)`
                );
            }

            // 3. Combine results
            const recognizedDigits = results.map(r => r.prediction).join('');
            const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
            const processingTime = performance.now() - startTime;

            const finalResult = {
                digits: recognizedDigits,
                confidence: avgConfidence,
                processingTime: processingTime,
                digitCount: results.length,
                groups: characterGroups,
                individualResults: results,
                success: true
            };

            this.debugLog('RECOGNITION', 
                `Recognition complete: "${recognizedDigits}" ` +
                `(${results.length} digits, ${avgConfidence.toFixed(1)}% confidence, ${processingTime.toFixed(0)}ms)`, 
                'highlight'
            );

            // Trigger callback
            this.config.callbacks.onRecognitionComplete(finalResult);

            return finalResult;

        } catch (error) {
            this.debugLog('RECOGNITION', `Recognition failed: ${error.message}`, 'error');
            
            const errorResult = {
                digits: '',
                confidence: 0,
                processingTime: performance.now() - startTime,
                digitCount: 0,
                groups: [],
                individualResults: [],
                success: false,
                error: error.message
            };

            this.config.callbacks.onRecognitionComplete(errorResult);
            return errorResult;
        }
    }

    /**
     * Group strokes into character groups using geometric analysis
     */
    groupStrokesIntoCharacters() {
        if (this.strokes.length === 0) return [];

        // Calculate connectivity matrix
        const connectivity = this.calculateConnectivityMatrix();
        
        this.debugLog('CONNECTIVITY', `Calculated ${this.strokes.length}×${this.strokes.length} connectivity matrix`);

        // Group strokes using greedy algorithm
        const groups = [];
        const used = new Array(this.strokes.length).fill(false);
        
        for (let i = 0; i < this.strokes.length; i++) {
            if (used[i]) continue;
            
            const group = {
                strokes: [this.strokes[i]],
                indices: [i]
            };
            used[i] = true;
            
            // Find connected strokes
            let added = true;
            while (added) {
                added = false;
                
                for (let j = 0; j < this.strokes.length; j++) {
                    if (used[j]) continue;
                    
                    // Check if connected to any stroke in group
                    let isConnected = false;
                    for (const idx of group.indices) {
                        if (connectivity[idx][j] > this.config.segmentation.connectivityThreshold) {
                            isConnected = true;
                            break;
                        }
                    }
                    
                    if (isConnected && this.validateGroupConstraints(group, this.strokes[j])) {
                        group.strokes.push(this.strokes[j]);
                        group.indices.push(j);
                        used[j] = true;
                        added = true;
                    }
                }
            }
            
            // Calculate group bounding box
            this.calculateGroupBoundingBox(group);
            groups.push(group);
        }
        
        // Sort groups by X position (left to right)
        groups.sort((a, b) => a.boundingBox.minX - b.boundingBox.minX);
        
        this.debugLog('GROUPING', 
            `Grouping complete: ${groups.map((g, i) => `Group${i+1}(${g.strokes.length})`).join(', ')}`
        );
        
        return groups;
    }

    /**
     * Calculate connectivity matrix between all strokes
     */
    calculateConnectivityMatrix() {
        const n = this.strokes.length;
        const matrix = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const score = this.calculateStrokeConnectivity(this.strokes[i], this.strokes[j]);
                matrix[i][j] = score;
                matrix[j][i] = score;
            }
        }
        
        return matrix;
    }

    /**
     * Calculate connectivity score between two strokes
     */
    calculateStrokeConnectivity(stroke1, stroke2) {
        // Get canvas dimensions for relative calculations
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // 1. Proximity score
        const proximity = this.calculateProximityScore(stroke1, stroke2);
        
        // 2. Size similarity score
        const sizeScore = this.calculateSizeSimilarity(stroke1, stroke2);
        
        // 3. Spatial relationship score
        const spatialScore = this.calculateSpatialRelationship(stroke1, stroke2, canvasWidth);
        
        // 4. Temporal continuity score
        const temporalScore = this.calculateTemporalContinuity(stroke1, stroke2);
        
        // 5. Separation likelihood score
        const separationScore = this.calculateSeparationLikelihood(stroke1, stroke2, canvasWidth);
        
        // Weighted combination
        const score = proximity * 0.3 + sizeScore * 0.1 + spatialScore * 0.4 + temporalScore * 0.15 + separationScore * 0.05;
        
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Calculate proximity score between two strokes
     */
    calculateProximityScore(stroke1, stroke2) {
        const distances = [
            this.distance(stroke1.endPoint, stroke2.startPoint),
            this.distance(stroke1.startPoint, stroke2.endPoint),
            this.distance(stroke1.endPoint, stroke2.endPoint),
            this.distance(stroke1.startPoint, stroke2.startPoint)
        ];
        
        const bboxDistance = this.boundingBoxDistance(stroke1.boundingBox, stroke2.boundingBox);
        const minDistance = Math.min(Math.min(...distances), bboxDistance);
        
        return Math.max(0, 1 - minDistance / this.config.segmentation.proximityThreshold);
    }

    /**
     * Calculate size similarity score between two strokes
     */
    calculateSizeSimilarity(stroke1, stroke2) {
        const size1 = Math.max(stroke1.width, stroke1.height);
        const size2 = Math.max(stroke2.width, stroke2.height);
        const ratio = Math.min(size1, size2) / Math.max(size1, size2);
        return ratio > 0.6 ? 1 : ratio / 0.6;
    }

    /**
     * Calculate spatial relationship score between two strokes
     */
    calculateSpatialRelationship(stroke1, stroke2, canvasWidth) {
        const horizontalOverlap = this.calculateOverlap(
            stroke1.boundingBox.minX, stroke1.boundingBox.maxX,
            stroke2.boundingBox.minX, stroke2.boundingBox.maxX
        );
        
        const verticalOverlap = this.calculateOverlap(
            stroke1.boundingBox.minY, stroke1.boundingBox.maxY,
            stroke2.boundingBox.minY, stroke2.boundingBox.maxY
        );
        
        const horizontalGap = Math.max(0,
            Math.max(stroke1.boundingBox.minX, stroke2.boundingBox.minX) -
            Math.min(stroke1.boundingBox.maxX, stroke2.boundingBox.maxX)
        );
        
        // Penalize large horizontal gaps (likely different digits)
        const gapPenalty = horizontalGap > canvasWidth * 0.1 ? 0.3 : 1.0;
        
        return Math.max(horizontalOverlap, verticalOverlap * 0.8) * gapPenalty;
    }

    /**
     * Calculate temporal continuity score between two strokes
     */
    calculateTemporalContinuity(stroke1, stroke2) {
        const timeDiff = Math.abs(stroke1.startTime - stroke2.startTime);
        return Math.max(0, 1 - timeDiff / 3000); // 3 second threshold
    }

    /**
     * Calculate separation likelihood between two strokes
     */
    calculateSeparationLikelihood(stroke1, stroke2, canvasWidth) {
        const centerDistance = Math.abs(stroke1.centerX - stroke2.centerX);
        const avgWidth = (stroke1.width + stroke2.width) / 2;
        
        // If strokes are far apart horizontally, likely different digits
        if (centerDistance > canvasWidth * 0.15 && avgWidth > 0) {
            const ratio = centerDistance / avgWidth;
            if (ratio > 2.0) {
                return 0.2; // Low connectivity
            }
        }
        
        return 1.0; // Normal connectivity
    }

    /**
     * Validate if a stroke can be added to a group
     */
    validateGroupConstraints(group, newStroke) {
        // Maximum strokes per digit
        if (group.strokes.length >= this.config.segmentation.maxStrokesPerDigit) {
            return false;
        }
        
        // Calculate hypothetical bounding box
        const allStrokes = [...group.strokes, newStroke];
        const minX = Math.min(...allStrokes.map(s => s.boundingBox.minX));
        const maxX = Math.max(...allStrokes.map(s => s.boundingBox.maxX));
        const minY = Math.min(...allStrokes.map(s => s.boundingBox.minY));
        const maxY = Math.max(...allStrokes.map(s => s.boundingBox.maxY));
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Aspect ratio constraint
        const aspectRatio = width / height;
        const [minRatio, maxRatio] = this.config.segmentation.aspectRatioRange;
        
        if (aspectRatio < minRatio || aspectRatio > maxRatio) {
            return false;
        }
        
        return true;
    }

    /**
     * Calculate group bounding box
     */
    calculateGroupBoundingBox(group) {
        const allPoints = [];
        for (const stroke of group.strokes) {
            allPoints.push(
                {x: stroke.boundingBox.minX, y: stroke.boundingBox.minY},
                {x: stroke.boundingBox.maxX, y: stroke.boundingBox.maxY}
            );
        }
        
        group.boundingBox = {
            minX: Math.min(...allPoints.map(p => p.x)),
            maxX: Math.max(...allPoints.map(p => p.x)),
            minY: Math.min(...allPoints.map(p => p.y)),
            maxY: Math.max(...allPoints.map(p => p.y))
        };
    }

    /**
     * Recognize a character group using ONNX model
     */
    async recognizeCharacterGroup(group) {
        const tensor = this.renderGroupTo28x28(group);
        return await this.performInference(tensor);
    }

    /**
     * Render character group to 28x28 tensor for model input
     */
    renderGroupTo28x28(group) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        
        // White background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, 28, 28);
        
        const bbox = group.boundingBox;
        const groupWidth = bbox.maxX - bbox.minX;
        const groupHeight = bbox.maxY - bbox.minY;
        
        // Scale to fit in 18x18 area (with 5px margins)
        const scale = Math.min(18 / groupWidth, 18 / groupHeight) * 0.85;
        const offsetX = (28 - groupWidth * scale) / 2;
        const offsetY = (28 - groupHeight * scale) / 2;
        
        // Drawing settings
        tempCtx.strokeStyle = 'black';
        tempCtx.lineWidth = 1.8;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
        
        // Draw each stroke
        for (const stroke of group.strokes) {
            tempCtx.beginPath();
            
            for (let i = 0; i < stroke.points.length; i++) {
                const x = (stroke.points[i].x - bbox.minX) * scale + offsetX;
                const y = (stroke.points[i].y - bbox.minY) * scale + offsetY;
                
                if (i === 0) {
                    tempCtx.moveTo(x, y);
                } else {
                    tempCtx.lineTo(x, y);
                }
            }
            
            tempCtx.stroke();
        }
        
        // Convert to tensor
        const imageData = tempCtx.getImageData(0, 0, 28, 28);
        const data = imageData.data;
        
        const tensor = new Float32Array(1 * 1 * 28 * 28);
        for (let i = 0; i < 28 * 28; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            const gray = (r + g + b) / 3;
            
            // MNIST normalization
            let normalized = (255 - gray) / 255.0;
            normalized = (normalized - 0.1307) / 0.3081;
            
            tensor[i] = normalized;
        }
        
        return tensor;
    }

    /**
     * Perform ONNX model inference
     */
    async performInference(tensor) {
        if (!this.session) {
            throw new Error('ONNX model not loaded');
        }

        const inputMap = new Map();
        inputMap.set('input', new onnx.Tensor(tensor, 'float32', [1, 1, 28, 28]));
        
        const outputMap = await this.session.run(inputMap);
        const predictions = outputMap.get('output').data;
        
        // Find max prediction
        let maxIndex = 0;
        let maxValue = predictions[0];
        
        for (let i = 1; i < predictions.length; i++) {
            if (predictions[i] > maxValue) {
                maxValue = predictions[i];
                maxIndex = i;
            }
        }

        // Calculate softmax probabilities
        const expValues = Array.from(predictions).map(x => Math.exp(x));
        const sumExp = expValues.reduce((a, b) => a + b, 0);
        const probabilities = expValues.map(x => x / sumExp);

        return {
            prediction: maxIndex,
            confidence: probabilities[maxIndex] * 100,
            probabilities: probabilities
        };
    }

    /**
     * Utility function to calculate distance between two points
     */
    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Utility function to calculate distance between bounding boxes
     */
    boundingBoxDistance(bbox1, bbox2) {
        const horizontalGap = Math.max(0,
            Math.max(bbox1.minX, bbox2.minX) - Math.min(bbox1.maxX, bbox2.maxX)
        );
        const verticalGap = Math.max(0,
            Math.max(bbox1.minY, bbox2.minY) - Math.min(bbox1.maxY, bbox2.maxY)
        );
        
        return Math.sqrt(horizontalGap * horizontalGap + verticalGap * verticalGap);
    }

    /**
     * Utility function to calculate overlap between two ranges
     */
    calculateOverlap(min1, max1, min2, max2) {
        const overlapStart = Math.max(min1, min2);
        const overlapEnd = Math.min(max1, max2);
        
        if (overlapStart < overlapEnd) {
            const overlap = overlapEnd - overlapStart;
            const range1 = max1 - min1;
            const range2 = max2 - min2;
            return overlap / Math.min(range1, range2);
        }
        
        return 0;
    }

    /**
     * Clear canvas and reset stroke data
     */
    clearCanvas() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset state
        clearTimeout(this.recognitionTimeout);
        this.strokes = [];
        this.currentStroke = null;
        this.isDrawing = false;
        
        this.debugLog('CANVAS', 'Canvas cleared');
    }

    /**
     * Load ONNX model
     */
    async loadModel() {
        try {
            this.debugLog('MODEL', 'Loading ONNX model...', 'highlight');
            
            // Check if onnx library is available
            if (typeof onnx === 'undefined') {
                throw new Error('ONNX.js library not found. Please include onnx.min.js');
            }
            
            this.session = new onnx.InferenceSession();
            await this.session.loadModel(this.config.modelPath);
            
            this.isModelLoaded = true;
            this.debugLog('MODEL', 'Model loaded successfully!', 'highlight');
            
        } catch (error) {
            this.debugLog('MODEL', `Model loading failed: ${error.message}`, 'error');
            this.isModelLoaded = false;
            throw error;
        }
    }

    /**
     * Get current stroke count
     */
    getStrokeCount() {
        return this.strokes.length;
    }

    /**
     * Get current strokes data
     */
    getStrokes() {
        return [...this.strokes]; // Return copy
    }

    /**
     * Check if model is loaded
     */
    isReady() {
        return this.isModelLoaded;
    }

    /**
     * Debug logging function
     */
    debugLog(section, message, type = 'normal') {
        this.config.callbacks.onDebugLog(section, message, type);
    }

    /**
     * Destroy the recognizer and clean up resources
     */
    destroy() {
        this.removeEventListeners();
        clearTimeout(this.recognitionTimeout);
        
        if (this.session) {
            // ONNX.js doesn't have explicit dispose method in older versions
            this.session = null;
        }
        
        this.strokes = [];
        this.currentStroke = null;
        this.debugLog('LIFECYCLE', 'Recognizer destroyed');
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = StrokeDigitRecognizer;
} else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], function() {
        return StrokeDigitRecognizer;
    });
} else {
    // Browser global
    window.StrokeDigitRecognizer = StrokeDigitRecognizer;
}
