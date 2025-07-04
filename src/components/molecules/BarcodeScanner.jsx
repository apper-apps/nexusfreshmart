import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import jsQR from 'jsqr';

const BarcodeScanner = ({ onScan, isActive, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (isActive && !manualMode) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, manualMode]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current.play();
          scanBarcode();
        });
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions or use manual entry.');
      setManualMode(true);
      setIsScanning(false);
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsScanning(false);
  };

  const scanBarcode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleScanResult(code.data);
        return;
      }
    }

    animationRef.current = requestAnimationFrame(scanBarcode);
  };

  const handleScanResult = (barcode) => {
    if (barcode && barcode.trim()) {
      toast.success(`Barcode scanned: ${barcode}`);
      onScan(barcode.trim());
      stopCamera();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScanResult(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const toggleMode = () => {
    setManualMode(!manualMode);
    setError(null);
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Barcode Scanner</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ApperIcon name="X" size={20} />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex space-x-2 mb-4">
            <Button
              variant={!manualMode ? 'primary' : 'outline'}
              size="small"
              onClick={() => setManualMode(false)}
              icon="Camera"
            >
              Camera
            </Button>
            <Button
              variant={manualMode ? 'primary' : 'outline'}
              size="small"
              onClick={toggleMode}
              icon="Keyboard"
            >
              Manual
            </Button>
          </div>

          {!manualMode ? (
            <div className="space-y-4">
              {error ? (
                <div className="text-center py-8">
                  <ApperIcon name="AlertCircle" size={48} className="text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              ) : (
                <>
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-48 object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    {/* Scanner overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-white border-dashed w-3/4 h-24 rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <ApperIcon name="Scan" size={24} className="mx-auto mb-2" />
                          <p className="text-xs">Align barcode here</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isScanning && (
                    <div className="text-center">
                      <div className="inline-flex items-center text-blue-600">
                        <ApperIcon name="Loader2" size={16} className="animate-spin mr-2" />
                        <span className="text-sm">Scanning...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <Input
                label="Enter Barcode"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode number"
                icon="Hash"
                autoFocus
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={!manualBarcode.trim()}
                icon="Search"
              >
                Search Product
              </Button>
            </form>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            {manualMode ? 'Enter barcode manually' : 'Point camera at barcode to scan'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;