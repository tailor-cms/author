import type { ContentElement } from '@tailor-cms/interfaces/content-element.ts';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { IsContentElement, IsInput, Prop, TailorCollection } from '../lib/index.ts';

class Article {
  @Prop()
  @IsInput(MetaInputType.Textarea)
  description: string;

  @Prop()
  @IsContentElement(ContentElementType.Html)
  html: ContentElement;

  @Prop({ label: 'Overview Video' })
  @IsContentElement(ContentElementType.Video)
  video: ContentElement;

  @Prop()
  @IsContentElement(ContentElementType.MultipleChoice)
  question: ContentElement;
}

export const exampleCollection = new TailorCollection(Article);
