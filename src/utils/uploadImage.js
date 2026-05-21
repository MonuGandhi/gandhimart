const CLOUDINARY_CLOUD_NAME = 'dwae6wa0l';
const CLOUDINARY_UPLOAD_PRESET = 'sl2esvy8';

/**
 * Uploads a file (or base64 string) to Cloudinary and returns the download URL
 * @param {File|String} file - The file object or base64 string
 * @param {String} folder - The folder name (not strictly used by unsigned upload unless preset handles it)
 * @returns {Promise<String>} - The secure URL of the uploaded image
 */
export const uploadImage = async (file, folder = 'general') => {
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `gandhimart/${folder}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};
