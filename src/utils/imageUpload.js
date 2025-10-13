import { supabase } from './supabaseClient';

export class ImageUploadService {
  static BUCKET_NAME = 'product-images';

  // Upload single image
  static async uploadImage(file, folder = 'products') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        success: true,
        publicUrl,
        filePath
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(files, folder = 'products') {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, folder));
      const results = await Promise.all(uploadPromises);

      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);

      return {
        success: true,
        images: successfulUploads.map(result => result.publicUrl),
        failed: failedUploads
      };
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete image
  static async deleteImage(filePath) {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get image URL (useful for displaying)
  static getImageUrl(filePath) {
    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return publicUrl;
  }
}