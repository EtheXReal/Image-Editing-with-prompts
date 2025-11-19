/**
 * Converts a File object to a Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Strips the data URI prefix (e.g., "data:image/png;base64,") from a base64 string.
 */
export const stripBase64Prefix = (base64WithPrefix: string): string => {
  return base64WithPrefix.split(',')[1] || base64WithPrefix;
};

/**
 * Downloads a base64 image string as a file.
 */
export const downloadImage = (base64Url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = base64Url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};