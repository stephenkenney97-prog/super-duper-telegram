export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export const getMimeTypeFromDataUrl = (dataUrl, fallback = 'image/jpeg') => {
  const match = typeof dataUrl === 'string' ? dataUrl.match(/^data:([^;,]+)/) : null;
  return match ? match[1] : fallback;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp?.toDate) {
    return 'Just now';
  }

  try {
    return timestamp.toDate().toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    console.error('Failed to format timestamp', error);
    return 'Unknown date';
  }
};
