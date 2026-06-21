export type MediaKind = 'image' | 'video' | 'audio' | 'document';

/** The shape we surface to the frontend after upload. */
export interface ShootMediaItem {
  id: number;                  // local shoot_media.id
  shootId: number;
  photosMediaId: number;       // canonical id on photos.mytrees.family
  filename: string;
  type: MediaKind;
  size: number | null;
  width: number | null;
  height: number | null;
  uploadedAt: string;
  transferredAt: string | null;
}

/** Response from POST /api/shoots/:id/upload. */
export interface UploadResponse {
  media: ShootMediaItem;
}

/** Body for POST /api/shoots/:id/transfer — marks shoot paid & moves
 *  ownership on photos.mytrees.family from photographer to client. */
export interface TransferRequest {
  toMytreesUserId: string;     // the client's authUsers.id
}
