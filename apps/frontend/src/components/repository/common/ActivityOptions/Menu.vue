<template>
  <div>
    <v-menu max-width="350" offset-y left>
      <template #activator="{ on }">
        <v-btn v-on="on" color="primary darken-3" icon tile>
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list class="text-left text-uppercase">
        <v-list-item
          v-for="it in menuOptions"
          :key="it.name"
          @click="it.action()"
          dense>
          <v-list-item-title>
            <v-icon size="20" class="pr-1">{{ it.icon }}</v-icon>
            {{ it.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <create-dialog
      v-if="showCreateDialog"
      @close="showCreateDialog = null"
      @created="expandParent"
      :repository-id="activity.repositoryId"
      :levels="supportedLevels"
      :anchor="activity"
      :action="action"
      :heading="`${dialogHeading} ${activity.data.name}`" />
    <copy-dialog
      v-if="showCopyDialog"
      @close="showCopyDialog = null"
      @completed="parentId => expandParent({ parentId })"
      :repository-id="activity.repositoryId"
      :levels="supportedLevels"
      :anchor="activity"
      :action="action" />
  </div>
</template>

<script>
import CopyDialog from '@/components/repository/common/CopyActivity/index.vue';
import CreateDialog from '@/components/repository/common/CreateDialog/index.vue';
import filter from 'lodash/filter';
import find from 'lodash/find';
import first from 'lodash/first';
import InsertLocation from '@/utils/InsertLocation';
import { mapActions } from 'vuex';
import { mapRequests } from '@extensionengine/vue-radio';
import optionsMixin from './common';
import sortBy from 'lodash/sortBy';

const { ADD_AFTER, ADD_BEFORE, ADD_INTO } = InsertLocation;

export default {
  name: 'activity-options-menu',
  mixins: [optionsMixin],
  props: {
    activity: { type: Object, required: true }
  },
  data: () => ({
    showCreateDialog: false,
    showCopyDialog: false,
    action: null,
    supportedLevels: []
  }),
  computed: {
    addMenuOptions() {
      const items = [{
        name: 'Add item above',
        icon: '$addAbove',
        action: () => this.setCreateContext(this.sameLevel, ADD_BEFORE)
      }, {
        name: 'Add item below',
        icon: '$addBelow',
        action: () => this.setCreateContext(this.sameLevel, ADD_AFTER)
      }];
      if (!this.subLevels.length) return items;
      return items.concat({
        name: 'Add item into',
        icon: '$addInto',
        action: () => this.setCreateContext(this.subLevels, ADD_INTO)
      });
    },
    copyMenuOptions() {
      const items = [{
        name: 'Copy existing below',
        icon: 'mdi-content-copy',
        action: () => this.setCopyContext(this.sameLevel, ADD_AFTER)
      }];
      if (!this.subLevels.length) return items;
      return items.concat({
        name: 'Copy existing into',
        icon: 'mdi-content-copy',
        action: () => this.setCopyContext(this.subLevels, ADD_INTO)
      });
    },
    menuOptions() {
      return [
        ...this.addMenuOptions,
        ...this.copyMenuOptions, {
          name: 'Remove',
          icon: 'mdi-delete',
          action: () => this.delete(this.activity)
        }
      ];
    }
  },
  methods: {
    ...mapActions('repository/activities', ['remove']),
    ...mapRequests('app', ['showConfirmationModal']),
    setCreateContext(levels, action = null) {
      this.setSupportedLevels(levels, action);
      this.showCreateDialog = true;
    },
    setCopyContext(levels, action = null) {
      this.setSupportedLevels(levels, action);
      this.showCopyDialog = true;
    },
    setSupportedLevels(levels, action = null) {
      this.supportedLevels = levels;
      this.action = action;
    },
    delete() {
      const { activity, $route } = this;
      const { graph } = $route.query;
      const action = () => {
        const rootFilter = it => !it.parentId && (it.id !== activity.id);
        // Focus parent or first root node
        const focusNode = activity.parentId
          ? find(this.activities, { id: activity.parentId })
          : first(sortBy(filter(this.activities, rootFilter), 'position'));
        this.remove(this.activity);
        if (focusNode) this.selectActivity(focusNode.id);
      };
      const name = `${graph ? `${activity.shortId}: ` : ''}${activity.data.name}`;
      this.showConfirmationModal({
        title: 'Delete item?',
        message: `Are you sure you want to delete ${name}?`,
        action
      });
    }
  },
  components: { CopyDialog, CreateDialog }
};
</script>
