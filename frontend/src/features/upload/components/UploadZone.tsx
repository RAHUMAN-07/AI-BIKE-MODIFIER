import { useCallback, useRef, useState } from 'react';
import { useBikeStore } from '../../../core/stores/bikeStore';
import CaptureGuide from './CaptureGuide';
import { uploadImage, startReconstruction, getReconstructionStatus, getSegmentationStatus, toBackendUrl } from '../../../core/services/api';

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
  const { setProcessingStage, setUploadedImage, setModelUrl, initializeParts, setCurrentPage } = useBikeStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, WEBP image or MP4/MOV video.');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setPreviewUrl(imageUrl);
    setSelectedFile(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedFile || !previewUrl) return;

    setUploadedImage(previewUrl);

    try {
      setProcessingStage('uploading', 10, 'Uploading your motorcycle photo...');
      const uploadResult = await uploadImage(selectedFile);
      setProcessingStage('uploading', 100, 'Upload complete!');

      await new Promise(r => setTimeout(r, 400));
      setProcessingStage('reconstructing', 5, 'Starting Tripo3D AI 3D reconstruction...');
      await startReconstruction(uploadResult.sessionId);

      let done = false;
      while (!done) {
        await new Promise(r => setTimeout(r, 1500));
        const status = await getReconstructionStatus(uploadResult.sessionId);

        if (status.status === 'complete') {
          setProcessingStage('reconstructing', 100, '3D model generated!');
          done = true;

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
          
          if (status.modelUrl) {
            setModelUrl(toBackendUrl(status.modelUrl));
            setProcessingStage('ready', 100, 'Your 3D bike model is ready to customize!');
            setCurrentPage('viewer');
          } else {
            throw new Error('Reconstruction succeeded but did not return a valid model.');
          }

        } else if (status.status === 'error') {
          console.error('Reconstruction error:', status.error);
          setProcessingStage('idle', 0, 'Reconstruction failed');
          alert('AI Reconstruction failed: ' + (status.error || 'Unknown error'));
          done = true;

        } else {
          setProcessingStage('reconstructing', Math.min(status.progress || 30, 95),
            status.progress < 30 ? 'Uploading to Tripo3D AI...' :
            status.progress < 60 ? 'Generating 3D GLB mesh...' :
            'Applying materials & textures...');
        }
      }
    } catch (err) {
      console.error('Pipeline error:', err);
      setProcessingStage('idle', 0, 'Upload failed');
      alert('AI pipeline failed. Please ensure the backend is running.');
    }
  }, [selectedFile, previewUrl, setUploadedImage, setProcessingStage, initializeParts, setModelUrl]);

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

  return (
    <div className="upload-zone">
      <div className="upload-zone__content" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="upload-zone__hero">
          <h1>Transform Your Ride in 3D</h1>
          <p>
            Upload a photo of your motorcycle and watch Tripo3D AI convert it into an interactive 3D model.
          </p>
        </div>

        {!selectedFile ? (
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
        ) : (
          <div className="upload-preview-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div className="upload-preview" style={{ position: 'relative', width: '100%', maxWidth: 450, borderRadius: 20, overflow: 'hidden', border: '2px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 0 24px rgba(99, 102, 241, 0.2)' }}>
              <img src={previewUrl!} alt="Motorcycle Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn btn--primary" 
                onClick={handleGenerate}
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', padding: '12px 28px', borderRadius: 12, fontWeight: 'bold', fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
              >
                🚀 Generate 3D Model
              </button>
              <button 
                className="btn" 
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                style={{ padding: '12px 20px', borderRadius: 12, fontWeight: 'semibold', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--text-secondary)' }}
              >
                Change Image
              </button>
            </div>
          </div>
        )}

        <CaptureGuide />
      </div>
    </div>
  );
}
