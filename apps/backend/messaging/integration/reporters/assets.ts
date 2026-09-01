import type { AttachmentPreview, Reporter } from './lib/types.ts';
import { assetRef, formatAnnouncement, sharedValue } from './lib/format.ts';
import { EventType } from '#shared/events/bus.ts';
import { ReferenceType } from '@tailor-cms/utils';

interface UploadedAsset {
  id: number;
  name: string;
}

interface UploadData {
  assets?: UploadedAsset[];
  folder?: string | null;
}

// A strip under the message
const MAX_PREVIEWS = 4;

const toPreview = (asset: UploadedAsset): AttachmentPreview => ({
  entityType: ReferenceType.Asset,
  entityId: String(asset.id),
  label: asset.name,
});

const assets: Reporter<UploadData> = {
  key: 'assets',
  name: 'Assets',
  icon: 'mdi-image-multiple-outline',
  events: [EventType.AssetUploaded],
  format(events, ctx) {
    const files = events.flatMap(({ data }) => data.assets ?? []);
    const total = files.length;
    if (!total) return null;
    const folder = sharedValue(events.map(({ data }) => data.folder ?? null));
    const isSingle = total === 1;
    const linked = isSingle ? assetRef(files[0]) : `${total} files`;
    return formatAnnouncement(`Uploaded ${linked}`, {
      title: `Uploaded ${isSingle ? 'a file' : `${total} files`}`,
      color: 'secondary',
      fields: {
        'Folder': folder,
        'Uploaded by': ctx.actorLabel,
      },
      tailor_previews: files.slice(0, MAX_PREVIEWS).map(toPreview),
      tailor_previews_total: total,
    });
  },
};

export default assets;
