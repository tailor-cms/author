import {
  AssetType,
  LinkContentType,
  LinkProvider,
} from '@tailor-cms/interfaces/asset';

export const ASSET_TYPE_ICON: Record<string, string> = {
  [AssetType.Image]: 'mdi-image-outline',
  [AssetType.Video]: 'mdi-video-outline',
  [AssetType.Audio]: 'mdi-volume-medium',
  [AssetType.Document]: 'mdi-file-document-outline',
  [AssetType.Link]: 'mdi-link',
  [AssetType.Other]: 'mdi-file-outline',
};

export const ASSET_TYPE_LABEL: Record<string, string> = {
  [AssetType.Image]: 'Image',
  [AssetType.Video]: 'Video',
  [AssetType.Audio]: 'Audio',
  [AssetType.Document]: 'Document',
  [AssetType.Link]: 'Link',
  [AssetType.Other]: 'File',
};

export const ASSET_TYPE_COLOR: Record<string, string> = {
  [AssetType.Image]: 'asset-image',
  [AssetType.Video]: 'asset-video',
  [AssetType.Audio]: 'asset-audio',
  [AssetType.Document]: 'asset-document',
  [AssetType.Link]: 'asset-link',
  [AssetType.Other]: 'asset-other',
};

export const LINK_PROVIDER_STYLE: Record<
  LinkProvider,
  { icon: string; color: string; label: string }
> = {
  [LinkProvider.YouTube]: {
    icon: 'mdi-youtube',
    color: '#FF0000',
    label: 'YouTube Video',
  },
  [LinkProvider.Vimeo]: {
    icon: 'mdi-vimeo',
    color: '#1AB7EA',
    label: 'Vimeo Video',
  },
  [LinkProvider.Dailymotion]: {
    icon: 'mdi-play-circle',
    color: '#0066DC',
    label: 'Dailymotion Video',
  },
  [LinkProvider.Loom]: {
    icon: 'mdi-play-circle',
    color: '#625DF5',
    label: 'Loom Video',
  },
  [LinkProvider.Spotify]: {
    icon: 'mdi-spotify',
    color: '#1DB954',
    label: 'Spotify',
  },
  [LinkProvider.SoundCloud]: {
    icon: 'mdi-soundcloud',
    color: '#FF5500',
    label: 'SoundCloud',
  },
  [LinkProvider.GoogleDocs]: {
    icon: 'mdi-file-document-outline',
    color: '#4285F4',
    label: 'Google Doc',
  },
  [LinkProvider.GoogleSheets]: {
    icon: 'mdi-google-spreadsheet',
    color: '#0F9D58',
    label: 'Google Sheet',
  },
  [LinkProvider.GoogleSlides]: {
    icon: 'mdi-file-presentation-box',
    color: '#F4B400',
    label: 'Google Slides',
  },
  [LinkProvider.GoogleForms]: {
    icon: 'mdi-form-select',
    color: '#7248B9',
    label: 'Google Form',
  },
  [LinkProvider.GoogleDrive]: {
    icon: 'mdi-google-drive',
    color: '#1A73E8',
    label: 'Google Drive',
  },
  [LinkProvider.MicrosoftWord]: {
    icon: 'mdi-microsoft-word',
    color: '#2B579A',
    label: 'Word document',
  },
  [LinkProvider.MicrosoftExcel]: {
    icon: 'mdi-microsoft-excel',
    color: '#217346',
    label: 'Excel workbook',
  },
  [LinkProvider.MicrosoftPowerPoint]: {
    icon: 'mdi-microsoft-powerpoint',
    color: '#D24726',
    label: 'PowerPoint deck',
  },
  [LinkProvider.OneDrive]: {
    icon: 'mdi-microsoft-onedrive',
    color: '#0078D4',
    label: 'OneDrive',
  },
  [LinkProvider.SharePoint]: {
    icon: 'mdi-microsoft-sharepoint',
    color: '#038387',
    label: 'SharePoint',
  },
};

export const LINK_CONTENT_TYPE_ICON: Record<string, string> = {
  [LinkContentType.Video]: 'mdi-play-circle',
  [LinkContentType.Image]: 'mdi-image',
  [LinkContentType.Document]: 'mdi-file-document',
  [LinkContentType.Audio]: 'mdi-music-circle',
  [LinkContentType.Article]: 'mdi-newspaper-variant',
  [LinkContentType.Research]: 'mdi-school',
};

export const LINK_CONTENT_TYPE_LABEL: Record<string, string> = {
  [LinkContentType.Video]: 'Video Link',
  [LinkContentType.Audio]: 'Audio Link',
  [LinkContentType.Document]: 'Document Link',
  [LinkContentType.Image]: 'Image Link',
  [LinkContentType.Article]: 'Article Link',
  [LinkContentType.Research]: 'Research Link',
};
