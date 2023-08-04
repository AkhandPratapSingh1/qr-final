import React, { useState, useEffect } from 'react';
import QrReader from 'jsqr';
import './PasteImage.css';

const PasteImage = () => {
  const [qrData, setQrData] = useState('');
  const [imageSrc, setImageSrc] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleImagePaste = (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (let index in items) {
      const item = items[index];
      if (item.kind === 'file') {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = () => {
          const image = new Image();
          image.onload = () => {
            const qrCodeData = scanQRCode(image);
            if (qrCodeData) {
              setQrData(qrCodeData);
            } else {
              setQrData('Error: Could not read QR code.');
            }
          };
          image.src = reader.result;
          setImageSrc(reader.result); // Save the pasted image source
        };
        reader.readAsDataURL(blob);
      }
    }
  };
  const copyToClipboard = (text, index) => {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = text;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);

    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1500);
  };


  const scanQRCode = (image) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0, image.width, image.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = QrReader(imageData.data, imageData.width, imageData.height);

    if (code) {
        const qrData = code.data;
        const upiParams = parseUPIParams(qrData);
        if (upiParams) {
          return {
            type: 'upi',
            data: upiParams,
          };
        } else {
          return {
            type: 'text',
            data: qrData,
          };
        }
      }
    

    return null;
  };

  const isValidURL = (str) => {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  };

  const parseUPIParams = (url) => {
    const upiParams = {};
    const params = url.split('?')[1]?.split('&');
    if (!params) return null;

    params.forEach((param) => {
      const [key, value] = param.split('=');
      const parsedKey = mapSpecialKeys(key); // Map special keys here
      const parsedValue = mapSpecialValues(parsedKey, value); // Map special values here
      upiParams[parsedKey] = decodeURIComponent(parsedValue);
    });

    return upiParams;
  };


  const mapSpecialKeys = (key) => {
    // Define the mapping of special keys to the desired text here
    const specialKeyMap = {
      pn: 'Account Holder Name',
      pa: 'UPI ID'
    
      // Add more mappings if needed
    };

    return specialKeyMap[key] || key;
  };

  const mapSpecialValues = (key, value) => {
    // Define the mapping of special values to the desired text here
    const specialValueMap = {
      '@okhdfcbank': 'HDFC Bank',
      '@ybl': 'Yes Bank',
      // Add more mappings if needed
    };

    return specialValueMap[value] || value;
  };
  return (
    <div>
      <h1>Paste Image</h1>
      <div onPaste={handleImagePaste} className="paste-container" contentEditable="true">
        {imageSrc ? (
          <img src={imageSrc} alt="Pasted QR code" className="pasted-image" />
        ) : (
          <p>Paste an image here.</p>
        )}
      </div>
      {qrData && (
        <div className="qr-data-container">
          <div className="qr-details">
            {qrData.type === 'upi' ? (
              <div>
                <h3>UPI Payment Details</h3>
                <ul>
                  {Object.entries(qrData.data).map(([key, value], index) => (
                    
                    <li
                      key={key}
                      style={(key === 'UPI ID' || key === 'Account Holder Name') ? 
                      { 
                        
                              backgroundColor: 'yellow',
                              border: '2px solid orange',
                              borderRadius: '5px',
                              padding: '5px 10px',
                              fontWeight: 'bold',
                              color: '#333',
                              marginBottom: '5px',
                    
                    
                    } 
                      
                      : {}}
                      
                    >

                      <span>{mapSpecialKeys(key)}: </span>
                      {key === '' ? (
                        <span>
                          {mapSpecialValues(key, value)} ({value})
                         
                      ) : (
                        <span>{value}</span>
                      )}
                        </span>
                        
                      ) : (
                        <span>{value}</span>
                      )}
                      <button onClick={() => copyToClipboard(value, index)}>
                        {copiedIndex === index ? 'Copied' : 'Copy'}
                      </button>
                    </li>
                  ))}
                </ul>
                <ul>
               
                </ul>
                

              </div>
            ) : (
              <p>{qrData.data}</p>
            )} 
          </div>
        </div>
      )}
    </div>
  );
};

export default PasteImage;
