import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, ZoomIn, ZoomOut, RotateCw, Check, X, Upload } from 'lucide-react';

interface ProfilePictureUploaderProps {
  currentPicture?: string;
  fullName: string;
  onSavePicture: (base64Data: string) => Promise<void>;
  onRemovePicture?: () => Promise<void>;
  isEditable?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  currentPicture,
  fullName,
  onSavePicture,
  onRemovePicture,
  isEditable = true,
  size = 'xl'
}) => {
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return 'NT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-base',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-4xl'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImageSrc(result);
      setZoom(1);
      setRotation(0);
      setPanOffset({ x: 0, y: 0 });
      setIsCropping(true);
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  // Preload image for canvas rendering inside modal
  useEffect(() => {
    if (selectedImageSrc && isCropping) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = selectedImageSrc;
      img.onload = () => {
        imageRef.current = img;
        drawCropPreview();
      };
    }
  }, [selectedImageSrc, isCropping, zoom, rotation, panOffset]);

  const drawCropPreview = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    // Create circular clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Fill background
    ctx.fillStyle = '#F3F5F7';
    ctx.fillRect(0, 0, size, size);

    // Move to center
    ctx.translate(size / 2 + panOffset.x, size / 2 + panOffset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw centered image
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;

    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveCroppedImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);
      await onSavePicture(croppedBase64);
      setIsCropping(false);
      setSelectedImageSrc(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile picture');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className={`rounded-full overflow-hidden border-4 border-white shadow-md bg-[#0F3557] text-[#A9D8F7] font-extrabold flex items-center justify-center transition-all ${sizeClasses[size]}`}>
          {currentPicture ? (
            <img
              src={currentPicture}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{getInitials(fullName)}</span>
          )}
        </div>

        {/* Change Picture Hover Trigger */}
        {isEditable && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-semibold transition-opacity cursor-pointer gap-1 p-2"
            title="Upload Profile Picture"
          >
            <Camera className="w-5 h-5" />
            <span>Change</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <p className="text-[11px] text-red-600 mt-2 text-center font-medium">{errorMsg}</p>
      )}

      {/* Action buttons below profile picture */}
      {isEditable && (
        <div className="flex items-center gap-2 mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-[#0057B8] hover:bg-[#004bb0] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>

          {currentPicture && onRemovePicture && (
            <button
              type="button"
              onClick={onRemovePicture}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              title="Remove Profile Picture"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      )}

      {/* Interactive Crop Modal */}
      {isCropping && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-[#D9DEE5]">
            <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F3557]">Crop & Adjust Photo</h3>
                <p className="text-xs text-[#6E7A87]">Drag to reposition or adjust zoom</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCropping(false)}
                className="p-1.5 text-[#6E7A87] hover:bg-[#F3F5F7] rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Viewport */}
            <div className="flex justify-center my-2">
              <div
                className="relative rounded-full border-4 border-[#0057B8] shadow-inner overflow-hidden cursor-grab active:cursor-grabbing bg-[#F3F5F7]"
                style={{ width: '220px', height: '220px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="w-full h-full pointer-events-none"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3 bg-[#F3F5F7] p-4 rounded-2xl border border-[#D9DEE5]">
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-[#6E7A87]" />
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#D9DEE5] rounded-lg appearance-none cursor-pointer accent-[#0057B8]"
                />
                <ZoomIn className="w-4 h-4 text-[#6E7A87]" />
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#D9DEE5]">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="px-3 py-1.5 bg-white text-[#0F3557] border border-[#D9DEE5] rounded-lg font-semibold flex items-center gap-1.5 hover:bg-gray-50"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate 90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="text-[#0057B8] hover:underline font-semibold"
                >
                  Reset Zoom & Pan
                </button>
              </div>
            </div>

            {/* Save & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCropping(false)}
                className="px-4 py-2 border border-[#D9DEE5] text-[#1E2A36] text-xs font-semibold rounded-xl hover:bg-[#F3F5F7]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveCroppedImage}
                className="px-5 py-2 bg-[#0057B8] hover:bg-[#004bb0] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Set Picture</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
