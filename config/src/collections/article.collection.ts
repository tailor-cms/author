import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element.ts';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import {
  IsContentElement,
  IsInput,
  IsRelationship,
  Prop,
  TailorCollection,
  TailorEntity,
} from '../lib/index.ts';
import { OUTLINE_COLOR } from '../colors';

const embedElementConfig = [
  ContentElementType.TiptapHtml,
  ContentElementType.Image,
  ContentElementType.Embed,
];

class Author {
  @Prop({ label: 'Full name' })
  @IsInput(MetaInputType.TextField, {
    isTitle: true,
    validate: { required: true, min: 2, max: 120 },
  })
  fullName: string;

  @Prop()
  @IsInput(MetaInputType.Html, { validate: { max: 4000 } })
  bio: string;

  @Prop({ label: 'Avatar' })
  @IsInput(MetaInputType.File, {
    placeholder: 'Upload a profile photo',
    showPreview: true,
    icon: 'mdi-account',
    ext: ['jpg', 'jpeg', 'png'],
  })
  avatar: string;
}

class Article {
  @Prop({ label: 'Title' })
  @IsInput(MetaInputType.TextField, {
    isTitle: true,
    validate: { required: true, min: 2, max: 200 },
  })
  title: string;

  @Prop()
  @IsInput(MetaInputType.Html, {
    validate: { required: true, min: 2, max: 2000 },
  })
  description: string;

  // Cross-fence reference
  @Prop({ label: 'Author' })
  @IsRelationship({
    entity: 'AUTHOR',
    allowEmpty: false,
    placeholder: 'Select the author',
  })
  author: Relationship[];

  @Prop({ label: 'Tags' })
  @IsRelationship({
    entity: 'TAG',
    multiple: true,
    placeholder: 'Add tags',
  })
  tags: Relationship[];

  @Prop({ label: 'Thumbnail Image' })
  @IsInput(MetaInputType.File, {
    placeholder: 'Click to upload a thumbnail image',
    showPreview: true,
    icon: 'mdi-image',
    ext: ['jpg', 'jpeg', 'png'],
  })
  thumbnail: string;

  @Prop({ label: 'Body' })
  @IsContentElement(ContentElementType.TiptapHtml, { required: true })
  body: ContentElement;

  @Prop({ label: 'Poll' })
  @IsContentElement(ContentElementType.MultipleChoice, {
    required: false,
    isGradable: false,
  })
  question: ContentElement;
}

// A tag is just a name/title - no other content.
class Tag {
  @Prop({ label: 'Name' })
  @IsInput(MetaInputType.TextField, {
    validate: { required: true, min: 2, max: 60 },
    isTitle: true,
  })
  name: string;
}

const Articles = new TailorEntity(Article, {
  type: 'ARTICLE',
  label: 'Articles',
  icon: 'mdi-newspaper-variant-outline',
  color: OUTLINE_COLOR.ACCENT_2,
  embedElementConfig,
});

const Authors = new TailorEntity(Author, {
  type: 'AUTHOR',
  label: 'Authors',
  icon: 'mdi-account-edit-outline',
  color: OUTLINE_COLOR.ACCENT_5,
});

const Tags = new TailorEntity(Tag, {
  type: 'TAG',
  label: 'Tags',
  icon: 'mdi-tag-outline',
  color: OUTLINE_COLOR.ACCENT_3,
});

export const articleCollection = new TailorCollection({
  id: 'TEST_COLLECTION',
  name: 'Test Collection',
  entities: [Articles, Authors, Tags],
});
