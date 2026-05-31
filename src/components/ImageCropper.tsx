import React, { useState, useRef, useEffect } from 'react';
import { Check, X, RotateCw, Move, ZoomIn, ZoomOut } from './Icons';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Crop box state (percentage relative to container)
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 60 });

  // 根据图片尺寸智能调整默认裁剪区域
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // 竖图检测：高度超过宽度的 1.3 倍
    if (img.naturalHeight > img.naturalWidth * 1.3) {
      setCrop({ x: 5, y: 5, width: 90, height: 45 });
    } else {
      setCrop({ x: 10, y: 10, width: 80, height: 60 });
    }
  };
  
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  
  const [dragTarget, setDragTarget] = useState<'move' | 'se' | null>(null);

  // --- Handlers ---

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, target: 'move' | 'se' | 'bg') => {
    // e.preventDefault(); // Don't prevent default on bg to allow scrolling if needed? No, we want to block scroll
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (target === 'bg') {
        setIsPanning(true);
        setPanStart({ x: clientX, y: clientY });
        setInitialPan({ ...pan });
    } else {
        e.stopPropagation(); // Stop bubbling to bg
        setIsDragging(true);
        setDragTarget(target);
        setDragStart({ x: clientX, y: clientY });
    }
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (isPanning) {
        e.preventDefault();
        const deltaX = clientX - panStart.x;
        const deltaY = clientY - panStart.y;
        setPan({
            x: initialPan.x + deltaX,
            y: initialPan.y + deltaY
        });
        return;
    }

    if (isDragging) {
        e.preventDefault();
        const deltaX = clientX - dragStart.x;
        const deltaY = clientY - dragStart.y;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const percentX = (deltaX / containerRect.width) * 100;
        const percentY = (deltaY / containerRect.height) * 100;

        if (dragTarget === 'move') {
          setCrop(prev => ({
            ...prev,
            x: Math.min(Math.max(0, prev.x + percentX), 100 - prev.width),
            y: Math.min(Math.max(0, prev.y + percentY), 100 - prev.height)
          }));
        } else if (dragTarget === 'se') {
           setCrop(prev => ({
            ...prev,
            width: Math.min(Math.max(5, prev.width + percentX), 100 - prev.x), // Min 5% size
            height: Math.min(Math.max(5, prev.height + percentY), 100 - prev.y)
          })); 
        }

        setDragStart({ x: clientX, y: clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
    setDragTarget(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = -e.deltaY * 0.001;
    setZoom(z => Math.min(Math.max(0.1, z + delta), 5));
  };

  useEffect(() => {
    if (isDragging || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isPanning, dragStart, panStart]);

  const handleConfirm = () => {
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    
    // Get visible rectangles
    const imgRect = img.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    
    // 1. Determine Image Geometry in Natural Coordinates
    // Rotations: 0, 90, 180, 270.
    // If 90 or 270, the visual width corresponds to natural height.
    const isRotated = rotation % 180 !== 0;
    const naturalW = isRotated ? img.naturalHeight : img.naturalWidth;
    const naturalH = isRotated ? img.naturalWidth : img.naturalHeight;
    
    // 2. Calculate scale factor between Natural and Visual (Displayed) size
    // imgRect.width includes Zoom and Scale.
    const scaleX = naturalW / imgRect.width;
    const scaleY = naturalH / imgRect.height;
    
    // 3. Map Crop Box (Container %) to Visual Pixels (relative to Container TopLeft)
    const cropVisX = (crop.x / 100) * contRect.width;
    const cropVisY = (crop.y / 100) * contRect.height;
    const cropVisW = (crop.width / 100) * contRect.width;
    const cropVisH = (crop.height / 100) * contRect.height;
    
    // 4. Map Visual Pixels to Image Offset (relative to Image TopLeft)
    // Offset of Image TopLeft relative to Container TopLeft
    const imgOffsetX = imgRect.left - contRect.left;
    const imgOffsetY = imgRect.top - contRect.top;
    
    // Relative Crop pos inside the Image Visual Rect
    const relCropX = cropVisX - imgOffsetX;
    const relCropY = cropVisY - imgOffsetY;
    
    // 5. Convert to Natural Coordinates
    const natCropX = relCropX * scaleX;
    const natCropY = relCropY * scaleY;
    const natCropW = cropVisW * scaleX;
    const natCropH = cropVisH * scaleY;
    
    // --- Intersection Logic to remove "Black Space" ---
    const startX = Math.max(0, natCropX);
    const startY = Math.max(0, natCropY);
    
    const cropEndX = natCropX + natCropW;
    const cropEndY = natCropY + natCropH;
    
    const finalEndX = Math.min(cropEndX, naturalW);
    const finalEndY = Math.min(cropEndY, naturalH);
    
    const finalW = Math.max(0, finalEndX - startX);
    const finalH = Math.max(0, finalEndY - startY);
    
    if (finalW <= 0 || finalH <= 0) {
        // Fallback: if crop is completely outside, return valid empty or just center?
        // Returning here prevents an empty canvas error.
        console.warn("Crop area is outside the image bounds.");
        return; 
    }

    // 6. Draw rotation-corrected image to temp canvas
    // We want a canvas that holds the "Rotated Natural Image".
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = naturalW;
    tempCanvas.height = naturalH;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    // Standard rotation logic for canvas
    ctx.translate(naturalW / 2, naturalH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    
    // 7. Extract the crop (intersection)，并根据最大宽度进行压缩缩放
    const MAX_WIDTH = 1200;
    let outputW = finalW;
    let outputH = finalH;
    if (outputW > MAX_WIDTH) {
      const ratio = MAX_WIDTH / outputW;
      outputW = MAX_WIDTH;
      outputH = Math.round(outputH * ratio);
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = outputW;
    finalCanvas.height = outputH;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return;

    finalCtx.drawImage(
        tempCanvas,
        startX, startY, finalW, finalH,
        0, 0, outputW, outputH
    );

    // 使用 0.7 质量压缩输出
    onConfirm(finalCanvas.toDataURL('image/jpeg', 0.7));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white z-10 bg-black/20 backdrop-blur-sm">
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
        <span className="font-bold text-lg">调整题目区域</span>
        <button onClick={handleConfirm} className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 shadow-lg shadow-blue-500/30">
          <Check size={24} />
        </button>
      </div>

      {/* Main Area */}
      <div 
        className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900 cursor-grab active:cursor-grabbing" 
        ref={containerRef}
        onMouseDown={(e) => handleMouseDown(e, 'bg')}
        onTouchStart={(e) => handleMouseDown(e, 'bg')}
        onWheel={handleWheel}
      >
        <div 
            className="transition-transform duration-75 ease-linear will-change-transform"
            style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center'
            }}
        >
            <img
                ref={imageRef}
                src={imageSrc}
                alt="Original"
                onLoad={handleImageLoad}
                className="max-w-none pointer-events-none select-none"
                style={{ 
                    // Calculate a reasonable initial size if needed, but max-width constraints 
                    // interfere with zoom. Let's start with a size that fits the screen approx.
                    // We can control initial scale in a real app, but here we let it be natural 
                    // and let the user zoom/pan.
                    maxHeight: '80vh', 
                    maxWidth: '90vw'
                }}
            />
        </div>

        {/* Overlay & Crop Box */}
        <div className="absolute inset-0 pointer-events-none">
            {/* Dimmed Areas */}
            <div className="absolute bg-black/60 top-0 left-0 right-0 transition-all duration-75" style={{ height: `${crop.y}%` }}></div>
            <div className="absolute bg-black/60 bottom-0 left-0 right-0 transition-all duration-75" style={{ height: `${100 - crop.y - crop.height}%` }}></div>
            <div className="absolute bg-black/60 top-0 left-0 bottom-0 transition-all duration-75" style={{ top: `${crop.y}%`, height: `${crop.height}%`, width: `${crop.x}%` }}></div>
            <div className="absolute bg-black/60 top-0 right-0 bottom-0 transition-all duration-75" style={{ top: `${crop.y}%`, height: `${crop.height}%`, width: `${100 - crop.x - crop.width}%` }}></div>
            
            {/* The Crop Box */}
            <div 
                className="absolute border-2 border-white box-content shadow-2xl pointer-events-auto cursor-move group"
                style={{ 
                    left: `${crop.x}%`, 
                    top: `${crop.y}%`, 
                    width: `${crop.width}%`, 
                    height: `${crop.height}%` 
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                onTouchStart={(e) => handleMouseDown(e, 'move')}
            >
                {/* Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity">
                    <div className="border-r border-white/50"></div>
                    <div className="border-r border-white/50"></div>
                    <div></div>
                    <div className="border-t border-white/50 col-span-3 row-start-2"></div>
                    <div className="border-t border-white/50 col-span-3 row-start-3"></div>
                </div>

                {/* Resize Handle (Bottom Right) */}
                <div 
                    className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-nwse-resize shadow-lg z-10"
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'se'); }}
                    onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, 'se'); }}
                >
                    <Move size={14} className="text-white" />
                </div>
            </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-6 bg-black flex justify-center pb-8 gap-4 z-10">
        <button 
            onClick={() => setZoom(z => Math.max(0.1, z - 0.2))}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
            <ZoomOut size={20} />
        </button>
        
        <button 
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="flex items-center gap-2 text-white/90 px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors font-medium"
        >
            <RotateCw size={18} />
            <span>旋转</span>
        </button>

        <button 
            onClick={() => setZoom(z => Math.min(5, z + 0.2))}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
            <ZoomIn size={20} />
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;