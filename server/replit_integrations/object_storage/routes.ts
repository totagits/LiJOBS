import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      
      // Extract direct GCS URL (without query params) for playback
      // This works reliably in both development and production
      const directUrl = uploadURL.split('?')[0];

      res.json({
        uploadURL,
        objectPath,
        directUrl, // Direct GCS URL for playback
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/uploads/:objectId
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get("/objects/uploads/:objectId", async (req, res) => {
    try {
      const objectPath = `/objects/uploads/${req.params.objectId}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });

  /**
   * Serve public video files.
   *
   * GET /api/videos/:filename
   *
   * This serves video files from the public/videos folder in object storage.
   */
  app.get("/api/videos/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const publicFile = await objectStorageService.searchPublicObject(`videos/${filename}`);
      if (!publicFile) {
        return res.status(404).json({ error: "Video not found" });
      }
      await objectStorageService.downloadObject(publicFile, res, 86400); // Cache for 24 hours
    } catch (error) {
      console.error("Error serving video:", error);
      return res.status(500).json({ error: "Failed to serve video" });
    }
  });

}

