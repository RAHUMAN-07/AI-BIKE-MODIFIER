import { useCallback, useRef, useState } from 'react';
import { useBikeStore } from '../stores/bikeStore';
import CaptureGuide from './CaptureGuide';
import { uploadImage, startReconstruction, getReconstructionStatus, getSegmentationStatus, toBackendUrl } from '../services/api';

const ALL_PARTS = [
  'fuel_tank', 'fairing', 'seat', 'exhaust', 'handlebar',
  'mirror_left', 'mirror_right', 'headlight', 'taillight',
  'front_wheel', 'rear_wheel', 'front_rim', 'rear_rim',
  'front_disc', 'rear_disc', 'front_caliper', 'rear_caliper',
  'winglet_left', 'winglet_right',
  'mudguard_front', 'mudguard_rear', 'chain_cover', 'engine', 'frame',
  'radiator', 'air_intake', 'swingarm', 'subframe',
  'footpeg_left', 'footpeg_right',
  'rear_sprocket', 'chain', 'fork_guard_left', 'fork_guard_right', 'steering_damper',
];

export default function UploadZone() {
  const { setProcessingStage, setUploadedImage, setModelUrl, initializeParts } = useBikeStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === Real upload + backend reconstruction ===
  const handleFile = useCallback(async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, WEBP image or MP4/MOV video.');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    try {
      // Stage 1: Uploading to backend
      setProcessingStage('uploading', 10, 'Uploading your motorcycle photo...');
      const uploadResult = await uploadImage(file);
      setProcessingStage('uploading', 100, 'Upload complete!');

      // Stage 2: Trigger 3D Reconstruction
      await new Promise(r => setTimeout(r, 400)); // brief pause for UX
      setProcessingStage('reconstructing', 5, 'Starting 3D reconstruction...');
      await startReconstruction(uploadResult.sessionId);

      // Poll reconstruction status
      let done = false;
      while (!done) {
        await new Promise(r => setTimeout(r, 1500));
        const status = await getReconstructionStatus(uploadResult.sessionId);

        if (status.status === 'complete') {
          setProcessingStage('reconstructing', 100, '3D mesh generated!');
          done = true;

          // Stage 3: Segmenting
          await new Promise(r => setTimeout(r, 300));
          setProcessingStage('segmenting', 10, 'Requesting part segmentation...');
          try {
            const segStatus = await getSegmentationStatus(uploadResult.sessionId);
            setProcessingStage('segmenting', 50, 'Identifying motorcycle parts...');
            if (segStatus.parts && segStatus.parts.length > 0) {
              setProcessingStage('segmenting', 90, `Detected ${segStatus.parts.length} parts...`);
              await new Promise(r => setTimeout(r, 400));
              initializeParts(segStatus.parts, segStatus.colors);
            } else {
              setProcessingStage('segmenting', 90, 'No parts detected, using default parts...');
              await new Promise(r => setTimeout(r, 400));
              initializeParts(ALL_PARTS, segStatus.colors);
            }
          } catch (segErr) {
            console.error('Segmentation failed:', segErr);
            setProcessingStage('segmenting', 90, 'Segmentation failed, falling back...');
            await new Promise(r => setTimeout(r, 400));
            initializeParts(ALL_PARTS, null);
          }
          
          // Use real model URL if available, fallback to demo
          const modelUrl = status.modelUrl && status.modelUrl !== 'demo'
            ? toBackendUrl(status.modelUrl)
            : 'demo';
          setModelUrl(modelUrl);
          setProcessingStage('ready', 100, 'Your bike is ready to customize!');

        } else if (status.status === 'error') {
          console.error('Reconstruction error:', status.error);
          // Fallback to demo mode on error
          setProcessingStage('reconstructing', 100, 'Using demo model (API unavailable)');
          await new Promise(r => setTimeout(r, 500));
          initializeParts(ALL_PARTS);
          setModelUrl('demo');
          setProcessingStage('ready', 100, 'Your bike is ready to customize!');
          done = true;

        } else {
          // Still processing
          setProcessingStage('reconstructing', Math.min(status.progress || 30, 95),
            status.progress < 30 ? 'Extracting depth map...' :
            status.progress < 60 ? 'Generating 3D mesh...' :
            'Applying textures...');
        }
      }
    } catch (err) {
      console.error('Pipeline error:', err);
      // Fallback to demo mode if backend is unreachable
      setProcessingStage('uploading', 100, 'Backend unavailable — using demo mode');
      await new Promise(r => setTimeout(r, 500));
      simulateProcessing();
    }
  }, [setUploadedImage, setProcessingStage, initializeParts, setModelUrl]);

  // === Demo mode fallback (simulated pipeline) ===
  const simulateProcessing = useCallback(() => {
    setProcessingStage('uploading', 0, 'Uploading your motorcycle photo...');
    
    setTimeout(() => {
      setProcessingStage('uploading', 100, 'Upload complete!');
      
      setTimeout(() => {
        setProcessingStage('reconstructing', 0, 'Analyzing motorcycle geometry...');
        
        let progress = 0;
        const reconstructInterval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 100) {
            clearInterval(reconstructInterval);
            setProcessingStage('reconstructing', 100, '3D mesh generated!');
            
            setTimeout(() => {
              setProcessingStage('segmenting', 0, 'Identifying motorcycle parts...');
              
              let segProgress = 0;
              const segInterval = setInterval(() => {
                segProgress += Math.random() * 20;
                if (segProgress >= 100) {
                  clearInterval(segInterval);
                  initializeParts(ALL_PARTS);
                  setModelUrl('demo');
                  setProcessingStage('ready', 100, 'Your bike is ready to customize!');
                  return;
                }
                setProcessingStage('segmenting', Math.min(segProgress, 99), 'Labeling parts: ' + 
                  ['fuel tank', 'fairing', 'seat', 'exhaust', 'wheels', 'engine'][Math.floor(segProgress / 20)] + '...');
              }, 300);
            }, 500);
            return;
          }
          setProcessingStage('reconstructing', Math.min(progress, 99), 
            progress < 30 ? 'Extracting depth map...' :
            progress < 60 ? 'Generating 3D mesh...' :
            'Applying textures...');
        }, 400);
      }, 500);
    }, 800);
  }, [setProcessingStage, initializeParts, setModelUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDemoMode = useCallback(() => {
    simulateProcessing();
  }, [simulateProcessing]);

  return (
    <div className="upload-zone">
      <div className="upload-zone__content" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="upload-zone__hero">
          <h1>Transform Your Ride</h1>
          <p>
            Upload a photo of your motorcycle and watch AI reconstruct it in 3D. 
            Then tap any part to customize colors, styles, and aftermarket upgrades.
          </p>
        </div>

        <div
          className={`upload-dropzone ${isDragOver ? 'upload-dropzone--active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label="Upload motorcycle photo"
        >
          <div className="upload-dropzone__inner">
            <div className="upload-dropzone__icon">📸</div>
            <div className="upload-dropzone__text">
              <h3>Drop your motorcycle photo here</h3>
              <p>or click to browse files</p>
            </div>
            <div className="upload-dropzone__formats">
              <span className="upload-dropzone__format-tag">JPG</span>
              <span className="upload-dropzone__format-tag">PNG</span>
              <span className="upload-dropzone__format-tag">WEBP</span>
              <span className="upload-dropzone__format-tag">MP4</span>
              <span className="upload-dropzone__format-tag">MOV</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </div>

        <CaptureGuide />

        <button className="btn btn--primary btn--lg" onClick={handleDemoMode}>
          🚀 Try Demo Mode
        </button>
      </div>
    </div>
  );
}
