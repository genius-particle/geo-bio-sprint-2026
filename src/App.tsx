import { useState, useRef } from 'react';
import type { ViewMode } from './types';
import ImageCropper from './components/ImageCropper';
import DashboardView from './components/DashboardView';
import QuestionCaptureView from './components/QuestionCaptureView';
import QuestionDetailView from './components/QuestionDetailView';
import MistakeBookView from './components/MistakeBookView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import PracticeView from './components/PracticeView';

const TABS: { id: ViewMode; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: '首页' },
  { id: 'mistakes', icon: '📋', label: '错题本' },
  { id: 'knowledge', icon: '📚', label: '知识库' },
  { id: 'practice', icon: '✏️', label: '练习' },
];

/**
 * 从 base64 图片中解析 EXIF Orientation 值
 * 仅处理 JPEG 格式，返回 1（正常）、3（180°）、6（顺时针90°）、8（逆时针90°）
 */
function getExifOrientation(base64: string): number {
  try {
    // 将 base64 转为二进制数据
    const dataUrl = base64;
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) return 1;
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // 检查 JPEG 文件头 0xFFD8
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;

    let offset = 2;
    while (offset < len - 1) {
      // 查找 APP1 段标记 0xFFE1
      if (bytes[offset] === 0xff && bytes[offset + 1] === 0xe1) {
        // APP1 段长度（大端序）
        const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
        // 检查 "Exif" 标识：0x45 0x78 0x69 0x66
        const exifOffset = offset + 4;
        if (
          bytes[exifOffset] === 0x45 &&
          bytes[exifOffset + 1] === 0x78 &&
          bytes[exifOffset + 2] === 0x69 &&
          bytes[exifOffset + 3] === 0x66
        ) {
          // 跳过 "Exif\0\0"（6 字节），到达 TIFF 头
          const tiffOffset = exifOffset + 6;
          // 判断字节序：II = 小端序 (0x4949)，MM = 大端序 (0x4D4D)
          const littleEndian = bytes[tiffOffset] === 0x49 && bytes[tiffOffset + 1] === 0x49;
          // IFD0 偏移量（TIFF 头后的 4 字节）
          const ifdOffsetValue = littleEndian
            ? bytes[tiffOffset + 8] | (bytes[tiffOffset + 9] << 8) | (bytes[tiffOffset + 10] << 16) | (bytes[tiffOffset + 11] << 24)
            : (bytes[tiffOffset + 8] << 24) | (bytes[tiffOffset + 9] << 16) | (bytes[tiffOffset + 10] << 8) | bytes[tiffOffset + 11];
          const ifdStart = tiffOffset + ifdOffsetValue;
          // IFD 条目数量（2 字节）
          const entryCount = littleEndian
            ? bytes[ifdStart] | (bytes[ifdStart + 1] << 8)
            : (bytes[ifdStart] << 8) | bytes[ifdStart + 1];
          // 遍历 IFD 条目，每个条目 12 字节，查找 Orientation tag (0x0112)
          for (let i = 0; i < entryCount; i++) {
            const entryOffset = ifdStart + 2 + i * 12;
            if (entryOffset + 12 > len) break;
            const tagId = littleEndian
              ? bytes[entryOffset] | (bytes[entryOffset + 1] << 8)
              : (bytes[entryOffset] << 8) | bytes[entryOffset + 1];
            if (tagId === 0x0112) {
              // Orientation 值在条目的第 8-9 字节（SHORT 类型）
              const orientation = littleEndian
                ? bytes[entryOffset + 8] | (bytes[entryOffset + 9] << 8)
                : (bytes[entryOffset + 8] << 8) | bytes[entryOffset + 9];
              return orientation;
            }
          }
        }
        // 未找到 Orientation 标记，继续搜索下一个 APP1 段
        offset += 2 + segLen;
      } else if (bytes[offset] === 0xff) {
        // 跳过其他 APP 段
        const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
        offset += 2 + segLen;
      } else {
        break;
      }
    }
  } catch {
    // 解析失败，返回默认值
  }
  return 1;
}

/**
 * 根据 EXIF Orientation 自动旋转图片，返回修正后的 base64
 * 支持的 Orientation 值：1（正常）、3（180°）、6（顺时针90°）、8（逆时针90°）
 */
function fixExifRotation(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const orientation = getExifOrientation(base64);
    // Orientation 为 1 或无 EXIF 时直接返回原图
    if (orientation === 1 || orientation === undefined) {
      resolve(base64);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }

      // 根据旋转角度设置 Canvas 尺寸
      if (orientation === 6 || orientation === 8) {
        // 90° 或 270° 旋转，宽高互换
        canvas.width = img.naturalHeight;
        canvas.height = img.naturalWidth;
      } else {
        // 180° 旋转，尺寸不变
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }

      // 执行旋转绘制
      if (orientation === 3) {
        // 180° 旋转
        ctx.translate(canvas.width, canvas.height);
        ctx.rotate(Math.PI);
      } else if (orientation === 6) {
        // 顺时针 90°
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
      } else if (orientation === 8) {
        // 逆时针 90°
        ctx.translate(0, canvas.height);
        ctx.rotate(-Math.PI / 2);
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export default function App() {
  const [view, setView] = useState<ViewMode>('home');
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [croppedImages, setCroppedImages] = useState<string[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // 上传时自动修正 EXIF 旋转
        const fixed = await fixExifRotation(reader.result as string);
        setCroppingImage(fixed);
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCropConfirm = (cropped: string) => {
    setCroppingImage(null);
    setCroppedImages(prev => [...prev, cropped]);
    setView('capture');
  };

  const handleRemoveImage = (index: number) => {
    setCroppedImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setView('home');
      return next;
    });
  };

  const handleSave = () => {
    setCroppedImages([]);
    setRefreshKey(k => k + 1);
    setView('home');
  };

  const openQuestion = (id: string) => {
    setSelectedQuestionId(id);
    setView('detail');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} capture="environment" />
      
      {croppingImage && (
        <ImageCropper imageSrc={croppingImage} onConfirm={handleCropConfirm} onCancel={() => setCroppingImage(null)} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {view === 'home' && <DashboardView onCapture={() => fileInputRef.current?.click()} onSelectQuestion={openQuestion} refreshKey={refreshKey} />}
        {view === 'capture' && croppedImages.length > 0 && <QuestionCaptureView imageBase64List={croppedImages} onAddImage={() => fileInputRef.current?.click()} onRemoveImage={handleRemoveImage} onSave={handleSave} onCancel={() => { setCroppedImages([]); setView('home'); }} />}
        {view === 'detail' && selectedQuestionId && <QuestionDetailView questionId={selectedQuestionId} onBack={() => setView('home')} />}
        {view === 'mistakes' && <MistakeBookView onSelectQuestion={openQuestion} />}
        {view === 'knowledge' && <KnowledgeBaseView />}
        {view === 'practice' && <PracticeView />}
      </div>

      {/* Bottom Tab Bar */}
      <div className="flex border-t border-gray-200 bg-white safe-area-bottom">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            className={`flex-1 py-3 text-center ${view === tab.id ? 'text-green-600' : 'text-gray-400'}`}>
            <div className="text-xl">{tab.icon}</div>
            <div className="text-xs mt-0.5">{tab.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
