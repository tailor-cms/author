import type { IconProps, IconSet } from 'vuetify';
import { h } from 'vue';

import AddAbove from './AddAbove.vue';
import AddBelow from './AddBelow.vue';
import AddInto from './AddInto.vue';

const svgNameToComponent: any = {
  above: AddAbove,
  below: AddBelow,
  into: AddInto,
};

const iconset: IconSet = {
  component: (props: IconProps) =>
    h(props.tag, [
      h(svgNameToComponent[props.icon as string], {
        class: 'v-icon__svg',
      }),
    ]),
};

export default iconset;
