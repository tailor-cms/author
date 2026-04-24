import type { ContentElement } from '@tailor-cms/interfaces/content-element.ts';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { IsContentElement, IsInput, Prop, TailorCollection } from '../lib/index.ts';

class Article {
  @Prop()
  @IsInput(MetaInputType.Html, { validate: { required: true, min: 2, max: 2000 } })
  description: string;

  @Prop()
  @IsInput(
    MetaInputType.File,
    {
      label: 'Thumbnail Image',
      placeholder: 'Click to upload a thumbnail image',
      showPreview: true,
      icon: 'mdi-image',
      ext: ['jpg', 'jpeg', 'png'],
    },
  )
  thumbnail: string;

  @Prop({ label: 'Overview Video' })
  @IsContentElement(ContentElementType.MuxVideo, { required: true })
  video: ContentElement;

  @Prop({ label: 'Poll' })
  @IsContentElement(ContentElementType.MultipleChoice, { required: true })
  question: ContentElement;
}

export const exampleCollection = new TailorCollection(Article);
