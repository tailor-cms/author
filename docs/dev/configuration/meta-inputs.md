# Meta inputs

## Overview

Configurable Inputs are input components which can be attached to various
content building blocks to capture additional data. Simple example might be
adding a description text input to the `Module` or a transcript file input
to a Video `Content Element`.

This section provides a comprehensive list of all input components
that come pre-installed with the platform, along with their configuration
details. For guidance on installing or developing new components, refer to
the Extensions section.

### Base interface

```ts
interface MetaInput {
  // Used to resolve correct input component
  type: string;
  // Key for the data storage
  key: string;
  // Input label
  label: string;
  // Default value, type depends on the input
  defaultValue?: any;
  // Validation rules, via vee-validate global validator object notation.
  // see https://vee-validate.logaretm.com/v4/guide/global-validators
  validate?: Record<string, any>;
  // Should it be shown in the creation dialog 
  // for the Repository and Activity (or just afterwards).
  hideOnCreate: boolean;
}
```

## Text field

The **Text Field** component is a single-line input designed for capturing
short strings or numbers. It is commonly used for fields like names, titles,
or other brief text or number entries.

#### Additional props

- `inputType?: 'text' | 'number'`: Used to determine if input is text or numeric,
  defaults to text.
- `placeholder?: string`: A string to display as a hint in the input field.

#### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const titleField = {
  type: MetaInputType.TextField,
  key: 'title',
  label: 'Title',
  placeholder: 'Enter title...',
  validate: { required: true, min: 2, max: 80 },
};

const amountField = {
  type: MetaInputType.TextField,
  key: 'amount',
  label: 'Amount of something',
  inputType: 'number',
};
```

---

## Textarea

The **Textarea** component is a multi-line input designed for capturing longer
text entries, such as descriptions.

### Additional props

- `rows?: number`: Number of visible text lines.
- `placeholder?: string`: A string to display as a hint in the input field.

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const captionsField = {
  type: MetaInputType.Textarea,
  key: 'captions',
  label: 'Captions',
  placeholder: 'Enter captions...',
  validate: { required: true, min: 2, max: 2000 },
  rows: 2,
};
```

---

## Select

The **Select** component is a dropdown menu for selecting a single option from
a predefined list.

### Additional props

- `options: any[]`: Array of selectable values.

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const durationField = {
  type: MetaInputType.Select,
  key: 'duration',
  label: 'Duration',
  options: ['SHORT', 'STANDARD', 'LONG'],
};
```

---

## Radio Group

The **Radio Group** component is a group of radio buttons for selecting a single
option.

### Additional props

- `items: RadioInput[]`: Array of selectable options with label and value.

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const isCorrectField = {
  type: MetaInputType.RadioGroup,
  key: 'isCorrect',
  label: 'Is Correct',
  items: [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
    { label: 'Maybe', value: 'maybe' },
  ],
};
```

---

## Checkbox

The **Checkbox** component is a single checkbox for capturing boolean values.

### Additional props

- `description?: string`
  
### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const termsField = {
  type: MetaInputType.Checkbox,
  key: 'isRequired',
  label: 'Is required?',
  description: 'Is module required',
  defaultValue: false,
};
```

---

## Switch

The **Switch** component is a toggle switch for capturing boolean values.

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const notificationsField = {
  type: MetaInputType.Switch,
  key: 'notifications',
  label: 'Enable Notifications',
};
```

---

## Html

The **Html** component is a rich text editor for capturing HTML content.

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const contentField = {
  type: MetaInputType.Html,
  key: 'content',
  label: 'Content',
};
```

---

## Color

The **Color** component is a color picker for selecting colors.

### Additional props

- `colors?: Array<Array<string>`: Optional matrix with color options in hex format.

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const backgroundColorField = {
  key: 'color',
  type: MetaInputType.Color,
  label: 'Color',
};
```

---

## File

The **File** component is a file input for uploading files.

### Additional props

- `placeholder?: string`: Input placeholder text
- `icon?: string`: MDI icon, e.g. representing input format
- `showPreview?: boolean`: Show thumbnail of an image

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const uploadField = {
  type: MetaInputType.File,
  key: 'upload',
  label: 'Upload File',
  placeholder: 'Click to upload a file...',
  icon: 'mdi-file-pdf-box',
  validate: { ext: ['pdf'] },
};
```

---

## Combobox

The **Combobox** component support multiple option selection with search.

### Additional props

- `options: any[]`: Array of selectable values.
- `placeholder?: string`: A string to display as a hint in the input field.
- `multiple?: boolean`: If multiple items can be selected.

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const tagsField = {
  type: MetaInputType.Combobox,
  key: 'tags',
  label: 'Tags',
  placeholder: 'Enter or select a tag...',
  options: ['Tag1', 'Tag2', 'Tag3'],
  multiple: true,
};
```

---

## Datetime

The **Datetime** component is a date and time picker for capturing temporal data.

### Additional Props

- `hideTime`: A boolean that determines whether the time picker should be
  hidden, allowing users to select only the date.

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const event = {
  type: MetaInputType.Datetime,
  key: 'event',
  label: 'Event Date',
  hideTime: true,
};
```

---

## HE@S Rating

The **HE@S Rating** component is a DEMO custom rating input for capturing
HE@S style ratings.

### Additional props

- `reviewable`: Allows authors to request reviews from platform experts.
  This feature is currently experimental and intended for concept demonstration
  purposes.

### Example configuration

```ts
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

const ratingField = {
  type: MetaInputType.HeasRating,
  key: 'rating',
  label: 'HE@S Rating',
  reviewable: false,
};
```
